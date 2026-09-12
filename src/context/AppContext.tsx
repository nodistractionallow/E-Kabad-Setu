import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Language, UserRole, MaterialItem, EWasteLot, CollectorProfile, RecyclerFacility, AuthSession } from '../types';
import { INITIAL_MATERIALS, INITIAL_LOTS, MOCK_COLLECTOR, MOCK_RECYCLER } from '../data/mockData';
import { speakVoice, playFeedbackChime, stopVoice } from '../utils/speech';
import { supabase } from '../lib/supabase';
import {
  enqueueSyncAction,
  processSyncQueue,
  pullLotsFromSupabase,
  pullMaterialsFromSupabase,
  getSyncQueue,
  mapSupabaseRowToLot,
} from '../services/syncService';
import { updateLotInSqlite, saveLotToSqlite, fetchSqliteLots } from '../lib/sqliteClient';

interface AppContextType {
  currentView: UserRole;
  setCurrentView: (view: UserRole) => void;
  authSession: AuthSession | null;
  login: (role: UserRole, userDetails?: any) => void;
  logout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  collector: CollectorProfile;
  setCollector: React.Dispatch<React.SetStateAction<CollectorProfile>>;
  recycler: RecyclerFacility;
  materials: MaterialItem[];
  lots: EWasteLot[];
  activeCreatedLot: EWasteLot | null;
  setActiveCreatedLot: (lot: EWasteLot | null) => void;
  activePublicOrderId: string | null;
  setActivePublicOrderId: (id: string | null) => void;
  addLot: (lot: Omit<EWasteLot, 'id' | 'timestamp' | 'status'>) => Promise<EWasteLot>;
  approveAndPayLot: (lotId: string, weighbridgeWeightKg: number, paymentMode: 'UPI' | 'CASH', overrideRatePerKg?: number) => Promise<void>;
  rejectLot: (lotId: string, reason: string) => Promise<void>;
  reopenLot?: (lotId: string) => Promise<void>;
  updateMaterialPrice: (materialId: string, newPrice: number) => Promise<void>;
  addCustomMaterial: (material: MaterialItem) => Promise<void>;
  syncPendingAiClassifications: () => Promise<void>;
  isSyncingOfflineQueue: boolean;
  resetAllData: () => Promise<void>;
  deleteLotWithKey: (lotId: string, adminKey: string) => Promise<boolean>;
  restoreLot: (lot: EWasteLot) => Promise<void>;
  speak: (text: string) => void;
  stopAudio: () => void;
  isFirebaseSyncing: boolean;
  isSupabaseSyncing: boolean;
  pendingSyncCount: number;
  triggerSupabaseSync: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  VIEW: 'ekabad_view_v1',
  LANG: 'ekabad_lang_v1',
  LOTS: 'ekabad_lots_v1',
  MATERIALS: 'ekabad_materials_v1',
  COLLECTOR: 'ekabad_collector_v1',
  ONLINE: 'ekabad_online_v1',
  AUTH_SESSION: 'ekabad_auth_session_v1',
  RECYCLE_BIN: 'ekabad_govt_recycle_bin_v1',
  PAID_LOTS: 'ekabad_paid_lots_v1'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.isLoggedIn) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState<UserRole>(() => {
    try {
      const storedSession = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed && parsed.isLoggedIn && parsed.role) {
          return parsed.role;
        }
      }
      const storedView = localStorage.getItem(STORAGE_KEYS.VIEW);
      return (storedView as UserRole) || 'gateway';
    } catch {
      return 'gateway';
    }
  });

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || 'hi';
    } catch {
      return 'hi';
    }
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ONLINE);
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      return stored ? JSON.parse(stored) : INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  const [lots, setLots] = useState<EWasteLot[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOTS);
      const parsed: EWasteLot[] = stored ? JSON.parse(stored) : INITIAL_LOTS;
      const paidRaw = localStorage.getItem(STORAGE_KEYS.PAID_LOTS);
      const paidMap: Record<string, Partial<EWasteLot>> = paidRaw ? JSON.parse(paidRaw) : {};

      const merged = parsed.map((lot) => {
        const paidOverride = paidMap[lot.id.toUpperCase()] || paidMap[lot.id];
        if (paidOverride) {
          return {
            ...lot,
            ...paidOverride,
            status: 'paid' as const
          };
        }
        return lot;
      });

      // Also ensure any paid lot present in paidMap exists in the list
      Object.keys(paidMap).forEach((idKey) => {
        const p = paidMap[idKey];
        if (p && p.id && !merged.some((m) => m.id.toUpperCase() === idKey.toUpperCase())) {
          merged.unshift(p as EWasteLot);
        }
      });

      return merged;
    } catch {
      return INITIAL_LOTS;
    }
  });

  const [collector, setCollector] = useState<CollectorProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLECTOR);
      return stored ? JSON.parse(stored) : MOCK_COLLECTOR;
    } catch {
      return MOCK_COLLECTOR;
    }
  });

  const [recycler] = useState<RecyclerFacility>(MOCK_RECYCLER);
  const [activeCreatedLot, setActiveCreatedLot] = useState<EWasteLot | null>(null);
  const [activePublicOrderId, setActivePublicOrderId] = useState<string | null>(null);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(false);
  const [isSyncingOfflineQueue, setIsSyncingOfflineQueue] = useState<boolean>(false);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getSyncQueue().length);
  const hasInitializedFirebase = useRef(false);
  const isSyncingRef = useRef(false);

  // Trigger Supabase queue drain when online
  const triggerSupabaseSync = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    setIsSupabaseSyncing(true);
    try {
      const res = await processSyncQueue();
      setPendingSyncCount(getSyncQueue().length);
      if (res.syncedCount > 0) {
        console.log(`[Supabase Sync] Successfully uploaded ${res.syncedCount} queued items to PostgreSQL.`);
      }
    } catch (err) {
      console.warn('[Supabase Sync] Drain error:', err);
    } finally {
      setIsSupabaseSyncing(false);
    }
  };

  // Sync state to local storage as high-speed instant fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW, currentView);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [currentView]);

  useEffect(() => {
    try {
      if (authSession) {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(authSession));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [authSession]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, language);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [language]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSupabaseSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial background sync check on load
    triggerSupabaseSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Hydrate from SQLite database backend on boot
  useEffect(() => {
    fetchSqliteLots()
      .then((sqliteLots) => {
        if (sqliteLots && Array.isArray(sqliteLots) && sqliteLots.length > 0) {
          setLots((prev) => {
            const map = new Map<string, EWasteLot>();
            sqliteLots.forEach((l) => map.set(l.id.toUpperCase(), l));
            prev.forEach((l) => {
              const key = l.id.toUpperCase();
              if (!map.has(key)) {
                map.set(key, l);
              } else {
                const existing = map.get(key)!;
                if (l.status === 'paid' && existing.status !== 'paid') {
                  map.set(key, { ...existing, ...l, status: 'paid' });
                }
              }
            });
            const merged = Array.from(map.values());
            merged.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
            try {
              localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(merged));
            } catch (e) {
              console.warn(e);
            }
            return merged;
          });
        }
      })
      .catch(console.warn);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ONLINE, JSON.stringify(isOnline));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [isOnline]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [materials]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [lots]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COLLECTOR, JSON.stringify(collector));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [collector]);

  // Real-time Firebase Firestore synchronization across all devices and browsers
  useEffect(() => {
    let unsubscribeLots: (() => void) | undefined;
    let unsubscribeMaterials: (() => void) | undefined;
    let unsubscribeCollector: (() => void) | undefined;

    try {
      setIsFirebaseSyncing(true);

      // 1. Real-time Lots listener
      const lotsCollectionRef = collection(db, 'lots');
      unsubscribeLots = onSnapshot(lotsCollectionRef, async (snapshot) => {
        if (!snapshot.empty) {
          let paidMap: Record<string, Partial<EWasteLot>> = {};
          try {
            const paidRaw = localStorage.getItem(STORAGE_KEYS.PAID_LOTS);
            if (paidRaw) paidMap = JSON.parse(paidRaw);
          } catch (e) {
            console.warn(e);
          }

          const loadedLots: EWasteLot[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as EWasteLot;
            const docId = docSnap.id;
            const paidOverride = paidMap[docId.toUpperCase()] || paidMap[docId];
            const isPaid = data.status === 'paid' || Boolean(paidOverride);

            loadedLots.push({
              ...data,
              ...(paidOverride || {}),
              id: docId,
              status: isPaid ? 'paid' : (data.status || 'pending')
            });
          });

          // Retain any locally created or paid lots that might not yet be present in the Firestore snapshot
          setLots((prevLots) => {
            const merged = [...loadedLots];
            prevLots.forEach((pLot) => {
              if (!merged.some((m) => m.id.toUpperCase() === pLot.id.toUpperCase())) {
                merged.unshift(pLot);
              }
            });
            Object.keys(paidMap).forEach((idKey) => {
              const p = paidMap[idKey];
              if (p && p.id && !merged.some((m) => m.id.toUpperCase() === idKey.toUpperCase())) {
                merged.unshift(p as EWasteLot);
              }
            });
            merged.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
            try {
              localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(merged));
            } catch (e) {
              console.warn(e);
            }
            return merged;
          });
          setIsFirebaseSyncing(false);
        } else if (!hasInitializedFirebase.current) {
          // Initialize Firestore with default mock lots if remote database is blank
          hasInitializedFirebase.current = true;
          try {
            const batch = writeBatch(db);
            INITIAL_LOTS.forEach((lot) => {
              const docRef = doc(db, 'lots', lot.id);
              batch.set(docRef, lot, { merge: true });
            });
            await batch.commit();
          } catch (err) {
            console.warn('Firestore initial batch seed notice:', err);
          } finally {
            setIsFirebaseSyncing(false);
          }
        }
      }, (error) => {
        console.warn('Firestore lots listener error (falling back to local cache):', error);
        setIsFirebaseSyncing(false);
      });

      // 2. Real-time Materials rates listener
      const materialsCollectionRef = collection(db, 'materials');
      unsubscribeMaterials = onSnapshot(materialsCollectionRef, async (snapshot) => {
        if (!snapshot.empty) {
          const loadedMats: MaterialItem[] = [];
          snapshot.forEach((docSnap) => {
            loadedMats.push(docSnap.data() as MaterialItem);
          });
          setMaterials(loadedMats);
        } else {
          // Seed materials to Firestore if empty
          try {
            const batch = writeBatch(db);
            INITIAL_MATERIALS.forEach((mat) => {
              const docRef = doc(db, 'materials', mat.id);
              batch.set(docRef, mat, { merge: true });
            });
            await batch.commit();
          } catch (err) {
            console.warn('Firestore materials seed notice:', err);
          }
        }
      }, (error) => {
        console.warn('Firestore materials listener notice:', error);
      });

      // 3. Real-time Collector Profile listener
      const collectorDocRef = doc(db, 'collectors', MOCK_COLLECTOR.id);
      unsubscribeCollector = onSnapshot(collectorDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setCollector(docSnap.data() as CollectorProfile);
        } else {
          // Seed collector profile
          setDoc(collectorDocRef, MOCK_COLLECTOR, { merge: true }).catch(console.warn);
        }
      }, (error) => {
        console.warn('Firestore collector profile listener notice:', error);
      });

    } catch (e) {
      console.warn('Firebase initialization error:', e);
      setIsFirebaseSyncing(false);
    }

    return () => {
      if (unsubscribeLots) unsubscribeLots();
      if (unsubscribeMaterials) unsubscribeMaterials();
      if (unsubscribeCollector) unsubscribeCollector();
    };
  }, []);

  // Real-time Supabase PostgreSQL synchronization across multiple devices and browsers
  useEffect(() => {
    let supabaseChannel: ReturnType<typeof supabase.channel> | null = null;

    try {
      supabaseChannel = supabase
        .channel('realtime:lots')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'lots' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newLot = mapSupabaseRowToLot(payload.new);
              setLots((prev) => {
                if (prev.some((l) => l.id === newLot.id)) return prev;
                return [newLot, ...prev];
              });
              playFeedbackChime('beep');
            } else if (payload.eventType === 'UPDATE') {
              const updated = mapSupabaseRowToLot(payload.new);
              setLots((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            } else if (payload.eventType === 'DELETE') {
              setLots((prev) => prev.filter((l) => l.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Supabase Realtime subscription notice:', err);
    }

    return () => {
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const speak = (text: string) => {
    speakVoice(text, language);
  };

  const stopAudio = () => {
    stopVoice();
  };

  const addLot = async (lotData: Omit<EWasteLot, 'id' | 'timestamp' | 'status'>): Promise<EWasteLot> => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const timeString = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newLot: EWasteLot = {
      ...lotData,
      id: `LOT-2026-EW-${randomSuffix}`,
      timestamp: timeString,
      status: 'pending'
    };

    // Update local state immediately for snappy UI
    setLots((prev) => {
      const next = [newLot, ...prev.filter(l => l.id.toUpperCase() !== newLot.id.toUpperCase())];
      try {
        localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
    setActiveCreatedLot(newLot);

    const updatedCollector: CollectorProfile = {
      ...collector,
      totalLotsCount: collector.totalLotsCount + 1,
      todayWeightKg: Number((collector.todayWeightKg + newLot.weightKg).toFixed(1)),
      bagsDepositedKg: Math.min(collector.targetBagsKg, Number((collector.bagsDepositedKg + (newLot.hazardFlag ? newLot.weightKg : 0)).toFixed(1)))
    };
    setCollector(updatedCollector);
    try {
      localStorage.setItem(STORAGE_KEYS.COLLECTOR, JSON.stringify(updatedCollector));
    } catch (e) {
      console.warn(e);
    }

    // Persist immediately to SQLite database backend
    try {
      await saveLotToSqlite(newLot);
    } catch (err) {
      console.warn('SQLite lot creation save error:', err);
    }

    // Persist asynchronously to Firebase Firestore for cross-device sync
    try {
      const lotRef = doc(db, 'lots', newLot.id);
      await setDoc(lotRef, newLot, { merge: true });

      const collectorRef = doc(db, 'collectors', collector.id);
      await setDoc(collectorRef, updatedCollector, { merge: true });
    } catch (err) {
      console.warn('Error saving lot to Firestore, saved to offline cache:', err);
    }

    // Persist to Supabase offline-first sync queue (Last-Write-Wins)
    enqueueSyncAction('lots', 'insert', newLot.id, newLot);
    enqueueSyncAction('collectors', 'update', collector.id, updatedCollector);
    setPendingSyncCount(getSyncQueue().length);

    playFeedbackChime('success');
    return newLot;
  };

  const approveAndPayLot = async (lotId: string, weighbridgeWeightKg: number, paymentMode: 'UPI' | 'CASH', overrideRatePerKg?: number): Promise<void> => {
    const cleanId = (lotId || '').trim();
    if (!cleanId) return;

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const utr = `UTR-CPCB-${nowMs.toString().slice(-8)}`;

    const matchedLot = lots.find((l) => l.id.toUpperCase() === cleanId.toUpperCase());
    const effectiveRate = (overrideRatePerKg && overrideRatePerKg > 0) 
      ? overrideRatePerKg 
      : (matchedLot?.ratePerKg && matchedLot.ratePerKg > 0 ? matchedLot.ratePerKg : 120);
    const finalPayout = Math.round(weighbridgeWeightKg * effectiveRate);

    const updatedPaidLot: EWasteLot = {
      ...(matchedLot || {
        id: cleanId,
        collectorId: collector.id,
        collectorName: collector.name,
        materialId: 'mat_pcb_high',
        materialName: 'High-Grade Server & Telecom Motherboard',
        category: 'pcb',
        weightKg: weighbridgeWeightKg,
        ratePerKg: effectiveRate,
        totalAmount: finalPayout,
        timestamp: nowIso
      }),
      ratePerKg: effectiveRate,
      status: 'paid',
      weighbridgeWeightKg,
      finalPayoutAmount: finalPayout,
      paymentMode,
      eprCreditKg: weighbridgeWeightKg,
      paidAt: nowIso,
      paidTimestamp: nowMs,
      settlementUtr: utr,
      anomalyFlag: false,
      anomalyCleared: true,
      anomalyResolution: 'Supervisor Weighbridge Clearance Override Authorized'
    };

    // 1. Immediately store in persistent PAID_LOTS map in localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PAID_LOTS);
      const map: Record<string, Partial<EWasteLot>> = raw ? JSON.parse(raw) : {};
      map[cleanId.toUpperCase()] = updatedPaidLot;
      map[cleanId.toLowerCase()] = updatedPaidLot;
      map[cleanId] = updatedPaidLot;
      localStorage.setItem(STORAGE_KEYS.PAID_LOTS, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to update PAID_LOTS in storage:', e);
    }

    // 2. Immediately update lots state & STORAGE_KEYS.LOTS
    setLots((prev) => {
      let found = false;
      const nextLots = prev.map((lot) => {
        if (lot.id.toUpperCase() === cleanId.toUpperCase()) {
          found = true;
          return updatedPaidLot;
        }
        return lot;
      });
      if (!found) {
        nextLots.unshift(updatedPaidLot);
      }
      try {
        localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(nextLots));
      } catch (e) {
        console.warn(e);
      }
      return nextLots;
    });

    // 3. Update collector earnings
    let updatedCollector = collector;
    if (matchedLot && matchedLot.collectorId === collector.id) {
      updatedCollector = {
        ...collector,
        todayEarnings: collector.todayEarnings + finalPayout
      };
      setCollector(updatedCollector);
      try {
        localStorage.setItem(STORAGE_KEYS.COLLECTOR, JSON.stringify(updatedCollector));
      } catch (e) {
        console.warn(e);
      }
    }

    // 4. Save to Firestore using setDoc with merge: true (never fails with document not found)
    try {
      const lotRef = doc(db, 'lots', cleanId);
      await setDoc(lotRef, updatedPaidLot, { merge: true });

      if (matchedLot && matchedLot.collectorId === collector.id) {
        const collectorRef = doc(db, 'collectors', collector.id);
        await setDoc(collectorRef, { todayEarnings: updatedCollector.todayEarnings }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore update error, cached locally:', err);
    }

    // 5. Save to SQLite database backend
    try {
      await updateLotInSqlite(cleanId, updatedPaidLot);
    } catch (err) {
      console.warn('SQLite lot payment update error:', err);
    }

    // 6. Offline sync queue
    enqueueSyncAction('lots', 'update', cleanId, updatedPaidLot);
    enqueueSyncAction('transactions', 'insert', `TXN-${cleanId}`, {
      id: `TXN-${cleanId}`,
      lot_id: cleanId,
      collector_id: matchedLot?.collectorId || collector.id,
      weighbridge_weight_kg: weighbridgeWeightKg,
      rate_per_kg: effectiveRate,
      payout_amount: finalPayout,
      payment_mode: paymentMode,
      payment_status: 'completed',
      epr_credit_generated_kg: weighbridgeWeightKg,
    });
    enqueueSyncAction('collectors', 'update', collector.id, updatedCollector);
    setPendingSyncCount(getSyncQueue().length);

    playFeedbackChime('success');
  };

  const rejectLot = async (lotId: string, reason: string): Promise<void> => {
    const cleanId = (lotId || '').trim();
    let updatedLot: EWasteLot | undefined;

    setLots((prev) => {
      const nextLots = prev.map((lot) => {
        if (lot.id.toUpperCase() === cleanId.toUpperCase()) {
          updatedLot = {
            ...lot,
            status: 'rejected',
            anomalyFlag: true,
            anomalyReason: reason,
            rejectionReason: reason
          };
          return updatedLot;
        }
        return lot;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(nextLots));
      } catch (e) {
        console.warn(e);
      }
      return nextLots;
    });

    // Remove from PAID_LOTS cache if present
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PAID_LOTS);
      if (raw) {
        const map = JSON.parse(raw);
        delete map[cleanId];
        delete map[cleanId.toUpperCase()];
        delete map[cleanId.toLowerCase()];
        localStorage.setItem(STORAGE_KEYS.PAID_LOTS, JSON.stringify(map));
      }
    } catch (e) {
      console.warn('Failed to clear PAID_LOTS on reject:', e);
    }

    // Save to SQLite
    if (updatedLot) {
      try {
        await updateLotInSqlite(cleanId, updatedLot);
      } catch (sqlErr) {
        console.warn('SQLite rejectLot error:', sqlErr);
      }
    }

    // Save to Firestore with setDoc merge: true
    try {
      const lotRef = doc(db, 'lots', cleanId);
      if (updatedLot) {
        await setDoc(lotRef, updatedLot, { merge: true });
      } else {
        await setDoc(lotRef, {
          id: cleanId,
          status: 'rejected',
          anomalyFlag: true,
          anomalyReason: reason,
          rejectionReason: reason
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore rejectLot error, cached locally:', err);
    }

    if (updatedLot) {
      enqueueSyncAction('lots', 'update', cleanId, updatedLot);
      setPendingSyncCount(getSyncQueue().length);
    }

    playFeedbackChime('warning');
  };

  const reopenLot = async (lotId: string): Promise<void> => {
    let updatedLot: EWasteLot | undefined;
    setLots((prev) =>
      prev.map((lot) => {
        if (lot.id === lotId) {
          updatedLot = {
            ...lot,
            status: 'pending',
            anomalyFlag: true
          };
          return updatedLot;
        }
        return lot;
      })
    );

    try {
      const lotRef = doc(db, 'lots', lotId);
      await updateDoc(lotRef, {
        status: 'pending',
        anomalyFlag: true
      });
    } catch (err) {
      console.warn('Firestore reopenLot error, cached locally:', err);
    }

    if (updatedLot) {
      enqueueSyncAction('lots', 'update', lotId, updatedLot);
      setPendingSyncCount(getSyncQueue().length);
    }

    playFeedbackChime('beep');
  };

  const syncPendingAiClassifications = async (): Promise<void> => {
    if (isSyncingRef.current || !isOnline) return;

    // Find any lots that need AI classification (saved while offline)
    const pendingLots = lots.filter(l => l.needsOnlineAiCategorization && l.photoUrl);
    if (pendingLots.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncingOfflineQueue(true);

    try {
      for (const lot of pendingLots) {
        try {
          const res = await fetch('/api/ai/classify-material', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: lot.photoUrl, language })
          });
          const resData = await res.json();
          if (resData.success && resData.data) {
            const aiData = resData.data;
            const isNonEWaste = aiData.isEWaste === false;
            const updatedRate = isNonEWaste ? 0 : (aiData.estimatedRatePerKg || lot.ratePerKg);
            const updatedTotal = Math.round(lot.weightKg * updatedRate);
            const isHazard = aiData.hazardLevel === 'high' || lot.hazardFlag;

            const updatedLot: EWasteLot = {
              ...lot,
              materialName: aiData.detectedCategory || lot.materialName,
              ratePerKg: updatedRate,
              totalAmount: updatedTotal,
              hazardFlag: isHazard,
              hazardNote: aiData.hazardWarning || lot.hazardNote,
              needsOnlineAiCategorization: false,
              anomalyFlag: isNonEWaste ? true : lot.anomalyFlag,
              anomalyReason: isNonEWaste ? `AI Flag: Non-electronic item detected (${aiData.detectedObject || 'Invalid Item'})` : lot.anomalyReason,
              status: isNonEWaste ? 'rejected' : lot.status
            };

            setLots((prev) => prev.map((l) => (l.id === lot.id ? updatedLot : l)));

            // Update in Firestore
            try {
              const lotRef = doc(db, 'lots', lot.id);
              await updateDoc(lotRef, {
                materialName: updatedLot.materialName,
                ratePerKg: updatedLot.ratePerKg,
                totalAmount: updatedLot.totalAmount,
                hazardFlag: updatedLot.hazardFlag,
                hazardNote: updatedLot.hazardNote || null,
                needsOnlineAiCategorization: false,
                anomalyFlag: updatedLot.anomalyFlag || false,
                anomalyReason: updatedLot.anomalyReason || null,
                status: updatedLot.status
              });
            } catch (fsErr) {
              console.warn('Firestore queue sync error:', fsErr);
            }
          }
        } catch (itemErr) {
          console.warn(`Error processing pending AI classification for ${lot.id}:`, itemErr);
        }
      }
    } finally {
      setIsSyncingOfflineQueue(false);
      isSyncingRef.current = false;
    }
  };

  // Automatically trigger sync when coming online
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        syncPendingAiClassifications();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, lots]);

  const updateMaterialPrice = async (materialId: string, newPrice: number): Promise<void> => {
    let updatedMat: MaterialItem | undefined;

    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          const trend = Number((((newPrice - m.pricePerKg) / m.pricePerKg) * 100).toFixed(1));
          updatedMat = {
            ...m,
            pricePerKg: newPrice,
            trend
          };
          return updatedMat;
        }
        return m;
      })
    );

    try {
      if (updatedMat) {
        const matRef = doc(db, 'materials', materialId);
        await setDoc(matRef, updatedMat, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore updateMaterialPrice error:', err);
    }

    if (updatedMat) {
      enqueueSyncAction('materials', 'update', materialId, updatedMat);
      setPendingSyncCount(getSyncQueue().length);
    }

    playFeedbackChime('beep');
  };

  const addCustomMaterial = async (newMat: MaterialItem): Promise<void> => {
    setMaterials((prev) => {
      const exists = prev.some((m) => m.id === newMat.id);
      if (exists) {
        return prev.map((m) => (m.id === newMat.id ? newMat : m));
      }
      return [newMat, ...prev];
    });

    try {
      const matRef = doc(db, 'materials', newMat.id);
      await setDoc(matRef, newMat, { merge: true });
    } catch (err) {
      console.warn('Firestore addCustomMaterial error:', err);
    }

    enqueueSyncAction('materials', 'upsert', newMat.id, newMat);
    setPendingSyncCount(getSyncQueue().length);

    playFeedbackChime('success');
  };

  const resetAllData = async (): Promise<void> => {
    localStorage.clear();
    setMaterials(INITIAL_MATERIALS);
    setLots(INITIAL_LOTS);
    setCollector(MOCK_COLLECTOR);
    setActiveCreatedLot(null);
    setCurrentView('gateway');
    setLanguageState('hi');
    setIsOnline(true);

    try {
      const batch = writeBatch(db);
      INITIAL_LOTS.forEach((lot) => {
        const docRef = doc(db, 'lots', lot.id);
        batch.set(docRef, lot);
      });
      INITIAL_MATERIALS.forEach((mat) => {
        const docRef = doc(db, 'materials', mat.id);
        batch.set(docRef, mat);
      });
      const colRef = doc(db, 'collectors', MOCK_COLLECTOR.id);
      batch.set(colRef, MOCK_COLLECTOR);
      await batch.commit();
    } catch (err) {
      console.warn('Firestore resetAllData notice:', err);
    }

    playFeedbackChime('beep');
  };

  const login = (role: UserRole, userDetails?: any) => {
    const session: AuthSession = {
      isLoggedIn: true,
      role,
      user: userDetails || {
        id: role === 'collector' ? collector.id : role === 'recycler' ? recycler.id : 'GOV-CPCB-OFFICER',
        name: role === 'collector' ? collector.name : role === 'recycler' ? recycler.name : 'CPCB Central Desk'
      },
      loginTime: Date.now()
    };
    setAuthSession(session);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.VIEW, role);
    } catch (e) {
      console.warn('LocalStorage auth session save notice:', e);
    }
    setCurrentView(role);
    playFeedbackChime('success');
  };

  const logout = () => {
    setAuthSession(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      localStorage.setItem(STORAGE_KEYS.VIEW, 'gateway');
    } catch (e) {
      console.warn('LocalStorage auth session clear notice:', e);
    }
    setCurrentView('gateway');
    playFeedbackChime('beep');
  };

  const deleteLotWithKey = async (lotId: string, adminKey: string): Promise<boolean> => {
    if (adminKey.trim() !== '12345678') {
      return false;
    }

    setLots((prev) => prev.filter((l) => l.id !== lotId));

    try {
      const lotRef = doc(db, 'lots', lotId);
      await deleteDoc(lotRef);
    } catch (e) {
      console.warn('Firestore deleteLot notice:', e);
    }

    try {
      enqueueSyncAction('lots', 'delete', lotId, { id: lotId });
      setPendingSyncCount(getSyncQueue().length);
    } catch (e) {
      console.warn('Sync queue delete notice:', e);
    }

    return true;
  };

  const restoreLot = async (lot: EWasteLot): Promise<void> => {
    setLots((prev) => {
      const exists = prev.some((l) => l.id === lot.id);
      return exists ? prev : [lot, ...prev];
    });

    try {
      const lotRef = doc(db, 'lots', lot.id);
      await setDoc(lotRef, lot, { merge: true });
    } catch (e) {
      console.warn('Firestore restoreLot notice:', e);
    }

    try {
      enqueueSyncAction('lots', 'insert', lot.id, lot);
      setPendingSyncCount(getSyncQueue().length);
    } catch (e) {
      console.warn('Sync queue restore notice:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        authSession,
        login,
        logout,
        language,
        setLanguage,
        isOnline,
        setIsOnline,
        collector,
        setCollector,
        recycler,
        materials,
        lots,
        activeCreatedLot,
        setActiveCreatedLot,
        activePublicOrderId,
        setActivePublicOrderId,
        addLot,
        approveAndPayLot,
        rejectLot,
        reopenLot,
        updateMaterialPrice,
        addCustomMaterial,
        syncPendingAiClassifications,
        isSyncingOfflineQueue,
        resetAllData,
        deleteLotWithKey,
        restoreLot,
        speak,
        stopAudio,
        isFirebaseSyncing,
        isSupabaseSyncing,
        pendingSyncCount,
        triggerSupabaseSync
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
export default AppContext;
