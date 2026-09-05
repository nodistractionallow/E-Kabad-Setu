import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
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
  QrCode,
  MapPin,
  FileSpreadsheet,
  Award,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Trash2,
  Lock,
  Key,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { RegulatoryAuthority, RecyclerFacility, TransactionRecord, EWasteLot } from '../types';
import {
  REGULATORY_AUTHORITIES,
  NATIONAL_VENDOR_FACILITIES,
  NATIONAL_TRANSACTIONS_LOG
} from '../data/authoritiesAndTransactionsData';
import { LotPriceHistoryModal } from './LotPriceHistoryModal';
import { parseDateTimeToMs } from '../utils/dateTime';
import { useApp } from '../context/AppContext';

interface GovernmentTransactionLedgerProps {
  lots?: EWasteLot[];
}

type ExplorerMode = 'authorities' | 'vendors' | 'collectors' | 'all_transactions';

export const GovernmentTransactionLedger: React.FC<GovernmentTransactionLedgerProps> = ({ lots = [] }) => {
  const { deleteLotWithKey } = useApp();

  // Navigation & Folder State
  const [explorerMode, setExplorerMode] = useState<ExplorerMode>('authorities');
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);

  // Table display inside dropdown toggle (user requested: hide tables inside dropdown for government folders)
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(true);
  const [selectedFolderTable, setSelectedFolderTable] = useState<'transactions' | 'authorities' | 'vendors' | 'collectors'>('transactions');

  // Deletion with key 12345678 state
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('ekabad_deleted_gov_txns');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'processing' | 'flagged' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'weight'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Lot Price Graph Modal State
  const [selectedLotForModal, setSelectedLotForModal] = useState<{
    lotName: string;
    materialId?: string;
    currentRate?: number;
    lotId?: string;
  } | null>(null);

  // Transaction Inspection Drawer / Modal
  const [inspectingTxn, setInspectingTxn] = useState<TransactionRecord | null>(null);

  // Government Key Delete Authorization Handler
  const handleAuthorizeDelete = async () => {
    if (securityKeyInput.trim() !== '12345678') {
      setDeleteError('Invalid Security Key! Authorized Government Clearance Key "12345678" is required.');
      return;
    }

    if (deleteModal.isPurgeAll) {
      const newDeleted = new Set(deletedIds);
      for (const tx of filteredTransactions) {
        newDeleted.add(tx.id);
        if (tx.lotId) {
          newDeleted.add(tx.lotId);
          await deleteLotWithKey(tx.lotId, '12345678');
        }
      }
      setDeletedIds(newDeleted);
      try {
        localStorage.setItem('ekabad_deleted_gov_txns', JSON.stringify(Array.from(newDeleted)));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      setDeleteSuccess(`Successfully purged records authorized by statutory key 12345678.`);
    } else if (deleteModal.txn) {
      const target = deleteModal.txn;
      const newDeleted = new Set(deletedIds);
      newDeleted.add(target.id);
      if (target.lotId) {
        newDeleted.add(target.lotId);
        await deleteLotWithKey(target.lotId, '12345678');
      }
      setDeletedIds(newDeleted);
      try {
        localStorage.setItem('ekabad_deleted_gov_txns', JSON.stringify(Array.from(newDeleted)));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
      setDeleteSuccess(`Transaction record ${target.id} permanently purged with Key 12345678.`);
    }

    setSecurityKeyInput('');
    setDeleteError(null);
    setTimeout(() => {
      setDeleteModal({ isOpen: false });
      setDeleteSuccess(null);
    }, 1200);
  };

  // Merge live app lots with national transaction log
  const allCombinedTransactions = useMemo(() => {
    // Transform lots from app state into transaction records safely with null guards
    const appLotsAsTxns: TransactionRecord[] = lots.map((lot) => {
      const createdDate = lot.createdAt 
        ? (lot.createdAt.includes('T') ? lot.createdAt.split('T')[0] : lot.createdAt)
        : (lot.timestamp ? (lot.timestamp.includes('T') ? lot.timestamp.split('T')[0] : lot.timestamp.split(' ')[0]) : new Date().toISOString().split('T')[0]);
      const rate = lot.ratePerKg || (lot as any).pricePerKg || 480;
      const weight = lot.weighbridgeWeightKg || lot.weightKg || 5.0;
      const amount = lot.finalPayoutAmount || lot.totalAmount || (weight * rate);

      return {
        id: `TXN-APP-${lot.id.slice(-6)}`,
        lotId: lot.id,
        date: createdDate,
        timestamp: lot.createdAt || lot.timestamp || new Date().toISOString(),
        vendorId: lot.facilityId || (lot as any).recyclerId || 'fac_mumbai_01',
        vendorName: lot.facilityName || (lot as any).recyclerName || 'EcoRecycle CleanTech Hub (Turbhe)',
        vendorCpcbId: 'CPCB-REG-2024-MH-084',
        authorityId: 'auth_mpcb',
        statePcb: 'MPCB (Maharashtra)',
        collectorId: lot.collectorId || 'KBD-MH-4402',
        collectorName: lot.collectorName || 'Ram Sevak (रामसेवक कांबळे)',
        collectorPhone: lot.collectorPhone || '+91 98234 56789',
        collectorWard: 'Ward 12, Pune East',
        collectorTier: 'Gold' as const,
        materialId: lot.materialId || lot.id,
        materialName: lot.materialName || lot.category,
        category: (lot.category && (lot.category.toLowerCase().includes('wire') || lot.category.toLowerCase().includes('copper'))) ? 'copper' : 'pcb',
        declaredWeightKg: lot.weightKg || weight,
        weighbridgeWeightKg: weight,
        ratePerKg: rate,
        totalAmount: amount,
        paymentMode: (lot.paymentMode as any) || 'UPI',
        paymentStatus: (lot.status === 'verified' || lot.status === 'paid') ? 'settled' : lot.status === 'rejected' ? 'rejected' : 'processing',
        settlementUtr: lot.settlementUtr || `UPI-SETTLE-${lot.id.slice(-8).toUpperCase()}`,
        eprCreditGeneratedKg: Math.round(weight * 0.85),
        eprCertificateNo: (lot.status === 'verified' || lot.status === 'paid') ? `EPR-CPCB-2026-VAL-${lot.id.slice(-4)}` : undefined,
        gpsCoordinates: lot.gpsLocation || '18.5204° N, 73.8567° E'
      };
    });

    return [...appLotsAsTxns, ...NATIONAL_TRANSACTIONS_LOG].filter((tx) => !deletedIds.has(tx.id) && !(tx.lotId && deletedIds.has(tx.lotId)));
  }, [lots, deletedIds]);

  // Filtered transactions based on breadcrumb folders and query
  const filteredTransactions = useMemo(() => {
    return allCombinedTransactions.filter((tx) => {
      // Authority Filter
      if (selectedAuthorityId) {
        const auth = REGULATORY_AUTHORITIES.find((a) => a.id === selectedAuthorityId);
        if (auth && !tx.statePcb.toLowerCase().includes(auth.code.toLowerCase()) && !tx.statePcb.toLowerCase().includes(auth.name.toLowerCase().split(' ')[0])) {
          return false;
        }
      }

      // Vendor Filter
      if (selectedVendorId) {
        if (tx.vendorId !== selectedVendorId) {
          return false;
        }
      }

      // Collector Filter
      if (selectedCollectorId) {
        if (tx.collectorId !== selectedCollectorId && tx.collectorName !== selectedCollectorId) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'all' && tx.paymentStatus !== statusFilter) {
        return false;
      }

      // Category Filter
      if (categoryFilter !== 'all') {
        const cat = categoryFilter.toLowerCase();
        const matchesCategory = tx.category.toLowerCase().includes(cat) || tx.materialName.toLowerCase().includes(cat);
        if (!matchesCategory) return false;
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matches =
          tx.id.toLowerCase().includes(q) ||
          tx.lotId.toLowerCase().includes(q) ||
          tx.settlementUtr.toLowerCase().includes(q) ||
          tx.vendorName.toLowerCase().includes(q) ||
          tx.collectorName.toLowerCase().includes(q) ||
          tx.materialName.toLowerCase().includes(q) ||
          tx.statePcb.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        const timeA = parseDateTimeToMs(a.timestamp || a.date);
        const timeB = parseDateTimeToMs(b.timestamp || b.date);
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }
      if (sortBy === 'amount') {
        return sortOrder === 'desc' ? b.totalAmount - a.totalAmount : a.totalAmount - b.totalAmount;
      }
      if (sortBy === 'weight') {
        const wA = a.weighbridgeWeightKg || a.declaredWeightKg;
        const wB = b.weighbridgeWeightKg || b.declaredWeightKg;
        return sortOrder === 'desc' ? wB - wA : wA - wB;
      }
      return 0;
    });
  }, [
    allCombinedTransactions,
    selectedAuthorityId,
    selectedVendorId,
    selectedCollectorId,
    statusFilter,
    categoryFilter,
    searchQuery,
    sortBy,
    sortOrder
  ]);

  // Aggregate Key Metrics for current filtered view
  const summaryMetrics = useMemo(() => {
    const totalDisbursed = filteredTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
    const totalWeightKg = filteredTransactions.reduce((acc, t) => acc + (t.weighbridgeWeightKg || t.declaredWeightKg), 0);
    const uniqueVendors = new Set(filteredTransactions.map((t) => t.vendorId)).size;
    const uniqueCollectors = new Set(filteredTransactions.map((t) => t.collectorName)).size;
    const totalFlagged = filteredTransactions.filter((t) => t.paymentStatus === 'flagged' || t.anomalyFlag).length;

    return {
      totalDisbursed,
      totalWeightKg,
      uniqueVendors,
      uniqueCollectors,
      totalFlagged
    };
  }, [filteredTransactions]);

  const handleResetBreadcrumbs = () => {
    setSelectedAuthorityId(null);
    setSelectedVendorId(null);
    setSelectedCollectorId(null);
  };

  const handleOpenPriceModal = (materialName: string, materialId?: string, rate?: number, lotId?: string) => {
    setSelectedLotForModal({
      lotName: materialName,
      materialId: materialId || materialName,
      currentRate: rate,
      lotId: lotId
    });
  };

  const handleExportCsv = () => {
    const headers = [
      'Transaction ID',
      'Lot ID',
      'Date',
      'Buyer Facility',
      'CPCB Reg ID',
      'SPCB Jurisdiction',
      'Collector Name',
      'Collector Phone',
      'Material Name',
      'Category',
      'Declared Wt (kg)',
      'Weighbridge Wt (kg)',
      'Rate (INR/kg)',
      'Total Amount (INR)',
      'Payment Mode',
      'Payment Status',
      'Settlement UTR'
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.lotId,
      tx.date,
      `"${tx.vendorName.replace(/"/g, '""')}"`,
      tx.vendorCpcbId,
      tx.statePcb,
      `"${tx.collectorName.replace(/"/g, '""')}"`,
      tx.collectorPhone,
      `"${tx.materialName.replace(/"/g, '""')}"`,
      tx.category,
      tx.declaredWeightKg,
      tx.weighbridgeWeightKg,
      tx.ratePerKg,
      tx.totalAmount,
      tx.paymentMode,
      tx.paymentStatus,
      tx.settlementUtr
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CPCB_Vendor_Collector_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentAuthority = selectedAuthorityId ? REGULATORY_AUTHORITIES.find((a) => a.id === selectedAuthorityId) : null;
  const currentVendor = selectedVendorId ? NATIONAL_VENDOR_FACILITIES.find((v) => v.id === selectedVendorId) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb & View Toggle Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Ministry of Environment & Climate Change (MoEFCC)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-mono font-bold">
                E-Waste Rules 2022 Central Registry
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              National Vendor-to-Collector Transaction Dossier & Authority Folders
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Real-time surveillance of scrap transactions from registered kabadiwalas to authorized recycling plants.
              Categorized by State Pollution Control Boards, formal facilities, and interactive scrap grade price volatility graphs.
            </p>
          </div>

          {/* Export & Graph Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenPriceModal('Printed Circuit Boards (Motherboard)', 'mat_pcb_high', 495)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              title="Open the fixed live material price trends and statutory MSP graph"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>📊 Live Scrap Price Trends Graph</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-colors cursor-pointer"
              title="Export filtered records to official CPCB CSV"
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
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              title="Delete or purge filtered transaction records using statutory clearance key 12345678"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>🗑️ Delete Data (Key: 12345678)</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs (Authorities Folder / Vendors Folder / Flat Table) */}
        <div className="flex items-center space-x-2 border-t border-slate-200 pt-4 mt-5 overflow-x-auto">
          {[
            { id: 'authorities', label: '1. Regulatory Authority Folders (SPCBs)', icon: Folder, count: REGULATORY_AUTHORITIES.length },
            { id: 'vendors', label: '2. Vendor / Recycler Plant Folders', icon: Building2, count: NATIONAL_VENDOR_FACILITIES.length },
            { id: 'collectors', label: '3. Collector Aggregator Directories', icon: User, count: summaryMetrics.uniqueCollectors },
            { id: 'all_transactions', label: '4. Master All-Transactions Ledger', icon: Layers, count: allCombinedTransactions.length }
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = explorerMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setExplorerMode(mode.id as ExplorerMode);
                  if (mode.id === 'all_transactions') {
                    handleResetBreadcrumbs();
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-md ${isActive ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                  {mode.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Breadcrumb Bar */}
      {(selectedAuthorityId || selectedVendorId || selectedCollectorId) && (
        <div className="flex items-center gap-2 text-xs font-mono bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-2xs">
          <button
            type="button"
            onClick={handleResetBreadcrumbs}
            className="text-emerald-700 hover:underline flex items-center gap-1 font-bold cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>National Central Root</span>
          </button>

          {currentAuthority && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => {
                  setSelectedVendorId(null);
                  setSelectedCollectorId(null);
                }}
                className={`font-bold hover:underline cursor-pointer ${
                  !selectedVendorId ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {currentAuthority.name}
              </button>
            </>
          )}

          {currentVendor && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-bold">{currentVendor.name}</span>
            </>
          )}

          <button
            type="button"
            onClick={handleResetBreadcrumbs}
            className="ml-auto text-[11px] text-slate-500 hover:text-rose-600 font-sans cursor-pointer font-medium"
          >
            Clear Filter & Return to All
          </button>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Total Filtered Payouts</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-1">
            ₹{(summaryMetrics.totalDisbursed / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-emerald-700 font-mono mt-0.5 font-semibold">100% Direct to Bank/UPI</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Physical Mass Traced</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-teal-700 mt-1">
            {(summaryMetrics.totalWeightKg / 1000).toFixed(2)} MT
          </div>
          <div className="text-[11px] text-teal-700 font-mono mt-0.5 font-semibold">
            {summaryMetrics.totalWeightKg.toLocaleString()} kg Total Weight
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Traded Counterparties</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-indigo-700 mt-1">
            {summaryMetrics.uniqueVendors} Vendors • {summaryMetrics.uniqueCollectors} Collectors
          </div>
          <div className="text-[11px] text-indigo-700 font-mono mt-0.5 font-semibold">Verified Bilateral Pairs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Flagged / Under Audit</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 mt-1">
            {summaryMetrics.totalFlagged} Lots
          </div>
          <div className="text-[11px] text-amber-700 font-mono mt-0.5 font-semibold">Discrepancy / Hazard Hold</div>
        </div>
      </div>

      {/* MODE 1: REGULATORY AUTHORITY FOLDERS VIEW */}
      {explorerMode === 'authorities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase font-mono flex items-center gap-2">
              <Folder className="w-4 h-4 text-emerald-700" />
              State Pollution Control Boards (SPCB) Jurisdictional Folders
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Click any folder to inspect facilities and transactions under that authority
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {REGULATORY_AUTHORITIES.map((auth) => {
              const isSelected = selectedAuthorityId === auth.id;
              return (
                <div
                  key={auth.id}
                  onClick={() => {
                    if (selectedAuthorityId === auth.id) {
                      setSelectedAuthorityId(null);
                    } else {
                      setSelectedAuthorityId(auth.id);
                      setSelectedVendorId(null);
                    }
                  }}
                  className={`border rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden group shadow-2xs ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      {isSelected ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        auth.status === 'Operational'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : auth.status === 'Audit Underway'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {auth.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-emerald-700 font-bold">{auth.code}</div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5 group-hover:text-emerald-700 transition-colors">
                    {auth.name}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{auth.headquarters}</div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono">
                    <div>
                      <div className="text-slate-400">Authorized Units</div>
                      <div className="text-slate-800 font-bold">{auth.activeVendorsCount} Plants</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Traded Volume</div>
                      <div className="text-emerald-700 font-bold">{auth.totalTradedTons} MT</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Compliance</div>
                      <div className="text-teal-700 font-bold">{auth.complianceScore}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Disbursed (Cr)</div>
                      <div className="text-amber-700 font-bold">₹{auth.totalDisbursedCrores} Cr</div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-emerald-700 font-bold flex items-center justify-between pt-1">
                    <span>{isSelected ? 'Folder Opened (Filtered Below)' : 'Open Authority Dossier'}</span>
                    <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: VENDOR / RECYCLER PLANT FOLDERS VIEW */}
      {explorerMode === 'vendors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase font-mono flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              CPCB Authorized Recycler & Smelting Vendor Folders
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Select any vendor plant to view inward collector lots and payout manifests
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {NATIONAL_VENDOR_FACILITIES.map((vendor) => {
              const isSelected = selectedVendorId === vendor.id;
              return (
                <div
                  key={vendor.id}
                  onClick={() => {
                    if (selectedVendorId === vendor.id) {
                      setSelectedVendorId(null);
                    } else {
                      setSelectedVendorId(vendor.id);
                    }
                  }}
                  className={`border rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden group shadow-2xs ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Rating: {vendor.complianceRating || 'A+'}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-emerald-700 font-bold">{vendor.cpcbId}</div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                    {vendor.name}
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {vendor.location}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono">
                    <div>
                      <div className="text-slate-400">Monthly Quota</div>
                      <div className="text-slate-800 font-bold">{vendor.monthlyQuotaTons} MT</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Processed MTD</div>
                      <div className="text-teal-700 font-bold">{vendor.processedThisMonthTons} MT</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Active Kabadiwalas</div>
                      <div className="text-indigo-700 font-bold">{vendor.activeCollectors}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">EPR Yield</div>
                      <div className="text-amber-700 font-bold">{vendor.eprCreditsGeneratedTons} MT</div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-indigo-700 font-bold flex items-center justify-between pt-1">
                    <span>{isSelected ? 'Folder Opened (Filtered Below)' : 'Inspect Vendor Transactions'}</span>
                    <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Transaction ID, Lot ID, UTR, Collector, Vendor, SPCB or Material..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-mono"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-mono"
          >
            <option value="all">All Settlement Statuses</option>
            <option value="settled">Settled (100% Paid)</option>
            <option value="processing">Processing (Weighbridge)</option>
            <option value="flagged">Flagged (Anomaly)</option>
            <option value="rejected">Rejected (Hazard Breach)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-mono"
          >
            <option value="all">All Material Categories</option>
            <option value="pcb">PCBs & Motherboards</option>
            <option value="copper">Copper Wires & Cables</option>
            <option value="battery">Lithium & Lead Batteries</option>
            <option value="telecom">Telecom & Network Cards</option>
            <option value="solar">Solar PV Panels</option>
            <option value="cooling">Cooling Compressors</option>
            <option value="medical">Medical Diagnostics PCB</option>
            <option value="plastic">Flame-Retardant E-Plastics</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-mono"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Payout (₹)</option>
            <option value="weight">Sort by Weight (kg)</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 cursor-pointer"
            title={`Toggle order: current is ${sortOrder.toUpperCase()}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* FOLDER TABLE CONTROLS & DROPDOWN DISPLAY (Hiding table behind dropdown) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-emerald-700" />
            <span>Select Folder Table:</span>
          </label>
          <select
            value={selectedFolderTable}
            onChange={(e) => setSelectedFolderTable(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
          >
            <option value="transactions">📂 Bilateral Transactions Ledger ({filteredTransactions.length} items)</option>
            <option value="authorities">🏛️ State PCB Regulatory Folders ({REGULATORY_AUTHORITIES.length} authorities)</option>
            <option value="vendors">🏭 Registered Recycling Plants ({NATIONAL_VENDOR_FACILITIES.length} facilities)</option>
            <option value="collectors">🛵 Certified Aggregator Directory ({summaryMetrics.uniqueCollectors} collectors)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
        >
          {isTableDropdownOpen ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
              <span>Hide Tables Inside Dropdown</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
              <span>Show / Expand Table View</span>
            </>
          )}
        </button>
      </div>

      {!isTableDropdownOpen ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center">
          <Folder className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-mono font-bold text-slate-700">
            Government Folder Table is collapsed inside the dropdown menu above.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Current active view: <span className="font-bold text-emerald-700">{selectedFolderTable.toUpperCase()}</span> ({filteredTransactions.length} records).
          </p>
          <button
            type="button"
            onClick={() => setIsTableDropdownOpen(true)}
            className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-mono inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open & View Selected Table</span>
          </button>
        </div>
      ) : (
      /* MASTER TRANSACTIONS TABLE */
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Categorised National Transaction Records Ledger ({filteredTransactions.length} Verified Bilateral Records)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tip: Click on any <span className="text-emerald-700 font-bold">Lot Name card</span> to open its fixed real-time price change and volatility graph.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-600">
            Total Ledger Valuation: <span className="text-emerald-700 font-bold">₹{summaryMetrics.totalDisbursed.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Txn / UTR Ref</th>
                <th className="py-3 px-4">Lot Name & Grade (Tap for Graph)</th>
                <th className="py-3 px-4">Buyer (Vendor / Plant)</th>
                <th className="py-3 px-4">Seller (Collector)</th>
                <th className="py-3 px-4">Weight (kg)</th>
                <th className="py-3 px-4">Rate (₹/kg)</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status & Compliance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-mono">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    No transactions matching the selected folder or search query.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      {/* Txn ID & Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{tx.id}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {tx.timestamp}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate max-w-[140px] font-mono mt-0.5">
                          {tx.settlementUtr}
                        </div>
                      </td>

                      {/* LOT NAME (CLICKABLE INTERACTIVE CARD TO VIEW PRICE GRAPH) */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenPriceModal(tx.materialName, tx.materialId, tx.ratePerKg, tx.lotId)}
                          className="group/lot flex items-start gap-2 text-left p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer w-full max-w-[240px]"
                          title="Click to view historical price change graph and volatility index for this lot"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5 group-hover/lot:bg-emerald-600 group-hover/lot:text-white text-emerald-700 transition-colors">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover/lot:text-emerald-800 transition-colors line-clamp-1">
                              {tx.materialName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-emerald-700 font-bold">
                                Lot: {tx.lotId}
                              </span>
                              <span className="text-[10px] text-slate-400">•</span>
                              <span className="text-[10px] text-indigo-700 uppercase font-semibold">
                                {tx.category}
                              </span>
                            </div>
                            <div className="text-[9px] text-emerald-700 font-sans flex items-center gap-0.5 mt-1 font-bold group-hover/lot:underline">
                              <span>View Price Graph</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* VENDOR (BUYER) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                          <span className="truncate max-w-[170px]">{tx.vendorName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{tx.vendorCpcbId}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{tx.statePcb}</div>
                      </td>

                      {/* COLLECTOR (SELLER) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-teal-700" />
                          <span>{tx.collectorName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{tx.collectorPhone}</div>
                        <div className="text-[9px] text-slate-400">{tx.collectorWard}</div>
                      </td>

                      {/* WEIGHT */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-700">
                          {tx.weighbridgeWeightKg ? `${tx.weighbridgeWeightKg} kg` : `${tx.declaredWeightKg} kg`}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {tx.weighbridgeWeightKg ? 'Weighbridge Net' : 'Declared Est.'}
                        </div>
                      </td>

                      {/* RATE PER KG */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">₹{tx.ratePerKg} / kg</div>
                        <div className="text-[10px] text-slate-500 font-mono">CPCB Schedule Base</div>
                      </td>

                      {/* TOTAL AMOUNT */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-black text-amber-700 text-sm">
                          ₹{tx.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{tx.paymentMode} Disbursed</div>
                      </td>

                      {/* STATUS & COMPLIANCE */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block w-fit ${
                              tx.paymentStatus === 'settled'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : tx.paymentStatus === 'flagged'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : tx.paymentStatus === 'rejected'
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {tx.paymentStatus.toUpperCase()}
                          </span>

                          {tx.anomalyFlag && (
                            <span className="text-[9px] text-rose-700 font-sans flex items-center gap-1 font-bold">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Anomaly Alert
                            </span>
                          )}

                          {tx.eprCertificateNo && (
                            <span className="text-[9px] text-emerald-700 font-mono font-semibold">
                              EPR Verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingTxn(tx)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-[11px] font-bold font-mono transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            title="Inspect digital manifest and statutory audit trail"
                          >
                            <Eye className="w-3 h-3 text-emerald-700" />
                            <span>Audit Trail</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteModal({ isOpen: true, txn: tx, isPurgeAll: false });
                              setSecurityKeyInput('');
                              setDeleteError(null);
                              setDeleteSuccess(null);
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Statutory removal with Key 12345678"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* TRANSACTION INSPECTION AUDIT TRAIL MODAL */}
      {inspectingTxn && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-4 text-slate-900">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Official CPCB Transaction Manifest & Audit Dossier
                  </h3>
                  <div className="text-xs font-mono text-slate-500">
                    ID: {inspectingTxn.id} • Lot: {inspectingTxn.lotId}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTxn(null)}
                className="text-slate-400 hover:text-slate-800 p-2 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-500 uppercase text-[10px]">Settlement UTR</div>
                  <div className="text-emerald-700 font-bold break-all">{inspectingTxn.settlementUtr}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase text-[10px]">Payment Timestamp</div>
                  <div className="text-slate-800">{inspectingTxn.timestamp}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase text-[10px]">Buyer Facility</div>
                  <div className="text-slate-900 font-bold">{inspectingTxn.vendorName}</div>
                  <div className="text-slate-500 text-[10px]">{inspectingTxn.vendorCpcbId}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase text-[10px]">Seller Collector</div>
                  <div className="text-slate-900 font-bold">{inspectingTxn.collectorName}</div>
                  <div className="text-slate-500 text-[10px]">{inspectingTxn.collectorPhone}</div>
                </div>
              </div>

              {/* Material & Financials */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Material Grade:</span>
                  <span className="font-bold text-slate-900">{inspectingTxn.materialName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Verified Weighbridge Mass:</span>
                  <span className="font-bold text-emerald-700">{inspectingTxn.weighbridgeWeightKg || inspectingTxn.declaredWeightKg} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">CPCB Mandi Unit Rate:</span>
                  <span className="font-bold text-slate-900">₹{inspectingTxn.ratePerKg} / kg</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-sm">
                  <span className="text-slate-900 font-bold">Total Direct Payout:</span>
                  <span className="font-black text-amber-700">₹{inspectingTxn.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {inspectingTxn.anomalyFlag && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs">
                  <div className="font-bold flex items-center gap-1 text-rose-700 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Automated Surveillance Alert
                  </div>
                  <div>{inspectingTxn.anomalyReason}</div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInspectingTxn(null);
                    handleOpenPriceModal(inspectingTxn.materialName, inspectingTxn.materialId, inspectingTxn.ratePerKg, inspectingTxn.lotId);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Open Price Fluctuation Graph</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingTxn(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOT PRICE CHANGE GRAPH MODAL (FIXED & DIRECTLY VISIBLE ON SCREEN) */}
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

      {/* GOVERNMENT DELETE SECURITY KEY AUTHORIZATION MODAL (KEY: 12345678) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-mono">
                    Statutory Data Purge
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Government Central Clearance Protocol
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 leading-relaxed font-sans space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                Restricted Government Authorization Required
              </p>
              <p className="text-[11px] text-rose-800">
                {deleteModal.isPurgeAll
                  ? `You are about to purge all currently filtered transaction records (${filteredTransactions.length} items). Enter the 8-digit government statutory key to authorize permanent removal.`
                  : `You are about to delete record ${deleteModal.txn?.id || 'selected lot'} from official records. Enter the 8-digit government statutory key.`}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Enter Government Clearance Key:</span>
              </label>
              <input
                type="password"
                placeholder="Enter 8-digit statutory key (e.g. 12345678)"
                value={securityKeyInput}
                onChange={(e) => {
                  setSecurityKeyInput(e.target.value);
                  setDeleteError(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                autoFocus
              />
              <p className="text-[10px] text-slate-400 font-mono">
                Statutory clearance master key: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">12345678</code>
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {deleteSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{deleteSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAuthorizeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Authorize & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
