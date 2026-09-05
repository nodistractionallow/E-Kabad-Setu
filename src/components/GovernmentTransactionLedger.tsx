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
  ChevronLeft
} from 'lucide-react';
import { RegulatoryAuthority, RecyclerFacility, TransactionRecord, EWasteLot } from '../types';
import {
  REGULATORY_AUTHORITIES,
  NATIONAL_VENDOR_FACILITIES,
  NATIONAL_TRANSACTIONS_LOG
} from '../data/authoritiesAndTransactionsData';
import { LotPriceHistoryModal } from './LotPriceHistoryModal';

interface GovernmentTransactionLedgerProps {
  lots?: EWasteLot[];
}

type ExplorerMode = 'authorities' | 'vendors' | 'collectors' | 'all_transactions';

export const GovernmentTransactionLedger: React.FC<GovernmentTransactionLedgerProps> = ({ lots = [] }) => {
  // Navigation & Folder State
  const [explorerMode, setExplorerMode] = useState<ExplorerMode>('authorities');
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);

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

  // Selected Transaction Receipt Drawer / Detail Modal
  const [inspectingTxn, setInspectingTxn] = useState<TransactionRecord | null>(null);

  // Combine static national transactions with dynamic lots from context
  const allCombinedTransactions = useMemo(() => {
    // Map context lots to transaction records
    const mappedContextLots: TransactionRecord[] = lots.map((l) => ({
      id: `TXN-CPCB-${l.id.replace('LOT-', '')}`,
      lotId: l.id,
      settlementUtr: l.status === 'paid' ? `UPI/MANDI/${l.id}/SETTLED` : l.anomalyFlag ? 'HOLD/ANOMALY/INVESTIGATION' : 'PENDING/WEIGHBRIDGE-STAGE',
      date: l.timestamp.split(' ')[0] || '2026-09-04',
      timestamp: l.timestamp,
      vendorId: l.facilityId || 'REC-MH-PN-004',
      vendorName: l.facilityName || 'EcoMetals CPCB Dismantling Unit #4',
      vendorCpcbId: 'CPCB/EW-REC/2026/8812',
      authorityId: 'auth_mpcb',
      statePcb: 'MPCB-PUNE-EW-902',
      collectorId: l.collectorId,
      collectorName: l.collectorName,
      collectorPhone: l.collectorPhone,
      collectorWard: l.gpsLocation,
      collectorTier: 'Gold',
      materialId: l.materialId,
      materialName: l.materialName,
      category: l.category,
      declaredWeightKg: l.weightKg,
      weighbridgeWeightKg: l.weighbridgeWeightKg || l.weightKg,
      ratePerKg: l.ratePerKg,
      totalAmount: l.finalPayoutAmount || l.totalAmount,
      paymentMode: (l.paymentMode as any) || 'UPI',
      paymentStatus: l.status === 'paid' ? 'settled' : l.status === 'rejected' ? 'rejected' : l.anomalyFlag ? 'flagged' : 'processing',
      anomalyFlag: l.anomalyFlag,
      anomalyReason: l.anomalyReason,
      eprCreditGeneratedKg: l.eprCreditKg || l.weightKg,
      eprCertificateNo: `EPR-CPCB-2026-${l.id}`,
      gpsCoordinates: l.gpsLocation,
      photoUrl: l.photoUrl
    }));

    // Deduplicate by lotId/id
    const existingIds = new Set(mappedContextLots.map((m) => m.lotId));
    const staticFiltered = NATIONAL_TRANSACTIONS_LOG.filter((st) => !existingIds.has(st.lotId));
    return [...mappedContextLots, ...staticFiltered];
  }, [lots]);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    return allCombinedTransactions.filter((tx) => {
      // Authority Filter
      if (selectedAuthorityId && tx.authorityId !== selectedAuthorityId) {
        return false;
      }
      // Vendor Filter
      if (selectedVendorId && tx.vendorId !== selectedVendorId) {
        return false;
      }
      // Collector Filter
      if (selectedCollectorId && tx.collectorId !== selectedCollectorId) {
        return false;
      }
      // Status Filter
      if (statusFilter !== 'all' && tx.paymentStatus !== statusFilter) {
        return false;
      }
      // Category Filter
      if (categoryFilter !== 'all' && tx.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          tx.id.toLowerCase().includes(q) ||
          tx.lotId.toLowerCase().includes(q) ||
          tx.settlementUtr.toLowerCase().includes(q) ||
          tx.vendorName.toLowerCase().includes(q) ||
          tx.collectorName.toLowerCase().includes(q) ||
          tx.collectorPhone.includes(q) ||
          tx.materialName.toLowerCase().includes(q) ||
          tx.statePcb.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'desc' ? b.totalAmount - a.totalAmount : a.totalAmount - b.totalAmount;
      }
      if (sortBy === 'weight') {
        const wA = a.weighbridgeWeightKg || a.declaredWeightKg;
        const wB = b.weighbridgeWeightKg || b.declaredWeightKg;
        return sortOrder === 'desc' ? wB - wA : wA - wB;
      }
      // Date sort
      return sortOrder === 'desc'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime();
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

  // Metrics summary
  const summaryMetrics = useMemo(() => {
    const totalDisbursed = filteredTransactions.reduce((acc, t) => acc + (t.paymentStatus === 'settled' ? t.totalAmount : 0), 0);
    const totalWeightKg = filteredTransactions.reduce((acc, t) => acc + (t.weighbridgeWeightKg || t.declaredWeightKg), 0);
    const totalFlagged = filteredTransactions.filter((t) => t.paymentStatus === 'flagged' || t.anomalyFlag).length;
    const uniqueVendors = new Set(filteredTransactions.map((t) => t.vendorId)).size;
    const uniqueCollectors = new Set(filteredTransactions.map((t) => t.collectorId)).size;

    return {
      totalDisbursed,
      totalWeightKg,
      totalFlagged,
      uniqueVendors,
      uniqueCollectors,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Handlers
  const handleOpenPriceModal = (lotName: string, materialId?: string, currentRate?: number, lotId?: string) => {
    setSelectedLotForModal({
      lotName,
      materialId,
      currentRate,
      lotId
    });
  };

  const handleResetBreadcrumbs = () => {
    setSelectedAuthorityId(null);
    setSelectedVendorId(null);
    setSelectedCollectorId(null);
  };

  const handleExportCsv = () => {
    const headers = [
      'Transaction ID',
      'Lot ID',
      'Date',
      'Vendor Name',
      'Vendor CPCB ID',
      'State SPCB',
      'Collector Name',
      'Collector Phone',
      'Material Name',
      'Category',
      'Declared Wt (kg)',
      'Weighbridge Wt (kg)',
      'Rate (INR/kg)',
      'Total Payout (INR)',
      'Payment Mode',
      'Status',
      'UTR Number'
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Ministry of Environment & Climate Change (MoEFCC)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                E-Waste Rules 2022 Central Registry
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              National Vendor-to-Collector Transaction Dossier & Authority Folders
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Real-time surveillance of scrap transactions from registered kabadiwalas to authorized recycling plants.
              Categorized by State Pollution Control Boards, formal facilities, and interactive scrap grade price volatility graphs.
            </p>
          </div>

          {/* Export & Mode Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-colors cursor-pointer"
              title="Export filtered records to official CPCB CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs (Authorities Folder / Vendors Folder / Flat Table) */}
        <div className="flex items-center space-x-2 border-t border-slate-800 pt-4 mt-5 overflow-x-auto">
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
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-md ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-900 text-slate-400'}`}>
                  {mode.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Breadcrumb Bar */}
      {(selectedAuthorityId || selectedVendorId || selectedCollectorId) && (
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-2xl">
          <button
            type="button"
            onClick={handleResetBreadcrumbs}
            className="text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>National Central Root</span>
          </button>

          {currentAuthority && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <button
                type="button"
                onClick={() => {
                  setSelectedVendorId(null);
                  setSelectedCollectorId(null);
                }}
                className={`font-bold hover:underline cursor-pointer ${
                  !selectedVendorId ? 'text-white' : 'text-slate-400'
                }`}
              >
                {currentAuthority.name}
              </button>
            </>
          )}

          {currentVendor && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-bold">{currentVendor.name}</span>
            </>
          )}

          <button
            type="button"
            onClick={handleResetBreadcrumbs}
            className="ml-auto text-[11px] text-slate-400 hover:text-rose-400 font-sans cursor-pointer"
          >
            Clear Filter & Return to All
          </button>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Total Filtered Payouts</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
            ₹{(summaryMetrics.totalDisbursed / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-emerald-500 font-mono mt-0.5">100% Direct to Bank/UPI</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Physical Mass Traced</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-teal-300 mt-1">
            {(summaryMetrics.totalWeightKg / 1000).toFixed(2)} MT
          </div>
          <div className="text-[11px] text-teal-400 font-mono mt-0.5">
            {summaryMetrics.totalWeightKg.toLocaleString()} kg Total Weight
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Traded Counterparties</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-indigo-300 mt-1">
            {summaryMetrics.uniqueVendors} Vendors • {summaryMetrics.uniqueCollectors} Collectors
          </div>
          <div className="text-[11px] text-indigo-400 font-mono mt-0.5">Verified Bilateral Pairs</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Flagged / Under Audit</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-1">
            {summaryMetrics.totalFlagged} Lots
          </div>
          <div className="text-[11px] text-amber-300 font-mono mt-0.5">Discrepancy / Hazard Hold</div>
        </div>
      </div>

      {/* MODE 1: REGULATORY AUTHORITY FOLDERS VIEW */}
      {explorerMode === 'authorities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
              <Folder className="w-4 h-4 text-emerald-400" />
              State Pollution Control Boards (SPCB) Jurisdictional Folders
            </h2>
            <span className="text-xs text-slate-400 font-mono">
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
                  className={`border rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      {isSelected ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        auth.status === 'Operational'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : auth.status === 'Audit Underway'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {auth.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-emerald-400 font-bold">{auth.code}</div>
                  <h3 className="text-base font-bold text-white mt-0.5 group-hover:text-emerald-300 transition-colors">
                    {auth.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{auth.headquarters}</div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono">
                    <div>
                      <div className="text-slate-500">Authorized Units</div>
                      <div className="text-slate-200 font-bold">{auth.activeVendorsCount} Plants</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Traded Volume</div>
                      <div className="text-emerald-400 font-bold">{auth.totalTradedTons} MT</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Compliance</div>
                      <div className="text-teal-300 font-bold">{auth.complianceScore}%</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Disbursed (Cr)</div>
                      <div className="text-amber-400 font-bold">₹{auth.totalDisbursedCrores} Cr</div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-emerald-400 font-bold flex items-center justify-between pt-1">
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
            <h2 className="text-sm font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              CPCB Authorized Recycler & Smelting Vendor Folders
            </h2>
            <span className="text-xs text-slate-400 font-mono">
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
                  className={`border rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Rating: {vendor.complianceRating || 'A+'}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-emerald-400 font-bold">{vendor.cpcbId}</div>
                  <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1 group-hover:text-emerald-300 transition-colors">
                    {vendor.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {vendor.location}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono">
                    <div>
                      <div className="text-slate-500">Monthly Quota</div>
                      <div className="text-slate-200 font-bold">{vendor.monthlyQuotaTons} MT</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Processed MTD</div>
                      <div className="text-teal-300 font-bold">{vendor.processedThisMonthTons} MT</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Active Kabadiwalas</div>
                      <div className="text-indigo-300 font-bold">{vendor.activeCollectors}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">EPR Yield</div>
                      <div className="text-amber-400 font-bold">{vendor.eprCreditsGeneratedTons} MT</div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-indigo-400 font-bold flex items-center justify-between pt-1">
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Transaction ID, Lot ID, UTR, Collector, Vendor, SPCB or Material..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
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
            className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="all">All Material Categories</option>
            <option value="pcb">PCBs & Motherboards</option>
            <option value="copper">Copper Wires & Cables</option>
            <option value="battery">Lithium & Lead Batteries</option>
            <option value="crt">CRT Displays & Leaded Glass</option>
            <option value="magnet">Neodymium Rare-Earth</option>
            <option value="plastic">Flame-Retardant E-Plastics</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Payout (₹)</option>
            <option value="weight">Sort by Weight (kg)</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white"
            title={`Toggle order: current is ${sortOrder.toUpperCase()}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MASTER TRANSACTIONS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/40">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Categorised National Transaction Records Ledger ({filteredTransactions.length} Verified Bilateral Records)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tip: Click on any <span className="text-emerald-400 font-bold">Lot Name card</span> to open its real-time price change and volatility graph.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Total Ledger Valuation: <span className="text-emerald-400 font-bold">₹{summaryMetrics.totalDisbursed.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    <AlertTriangle className="w-8 h-8 text-amber-500/50 mx-auto mb-2" />
                    No transactions matching the selected folder or search query.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Txn ID & Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{tx.id}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {tx.timestamp}
                        </div>
                        <div className="text-[9px] text-slate-500 truncate max-w-[140px] font-mono mt-0.5">
                          {tx.settlementUtr}
                        </div>
                      </td>

                      {/* LOT NAME (CLICKABLE INTERACTIVE CARD TO VIEW PRICE GRAPH) */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenPriceModal(tx.materialName, tx.materialId, tx.ratePerKg, tx.lotId)}
                          className="group/lot flex items-start gap-2 text-left p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-950/40 border border-slate-700/80 hover:border-emerald-500/60 transition-all cursor-pointer w-full max-w-[240px]"
                          title="Click to view historical price change graph and volatility index for this lot"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/lot:bg-emerald-500 group-hover/lot:text-white text-emerald-400 transition-colors">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover/lot:text-emerald-300 transition-colors line-clamp-1">
                              {tx.materialName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-emerald-400">
                                Lot: {tx.lotId}
                              </span>
                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-[10px] text-indigo-300 uppercase">
                                {tx.category}
                              </span>
                            </div>
                            <div className="text-[9px] text-emerald-400 font-sans flex items-center gap-0.5 mt-1 font-semibold group-hover/lot:underline">
                              <span>View Price Graph</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* VENDOR (BUYER) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="truncate max-w-[170px]">{tx.vendorName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tx.vendorCpcbId}</div>
                        <div className="text-[9px] text-slate-500 font-mono">{tx.statePcb}</div>
                      </td>

                      {/* COLLECTOR (SELLER) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-teal-400" />
                          <span>{tx.collectorName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tx.collectorPhone}</div>
                        <div className="text-[9px] text-slate-500">{tx.collectorWard}</div>
                      </td>

                      {/* WEIGHT */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-400">
                          {tx.weighbridgeWeightKg ? `${tx.weighbridgeWeightKg} kg` : `${tx.declaredWeightKg} kg`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {tx.weighbridgeWeightKg ? 'Weighbridge Net' : 'Declared Est.'}
                        </div>
                      </td>

                      {/* RATE PER KG */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-white">₹{tx.ratePerKg} / kg</div>
                        <div className="text-[10px] text-slate-400 font-mono">CPCB Schedule Base</div>
                      </td>

                      {/* TOTAL AMOUNT */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-black text-amber-400 text-sm">
                          ₹{tx.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{tx.paymentMode} Disbursed</div>
                      </td>

                      {/* STATUS & COMPLIANCE */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block w-fit ${
                              tx.paymentStatus === 'settled'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : tx.paymentStatus === 'flagged'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : tx.paymentStatus === 'rejected'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {tx.paymentStatus.toUpperCase()}
                          </span>

                          {tx.anomalyFlag && (
                            <span className="text-[9px] text-rose-400 font-sans flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Anomaly Alert
                            </span>
                          )}

                          {tx.eprCertificateNo && (
                            <span className="text-[9px] text-emerald-400 font-mono">
                              EPR Verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectingTxn(tx)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold font-mono transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Inspect digital manifest and statutory audit trail"
                        >
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>Audit Trail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSACTION INSPECTION AUDIT TRAIL MODAL */}
      {inspectingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Official CPCB Transaction Manifest & Audit Dossier
                  </h3>
                  <div className="text-xs font-mono text-slate-400">
                    ID: {inspectingTxn.id} • Lot: {inspectingTxn.lotId}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTxn(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <div className="text-slate-500 uppercase text-[10px]">Settlement UTR</div>
                  <div className="text-emerald-400 font-bold break-all">{inspectingTxn.settlementUtr}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase text-[10px]">Payment Timestamp</div>
                  <div className="text-slate-200">{inspectingTxn.timestamp}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase text-[10px]">Buyer Facility</div>
                  <div className="text-white font-bold">{inspectingTxn.vendorName}</div>
                  <div className="text-slate-400 text-[10px]">{inspectingTxn.vendorCpcbId}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase text-[10px]">Seller Collector</div>
                  <div className="text-white font-bold">{inspectingTxn.collectorName}</div>
                  <div className="text-slate-400 text-[10px]">{inspectingTxn.collectorPhone}</div>
                </div>
              </div>

              {/* Material & Financials */}
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Material Grade:</span>
                  <span className="font-bold text-white">{inspectingTxn.materialName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Verified Weighbridge Mass:</span>
                  <span className="font-bold text-emerald-400">{inspectingTxn.weighbridgeWeightKg || inspectingTxn.declaredWeightKg} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">CPCB Mandi Unit Rate:</span>
                  <span className="font-bold text-white">₹{inspectingTxn.ratePerKg} / kg</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-700 pt-2 text-sm">
                  <span className="text-slate-200 font-bold">Total Direct Payout:</span>
                  <span className="font-black text-amber-400">₹{inspectingTxn.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {inspectingTxn.anomalyFlag && (
                <div className="bg-rose-950/40 border border-rose-800 p-3 rounded-xl text-rose-300 text-xs">
                  <div className="font-bold flex items-center gap-1 text-rose-400 mb-1">
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Open Price Fluctuation Graph</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingTxn(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOT PRICE CHANGE GRAPH MODAL */}
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
