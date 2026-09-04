import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Language, UserRole, MaterialItem, EWasteLot, CollectorProfile, RecyclerFacility } from '../types';
import { INITIAL_MATERIALS, INITIAL_LOTS, MOCK_COLLECTOR, MOCK_RECYCLER } from '../data/mockData';
import { speakVoice, playFeedbackChime, stopVoice } from '../utils/speech';

interface AppContextType {
  currentView: UserRole;
  setCurrentView: (view: UserRole) => void;
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
  addLot: (lot: Omit<EWasteLot, 'id' | 'timestamp' | 'status'>) => Promise<EWasteLot>;
  approveAndPayLot: (lotId: string, weighbridgeWeightKg: number, paymentMode: 'UPI' | 'CASH') => Promise<void>;
  rejectLot: (lotId: string, reason: string) => Promise<void>;
  reopenLot?: (lotId: string) => Promise<void>;
  updateMaterialPrice: (materialId: string, newPrice: number) => Promise<void>;
  addCustomMaterial: (material: MaterialItem) => Promise<void>;
  syncPendingAiClassifications: () => Promise<void>;
  isSyncingOfflineQueue: boolean;
  resetAllData: () => Promise<void>;
  speak: (text: string) => void;
  stopAudio: () => void;
  isFirebaseSyncing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  VIEW: 'ekabad_view_v1',
  LANG: 'ekabad_lang_v1',
  LOTS: 'ekabad_lots_v1',
  MATERIALS: 'ekabad_materials_v1',
  COLLECTOR: 'ekabad_collector_v1',
  ONLINE: 'ekabad_online_v1'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<UserRole>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.VIEW) as UserRole) || 'gateway';
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
      return stored ? JSON.parse(stored) : INITIAL_LOTS;
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
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(false);
  const [isSyncingOfflineQueue, setIsSyncingOfflineQueue] = useState<boolean>(false);
  const hasInitializedFirebase = useRef(false);
  const isSyncingRef = useRef(false);

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
      localStorage.setItem(STORAGE_KEYS.LANG, language);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [language]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
          const loadedLots: EWasteLot[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as EWasteLot;
            loadedLots.push({
              ...data,
              id: docSnap.id
            });
          });

          // Sort by creation or natural descending order
          loadedLots.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          setLots(loadedLots);
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
    setLots((prev) => [newLot, ...prev]);
    setActiveCreatedLot(newLot);

    const updatedCollector: CollectorProfile = {
      ...collector,
      totalLotsCount: collector.totalLotsCount + 1,
      todayWeightKg: Number((collector.todayWeightKg + newLot.weightKg).toFixed(1)),
      bagsDepositedKg: Math.min(collector.targetBagsKg, Number((collector.bagsDepositedKg + (newLot.hazardFlag ? newLot.weightKg : 0)).toFixed(1)))
    };
    setCollector(updatedCollector);

    // Persist asynchronously to Firebase Firestore for cross-device sync
    try {
      const lotRef = doc(db, 'lots', newLot.id);
      await setDoc(lotRef, newLot);

      const collectorRef = doc(db, 'collectors', collector.id);
      await setDoc(collectorRef, updatedCollector, { merge: true });
    } catch (err) {
      console.warn('Error saving lot to Firestore, saved to offline cache:', err);
    }

    playFeedbackChime('success');
    return newLot;
  };

  const approveAndPayLot = async (lotId: string, weighbridgeWeightKg: number, paymentMode: 'UPI' | 'CASH'): Promise<void> => {
    let updatedLot: EWasteLot | undefined;

    setLots((prev) =>
      prev.map((lot) => {
        if (lot.id === lotId) {
          const finalPayout = Math.round(weighbridgeWeightKg * lot.ratePerKg);
          updatedLot = {
            ...lot,
            status: 'paid',
            weighbridgeWeightKg,
            finalPayoutAmount: finalPayout,
            paymentMode,
            eprCreditKg: weighbridgeWeightKg
          };
          return updatedLot;
        }
        return lot;
      })
    );

    const matchedLot = lots.find((l) => l.id === lotId);
    let updatedCollector = collector;
    if (matchedLot && matchedLot.collectorId === collector.id) {
      const payout = Math.round(weighbridgeWeightKg * matchedLot.ratePerKg);
      updatedCollector = {
        ...collector,
        todayEarnings: collector.todayEarnings + payout
      };
      setCollector(updatedCollector);
    }

    // Persist to Firebase Firestore
    try {
      if (updatedLot) {
        const lotRef = doc(db, 'lots', lotId);
        await updateDoc(lotRef, {
          status: 'paid',
          weighbridgeWeightKg,
          finalPayoutAmount: Math.round(weighbridgeWeightKg * updatedLot.ratePerKg),
          paymentMode,
          eprCreditKg: weighbridgeWeightKg
        });
      }
      if (matchedLot && matchedLot.collectorId === collector.id) {
        const collectorRef = doc(db, 'collectors', collector.id);
        await updateDoc(collectorRef, {
          todayEarnings: updatedCollector.todayEarnings
        });
      }
    } catch (err) {
      console.warn('Firestore update error, cached locally:', err);
    }

    playFeedbackChime('success');
  };

  const rejectLot = async (lotId: string, reason: string): Promise<void> => {
    setLots((prev) =>
      prev.map((lot) => {
        if (lot.id === lotId) {
          return {
            ...lot,
            status: 'rejected',
            anomalyFlag: true,
            anomalyReason: reason
          };
        }
        return lot;
      })
    );

    try {
      const lotRef = doc(db, 'lots', lotId);
      await updateDoc(lotRef, {
        status: 'rejected',
        anomalyFlag: true,
        anomalyReason: reason
      });
    } catch (err) {
      console.warn('Firestore rejectLot error, cached locally:', err);
    }

    playFeedbackChime('warning');
  };

  const reopenLot = async (lotId: string): Promise<void> => {
    setLots((prev) =>
      prev.map((lot) => {
        if (lot.id === lotId) {
          return {
            ...lot,
            status: 'pending',
            anomalyFlag: true
          };
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

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
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
        addLot,
        approveAndPayLot,
        rejectLot,
        reopenLot,
        updateMaterialPrice,
        addCustomMaterial,
        syncPendingAiClassifications,
        isSyncingOfflineQueue,
        resetAllData,
        speak,
        stopAudio,
        isFirebaseSyncing
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
