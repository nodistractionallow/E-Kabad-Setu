import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Download,
  Building2,
  User,
  ShieldCheck,
  TrendingUp,
  Scale,
  Calendar,
  Layers,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  RefreshCw,
  MapPin,
  FileSpreadsheet,
  Award,
  Trash2,
  Lock,
  Key,
  SlidersHorizontal,
  X,
  RotateCcw,
  Archive,
  Phone,
  Globe,
  Radio
} from 'lucide-react';
import { RegulatoryAuthority, RecyclerFacility, TransactionRecord, EWasteLot, RecycledRecord } from '../types';
import {
  REGULATORY_AUTHORITIES,
  NATIONAL_VENDOR_FACILITIES,
  NATIONAL_TRANSACTIONS_LOG
} from '../data/authoritiesAndTransactionsData';
import { LotPriceHistoryModal } from './LotPriceHistoryModal';
import { useApp } from '../context/AppContext';

interface GovernmentTransactionLedgerProps {
  lots?: EWasteLot[];
}

export const GovernmentTransactionLedger: React.FC<GovernmentTransactionLedgerProps> = ({ lots = [] }) => {
  const { deleteLotWithKey, restoreLot } = useApp();

  // 4-Tier Hierarchy Navigation State
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);

  // Search & Nationwide Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [isNationwideSearch, setIsNationwideSearch] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'dossier' | 'recycle_bin'>('dossier');

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'processing' | 'flagged' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<'all' | 'UPI' | 'CASH' | 'ESCROW' | 'NEFT'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'weight'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals & Drawers
  const [selectedLotForModal, setSelectedLotForModal] = useState<{
    lotName: string;
    materialId?: string;
    currentRate?: number;
    lotId?: string;
  } | null>(null);

  const [inspectingTxn, setInspectingTxn] = useState<TransactionRecord | null>(null);

  // Statutory 12-Day Retention Safe Custody Bin
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('ekabad_deleted_gov_txns');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const [recycleBin, setRecycleBin] = useState<RecycledRecord[]>(() => {
    try {
      const stored = localStorage.getItem('ekabad_govt_recycle_bin_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    txn?: TransactionRecord;
    isPurgeAll?: boolean;
  }>({ isOpen: false });
  const [securityKeyInput, setSecurityKeyInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Helper to calculate countdown for 12-day retention
  const getRetentionRemaining = (expiresAt: number) => {
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      return { days: 0, hours: 0, text: 'Retention Expired (Statutory Period Elapsed)', isExpired: true };
    }
    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return {
      days,
      hours,
      text: `${days}d ${hours}h remaining`,
      isExpired: false
    };
  };

  // Restore a record from the 12-day recycle bin back to active records
  const handleRestoreRecord = async (item: RecycledRecord) => {
    try {
      if (item.originalLotData) {
        await restoreLot(item.originalLotData);
      } else if (item.lotId) {
        const tx = item.transactionData;
        const reconstructedLot: EWasteLot = {
          id: item.lotId,
          collectorId: tx.collectorId || 'COL-MH-PN-104',
          collectorName: tx.collectorName || 'Santosh Yadav',
          collectorPhone: tx.collectorPhone || '+91 98231 44920',
          materialId: tx.materialId || 'mat_pcb_high',
          materialName: tx.materialName,
          category: tx.category || 'pcb',
          weightKg: tx.weighbridgeWeightKg || tx.declaredWeightKg || 5,
          ratePerKg: tx.ratePerKg,
          totalAmount: tx.totalAmount || 0,
          status: tx.paymentStatus === 'settled' ? 'verified' : 'pending',
          paymentMode: (tx.paymentMode as any) || 'UPI',
          timestamp: tx.timestamp || tx.date || new Date().toISOString(),
          gpsLocation: tx.gpsCoordinates || '18.5204° N, 73.8567° E',
          facilityId: tx.facilityId || tx.vendorId || 'REC-MH-PN-004',
          facilityName: tx.facilityName || tx.vendorName || 'EcoMetals CPCB Dismantling Unit #4',
          distanceKm: 3.8,
          hazardFlag: false,
          photoUrl: tx.photoUrl || '',
          settlementUtr: tx.settlementUtr
        };
        await restoreLot(reconstructedLot);
      }

      const newDeleted = new Set(deletedIds);
      newDeleted.delete(item.transactionData.id);
      if (item.lotId) newDeleted.delete(item.lotId);
      setDeletedIds(newDeleted);

      const updatedBin = recycleBin.filter((r) => r.id !== item.id);
      setRecycleBin(updatedBin);

      localStorage.setItem('ekabad_deleted_gov_txns', JSON.stringify(Array.from(newDeleted)));
      localStorage.setItem('ekabad_govt_recycle_bin_v1', JSON.stringify(updatedBin));

      setStatusNotification({
        message: `Record ${item.transactionData.id} successfully restored to active records!`,
        type: 'success'
      });
      setTimeout(() => setStatusNotification(null), 3500);
    } catch (err) {
      console.error('Error restoring record:', err);
    }
  };

  // Clear or empty recycle bin
  const handleEmptyRecycleBin = () => {
    if (!window.confirm('Are you sure you want to permanently clear the Recycle Bin? Expired records will be permanently erased.')) {
      return;
    }
    setRecycleBin([]);
    try {
      localStorage.removeItem('ekabad_govt_recycle_bin_v1');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Government Key Delete Authorization Handler
  const handleAuthorizeDelete = async () => {
    if (securityKeyInput.trim() !== '12345678') {
      setDeleteError('Invalid Security Key! Authorized Government Clearance Key "12345678" is required.');
      return;
    }

    const now = Date.now();
    const RETENTION_DAYS = 12;
    const expiresAt = now + RETENTION_DAYS * 24 * 60 * 60 * 1000;

    if (deleteModal.isPurgeAll) {
      const newDeleted = new Set(deletedIds);
      const newRecycled: RecycledRecord[] = [];

      for (const tx of allCombinedTransactions) {
        newDeleted.add(tx.id);
        if (tx.lotId) {
          newDeleted.add(tx.lotId);
          await deleteLotWithKey(tx.lotId, '12345678');
        }
        const originalLot = lots.find((l) => l.id === tx.lotId || l.id === tx.id);
        newRecycled.push({
          id: `REC-${now}-${tx.id}`,
          lotId: tx.lotId,
          transactionData: tx,
          deletedAt: now,
          retentionDays: RETENTION_DAYS,
          expiresAt: expiresAt,
          deletedByKey: '12345678',
          originalLotData: originalLot
        });
      }
      setDeletedIds(newDeleted);
      const updatedBin = [...newRecycled, ...recycleBin];
      setRecycleBin(updatedBin);

      try {
        localStorage.setItem('ekabad_deleted_gov_txns', JSON.stringify(Array.from(newDeleted)));
        localStorage.setItem('ekabad_govt_recycle_bin_v1', JSON.stringify(updatedBin));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      setDeleteSuccess(`Successfully moved ${newRecycled.length} records into 12-day Statutory Recycle Bin.`);
    } else if (deleteModal.txn) {
      const target = deleteModal.txn;
      const newDeleted = new Set(deletedIds);
      newDeleted.add(target.id);
      if (target.lotId) {
        newDeleted.add(target.lotId);
        await deleteLotWithKey(target.lotId, '12345678');
      }
      setDeletedIds(newDeleted);

      const originalLot = lots.find((l) => l.id === target.lotId || l.id === target.id);
      const newRecycledItem: RecycledRecord = {
        id: `REC-${now}-${target.id}`,
        lotId: target.lotId,
        transactionData: target,
        deletedAt: now,
        retentionDays: RETENTION_DAYS,
        expiresAt: expiresAt,
        deletedByKey: '12345678',
        originalLotData: originalLot
      };

      const updatedBin = [newRecycledItem, ...recycleBin.filter((r) => r.transactionData.id !== target.id)];
      setRecycleBin(updatedBin);

      try {
        localStorage.setItem('ekabad_deleted_gov_txns', JSON.stringify(Array.from(newDeleted)));
        localStorage.setItem('ekabad_govt_recycle_bin_v1', JSON.stringify(updatedBin));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      setDeleteSuccess(`Record ${target.id} moved to 12-day Statutory Recycle Bin.`);
    }

    setSecurityKeyInput('');
    setDeleteError(null);
    setTimeout(() => {
      setDeleteModal({ isOpen: false });
      setDeleteSuccess(null);
    }, 1200);
  };

  // Comprehensive regulatory authorities including all monitored regional state jurisdictions
  const ALL_REGULATORY_AUTHORITIES: RegulatoryAuthority[] = useMemo(() => {
    const list = [...REGULATORY_AUTHORITIES];
    if (!list.some((a) => a.id === 'auth_ueppcb' || a.state.toLowerCase() === 'uttarakhand')) {
      list.push({
        id: 'auth_ueppcb',
        code: 'UEPPCB-UTTARAKHAND',
        name: 'Uttarakhand (UEPPCB)',
        fullName: 'Uttarakhand Environmental Protection & Pollution Control Board',
        state: 'Uttarakhand',
        zone: 'North',
        headquarters: 'Gaura Devi Paryavaran Bhawan, IT Park, Dehradun 248001',
        nodalOfficer: 'Dr. S. P. Subudhi (Member Secretary, E-Waste)',
        activeVendorsCount: 14,
        activeCollectorsCount: 420,
        totalTradedTons: 182.0,
        totalDisbursedCrores: 0.64,
        complianceScore: 96.2,
        status: 'Operational'
      });
    }
    return list;
  }, []);

  // Merge live app lots with national transaction log without duplication
  const allCombinedTransactions: TransactionRecord[] = useMemo(() => {
    // Map of national transaction records by lotId and id
    const nationalTxnByLotId = new Map<string, TransactionRecord>();
    NATIONAL_TRANSACTIONS_LOG.forEach((tx) => {
      if (tx.lotId) nationalTxnByLotId.set(tx.lotId, tx);
      nationalTxnByLotId.set(tx.id, tx);
    });

    // Supplemental record for Telangana Cerebra facility to ensure active demonstration
    const supplementalTxns: TransactionRecord[] = [
      {
        id: 'TXN-CPCB-2026-8807',
        lotId: 'LOT-2026-EW-8807',
        settlementUtr: 'UPI/MANDI/CRBR/449102837190/SETTLE',
        date: '2026-09-03',
        timestamp: '2026-09-03 04:15 PM',
        vendorId: 'REC-TS-HYD-021',
        vendorName: 'Cerebra Integrated E-Waste Solutions',
        vendorCpcbId: 'CPCB/EW-REC/2026/9041',
        authorityId: 'auth_tspcb',
        statePcb: 'TSPCB-HYD-EW-621',
        collectorId: 'KBD-TS-7701',
        collectorName: 'के. वेंकट राव (K. Venkat Rao)',
        collectorPhone: '+91 94401 55210',
        collectorWard: 'Cherlapally IDA, Hyderabad',
        collectorTier: 'Gold',
        materialId: 'mat_pcb_high',
        materialName: 'High-Grade Server & Telecom Motherboard',
        category: 'pcb',
        declaredWeightKg: 45.0,
        weighbridgeWeightKg: 45.0,
        ratePerKg: 490,
        totalAmount: 22050,
        paymentMode: 'UPI',
        paymentStatus: 'settled',
        eprCreditGeneratedKg: 45.0,
        eprCertificateNo: 'EPR-CPCB-2026-TS-90124',
        gpsCoordinates: '17.4483° N, 78.5983° E',
        photoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80'
      }
    ];

    supplementalTxns.forEach((st) => {
      if (!nationalTxnByLotId.has(st.id) && !nationalTxnByLotId.has(st.lotId)) {
        nationalTxnByLotId.set(st.lotId, st);
        nationalTxnByLotId.set(st.id, st);
      }
    });

    const processedLotIds = new Set<string>();
    const mergedList: TransactionRecord[] = [];

    // 1. Reconcile lots from dynamic application state (AppContext)
    lots.forEach((lot) => {
      processedLotIds.add(lot.id);
      const existingNatTx = nationalTxnByLotId.get(lot.id);

      const isLotPaid =
        lot.status?.toLowerCase() === 'paid' ||
        lot.status?.toLowerCase() === 'settled' ||
        Boolean(lot.paidAt) ||
        Boolean(lot.settlementUtr);

      const effectiveDate =
        isLotPaid && lot.paidAt
          ? lot.paidAt.includes('T')
            ? lot.paidAt.split('T')[0]
            : lot.paidAt
          : lot.timestamp
          ? lot.timestamp.includes('T')
            ? lot.timestamp.split('T')[0]
            : lot.timestamp.split(' ')[0]
          : new Date().toISOString().split('T')[0];

      const effectiveTimestamp =
        isLotPaid && lot.paidAt
          ? lot.paidAt
          : lot.paidTimestamp
          ? new Date(lot.paidTimestamp).toISOString()
          : lot.timestamp || new Date().toISOString();

      const rate = lot.ratePerKg || (existingNatTx?.ratePerKg ?? 480);
      const weight = lot.weighbridgeWeightKg || lot.weightKg || (existingNatTx?.weighbridgeWeightKg ?? 5.0);
      const amount = lot.finalPayoutAmount || lot.totalAmount || (existingNatTx?.totalAmount ?? weight * rate);

      mergedList.push({
        id: existingNatTx?.id || `TXN-CPCB-2026-${lot.id.slice(-4)}`,
        lotId: lot.id,
        date: effectiveDate,
        timestamp: effectiveTimestamp,
        vendorId: lot.facilityId || existingNatTx?.vendorId || 'REC-MH-PN-004',
        vendorName: lot.facilityName || existingNatTx?.vendorName || 'EcoMetals CPCB Dismantling Unit #4',
        vendorCpcbId: existingNatTx?.vendorCpcbId || 'CPCB/EW-REC/2026/8812',
        authorityId: existingNatTx?.authorityId || 'auth_mpcb',
        statePcb: existingNatTx?.statePcb || 'MPCB-PUNE-EW-902',
        collectorId: lot.collectorId || existingNatTx?.collectorId || 'KBD-MH-3108',
        collectorName: lot.collectorName || existingNatTx?.collectorName || 'संतोष यादव (Santosh Yadav)',
        collectorPhone: lot.collectorPhone || existingNatTx?.collectorPhone || '+91 97112 34509',
        collectorWard: existingNatTx?.collectorWard || 'Ward 8, Khadki, Pune',
        collectorTier: (existingNatTx?.collectorTier || 'Gold') as any,
        materialId: lot.materialId || existingNatTx?.materialId || lot.id,
        materialName: lot.materialName || existingNatTx?.materialName || lot.category,
        category: lot.category || existingNatTx?.category || 'pcb',
        declaredWeightKg: lot.weightKg || weight,
        weighbridgeWeightKg: weight,
        ratePerKg: rate,
        totalAmount: amount,
        paymentMode: (lot.paymentMode as any) || existingNatTx?.paymentMode || 'UPI',
        paymentStatus: isLotPaid
          ? 'settled'
          : lot.status === 'verified'
          ? 'settled'
          : lot.status === 'rejected'
          ? 'rejected'
          : existingNatTx?.paymentStatus || 'processing',
        settlementUtr:
          lot.settlementUtr ||
          existingNatTx?.settlementUtr ||
          `UPI/MANDI/MH/${lot.id.slice(-8).toUpperCase()}`,
        eprCreditGeneratedKg: Math.round(weight * 0.85),
        eprCertificateNo:
          isLotPaid || lot.status === 'verified'
            ? existingNatTx?.eprCertificateNo || `EPR-CPCB-2026-MH-${lot.id.slice(-4)}`
            : undefined,
        gpsCoordinates: lot.gpsLocation || existingNatTx?.gpsCoordinates || '18.5204° N, 73.8567° E',
        anomalyFlag: lot.anomalyFlag ?? existingNatTx?.anomalyFlag ?? false,
        anomalyReason: lot.anomalyReason ?? existingNatTx?.anomalyReason,
        photoUrl: lot.photoUrl || existingNatTx?.photoUrl
      });
    });

    // 2. Add national records not already present in live lots
    const allNationalList = [...NATIONAL_TRANSACTIONS_LOG, ...supplementalTxns];
    allNationalList.forEach((tx) => {
      if (!processedLotIds.has(tx.lotId) && !processedLotIds.has(tx.id)) {
        processedLotIds.add(tx.lotId);
        processedLotIds.add(tx.id);
        mergedList.push(tx);
      }
    });

    const recycledTxnIds = new Set(recycleBin.map((r) => r.transactionData?.id).filter(Boolean));
    const recycledLotIds = new Set(recycleBin.map((r) => r.lotId).filter(Boolean) as string[]);

    return mergedList.filter(
      (tx) =>
        !deletedIds.has(tx.id) &&
        !(tx.lotId && deletedIds.has(tx.lotId)) &&
        !recycledTxnIds.has(tx.id) &&
        !(tx.lotId && recycledLotIds.has(tx.lotId))
    );
  }, [lots, deletedIds, recycleBin]);

  // Current Active Authority and Facility objects
  const currentAuthority = useMemo(() => {
    if (!selectedAuthorityId && !selectedState) return null;
    return (
      ALL_REGULATORY_AUTHORITIES.find(
        (a) =>
          a.id === selectedAuthorityId ||
          (selectedState && a.state.toLowerCase() === selectedState.toLowerCase())
      ) || null
    );
  }, [selectedAuthorityId, selectedState, ALL_REGULATORY_AUTHORITIES]);

  const currentVendor = useMemo(() => {
    if (!selectedVendorId) return null;
    const found = NATIONAL_VENDOR_FACILITIES.find((v) => v.id === selectedVendorId);
    if (found) return found;
    return {
      id: selectedVendorId,
      name: selectedVendorId,
      cpcbId: 'CPCB/EW-REC/2026/GENERIC',
      statePcb: 'SPCB-LIC-001',
      location: 'Authorized Industrial Estate',
      monthlyQuotaTons: 120.0,
      processedThisMonthTons: 35.0,
      activeCollectors: 10,
      eprCreditsGeneratedTons: 30.0
    };
  }, [selectedVendorId]);

  // Helper to determine current drilldown tier
  const currentTier: 'states' | 'recyclers' | 'collectors' | 'transactions' = useMemo(() => {
    if (selectedCollectorId) return 'transactions';
    if (selectedVendorId) return 'collectors';
    if (selectedState || selectedAuthorityId) return 'recyclers';
    return 'states';
  }, [selectedState, selectedAuthorityId, selectedVendorId, selectedCollectorId]);

  // LEVEL 1: State Folders Data
  const stateFolders = useMemo(() => {
    // All regional states (excluding CPCB national HQ)
    const states = ALL_REGULATORY_AUTHORITIES.filter((a) => a.id !== 'auth_cpcb_hq');

    return states.map((auth) => {
      // Find all transactions matching this authority/state
      const stateTxns = allCombinedTransactions.filter(
        (tx) =>
          tx.authorityId === auth.id ||
          (auth.id === 'auth_ueppcb' && (tx.authorityId === 'auth_cpcb_hq' || tx.statePcb?.includes('UEPPCB'))) ||
          (tx.statePcb && tx.statePcb.toLowerCase().includes(auth.state.toLowerCase())) ||
          (tx.statePcb && tx.statePcb.toLowerCase().includes(auth.code.toLowerCase().split('-')[0]))
      );

      // Find all facilities in this state
      const stateFacilities = NATIONAL_VENDOR_FACILITIES.filter(
        (f) =>
          f.authorityId === auth.id ||
          (auth.id === 'auth_ueppcb' && (f.state === 'Uttarakhand' || f.id === 'REC-UK-HW-012')) ||
          (f.state && f.state.toLowerCase() === auth.state.toLowerCase())
      );

      // Unique collectors active
      const uniqueCollectors = new Set(stateTxns.map((t) => t.collectorId || t.collectorName)).size;
      const totalWeightKg = stateTxns.reduce(
        (acc, t) => acc + (t.weighbridgeWeightKg || t.declaredWeightKg || 0),
        0
      );
      const totalDisbursed = stateTxns.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

      return {
        authority: auth,
        stateName: auth.state,
        spcbCode: auth.code,
        facilitiesCount: Math.max(stateFacilities.length, auth.activeVendorsCount || 0),
        transactionsCount: stateTxns.length,
        collectorsCount: Math.max(uniqueCollectors, stateTxns.length > 0 ? uniqueCollectors : 1),
        totalWeightMT: (totalWeightKg / 1000).toFixed(2),
        totalDisbursed: totalDisbursed,
        complianceScore: auth.complianceScore || 95.0,
        status: auth.status || 'Operational'
      };
    });
  }, [allCombinedTransactions, ALL_REGULATORY_AUTHORITIES]);

  // LEVEL 2: Recycler Company Folders for Selected State
  const recyclerCompanyFolders = useMemo(() => {
    if (!selectedState && !selectedAuthorityId) return [];

    const stateMatches = (fState?: string, aId?: string) => {
      if (selectedAuthorityId) {
        if (aId === selectedAuthorityId) return true;
        if (selectedAuthorityId === 'auth_ueppcb' && (aId === 'auth_cpcb_hq' || fState === 'Uttarakhand')) return true;
      }
      if (selectedState && fState && fState.toLowerCase() === selectedState.toLowerCase()) return true;
      return false;
    };

    const facilities = NATIONAL_VENDOR_FACILITIES.filter((f) => stateMatches(f.state, f.authorityId));

    return facilities.map((fac) => {
      const facTxns = allCombinedTransactions.filter(
        (t) => t.vendorId === fac.id || t.vendorName?.toLowerCase() === fac.name.toLowerCase()
      );
      const uniqueCollectors = new Set(facTxns.map((t) => t.collectorId || t.collectorName)).size;
      const totalWeightKg = facTxns.reduce(
        (acc, t) => acc + (t.weighbridgeWeightKg || t.declaredWeightKg || 0),
        0
      );
      const totalDisbursed = facTxns.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

      return {
        facility: fac,
        transactionsCount: facTxns.length,
        collectorsCount: Math.max(uniqueCollectors, facTxns.length > 0 ? uniqueCollectors : 1),
        totalWeightKg,
        totalDisbursed,
        quotaUsagePct: Math.min(
          100,
          Math.round((fac.processedThisMonthTons / (fac.monthlyQuotaTons || 1)) * 100)
        )
      };
    });
  }, [selectedState, selectedAuthorityId, allCombinedTransactions]);

  // LEVEL 3: Scrap Collector Folders for Selected Recycler
  const scrapCollectorFolders = useMemo(() => {
    if (!selectedVendorId) return [];

    const facTxns = allCombinedTransactions.filter(
      (t) =>
        t.vendorId === selectedVendorId ||
        (currentVendor && t.vendorName?.toLowerCase() === currentVendor.name.toLowerCase())
    );

    const collectorMap = new Map<
      string,
      {
        collectorId: string;
        collectorName: string;
        collectorPhone: string;
        collectorWard: string;
        collectorTier: string;
        txnCount: number;
        totalWeightKg: number;
        totalEarnings: number;
        lastActiveDate: string;
      }
    >();

    facTxns.forEach((tx) => {
      const cId = tx.collectorId || tx.collectorName || 'COL-UNKNOWN';
      const existing = collectorMap.get(cId);
      const wt = tx.weighbridgeWeightKg || tx.declaredWeightKg || 0;
      const amt = tx.totalAmount || 0;
      const date = tx.date || tx.timestamp?.split('T')[0] || tx.timestamp || '2026-09-01';

      if (!existing) {
        collectorMap.set(cId, {
          collectorId: cId,
          collectorName: tx.collectorName || 'Authorized Collector',
          collectorPhone: tx.collectorPhone || '+91 98000 00000',
          collectorWard: tx.collectorWard || 'Local Ward Depot',
          collectorTier: tx.collectorTier || 'Silver',
          txnCount: 1,
          totalWeightKg: wt,
          totalEarnings: amt,
          lastActiveDate: date
        });
      } else {
        existing.txnCount += 1;
        existing.totalWeightKg += wt;
        existing.totalEarnings += amt;
        if (date > existing.lastActiveDate) {
          existing.lastActiveDate = date;
        }
      }
    });

    return Array.from(collectorMap.values());
  }, [selectedVendorId, currentVendor, allCombinedTransactions]);

  // LEVEL 4 / Global Filtered Transactions
  const filteredTransactions = useMemo(() => {
    let result = allCombinedTransactions;

    // If NOT in global nationwide search, apply hierarchical drilldown constraints
    if (!isNationwideSearch) {
      if (selectedCollectorId) {
        result = result.filter(
          (t) =>
            (t.collectorId === selectedCollectorId || t.collectorName === selectedCollectorId) &&
            (t.vendorId === selectedVendorId || (currentVendor && t.vendorName?.toLowerCase() === currentVendor.name.toLowerCase()))
        );
      } else if (selectedVendorId) {
        result = result.filter(
          (t) =>
            t.vendorId === selectedVendorId ||
            (currentVendor && t.vendorName?.toLowerCase() === currentVendor.name.toLowerCase())
        );
      } else if (selectedState || selectedAuthorityId) {
        result = result.filter((t) => {
          if (selectedAuthorityId && t.authorityId === selectedAuthorityId) return true;
          if (selectedAuthorityId === 'auth_ueppcb' && (t.authorityId === 'auth_cpcb_hq' || t.statePcb?.includes('UEPPCB'))) return true;
          if (selectedState && t.statePcb?.toLowerCase().includes(selectedState.toLowerCase())) return true;
          return false;
        });
      }
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((tx) => {
        return (
          (tx.id && tx.id.toLowerCase().includes(q)) ||
          (tx.lotId && tx.lotId.toLowerCase().includes(q)) ||
          (tx.settlementUtr && tx.settlementUtr.toLowerCase().includes(q)) ||
          (tx.materialName && tx.materialName.toLowerCase().includes(q)) ||
          (tx.collectorName && tx.collectorName.toLowerCase().includes(q)) ||
          (tx.collectorPhone && tx.collectorPhone.toLowerCase().includes(q)) ||
          (tx.vendorName && tx.vendorName.toLowerCase().includes(q)) ||
          (tx.statePcb && tx.statePcb.toLowerCase().includes(q))
        );
      });
    }

    // Apply Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((tx) => {
        const s = (tx.paymentStatus || tx.status || '').toLowerCase();
        if (statusFilter === 'settled') return s === 'settled' || s === 'verified';
        if (statusFilter === 'processing') return s === 'processing' || s === 'pending';
        if (statusFilter === 'flagged') return s === 'flagged' || tx.anomalyFlag === true;
        if (statusFilter === 'rejected') return s === 'rejected';
        return true;
      });
    }

    // Apply Material Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter((tx) => {
        const c = (tx.category || '').toLowerCase();
        const m = (tx.materialName || '').toLowerCase();
        return c.includes(categoryFilter.toLowerCase()) || m.includes(categoryFilter.toLowerCase());
      });
    }

    // Apply Payment Mode Filter
    if (paymentModeFilter !== 'all') {
      result = result.filter((tx) => {
        const pm = (tx.paymentMode || '').toUpperCase();
        return pm === paymentModeFilter;
      });
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'amount') {
        const amtA = a.totalAmount || 0;
        const amtB = b.totalAmount || 0;
        return sortOrder === 'desc' ? amtB - amtA : amtA - amtB;
      }
      if (sortBy === 'weight') {
        const wtA = a.weighbridgeWeightKg || a.declaredWeightKg || 0;
        const wtB = b.weighbridgeWeightKg || b.declaredWeightKg || 0;
        return sortOrder === 'desc' ? wtB - wtA : wtA - wtB;
      }
      // Date sort
      const dateA = a.timestamp || a.date || '';
      const dateB = b.timestamp || b.date || '';
      return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });
  }, [
    allCombinedTransactions,
    isNationwideSearch,
    selectedCollectorId,
    selectedVendorId,
    selectedState,
    selectedAuthorityId,
    currentVendor,
    searchQuery,
    statusFilter,
    categoryFilter,
    paymentModeFilter,
    sortBy,
    sortOrder
  ]);

  // Search filtered folders for Level 1, 2, 3
  const searchedStateFolders = useMemo(() => {
    if (!searchQuery.trim() || isNationwideSearch) return stateFolders;
    const q = searchQuery.toLowerCase().trim();
    return stateFolders.filter(
      (s) =>
        s.stateName.toLowerCase().includes(q) ||
        s.spcbCode.toLowerCase().includes(q) ||
        s.authority.name.toLowerCase().includes(q)
    );
  }, [stateFolders, searchQuery, isNationwideSearch]);

  const searchedRecyclerFolders = useMemo(() => {
    if (!searchQuery.trim() || isNationwideSearch) return recyclerCompanyFolders;
    const q = searchQuery.toLowerCase().trim();
    return recyclerCompanyFolders.filter(
      (r) =>
        r.facility.name.toLowerCase().includes(q) ||
        r.facility.cpcbId.toLowerCase().includes(q) ||
        (r.facility.city && r.facility.city.toLowerCase().includes(q))
    );
  }, [recyclerCompanyFolders, searchQuery, isNationwideSearch]);

  const searchedCollectorFolders = useMemo(() => {
    if (!searchQuery.trim() || isNationwideSearch) return scrapCollectorFolders;
    const q = searchQuery.toLowerCase().trim();
    return scrapCollectorFolders.filter(
      (c) =>
        c.collectorName.toLowerCase().includes(q) ||
        c.collectorId.toLowerCase().includes(q) ||
        c.collectorPhone.toLowerCase().includes(q) ||
        c.collectorWard.toLowerCase().includes(q)
    );
  }, [scrapCollectorFolders, searchQuery, isNationwideSearch]);

  // Current active collector details object for header display
  const currentCollector = useMemo(() => {
    if (!selectedCollectorId) return null;
    return (
      scrapCollectorFolders.find((c) => c.collectorId === selectedCollectorId) || {
        collectorId: selectedCollectorId,
        collectorName: selectedCollectorId,
        collectorPhone: '+91 98000 00000',
        collectorWard: 'Local Depot',
        collectorTier: 'Silver'
      }
    );
  }, [selectedCollectorId, scrapCollectorFolders]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Transaction ID',
      'Lot ID',
      'Date',
      'State / SPCB',
      'Recycler Company',
      'Scrap Collector',
      'Collector Phone',
      'Material Name',
      'Category',
      'Weight (Kg)',
      'Rate (₹/kg)',
      'Total Amount (₹)',
      'Payment Mode',
      'Status',
      'Settlement UTR'
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.lotId,
      tx.date || tx.timestamp,
      tx.statePcb || 'Maharashtra',
      `"${tx.vendorName || 'EcoMetals'}"`,
      `"${tx.collectorName || 'Santosh Yadav'}"`,
      tx.collectorPhone || '',
      `"${tx.materialName}"`,
      tx.category || 'pcb',
      tx.weighbridgeWeightKg || tx.declaredWeightKg || 0,
      tx.ratePerKg,
      tx.totalAmount,
      tx.paymentMode || 'UPI',
      tx.paymentStatus || 'settled',
      tx.settlementUtr || ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CPCB_Govt_Ledger_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 text-slate-900 font-sans">
      {/* TOP REGULATORY BANNER */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                CPCB National Waste Audit Surveillance
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-mono font-semibold">
                E-Waste Rules 2022 • Section 4(1) Schedule III
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              State-to-Collector Hierarchical Transaction Ledger
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Surveillance folder hierarchy drilldown: <span className="font-bold text-slate-800">State SPCB Folders</span> → <span className="font-bold text-slate-800">Recycler Company Facilities</span> → <span className="font-bold text-slate-800">Scrap Collectors</span> → <span className="font-bold text-slate-800">Full Audited Transactions</span>.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedLotForModal({
                  lotName: 'Printed Circuit Boards (Motherboard)',
                  materialId: 'mat_pcb_high',
                  currentRate: 495
                })
              }
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Inspect Live Scrap Mandi Index against CPCB Floor Rate"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>CPCB Mandi Trends</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Filtered Records as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteModal({ isOpen: true, isPurgeAll: true });
                setSecurityKeyInput('');
                setDeleteError(null);
                setDeleteSuccess(null);
              }}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Purge or delete records using Statutory Key 12345678"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-700" />
              <span>Delete Data (Key: 12345678)</span>
            </button>
          </div>
        </div>

        {/* SUB-VIEW TABS: Dossier vs Recycle Bin */}
        <div className="flex items-center gap-2 border-t border-slate-200 pt-3.5 mt-4">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('dossier');
              setIsNationwideSearch(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'dossier' && !isNationwideSearch
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>4-Tier State Folders</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('dossier');
              setIsNationwideSearch(true);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer ${
              isNationwideSearch && activeSubTab === 'dossier'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Search All Transactions Nationwide</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('recycle_bin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'recycle_bin'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Statutory Recycle Bin ({recycleBin.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: RECYCLE BIN VIEW */}
      {activeSubTab === 'recycle_bin' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-rose-700" />
                Statutory 12-Day Safe Custody Retention Bin
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Under CPCB Rule 14(2), deleted transaction records remain held for 12 days before permanent cryptographic erasure.
              </p>
            </div>
            {recycleBin.length > 0 && (
              <button
                type="button"
                onClick={handleEmptyRecycleBin}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer"
              >
                Empty Bin Permanently
              </button>
            )}
          </div>

          {recycleBin.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 font-mono text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto mb-2 opacity-80" />
              No records in the 12-day retention bin. All active transaction ledgers are fully synchronized.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 uppercase border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Deleted Record</th>
                    <th className="py-2.5 px-3">Material & Grade</th>
                    <th className="py-2.5 px-3">Collector</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Retention Period</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {recycleBin.map((item) => {
                    const retention = getRetentionRemaining(item.expiresAt);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900">{item.transactionData.id}</span>
                          <span className="text-[10px] block text-slate-500">
                            Deleted: {new Date(item.deletedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.transactionData.materialName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {item.transactionData.collectorName}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-800 tabular-nums">
                          ₹{item.transactionData.totalAmount?.toLocaleString('en-IN') || 0}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              retention.isExpired
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {retention.text}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRestoreRecord(item)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-xs flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PRIMARY DOSSIER HIERARCHY */}
      {activeSubTab === 'dossier' && (
        <div className="space-y-4">
          {/* INTERACTIVE BREADCRUMB NAVIGATION TRAIL */}
          {!isNationwideSearch && (
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <nav className="flex flex-wrap items-center gap-1.5 text-xs font-mono font-bold" aria-label="Breadcrumb">
                {/* Root Level: All States */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedState(null);
                    setSelectedAuthorityId(null);
                    setSelectedVendorId(null);
                    setSelectedCollectorId(null);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    currentTier === 'states'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-700" />
                  <span>National (All States)</span>
                </button>

                {/* Level 2: State */}
                {selectedState && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVendorId(null);
                        setSelectedCollectorId(null);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        currentTier === 'recyclers'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{selectedState}</span>
                    </button>
                  </>
                )}

                {/* Level 3: Recycler Facility */}
                {currentVendor && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCollectorId(null);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer truncate max-w-[220px] ${
                        currentTier === 'collectors'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title={currentVendor.name}
                    >
                      <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                      <span>{currentVendor.name}</span>
                    </button>
                  </>
                )}

                {/* Level 4: Scrap Collector */}
                {currentCollector && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold">
                      <User className="w-3.5 h-3.5 text-emerald-800" />
                      <span>{currentCollector.collectorName}</span>
                    </span>
                  </>
                )}
              </nav>

              {/* ONE-CLICK BACK BUTTON */}
              {currentTier !== 'states' && (
                <button
                  type="button"
                  onClick={() => {
                    if (currentTier === 'transactions') setSelectedCollectorId(null);
                    else if (currentTier === 'collectors') setSelectedVendorId(null);
                    else if (currentTier === 'recyclers') {
                      setSelectedState(null);
                      setSelectedAuthorityId(null);
                    }
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold font-mono flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>
                    Back to{' '}
                    {currentTier === 'transactions'
                      ? 'Collectors'
                      : currentTier === 'collectors'
                      ? 'Recycler Units'
                      : 'States'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* SEARCH & MULTI-FACETED AUDIT FILTER TOOLBAR */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isNationwideSearch
                      ? 'Search ALL nationwide records (by Lot ID, UTR, Kabadiwala, Plant, State)...'
                      : currentTier === 'states'
                      ? 'Filter states (e.g. Maharashtra, Gujarat, Karnataka)...'
                      : currentTier === 'recyclers'
                      ? 'Filter recycler plants in this state (e.g. EcoMetals, CPCB ID)...'
                      : currentTier === 'collectors'
                      ? 'Filter scrap collectors (e.g. Santosh Yadav, Raju Kumar, Phone)...'
                      : 'Search transactions in this folder (by Lot ID, UTR, material)...'
                  }
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                  aria-label="Filter by payment status"
                >
                  <option value="all">Status: All Records</option>
                  <option value="settled">Settled (Verified)</option>
                  <option value="processing">Processing (Pending)</option>
                  <option value="flagged">Flagged / Hold (Anomaly)</option>
                  <option value="rejected">Rejected Lots</option>
                </select>

                {/* Material Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                  aria-label="Filter by material category"
                >
                  <option value="all">Category: All</option>
                  <option value="pcb">Printed Circuit Boards</option>
                  <option value="copper">Copper / Cables</option>
                  <option value="battery">Li-ion Batteries</option>
                  <option value="magnet">Rare-Earth Magnets</option>
                  <option value="plastic">E-Plastics</option>
                  <option value="crt">CRT Displays</option>
                </select>

                {/* Payment Mode Filter */}
                <select
                  value={paymentModeFilter}
                  onChange={(e) => setPaymentModeFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                  aria-label="Filter by payment mode"
                >
                  <option value="all">Mode: All</option>
                  <option value="UPI">UPI Instant</option>
                  <option value="CASH">CASH Handover</option>
                  <option value="ESCROW">ESCROW Guarantee</option>
                  <option value="NEFT">NEFT / RTGS</option>
                </select>

                {/* Sort By */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split('-');
                    setSortBy(sb as any);
                    setSortOrder(so as any);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono text-slate-700 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                  aria-label="Sort records by"
                >
                  <option value="date-desc">Date: Newest First</option>
                  <option value="date-asc">Date: Oldest First</option>
                  <option value="amount-desc">Amount: High → Low</option>
                  <option value="weight-desc">Weight: High → Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* DRILLDOWN LEVEL 1: STATE FOLDERS */}
          {!isNationwideSearch && currentTier === 'states' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-bold uppercase text-slate-600 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-emerald-700" />
                  Select State SPCB Folder ({searchedStateFolders.length} States Monitored)
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Click a state folder to inspect its licensed recycling facilities
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchedStateFolders.map((st) => (
                  <button
                    key={st.authority.id}
                    type="button"
                    onClick={() => {
                      setSelectedState(st.stateName);
                      setSelectedAuthorityId(st.authority.id);
                      setSearchQuery('');
                    }}
                    className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-600 rounded-xl p-4 text-left transition-all group shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                          <Folder className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {st.spcbCode}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {st.stateName}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        {st.authority.fullName}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block uppercase">Recyclers</span>
                        <span className="text-xs font-bold text-slate-900">{st.facilitiesCount}</span>
                      </div>
                      <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block uppercase">Volume</span>
                        <span className="text-xs font-bold text-emerald-800">{st.totalWeightMT} MT</span>
                      </div>
                      <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block uppercase">Disbursed</span>
                        <span className="text-xs font-bold text-slate-900">₹{(st.totalDisbursed / 100000).toFixed(1)}L</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DRILLDOWN LEVEL 2: RECYCLER COMPANY FOLDERS */}
          {!isNationwideSearch && currentTier === 'recyclers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-bold uppercase text-slate-600 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                  Authorized Recycler Facilities in {selectedState} ({searchedRecyclerFolders.length} Units)
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Select a recycler facility to inspect scrap collector deliveries
                </span>
              </div>

              {searchedRecyclerFolders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs font-mono text-slate-600">
                  No licensed recycler facilities found matching your criteria in {selectedState}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchedRecyclerFolders.map(({ facility: fac, transactionsCount, collectorsCount, totalWeightKg, totalDisbursed, quotaUsagePct }) => (
                    <button
                      key={fac.id}
                      type="button"
                      onClick={() => {
                        setSelectedVendorId(fac.id);
                        setSearchQuery('');
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-600 rounded-xl p-4 text-left transition-all group shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
                            Rating: {fac.complianceRating || 'A+'}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">
                          {fac.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                          <span>CPCB: {fac.cpcbId}</span>
                          <span>•</span>
                          <span>{fac.location}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-4 gap-2 text-center font-mono">
                        <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase">Collectors</span>
                          <span className="text-xs font-bold text-slate-900">{collectorsCount}</span>
                        </div>
                        <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase">Transacted</span>
                          <span className="text-xs font-bold text-slate-900">{transactionsCount}</span>
                        </div>
                        <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase">Total Scrap</span>
                          <span className="text-xs font-bold text-emerald-800">{(totalWeightKg / 1000).toFixed(2)} MT</span>
                        </div>
                        <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase">Paid Out</span>
                          <span className="text-xs font-bold text-slate-900">₹{(totalDisbursed / 1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DRILLDOWN LEVEL 3: SCRAP COLLECTOR FOLDERS */}
          {!isNationwideSearch && currentTier === 'collectors' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-bold uppercase text-slate-600 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  Scrap Collectors at {currentVendor?.name} ({searchedCollectorFolders.length} Active Kabadiwalas)
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Select a collector folder to view complete transaction logs & payment UTRs
                </span>
              </div>

              {searchedCollectorFolders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs font-mono text-slate-600">
                  No scrap collector transactions recorded yet at this facility.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchedCollectorFolders.map((col) => (
                    <button
                      key={col.collectorId}
                      type="button"
                      onClick={() => {
                        setSelectedCollectorId(col.collectorId);
                        setSearchQuery('');
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-600 rounded-xl p-4 text-left transition-all group shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                            <User className="w-5 h-5" />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              col.collectorTier === 'Gold'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : col.collectorTier === 'Silver'
                                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                : 'bg-orange-50 text-orange-800 border border-orange-200'
                            }`}
                          >
                            {col.collectorTier} Tier
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {col.collectorName}
                        </h3>
                        <div className="text-[11px] font-mono text-slate-500 space-y-0.5 mt-1">
                          <div>ID: {col.collectorId}</div>
                          <div>Phone: {col.collectorPhone}</div>
                          <div>Depot: {col.collectorWard}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center font-mono">
                        <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase">Lots</span>
                          <span className="text-xs font-bold text-slate-900">{col.txnCount}</span>
                        </div>
                        <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase">Weight</span>
                          <span className="text-xs font-bold text-emerald-800">{col.totalWeightKg.toFixed(1)} kg</span>
                        </div>
                        <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase">Earned</span>
                          <span className="text-xs font-bold text-slate-900">₹{col.totalEarnings.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DRILLDOWN LEVEL 4 OR NATIONWIDE SEARCH: FULL TRANSACTION LEDGER TABLE */}
          {(isNationwideSearch || currentTier === 'transactions') && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-0">
              {/* Header inside table */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    {isNationwideSearch
                      ? `Nationwide Surveillance Feed (${filteredTransactions.length} Records Found)`
                      : `Audited Transactions for ${currentCollector?.collectorName} at ${currentVendor?.name}`}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isNationwideSearch
                      ? 'Displaying all records across all states and recycling facilities matching filters.'
                      : `State: ${selectedState} • Facility ID: ${selectedVendorId} • Collector ID: ${selectedCollectorId}`}
                  </p>
                </div>
                <div className="text-xs font-mono font-bold text-slate-700 flex items-center gap-3">
                  <span>Showing: {filteredTransactions.length} Entries</span>
                  <span className="text-emerald-700">
                    Total: ₹{filteredTransactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center text-xs font-mono text-slate-500">
                  No transaction records found matching your filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 text-slate-700 uppercase border-b border-slate-200 font-bold">
                      <tr>
                        {isNationwideSearch && <th className="py-2.5 px-3">State & Facility Trail</th>}
                        <th className="py-2.5 px-3">Lot ID / Date</th>
                        <th className="py-2.5 px-3">Material Grade</th>
                        <th className="py-2.5 px-3 text-right">Weight (kg)</th>
                        <th className="py-2.5 px-3 text-right">Rate (₹/kg)</th>
                        <th className="py-2.5 px-3 text-right">Total Disbursed</th>
                        <th className="py-2.5 px-3">Payment / UTR</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredTransactions.map((tx) => {
                        const isSettled =
                          tx.paymentStatus === 'settled' || tx.status === 'SETTLED' || tx.paymentStatus === 'verified';
                        const isFlagged =
                          tx.paymentStatus === 'flagged' || tx.anomalyFlag === true;

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            {/* Nationwide Path Badges */}
                            {isNationwideSearch && (
                              <td className="py-2.5 px-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (tx.authorityId || tx.statePcb) {
                                      const auth = REGULATORY_AUTHORITIES.find(
                                        (a) => a.id === tx.authorityId
                                      );
                                      setSelectedState(auth ? auth.state : 'Maharashtra');
                                      setSelectedAuthorityId(tx.authorityId || 'auth_mpcb');
                                    }
                                    if (tx.vendorId) setSelectedVendorId(tx.vendorId);
                                    if (tx.collectorId) setSelectedCollectorId(tx.collectorId);
                                    setIsNationwideSearch(false);
                                  }}
                                  className="text-[10px] text-left hover:underline cursor-pointer block"
                                  title="Jump to this collector's folder"
                                >
                                  <span className="font-bold text-slate-900 block">
                                    {tx.statePcb || 'Maharashtra'}
                                  </span>
                                  <span className="text-indigo-800 block truncate max-w-[160px]">
                                    {tx.vendorName || 'EcoMetals Unit'}
                                  </span>
                                  <span className="text-emerald-800 block font-semibold truncate max-w-[160px]">
                                    👤 {tx.collectorName || 'Santosh Yadav'}
                                  </span>
                                </button>
                              </td>
                            )}

                            {/* Lot ID & Timestamp */}
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900">{tx.lotId || tx.id}</span>
                              <span className="text-[10px] block text-slate-500">
                                {tx.date || tx.timestamp?.split('T')[0]}
                              </span>
                            </td>

                            {/* Material & Hazard Flag */}
                            <td className="py-2.5 px-3">
                              <span className="font-medium text-slate-900 block">
                                {tx.materialName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                  {tx.category || 'pcb'}
                                </span>
                                {isFlagged && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" /> Anomaly
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Certified Weighbridge Weight */}
                            <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-800">
                              {(tx.weighbridgeWeightKg || tx.declaredWeightKg || 0).toFixed(1)}
                            </td>

                            {/* Mandi Rate */}
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                              ₹{tx.ratePerKg}
                            </td>

                            {/* Disbursed Amount */}
                            <td className="py-2.5 px-3 text-right tabular-nums font-bold text-emerald-800">
                              ₹{(tx.totalAmount || 0).toLocaleString('en-IN')}
                            </td>

                            {/* Mode & UTR */}
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-800 block text-[11px]">
                                {tx.paymentMode || 'UPI'}
                              </span>
                              <span
                                className="text-[10px] font-mono text-slate-500 truncate block max-w-[140px]"
                                title={tx.settlementUtr}
                              >
                                {tx.settlementUtr || 'PENDING'}
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isSettled
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : isFlagged
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {tx.paymentStatus || 'processing'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setInspectingTxn(tx)}
                                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                                  title="Inspect complete CPCB compliance manifest"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedLotForModal({
                                      lotName: tx.materialName,
                                      materialId: tx.materialId,
                                      currentRate: tx.ratePerKg,
                                      lotId: tx.lotId
                                    })
                                  }
                                  className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded cursor-pointer transition-colors"
                                  title="View Mandi Price vs Statutory Floor Graph"
                                >
                                  <TrendingUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteModal({ isOpen: true, txn: tx });
                                    setSecurityKeyInput('');
                                    setDeleteError(null);
                                    setDeleteSuccess(null);
                                  }}
                                  className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                  title="Delete record using key 12345678"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* INSPECTION MODAL DRAWER */}
      {inspectingTxn && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 flex items-center justify-center animate-fadeIn"
          onClick={() => setInspectingTxn(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden my-4 text-slate-900 font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-sm text-slate-900">
                  CPCB Mandatory Electronic Waste Audit Manifest
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTxn(null)}
                className="text-slate-500 hover:text-slate-900 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Transaction ID</span>
                  <span className="font-bold text-slate-900">{inspectingTxn.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Lot ID</span>
                  <span className="font-bold text-slate-900">{inspectingTxn.lotId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Timestamp</span>
                  <span className="text-slate-800">{inspectingTxn.timestamp || inspectingTxn.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">GPS Geofence</span>
                  <span className="text-slate-800">{inspectingTxn.gpsCoordinates || '18.5204° N, 73.8567° E'}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-3">
                <div className="text-[11px] font-bold text-slate-700 uppercase">Parties to Handover</div>
                <div className="grid grid-cols-2 gap-3 text-slate-800">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Authorized Recycler</span>
                    <div className="font-bold text-slate-900">{inspectingTxn.vendorName}</div>
                    <div className="text-[10px] text-slate-500">ID: {inspectingTxn.vendorId}</div>
                    <div className="text-[10px] text-slate-500">CPCB Reg: {inspectingTxn.vendorCpcbId}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Informal Kabadiwala</span>
                    <div className="font-bold text-slate-900">{inspectingTxn.collectorName}</div>
                    <div className="text-[10px] text-slate-500">ID: {inspectingTxn.collectorId}</div>
                    <div className="text-[10px] text-slate-500">Phone: {inspectingTxn.collectorPhone}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-3">
                <div className="text-[11px] font-bold text-slate-700 uppercase">Material & Valuation Metrics</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Weight</span>
                    <span className="font-bold text-slate-900">
                      {(inspectingTxn.weighbridgeWeightKg || inspectingTxn.declaredWeightKg || 0).toFixed(1)} kg
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Rate/kg</span>
                    <span className="font-bold text-slate-900">₹{inspectingTxn.ratePerKg}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Payout</span>
                    <span className="font-bold text-emerald-800">₹{inspectingTxn.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Payment</span>
                    <span className="font-bold text-indigo-800">{inspectingTxn.paymentMode}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement UTR:</span>
                  <span className="font-bold text-slate-900">{inspectingTxn.settlementUtr || 'N/A'}</span>
                </div>
                {inspectingTxn.eprCertificateNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">EPR Certificate No:</span>
                    <span className="font-bold text-emerald-800">{inspectingTxn.eprCertificateNo}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedLotForModal({
                    lotName: inspectingTxn.materialName,
                    materialId: inspectingTxn.materialId,
                    currentRate: inspectingTxn.ratePerKg,
                    lotId: inspectingTxn.lotId
                  });
                }}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold transition-colors cursor-pointer"
              >
                Inspect Price Volatility Chart
              </button>
              <button
                type="button"
                onClick={() => setInspectingTxn(null)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold transition-colors cursor-pointer"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUTORY CLEARANCE KEY DELETE AUTHORIZATION MODAL (Key: 12345678) */}
      {deleteModal.isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 flex items-center justify-center animate-fadeIn"
          onClick={() => setDeleteModal({ isOpen: false })}
        >
          <div
            className="bg-white border border-slate-300 rounded-xl w-full max-w-md shadow-2xl p-5 space-y-4 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {deleteModal.isPurgeAll
                    ? 'Purge Filtered Records'
                    : `Delete Record ${deleteModal.txn?.id}`}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Statutory Clearance Key Authorization Required (Key: <span className="font-mono font-bold text-slate-900">12345678</span>)
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 leading-relaxed font-mono">
              ⚠️ Records deleted from the active registry will be transferred into the <span className="font-bold">12-Day Safe Custody Recycle Bin</span> under CPCB Rule 14(2) before permanent deletion.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 block">
                Enter Government Clearance Key:
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={securityKeyInput}
                  onChange={(e) => setSecurityKeyInput(e.target.value)}
                  placeholder="Enter Clearance Key (12345678)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-600"
                  autoFocus
                />
              </div>
              {deleteError && (
                <div className="text-xs font-mono text-rose-700 font-semibold">{deleteError}</div>
              )}
              {deleteSuccess && (
                <div className="text-xs font-mono text-emerald-700 font-semibold">{deleteSuccess}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false })}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAuthorizeDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Authorize Clearance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRICE HISTORY MODAL */}
      {selectedLotForModal && (
        <LotPriceHistoryModal
          isOpen={true}
          onClose={() => setSelectedLotForModal(null)}
          lotName={selectedLotForModal.lotName}
          materialId={selectedLotForModal.materialId}
          currentRate={selectedLotForModal.currentRate}
          lotId={selectedLotForModal.lotId}
        />
      )}
    </div>
  );
};
