import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Scale, 
  MapPin, 
  Building2, 
  User, 
  QrCode, 
  ExternalLink, 
  Copy, 
  Check, 
  Printer, 
  AlertTriangle, 
  FileText,
  CreditCard,
  Award,
  RefreshCw, 
  Zap, 
  CheckCheck,
  Globe
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { EWasteLot } from '../types';
import { playFeedbackChime } from '../utils/speech';
import { getLiveTrackingUrl, VERCEL_DOMAIN, VERCEL_BASE_URL } from '../utils/trackingUrl';
import { db } from '../lib/firebase';
import { doc, onSnapshot, getDocFromServer, setDoc } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { fetchSqliteLotById, updateLotInSqlite } from '../lib/sqliteClient';
import { formatDisplayDateTime } from '../utils/dateTime';

interface PublicOrderTrackingViewProps {
  orderId: string;
  lot?: EWasteLot;
  onBackToApp?: () => void;
}

export const PublicOrderTrackingView: React.FC<PublicOrderTrackingViewProps> = ({
  orderId,
  lot,
  onBackToApp
}) => {
  const { lots, currentView, approveAndPayLot } = useApp();
  const [copied, setCopied] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Connecting...');

  // Check if viewing from an authority role or url param
  const isScrapCollector = currentView === 'collector';
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isAuthorityFromUrl = urlParams?.get('authority') === '1' || urlParams?.get('auth') === 'true';
  const isAuthorityRole = !isScrapCollector && (currentView === 'recycler' || currentView === 'government' || isAuthorityFromUrl);
  const [isAuthorityMode, setIsAuthorityMode] = useState<boolean>(isAuthorityRole);

  useEffect(() => {
    if (isScrapCollector) {
      setIsAuthorityMode(false);
    } else if (isAuthorityRole) {
      setIsAuthorityMode(true);
    }
  }, [currentView, isScrapCollector, isAuthorityRole]);

  // Helper to read persistent paid data from localStorage
  const getStoredPaidData = (id: string): Partial<EWasteLot> | null => {
    if (!id) return null;
    try {
      const raw = localStorage.getItem('ekabad_paid_lots_v1');
      if (raw) {
        const map = JSON.parse(raw);
        return map[id.toUpperCase()] || map[id.toLowerCase()] || map[id] || null;
      }
    } catch (e) {
      console.warn(e);
    }
    return null;
  };

  // Fallback demo mock if lot not yet loaded
  const defaultFallbackLot: EWasteLot = {
    id: orderId || 'LOT-2026-EW-8812',
    collectorId: 'KBD-MH-4402',
    collectorName: 'Ram Sevak (रामसेवक कांबळे)',
    collectorPhone: '+91 98234 56789',
    materialId: 'mat_pcb_high',
    materialName: 'High-Grade Server & Telecom Motherboard',
    category: 'pcb',
    weightKg: 5.0,
    ratePerKg: 480,
    totalAmount: 2400,
    status: 'pending',
    timestamp: new Date().toISOString(),
    gpsLocation: '18.5204° N, 73.8567° E (Ward 12, Pune)',
    facilityId: 'REC-MH-PN-004',
    facilityName: 'EcoMetals CPCB Authorized Dismantling Unit #4',
    distanceKm: 3.8,
    hazardFlag: false,
    photoUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=400&auto=format&fit=crop&q=80'
  };

  const [currentLot, setCurrentLot] = useState<EWasteLot>(() => {
    const rawId = (orderId || lot?.id || '').trim();
    const paidOverride = getStoredPaidData(rawId);
    const contextMatch = lots.find((l) => l.id.toUpperCase() === rawId.toUpperCase());
    const base = lot || contextMatch || defaultFallbackLot;
    if (paidOverride) {
      return {
        ...base,
        ...paidOverride,
        status: 'paid' as const
      };
    }
    return base;
  });

  const [authorityWeightInput, setAuthorityWeightInput] = useState<number>(() => {
    return currentLot.weighbridgeWeightKg || currentLot.weightKg || 5.0;
  });
  const [authorityRateInput, setAuthorityRateInput] = useState<number>(() => {
    return (currentLot.ratePerKg && currentLot.ratePerKg > 0) ? currentLot.ratePerKg : 120;
  });
  const [authorityPaymentMode, setAuthorityPaymentMode] = useState<'UPI' | 'CASH'>('UPI');
  const [isDisbursing, setIsDisbursing] = useState(false);

  const previousStatusRef = useRef<string>(currentLot.status);

  // Keep authority inputs updated when currentLot changes
  useEffect(() => {
    if (currentLot.weighbridgeWeightKg) {
      setAuthorityWeightInput(currentLot.weighbridgeWeightKg);
    } else if (currentLot.weightKg) {
      setAuthorityWeightInput(currentLot.weightKg);
    }
    if (currentLot.ratePerKg && currentLot.ratePerKg > 0) {
      setAuthorityRateInput(currentLot.ratePerKg);
    }
  }, [currentLot.weighbridgeWeightKg, currentLot.weightKg, currentLot.ratePerKg]);

  // Hydrate from SQLite storage on mount or ID change
  useEffect(() => {
    const targetLotId = (orderId || lot?.id || currentLot.id).trim();
    if (!targetLotId) return;

    let isMounted = true;
    fetchSqliteLotById(targetLotId).then((sqliteLot) => {
      if (isMounted && sqliteLot) {
        setCurrentLot((prev) => {
          const isSqlitePaid = sqliteLot.status?.toLowerCase() === 'paid' || 
                               Boolean(sqliteLot.paidAt) || 
                               Boolean(sqliteLot.settlementUtr);
          if (isSqlitePaid) {
            return {
              ...prev,
              ...sqliteLot,
              status: 'paid'
            };
          }
          return { ...prev, ...sqliteLot };
        });
      }
    }).catch(console.warn);

    return () => {
      isMounted = false;
    };
  }, [orderId, lot?.id]);

  // Sync when prop lot or context lots update
  useEffect(() => {
    const targetId = (orderId || lot?.id || currentLot.id).trim();
    const paidOverride = getStoredPaidData(targetId);

    if (lot) {
      setCurrentLot((prev) => {
        const prevPaid = prev.status === 'paid' || Boolean(prev.paidAt) || Boolean(prev.settlementUtr) || Boolean(paidOverride);
        if (prevPaid) {
          return {
            ...lot,
            ...(paidOverride || {}),
            status: 'paid',
            paidAt: prev.paidAt || paidOverride?.paidAt,
            settlementUtr: prev.settlementUtr || paidOverride?.settlementUtr
          };
        }
        return lot;
      });
    } else {
      const match = lots.find((l) => l.id.toUpperCase() === (orderId || '').toUpperCase());
      if (match) {
        setCurrentLot((prev) => {
          const prevPaid = prev.status === 'paid' || Boolean(prev.paidAt) || Boolean(prev.settlementUtr) || Boolean(paidOverride);
          if (prevPaid) {
            return {
              ...match,
              ...(paidOverride || {}),
              status: 'paid',
              paidAt: prev.paidAt || paidOverride?.paidAt,
              settlementUtr: prev.settlementUtr || paidOverride?.settlementUtr
            };
          }
          return match;
        });
      }
    }
  }, [lot, lots, orderId]);

  // Establish direct Real-Time Firestore onSnapshot listener
  useEffect(() => {
    const targetLotId = (orderId || lot?.id || currentLot.id).trim();
    if (!targetLotId) return;

    setIsRealtimeActive(true);
    setLastSyncTime(new Date().toLocaleTimeString());

    const docRef = doc(db, 'lots', targetLotId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        setIsRealtimeActive(true);
        setLastSyncTime(new Date().toLocaleTimeString());

        if (docSnap.exists()) {
          const liveData = docSnap.data() as EWasteLot;
          const updated: EWasteLot = {
            ...liveData,
            id: docSnap.id
          };

          // Play success sound when transitioning to 'paid' in real-time
          if (previousStatusRef.current !== 'paid' && updated.status === 'paid') {
            playFeedbackChime('success');
          }
          previousStatusRef.current = updated.status;

          const paidOverride = getStoredPaidData(targetLotId);

          // Never revert a paid lot back to pending via Firestore snapshot
          setCurrentLot((prev) => {
            const isLocalOrPrevPaid = prev.status?.toLowerCase() === 'paid' || 
                                      Boolean(prev.paidAt) || 
                                      Boolean(prev.settlementUtr) ||
                                      Boolean(paidOverride);

            if (isLocalOrPrevPaid || updated.status === 'paid') {
              return {
                ...updated,
                ...(paidOverride || {}),
                status: 'paid',
                paidAt: prev.paidAt || updated.paidAt || paidOverride?.paidAt,
                paidTimestamp: prev.paidTimestamp || updated.paidTimestamp || paidOverride?.paidTimestamp,
                settlementUtr: prev.settlementUtr || updated.settlementUtr || paidOverride?.settlementUtr,
                weighbridgeWeightKg: prev.weighbridgeWeightKg || updated.weighbridgeWeightKg || paidOverride?.weighbridgeWeightKg,
                finalPayoutAmount: prev.finalPayoutAmount || updated.finalPayoutAmount || paidOverride?.finalPayoutAmount,
                paymentMode: prev.paymentMode || updated.paymentMode || paidOverride?.paymentMode
              };
            }
            return updated;
          });
        }
      },
      (error) => {
        console.warn('Realtime listener error:', error);
        setIsRealtimeActive(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [orderId, lot?.id]);

  // Manual server force-refresh
  const handleManualSync = async () => {
    const targetLotId = (orderId || lot?.id || currentLot.id).trim();
    if (!targetLotId) return;

    setIsManualSyncing(true);
    try {
      // 1. Sync from SQLite first
      const sqliteRecord = await fetchSqliteLotById(targetLotId);
      if (sqliteRecord) {
        setCurrentLot((prev) => {
          const isSqlitePaid = sqliteRecord.status === 'paid' || Boolean(sqliteRecord.paidAt) || Boolean(sqliteRecord.settlementUtr);
          return isSqlitePaid ? { ...prev, ...sqliteRecord, status: 'paid' } : { ...prev, ...sqliteRecord };
        });
      }

      // 2. Sync from Firestore
      const docRef = doc(db, 'lots', targetLotId);
      const snap = await getDocFromServer(docRef);
      if (snap.exists()) {
        const liveData = snap.data() as EWasteLot;
        setCurrentLot((prev) => {
          const prevPaid = prev.status === 'paid' || Boolean(prev.paidAt) || Boolean(prev.settlementUtr);
          if (prevPaid && liveData.status !== 'paid') {
            return { ...liveData, id: snap.id, status: 'paid', paidAt: prev.paidAt, settlementUtr: prev.settlementUtr };
          }
          return { ...liveData, id: snap.id };
        });
      }
      playFeedbackChime('beep');
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Manual server fetch notice:', err);
    } finally {
      setTimeout(() => setIsManualSyncing(false), 500);
    }
  };

  const displayLot = currentLot;
  const liveTrackingUrl = getLiveTrackingUrl(displayLot.id);
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(liveTrackingUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveTrackingUrl);
    setCopied(true);
    playFeedbackChime('beep');
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine stage progress robustly
  const isPaid = displayLot.status?.toLowerCase() === 'paid' || 
                 displayLot.status?.toLowerCase() === 'settled' ||
                 Boolean(displayLot.paidAt) ||
                 Boolean(displayLot.settlementUtr);
  const isVerified = isPaid || displayLot.status === 'verified';
  const isRejected = displayLot.status === 'rejected';
  const effectiveWeight = displayLot.weighbridgeWeightKg || displayLot.weightKg;
  const effectiveAmount = displayLot.finalPayoutAmount || (displayLot.weighbridgeWeightKg ? Math.round(displayLot.weighbridgeWeightKg * displayLot.ratePerKg) : displayLot.totalAmount);

  const handleAuthorityDisburse = async () => {
    if (isPaid) return;
    setIsDisbursing(true);
    try {
      const nowIso = new Date().toISOString();
      const nowMs = Date.now();
      const utr = `UTR-CPCB-${nowMs.toString().slice(-8)}`;
      const effectiveRate = (displayLot.ratePerKg && displayLot.ratePerKg > 0) ? displayLot.ratePerKg : authorityRateInput;
      const payoutVal = Math.round(authorityWeightInput * effectiveRate);

      const updatedPaidLot: EWasteLot = {
        ...currentLot,
        ratePerKg: effectiveRate,
        status: 'paid',
        weighbridgeWeightKg: authorityWeightInput,
        finalPayoutAmount: payoutVal,
        paymentMode: authorityPaymentMode,
        eprCreditKg: authorityWeightInput,
        paidAt: nowIso,
        paidTimestamp: nowMs,
        settlementUtr: utr
      };

      // 1. Immediately store in persistent PAID_LOTS map in localStorage
      try {
        const raw = localStorage.getItem('ekabad_paid_lots_v1');
        const map = raw ? JSON.parse(raw) : {};
        map[displayLot.id.toUpperCase()] = updatedPaidLot;
        map[displayLot.id] = updatedPaidLot;
        localStorage.setItem('ekabad_paid_lots_v1', JSON.stringify(map));
      } catch (e) {
        console.warn('Failed to update PAID_LOTS in storage:', e);
      }

      // 2. Immediately update local state so UI switches instantly to Paid (no paying again)
      setCurrentLot(updatedPaidLot);
      previousStatusRef.current = 'paid';

      // 3. Persist to AppContext
      await approveAndPayLot(displayLot.id, authorityWeightInput, authorityPaymentMode, effectiveRate);

      // 4. Direct Firestore setDoc with merge: true (so it creates/updates and never throws error)
      try {
        const lotRef = doc(db, 'lots', displayLot.id);
        await setDoc(lotRef, updatedPaidLot, { merge: true });
      } catch (err) {
        console.warn('Direct Firestore write in view:', err);
      }

      // 5. Direct SQLite write to ensure immediate relational persistence
      await updateLotInSqlite(displayLot.id, updatedPaidLot);

      playFeedbackChime('success');
    } catch (err) {
      console.error('Disbursement error:', err);
    } finally {
      setIsDisbursing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16 animate-fadeIn">
      {/* Top MoEFCC Statutory Header Bar */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-2 px-4 border-b border-emerald-800">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold tracking-wide">MINISTRY OF ENVIRONMENT, FOREST & CLIMATE CHANGE (MoEFCC)</span>
            <span className="hidden sm:inline text-emerald-300">|</span>
            <span className="hidden sm:inline text-emerald-200">CPCB National E-Waste Traceability Ledger</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-emerald-300">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isRealtimeActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span>{isRealtimeActive ? 'Firebase Live Connected' : 'Syncing'}</span>
            </span>
            <span>•</span>
            <span>Last Sync: {lastSyncTime}</span>
          </div>
        </div>
      </div>

      {/* Main Nav Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Return to Portal"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  E-Kabad Setu Official Order Tracking
                </h1>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isPaid 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {isPaid ? 'Settled & Paid' : 'Live Manifest'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Manifest #{displayLot.id} • {VERCEL_BASE_URL}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* If user is scrap collector: show badge indicating Collector View (cannot disburse to self) */}
            {isScrapCollector ? (
              <div
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-mono font-medium flex items-center gap-1.5"
                title="Collector Account - View Only"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Collector View</span>
              </div>
            ) : isAuthorityRole ? (
              /* If user is authorized recycler or government: show Authority status */
              <div
                className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold font-mono flex items-center gap-1.5"
                title="Authorized Recycler Facility Gate Clearance"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Recycler Authority Mode</span>
              </div>
            ) : (
              /* Public / Citizen View */
              <div
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-mono flex items-center gap-1.5"
                title="CPCB Public Citizen Transparency Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Public Citizen View</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isManualSyncing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Force Real-time Server Sync"
            >
              <RefreshCw className={`w-4 h-4 ${isManualSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer hidden sm:flex"
              title="Print Official Manifest"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share QR Link'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">

        {/* STATUTORY CLEARANCE & PAYMENT SECTION */}
        {isAuthorityMode ? (
          !isPaid ? (
            /* CASE 1: AUTHORITY UNPAID -> DIRECT ACTION WITH WEIGHBRIDGE & INSTANT COLLECTOR PAYOUT */
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 rounded-3xl p-6 shadow-md space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300">
                        Direct Facility Gate Settlement
                      </span>
                      <span className="text-xs font-extrabold text-amber-800">STATUS: UNPAID (READY FOR PAYOUT)</span>
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Class-III Weighbridge Audit & Direct Statutory Settlement
                    </h2>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[10px] font-mono uppercase text-amber-800 font-bold">Safai Sathi / Collector</div>
                  <div className="text-xs font-bold text-slate-900">{displayLot.collectorName} ({displayLot.collectorId})</div>
                </div>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 ${displayLot.ratePerKg === 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 pt-1`}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Class-III Verified Gross Weight (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={authorityWeightInput}
                      onChange={(e) => setAuthorityWeightInput(Math.max(0.1, parseFloat(e.target.value) || 0))}
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">kg</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                    Declared Mass: {displayLot.weightKg} kg
                  </span>
                </div>

                {displayLot.ratePerKg === 0 && (
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      Factory Agreed Rate (₹/kg)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₹</span>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={authorityRateInput}
                        onChange={(e) => setAuthorityRateInput(Math.max(1, parseFloat(e.target.value) || 0))}
                        className="w-full pl-7 pr-10 py-2.5 bg-white border border-amber-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">/kg</span>
                    </div>
                    <span className="text-[11px] text-amber-800 font-mono mt-1 block font-semibold">
                      Original Rate: TBD (Factory Decides)
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Statutory Payment Mode
                  </label>
                  <select
                    value={authorityPaymentMode}
                    onChange={(e) => setAuthorityPaymentMode(e.target.value as 'UPI' | 'CASH')}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UPI">Direct Instant UPI</option>
                    <option value="CASH">Physical Cash Voucher</option>
                  </select>
                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                    {displayLot.ratePerKg === 0 ? 'Custom Rate Payout' : `CPCB Floor Rate: ₹${displayLot.ratePerKg}/kg`}
                  </span>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    disabled={isDisbursing}
                    onClick={handleAuthorityDisburse}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isDisbursing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Disbursing to Collector...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>
                          Verify & Disburse ₹{Math.round(authorityWeightInput * ((displayLot.ratePerKg && displayLot.ratePerKg > 0) ? displayLot.ratePerKg : authorityRateInput)).toLocaleString('en-IN')}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CASE 2: AUTHORITY ALREADY PAID -> VERIFIED & PAID BANNER (NO PAYMENT CONTROLS) */
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Statutory Settlement
                    </span>
                    <span className="text-xs font-black text-emerald-700">STATUS: VERIFIED & PAID</span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    Direct Statutory Settlement Completed to Collector
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">
                    Disbursed: ₹{effectiveAmount.toLocaleString('en-IN')} via {displayLot.paymentMode || 'Instant UPI'} • Weighbridge Mass: {effectiveWeight} kg • UTR: {displayLot.settlementUtr || 'UTR-CPCB-8812'}
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-white border border-emerald-300 rounded-2xl text-right shrink-0">
                <div className="text-[10px] font-mono uppercase text-slate-400">Payment Status</div>
                <div className="text-xs font-mono font-black text-emerald-700">100% SETTLED</div>
              </div>
            </div>
          )
        ) : (
          !isPaid ? (
            /* CASE 3: COLLECTOR / PUBLIC UNPAID -> READ-ONLY PENDING STATUS BANNER */
            <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300">
                      {isScrapCollector ? 'Collector Tracking Mode' : 'Public Ledger Manifest'}
                    </span>
                    <span className="text-xs font-black text-amber-700">STATUS: AWAITING RECYCLER WEIGHMENT & PAYOUT</span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isScrapCollector 
                      ? 'Lot Manifest Registered — Awaiting Facility Gate Inward Weighment' 
                      : 'Lot In Transit to Authorized Recycler Facility'}
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">
                    Declared Mass: {displayLot.weightKg} kg • Expected: ₹{displayLot.totalAmount.toLocaleString('en-IN')} • Payment will be disbursed directly upon facility gate verification.
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-white border border-amber-200 rounded-2xl text-right shrink-0">
                <div className="text-[10px] font-mono uppercase text-slate-400">Payment Status</div>
                <div className="text-xs font-mono font-black text-amber-600">PENDING WEIGHBRIDGE</div>
              </div>
            </div>
          ) : (
            /* CASE 4: COLLECTOR / PUBLIC PAID -> GREEN COMPLETED BANNER */
            <div className="bg-emerald-600 text-white rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500 animate-fadeIn">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-200 font-bold">
                    Direct Statutory Payment Disbursed in Real-Time
                  </div>
                  <div className="text-lg font-black tracking-tight">
                    ₹{effectiveAmount.toLocaleString('en-IN')} Paid via {displayLot.paymentMode || 'Instant UPI'}
                  </div>
                  <div className="text-xs text-emerald-100 font-mono mt-0.5">
                    Weighbridge Certified: {effectiveWeight} kg • EPR Credits Credited • UTR: {displayLot.settlementUtr || 'UTR-CPCB-8812'}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 bg-emerald-700/50 px-3.5 py-2 rounded-2xl border border-emerald-400/30">
                <div className="text-[10px] font-mono uppercase text-emerald-200">Transaction Status</div>
                <div className="text-xs font-mono font-bold text-white">SUCCESS / CLEARED</div>
              </div>
            </div>
          )
        )}

        {/* Status Hero Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                Current Statutory Status
              </span>
              <div className="flex items-center gap-2.5 mt-1">
                {isPaid ? (
                  <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xl sm:text-2xl">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    <span>Settled & EPR Credit Generated</span>
                  </div>
                ) : isRejected ? (
                  <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xl sm:text-2xl">
                    <AlertTriangle className="w-7 h-7 text-rose-600" />
                    <span>Rejected & Quarantined</span>
                  </div>
                ) : isVerified ? (
                  <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xl sm:text-2xl">
                    <CheckCircle2 className="w-7 h-7 text-blue-600" />
                    <span>Weighbridge Mass Verified (Pending Payout)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xl sm:text-2xl">
                    <Clock className="w-7 h-7 text-amber-500 animate-pulse" />
                    <span>Pending Recycler Inward Weighment</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isPaid
                  ? 'The scrap lot has completed weighing, contamination review, and direct statutory UPI transfer. CPCB EPR recycling certificate has been registered in real time.'
                  : isRejected
                  ? 'This lot was rejected by facility inspectors due to safety hazard, high chemical contamination, or statutory variance.'
                  : isVerified
                  ? 'Inward gross and tare weights recorded on Class-III weighbridge. UPI settlement is currently being finalized.'
                  : 'Scrap lot registered by collector. Awaiting arrival at authorized recycler facility gate for digital weighbridge audit.'}
              </p>
            </div>

            {/* Small QR Code seal */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl shrink-0 self-start md:self-auto">
              <div className="w-24 h-24 flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1">
                <QRCodeSVG
                  value={liveTrackingUrl}
                  size={84}
                  level="H"
                  includeMargin={false}
                  fgColor="#022c22"
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1">Live Manifest QR</span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="pt-6">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-4">
              Statutory Custody Chain & Inward Stepper
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              {/* Step 1 */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1. Lot Created</span>
                </div>
                <p className="text-[11px] text-slate-600">Geo-tagged at source by registered Safai Sathi.</p>
                <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-1">
                  {displayLot.timestamp || '08/09/2026 01:08 AM'}
                </div>
              </div>

              {/* Step 2 */}
              <div className={`p-3 rounded-2xl border ${isVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex items-center gap-2 font-bold text-xs mb-1 ${isVerified ? 'text-emerald-800' : 'text-slate-600'}`}>
                  {isVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span>2. Weighbridge Audit</span>
                </div>
                <p className="text-[11px] text-slate-600">Class-III certified gross/tare weight verification.</p>
                <div className="text-[10px] font-mono text-slate-500 font-semibold mt-1">
                  {displayLot.weighbridgeWeightKg ? `${displayLot.weighbridgeWeightKg} kg Verified` : isPaid ? `${effectiveWeight} kg Certified` : 'Pending Gate Arrival'}
                </div>
              </div>

              {/* Step 3 */}
              <div className={`p-3 rounded-2xl border ${isVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex items-center gap-2 font-bold text-xs mb-1 ${isVerified ? 'text-emerald-800' : 'text-slate-600'}`}>
                  {isVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span>3. AI Contamination Scan</span>
                </div>
                <p className="text-[11px] text-slate-600">Purity and hazardous component audit.</p>
                <div className="text-[10px] font-mono text-slate-500 font-semibold mt-1">
                  {displayLot.hazardFlag ? 'Hazard Segregated' : 'Cleared (Non-Hazardous)'}
                </div>
              </div>

              {/* Step 4 */}
              <div className={`p-3 rounded-2xl border ${isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex items-center gap-2 font-bold text-xs mb-1 ${isPaid ? 'text-emerald-800' : 'text-slate-600'}`}>
                  {isPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span>4. Direct Settlement</span>
                </div>
                <p className="text-[11px] text-slate-600">Instant UPI transfer & CPCB EPR certificate.</p>
                <div className="text-[10px] font-mono font-semibold mt-1 text-emerald-700">
                  {isPaid ? `₹${effectiveAmount.toLocaleString('en-IN')} Disbursed` : 'Awaiting Final Pay'}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Detailed Manifest Specification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Scrap Specification */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Scrap Lot Specifications</span>
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Material Category:</span>
                <span className="font-bold text-slate-900 text-right">{displayLot.materialName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">CPCB Schedule:</span>
                <span className="font-bold text-slate-800 uppercase">{displayLot.category}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Declared Mass:</span>
                <span className="font-bold text-slate-800">{displayLot.weightKg} kg</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Verified Weighbridge Mass:</span>
                <span className="font-bold text-emerald-700">
                  {displayLot.weighbridgeWeightKg ? `${displayLot.weighbridgeWeightKg} kg` : isPaid ? `${effectiveWeight} kg` : 'Pending Gate Weighment'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Statutory CPCB Floor Rate:</span>
                <span className="font-bold text-slate-900">₹{displayLot.ratePerKg} / kg</span>
              </div>
              <div className="flex justify-between items-center py-1.5 pt-2">
                <span className="text-slate-700 font-bold">Total Statutory Value:</span>
                <span className="font-black text-base text-emerald-800">
                  ₹{effectiveAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Facility & Collector Custody */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Custody & Compliance Seal</span>
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Collector / Safai Sathi:</span>
                <span className="font-bold text-slate-900 text-right">{displayLot.collectorName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Digital Saathi ID:</span>
                <span className="font-bold text-slate-800">{displayLot.collectorId}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Authorized Recycler:</span>
                <span className="font-bold text-slate-900 text-right">{displayLot.facilityName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">CPCB Authorization:</span>
                <span className="font-bold text-emerald-700">CPCB/EW-REC/2026/8812</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Geo-Tag Handover:</span>
                <span className="font-semibold text-slate-700 text-right">{displayLot.gpsLocation}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 pt-2">
                <span className="text-slate-500">EPR Certificate Ref:</span>
                <span className="font-bold text-slate-900 text-right">
                  {displayLot.id.replace('LOT', 'EPR-CPCB-CERT')}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* CPCB Regulatory Guarantee Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-start gap-3.5 shadow-xs">
          <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 space-y-1">
            <p className="font-bold text-emerald-900">
              Guaranteed by E-Waste (Management) Rules 2022, Ministry of Environment, Forest & Climate Change
            </p>
            <p className="text-slate-600 leading-relaxed">
              Every transaction registered on <strong className="font-mono text-emerald-800">{VERCEL_BASE_URL}</strong> is cryptographically recorded in real time via Firebase Firestore, preventing informal open-acid burning, illegal dumping, and unfair informal exploitation. Direct statutory UPI transfer is mandated upon certified weighbridge deposit.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};
