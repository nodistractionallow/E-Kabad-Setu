import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { EWasteLot, MaterialItem } from '../types';
import { playFeedbackChime } from '../utils/speech';
import { TablePagination } from './TablePagination';
import { 
  Factory, 
  ShieldCheck, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  LogOut, 
  QrCode, 
  Printer, 
  Download, 
  Sparkles, 
  Filter, 
  X, 
  BarChart3, 
  Zap, 
  Check, 
  Sliders, 
  Cpu, 
  Layers,
  Users,
  User,
  Search,
  ArrowUpDown,
  Tag,
  FolderCheck,
  Building2,
  Calendar,
  ShieldAlert,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Ban,
  Eye,
  Info,
  Plus
} from 'lucide-react';

export const RecyclerErpDashboard: React.FC = () => {
  const { 
    recycler, 
    lots, 
    materials, 
    addCustomMaterial,
    approveAndPayLot, 
    rejectLot, 
    reopenLot, 
    updateMaterialPrice, 
    setCurrentView, 
    speak 
  } = useApp();

  // Active ERP Tab (Economics, Datasets, Research moved strictly to Government Portal)
  const [activeTab, setActiveTab] = useState<'weighbridge' | 'vendors' | 'pricing' | 'fraud' | 'epr'>('weighbridge');

  // Custom Category Creation Modal State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPrice, setNewCatPrice] = useState<number>(120);
  const [newCatHazard, setNewCatHazard] = useState<'safe' | 'medium' | 'high'>('safe');
  const [newCatGrade, setNewCatGrade] = useState('Grade A / Industrial');

  // Custom Vendor Registration Modal State
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorUpi, setNewVendorUpi] = useState('');
  const [newVendorTier, setNewVendorTier] = useState<'Standard Partner' | 'Silver Partner' | 'Gold Partner'>('Standard Partner');
  const [customRegisteredVendors, setCustomRegisteredVendors] = useState<Array<{
    id: string;
    name: string;
    phone: string;
    tier: string;
    upiId?: string;
  }>>([]);

  // Live Gemini AI Anomaly State
  const [analyzingLotId, setAnalyzingLotId] = useState<string | null>(null);
  const [liveAnomalyResults, setLiveAnomalyResults] = useState<Record<string, {
    isAnomaly: boolean;
    anomalyScore: number;
    anomalyReason: string;
    riskCategory: string;
    suggestedAction: string;
    auditNote: string;
  }>>({});

  const handleRunLiveGeminiAudit = async (lot: EWasteLot) => {
    setAnalyzingLotId(lot.id);
    playFeedbackChime('beep');
    try {
      const res = await fetch('/api/ai/anomaly-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotId: lot.id,
          category: lot.category,
          weightKg: lot.weightKg,
          ratePerKg: lot.ratePerKg,
          collectorTier: 'Silver',
          photoUrl: lot.photoUrl
        })
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setLiveAnomalyResults((prev) => ({
          ...prev,
          [lot.id]: resData.data
        }));
        speak(`Gemini AI audit complete for ${lot.id}. Risk score ${resData.data.anomalyScore} percent.`);
      }
    } catch (err) {
      console.error('Anomaly audit error:', err);
    } finally {
      setAnalyzingLotId(null);
    }
  };

  // Weighbridge Verification Modal State
  const [verifyingLot, setVerifyingLot] = useState<EWasteLot | null>(null);
  const [weighbridgeInput, setWeighbridgeInput] = useState<number>(0);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'UPI' | 'CASH'>('UPI');
  
  // Tab 1: Pending vs Paid Tab State
  const [inboundTab, setInboundTab] = useState<'pending' | 'paid'>('pending');

  // Tab 1 (Pending Table): Search, Category Filter, Sorting, Pagination
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingCategory, setPendingCategory] = useState<string>('ALL');
  const [pendingSort, setPendingSort] = useState<'date_desc' | 'date_asc' | 'mass_desc' | 'mass_asc' | 'rate_desc' | 'amount_desc'>('date_desc');
  const [pendingPage, setPendingPage] = useState(1);

  // Tab 1 (Paid Table): Search, Category Filter, Sorting, Pagination
  const [paidSearch, setPaidSearch] = useState('');
  const [paidCategory, setPaidCategory] = useState<string>('ALL');
  const [paidSort, setPaidSort] = useState<'date_desc' | 'date_asc' | 'mass_desc' | 'mass_asc' | 'amount_desc'>('date_desc');
  const [paidPage, setPaidPage] = useState(1);

  // Tab 2 (Collector Partners Overview Table): Search, Sorting, Pagination
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorSort, setVendorSort] = useState<'mass_desc' | 'mass_asc' | 'lots_desc' | 'name_asc'>('mass_desc');
  const [vendorPage, setVendorPage] = useState(1);

  // Tab 2 (Selected Vendor Specific Folder / Ledger): Filter by Paid/Pending/All, Category, Search, Sorting, Pagination
  const [selectedVendorId, setSelectedVendorId] = useState<string>('KBD-MH-4402');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<'paid' | 'pending' | 'all'>('paid');
  const [selectedVendorCategory, setSelectedVendorCategory] = useState<string>('ALL');
  const [selectedVendorSearch, setSelectedVendorSearch] = useState('');
  const [selectedVendorSort, setSelectedVendorSort] = useState<'date_desc' | 'date_asc' | 'mass_desc' | 'mass_asc' | 'amount_desc'>('date_desc');
  const [selectedVendorPage, setSelectedVendorPage] = useState(1);

  // Tab 4 (AI Anomaly & Anti-Fraud Inspection): Sub-tab for Flagged vs Rejected
  const [anomalySubTab, setAnomalySubTab] = useState<'flagged' | 'rejected'>('flagged');

  // Tab 4 Sub-Tab A (Flagged Anomaly Table): Search, Category, Sorting, Pagination, Expanded Row
  const [anomalySearch, setAnomalySearch] = useState('');
  const [anomalyCategory, setAnomalyCategory] = useState<string>('ALL');
  const [anomalySort, setAnomalySort] = useState<'risk_desc' | 'date_desc' | 'date_asc' | 'mass_desc' | 'amount_desc'>('risk_desc');
  const [anomalyPage, setAnomalyPage] = useState(1);
  const [expandedAnomalyLotId, setExpandedAnomalyLotId] = useState<string | null>(null);

  // Tab 4 Sub-Tab B (Rejected & Quarantined Lots Table): Search, Category, Sorting, Pagination
  const [rejectedSearch, setRejectedSearch] = useState('');
  const [rejectedCategory, setRejectedCategory] = useState<string>('ALL');
  const [rejectedSort, setRejectedSort] = useState<'date_desc' | 'date_asc' | 'mass_desc' | 'amount_desc'>('date_desc');
  const [rejectedPage, setRejectedPage] = useState(1);
  const [selectedIncidentReportLot, setSelectedIncidentReportLot] = useState<EWasteLot | null>(null);

  // Tab 5 (EPR Inbound Batches Table): Search, Sorting, Pagination
  const [eprSearch, setEprSearch] = useState('');
  const [eprSort, setEprSort] = useState<'date_desc' | 'mass_desc' | 'amount_desc'>('date_desc');
  const [eprPage, setEprPage] = useState(1);

  // Price publisher local edits
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [priceSuccessToast, setPriceSuccessToast] = useState(false);

  // EPR Certificate Modal State
  const [generatedEprCert, setGeneratedEprCert] = useState<{
    certId: string;
    date: string;
    totalMassTons: number;
    copperKg: number;
    lithiumKg: number;
    cobaltKg: number;
    goldGrams: number;
  } | null>(null);

  const pendingLots = lots.filter((l) => l.status === 'pending');
  const flaggedAnomalyLots = lots.filter((l) => l.status !== 'rejected' && (l.anomalyFlag || l.ratePerKg > 900 || (l.category === 'pcb' && l.weightKg > 50)));
  const rejectedLots = lots.filter((l) => l.status === 'rejected');
  const verifiedLots = lots.filter((l) => l.status === 'paid' || l.status === 'verified');

  // Tally Recovered CRM Elements
  const totalProcessedKg = verifiedLots.reduce((acc, l) => acc + (l.weighbridgeWeightKg || l.weightKg), 0);
  const copperTallyKg = Math.round(totalProcessedKg * 0.42);
  const lithiumTallyKg = Math.round(totalProcessedKg * 0.048);
  const cobaltTallyKg = Math.round(totalProcessedKg * 0.032);
  const neodymiumTallyKg = Math.round(totalProcessedKg * 0.015);
  const goldTallyGrams = Math.round((totalProcessedKg / 1000) * 12.4);

  const PAGE_SIZE = 10;

  // 1. Pending Queue Table Filtering, Sorting & Pagination
  const filteredPendingLots = useMemo(() => {
    return pendingLots.filter((lot) => {
      const matchSearch = pendingSearch === '' || 
        lot.id.toLowerCase().includes(pendingSearch.toLowerCase()) ||
        lot.collectorName.toLowerCase().includes(pendingSearch.toLowerCase()) ||
        lot.collectorId.toLowerCase().includes(pendingSearch.toLowerCase()) ||
        lot.materialName.toLowerCase().includes(pendingSearch.toLowerCase());
      const matchCat = pendingCategory === 'ALL' || lot.category.toLowerCase() === pendingCategory.toLowerCase();
      return matchSearch && matchCat;
    }).sort((a, b) => {
      if (pendingSort === 'date_desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (pendingSort === 'date_asc') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (pendingSort === 'mass_desc') return b.weightKg - a.weightKg;
      if (pendingSort === 'mass_asc') return a.weightKg - b.weightKg;
      if (pendingSort === 'rate_desc') return b.ratePerKg - a.ratePerKg;
      if (pendingSort === 'amount_desc') return b.totalAmount - a.totalAmount;
      return 0;
    });
  }, [pendingLots, pendingSearch, pendingCategory, pendingSort]);

  const pendingTotalPages = Math.max(1, Math.ceil(filteredPendingLots.length / PAGE_SIZE));
  const paginatedPendingLots = useMemo(() => {
    const start = (pendingPage - 1) * PAGE_SIZE;
    return filteredPendingLots.slice(start, start + PAGE_SIZE);
  }, [filteredPendingLots, pendingPage]);

  // 2. Verified & Paid Table Filtering, Sorting & Pagination
  const filteredPaidLots = useMemo(() => {
    return verifiedLots.filter((lot) => {
      const matchSearch = paidSearch === '' ||
        lot.id.toLowerCase().includes(paidSearch.toLowerCase()) ||
        lot.collectorName.toLowerCase().includes(paidSearch.toLowerCase()) ||
        lot.collectorId.toLowerCase().includes(paidSearch.toLowerCase()) ||
        lot.materialName.toLowerCase().includes(paidSearch.toLowerCase()) ||
        (lot.paymentMode && lot.paymentMode.toLowerCase().includes(paidSearch.toLowerCase()));
      const matchCat = paidCategory === 'ALL' || lot.category.toLowerCase() === paidCategory.toLowerCase();
      return matchSearch && matchCat;
    }).sort((a, b) => {
      if (paidSort === 'date_desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (paidSort === 'date_asc') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      const massA = a.weighbridgeWeightKg || a.weightKg;
      const massB = b.weighbridgeWeightKg || b.weightKg;
      if (paidSort === 'mass_desc') return massB - massA;
      if (paidSort === 'mass_asc') return massA - massB;
      const payA = a.finalPayoutAmount || a.totalAmount;
      const payB = b.finalPayoutAmount || b.totalAmount;
      if (paidSort === 'amount_desc') return payB - payA;
      return 0;
    });
  }, [verifiedLots, paidSearch, paidCategory, paidSort]);

  const paidTotalPages = Math.max(1, Math.ceil(filteredPaidLots.length / PAGE_SIZE));
  const paginatedPaidLots = useMemo(() => {
    const start = (paidPage - 1) * PAGE_SIZE;
    return filteredPaidLots.slice(start, start + PAGE_SIZE);
  }, [filteredPaidLots, paidPage]);

  // 3. Collector Partners Table (Grouped unique collectors)
  const uniqueCollectors = useMemo(() => {
    const ids = Array.from(new Set(lots.map(l => l.collectorId)));
    const baseList = ids.map(id => {
      const cLots = lots.filter(l => l.collectorId === id);
      const totalMass = cLots.reduce((sum, l) => sum + (l.weighbridgeWeightKg || l.weightKg), 0);
      const totalPaid = cLots.filter(l => l.status === 'paid').reduce((sum, l) => sum + (l.finalPayoutAmount || l.totalAmount), 0);
      const sample = cLots[0];
      return {
        id,
        name: sample?.collectorName || id,
        phone: sample?.collectorPhone || '',
        tier: id === 'KBD-MH-4402' ? 'Gold Partner' : 'Standard Partner',
        totalLots: cLots.length,
        totalMass,
        totalPaid,
        cLots
      };
    });

    // Merge any custom registered vendors that haven't deposited lots yet
    customRegisteredVendors.forEach(cv => {
      if (!baseList.some(v => v.id === cv.id)) {
        baseList.push({
          id: cv.id,
          name: cv.name,
          phone: cv.phone,
          tier: cv.tier,
          totalLots: 0,
          totalMass: 0,
          totalPaid: 0,
          cLots: []
        });
      }
    });

    return baseList;
  }, [lots, customRegisteredVendors]);

  const filteredVendors = useMemo(() => {
    return uniqueCollectors.filter(v => {
      if (!vendorSearch) return true;
      const q = vendorSearch.toLowerCase();
      return v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q) || v.phone.toLowerCase().includes(q);
    }).sort((a, b) => {
      if (vendorSort === 'mass_desc') return b.totalMass - a.totalMass;
      if (vendorSort === 'mass_asc') return a.totalMass - b.totalMass;
      if (vendorSort === 'lots_desc') return b.totalLots - a.totalLots;
      if (vendorSort === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [uniqueCollectors, vendorSearch, vendorSort]);

  const vendorTotalPages = Math.max(1, Math.ceil(filteredVendors.length / PAGE_SIZE));
  const paginatedVendors = useMemo(() => {
    const start = (vendorPage - 1) * PAGE_SIZE;
    return filteredVendors.slice(start, start + PAGE_SIZE);
  }, [filteredVendors, vendorPage]);

  // 4. Selected Vendor Ledger (Filtered by Paid, Pending, or All + Search + Category + Sort + Pagination)
  const selectedVendorRawLots = useMemo(() => {
    return lots.filter(l => l.collectorId === selectedVendorId);
  }, [lots, selectedVendorId]);

  const selectedVendorPaidLots = useMemo(() => {
    return selectedVendorRawLots.filter(l => l.status === 'paid' || l.status === 'verified');
  }, [selectedVendorRawLots]);

  const selectedVendorPendingLots = useMemo(() => {
    return selectedVendorRawLots.filter(l => l.status === 'pending');
  }, [selectedVendorRawLots]);

  const filteredSelectedVendorLots = useMemo(() => {
    let list = selectedVendorRawLots;
    if (selectedVendorFilter === 'paid') list = selectedVendorPaidLots;
    if (selectedVendorFilter === 'pending') list = selectedVendorPendingLots;

    return list.filter((lot) => {
      const matchSearch = selectedVendorSearch === '' ||
        lot.id.toLowerCase().includes(selectedVendorSearch.toLowerCase()) ||
        lot.materialName.toLowerCase().includes(selectedVendorSearch.toLowerCase()) ||
        lot.timestamp.toLowerCase().includes(selectedVendorSearch.toLowerCase());
      const matchCat = selectedVendorCategory === 'ALL' || lot.category.toLowerCase() === selectedVendorCategory.toLowerCase();
      return matchSearch && matchCat;
    }).sort((a, b) => {
      if (selectedVendorSort === 'date_desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (selectedVendorSort === 'date_asc') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      const massA = a.weighbridgeWeightKg || a.weightKg;
      const massB = b.weighbridgeWeightKg || b.weightKg;
      if (selectedVendorSort === 'mass_desc') return massB - massA;
      if (selectedVendorSort === 'mass_asc') return massA - massB;
      const payA = a.finalPayoutAmount || a.totalAmount;
      const payB = b.finalPayoutAmount || b.totalAmount;
      if (selectedVendorSort === 'amount_desc') return payB - payA;
      return 0;
    });
  }, [selectedVendorRawLots, selectedVendorPaidLots, selectedVendorPendingLots, selectedVendorFilter, selectedVendorSearch, selectedVendorCategory, selectedVendorSort]);

  const selectedVendorTotalPages = Math.max(1, Math.ceil(filteredSelectedVendorLots.length / PAGE_SIZE));
  const paginatedSelectedVendorLots = useMemo(() => {
    const start = (selectedVendorPage - 1) * PAGE_SIZE;
    return filteredSelectedVendorLots.slice(start, start + PAGE_SIZE);
  }, [filteredSelectedVendorLots, selectedVendorPage]);

  // 5. Flagged Anomaly Table Filtering, Sorting & Pagination
  const filteredAnomalyLots = useMemo(() => {
    return flaggedAnomalyLots.filter((lot) => {
      const matchSearch = anomalySearch === '' ||
        lot.id.toLowerCase().includes(anomalySearch.toLowerCase()) ||
        lot.collectorName.toLowerCase().includes(anomalySearch.toLowerCase()) ||
        lot.collectorId.toLowerCase().includes(anomalySearch.toLowerCase()) ||
        lot.materialName.toLowerCase().includes(anomalySearch.toLowerCase()) ||
        (lot.anomalyReason && lot.anomalyReason.toLowerCase().includes(anomalySearch.toLowerCase()));
      const matchCat = anomalyCategory === 'ALL' || lot.category.toLowerCase() === anomalyCategory.toLowerCase();
      return matchSearch && matchCat;
    }).sort((a, b) => {
      if (anomalySort === 'risk_desc') {
        const scoreA = liveAnomalyResults[a.id]?.anomalyScore ?? (a.anomalyFlag ? 88 : 60);
        const scoreB = liveAnomalyResults[b.id]?.anomalyScore ?? (b.anomalyFlag ? 88 : 60);
        return scoreB - scoreA;
      }
      if (anomalySort === 'date_desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (anomalySort === 'date_asc') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (anomalySort === 'mass_desc') return b.weightKg - a.weightKg;
      if (anomalySort === 'amount_desc') return b.totalAmount - a.totalAmount;
      return 0;
    });
  }, [flaggedAnomalyLots, anomalySearch, anomalyCategory, anomalySort, liveAnomalyResults]);

  const anomalyTotalPages = Math.max(1, Math.ceil(filteredAnomalyLots.length / PAGE_SIZE));
  const paginatedAnomalyLots = useMemo(() => {
    const start = (anomalyPage - 1) * PAGE_SIZE;
    return filteredAnomalyLots.slice(start, start + PAGE_SIZE);
  }, [filteredAnomalyLots, anomalyPage]);

  // 5B. Rejected & Quarantined Table Filtering, Sorting & Pagination
  const filteredRejectedLots = useMemo(() => {
    return rejectedLots.filter((lot) => {
      const matchSearch = rejectedSearch === '' ||
        lot.id.toLowerCase().includes(rejectedSearch.toLowerCase()) ||
        lot.collectorName.toLowerCase().includes(rejectedSearch.toLowerCase()) ||
        lot.collectorId.toLowerCase().includes(rejectedSearch.toLowerCase()) ||
        lot.materialName.toLowerCase().includes(rejectedSearch.toLowerCase()) ||
        (lot.anomalyReason && lot.anomalyReason.toLowerCase().includes(rejectedSearch.toLowerCase()));
      const matchCat = rejectedCategory === 'ALL' || lot.category.toLowerCase() === rejectedCategory.toLowerCase();
      return matchSearch && matchCat;
    }).sort((a, b) => {
      if (rejectedSort === 'date_desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (rejectedSort === 'date_asc') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (rejectedSort === 'mass_desc') return b.weightKg - a.weightKg;
      if (rejectedSort === 'amount_desc') return b.totalAmount - a.totalAmount;
      return 0;
    });
  }, [rejectedLots, rejectedSearch, rejectedCategory, rejectedSort]);

  const rejectedTotalPages = Math.max(1, Math.ceil(filteredRejectedLots.length / PAGE_SIZE));
  const paginatedRejectedLots = useMemo(() => {
    const start = (rejectedPage - 1) * PAGE_SIZE;
    return filteredRejectedLots.slice(start, start + PAGE_SIZE);
  }, [filteredRejectedLots, rejectedPage]);

  // 6. EPR Inbound Batches Table Filtering, Sorting & Pagination
  const filteredEprLots = useMemo(() => {
    return verifiedLots.filter((lot) => {
      if (!eprSearch) return true;
      const q = eprSearch.toLowerCase();
      return lot.id.toLowerCase().includes(q) ||
        lot.collectorName.toLowerCase().includes(q) ||
        lot.category.toLowerCase().includes(q) ||
        lot.materialName.toLowerCase().includes(q);
    }).sort((a, b) => {
      if (eprSort === 'date_desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      const massA = a.weighbridgeWeightKg || a.weightKg;
      const massB = b.weighbridgeWeightKg || b.weightKg;
      if (eprSort === 'mass_desc') return massB - massA;
      const payA = a.finalPayoutAmount || a.totalAmount;
      const payB = b.finalPayoutAmount || b.totalAmount;
      if (eprSort === 'amount_desc') return payB - payA;
      return 0;
    });
  }, [verifiedLots, eprSearch, eprSort]);

  const eprTotalPages = Math.max(1, Math.ceil(filteredEprLots.length / PAGE_SIZE));
  const paginatedEprLots = useMemo(() => {
    const start = (eprPage - 1) * PAGE_SIZE;
    return filteredEprLots.slice(start, start + PAGE_SIZE);
  }, [filteredEprLots, eprPage]);

  const openWeighbridgeModal = (lot: EWasteLot) => {
    playFeedbackChime('beep');
    setVerifyingLot(lot);
    // Default weighbridge mass within 0.1kg tolerance
    setWeighbridgeInput(lot.weightKg);
  };

  const handleApproveLot = () => {
    if (!verifyingLot) return;
    approveAndPayLot(verifyingLot.id, weighbridgeInput, selectedPaymentMode);
    setVerifyingLot(null);
    speak(`Lot ${verifyingLot.id} verified at weighbridge. Payment released via ${selectedPaymentMode}.`);
  };

  const handlePublishPrices = () => {
    Object.entries(editedPrices).forEach(([matId, newRate]) => {
      const rateNum = Number(newRate);
      if (rateNum > 0) {
        updateMaterialPrice(matId, rateNum);
      }
    });
    setPriceSuccessToast(true);
    speak('New buying prices published to local scrap mandi board.');
    setTimeout(() => setPriceSuccessToast(false), 4000);
  };

  const handleGenerateEprCert = () => {
    playFeedbackChime('success');
    const certNumber = `CPCB/EPR-CREDIT/MH-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toLocaleDateString('en-GB');
    setGeneratedEprCert({
      certId: certNumber,
      date: now,
      totalMassTons: Number(((totalProcessedKg + 42800) / 1000).toFixed(2)),
      copperKg: copperTallyKg + 18200,
      lithiumKg: lithiumTallyKg + 2100,
      cobaltKg: cobaltTallyKg + 1400,
      goldGrams: goldTallyGrams + 450
    });
    speak('Official CPCB EPR Compliance Certificate generated.');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Enterprise Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  {recycler.name}
                </h1>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                  {recycler.cpcbId}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                <span>MIDC Bhosari Hub #4</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">Class-III Calibrated Weighbridge</span>
                <span>•</span>
                <span className="text-slate-400">{recycler.statePcb}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-right hidden lg:block shadow-xs">
              <div className="text-[10px] text-slate-500 font-mono uppercase">EPR Annual Progress</div>
              <div className="text-xs font-bold font-mono text-emerald-800">
                {recycler.processedThisMonthTons} / {recycler.monthlyQuotaTons} MT ({Math.round((recycler.processedThisMonthTons / recycler.monthlyQuotaTons) * 100)}%)
              </div>
            </div>

            {/* Restricted Tools Moved to Government Portal; Direct link provided */}
            <button
              type="button"
              onClick={() => {
                playFeedbackChime('beep');
                setCurrentView('government');
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Access Government & CPCB Regulatory Research Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Govt / CPCB Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playFeedbackChime('beep');
                setCurrentView('gateway');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>लॉगआउट</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main ERP Navigation Tabs */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-200 px-6 sticky top-[65px] z-20">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-2">
          {[
            { id: 'weighbridge', label: '1. Inbound Weighbridge Queue', count: pendingLots.length, icon: Scale },
            { id: 'vendors', label: '2. Collector Partners', count: Array.from(new Set(lots.map(l => l.collectorId))).length, icon: Users },
            { id: 'pricing', label: '3. Daily Mandi Rate Publisher', icon: DollarSign },
            { id: 'fraud', label: '4. AI Anomaly Engine', count: flaggedAnomalyLots.length, icon: AlertTriangle, isAlert: flaggedAnomalyLots.length > 0 },
            { id: 'epr', label: '5. Mass Ledger & EPR', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playFeedbackChime('beep');
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    tab.isAlert
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ERP Content Area */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">

        {/* TAB 1: INBOUND WEIGHBRIDGE QUEUE */}
        {activeTab === 'weighbridge' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  <span>Inbound Scrap Lot Verification & Weighbridge Clearance</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time queue of traceable lots arriving from registered informal collectors. Verify mass against digital declaration.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Live Sensor Stream Active
                </span>
              </div>
            </div>

            {/* Sub-tabs for Inbound Queue vs Paid Lots */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setInboundTab('pending');
                    setPendingPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${inboundTab === 'pending' ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Pending Queue ({pendingLots.length})
                  </span>
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setInboundTab('paid');
                    setPaidPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${inboundTab === 'paid' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Verified & Paid ({verifiedLots.length})
                  </span>
                </button>
              </div>

              {/* Table Controls (Search & Sort) */}
              {inboundTab === 'pending' ? (
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search lot, vendor, item..."
                      value={pendingSearch}
                      onChange={(e) => {
                        setPendingSearch(e.target.value);
                        setPendingPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <select
                      value={pendingSort}
                      onChange={(e) => {
                        setPendingSort(e.target.value as typeof pendingSort);
                        setPendingPage(1);
                      }}
                      aria-label="Sort pending queue"
                      className="bg-transparent font-medium text-slate-700 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="date_desc">Newest Date</option>
                      <option value="date_asc">Oldest Date</option>
                      <option value="mass_desc">Weight: High → Low</option>
                      <option value="mass_asc">Weight: Low → High</option>
                      <option value="rate_desc">Rate: High → Low</option>
                      <option value="amount_desc">Valuation: High → Low</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search paid lot, vendor..."
                      value={paidSearch}
                      onChange={(e) => {
                        setPaidSearch(e.target.value);
                        setPaidPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <select
                      value={paidSort}
                      onChange={(e) => {
                        setPaidSort(e.target.value as typeof paidSort);
                        setPaidPage(1);
                      }}
                      aria-label="Sort paid lots"
                      className="bg-transparent font-medium text-slate-700 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="date_desc">Newest Date</option>
                      <option value="date_asc">Oldest Date</option>
                      <option value="mass_desc">Weight: High → Low</option>
                      <option value="mass_asc">Weight: Low → High</option>
                      <option value="amount_desc">Paid Out: High → Low</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3" /> Category:
              </span>
              {['ALL', 'pcb', 'copper', 'battery', 'crt', 'plastic', 'magnet'].map((cat) => {
                const currentCat = inboundTab === 'pending' ? pendingCategory : paidCategory;
                const isSelected = currentCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (inboundTab === 'pending') {
                        setPendingCategory(cat);
                        setPendingPage(1);
                      } else {
                        setPaidCategory(cat);
                        setPaidPage(1);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-slate-900 text-emerald-400 shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Pending Lots */}
            {inboundTab === 'pending' && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs mb-6 animate-fadeIn">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-mono uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Lot ID & Time</th>
                        <th className="py-3 px-4">Collector (Vendor)</th>
                        <th className="py-3 px-4">Scrap Category</th>
                        <th className="py-3 px-4">Field Mass</th>
                        <th className="py-3 px-4">Unit Rate</th>
                        <th className="py-3 px-4">Valuation</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {paginatedPendingLots.length === 0 ? (
                        <tr><td colSpan={7} className="py-8 text-center text-slate-500 font-sans">No pending lots found matching your filter criteria.</td></tr>
                      ) : paginatedPendingLots.map((lot) => (
                        <tr key={lot.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{lot.id}</span>
                              {lot.anomalyFlag && (
                                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1 rounded-md">
                                  Anomaly
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{lot.timestamp}</div>
                          </td>

                          <td className="py-3.5 px-4 font-sans">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900">
                              <span className="font-semibold text-xs">{lot.collectorName}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-1">{lot.collectorId}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-sans font-medium mb-1 truncate max-w-[150px]" title={lot.materialName}>{lot.materialName}</div>
                            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                              {lot.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 text-sm">{lot.weightKg} kg</span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            ₹{lot.ratePerKg}/kg
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-amber-700 text-sm">
                              ₹{lot.totalAmount}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openWeighbridgeModal(lot)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-transform active:scale-95 shadow-xs whitespace-nowrap"
                            >
                              Verify & Pay
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={pendingPage}
                  totalPages={pendingTotalPages}
                  totalItems={filteredPendingLots.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPendingPage}
                />
              </div>
            )}

            {/* Paid / Verified Lots */}
            {inboundTab === 'paid' && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-fadeIn">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-mono uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Lot ID & Time</th>
                        <th className="py-3 px-4">Collector (Vendor)</th>
                        <th className="py-3 px-4">Scrap Category</th>
                        <th className="py-3 px-4">Final Mass</th>
                        <th className="py-3 px-4">Unit Rate</th>
                        <th className="py-3 px-4">Paid Out</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {paginatedPaidLots.length === 0 ? (
                        <tr><td colSpan={7} className="py-8 text-center text-slate-500 font-sans">No completed lots found matching your filter criteria.</td></tr>
                      ) : paginatedPaidLots.map((lot) => (
                        <tr key={lot.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-600 flex items-center gap-1.5">
                              <span>{lot.id}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{lot.timestamp}</div>
                          </td>

                          <td className="py-3.5 px-4 font-sans">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50/50 border border-indigo-100/50 text-indigo-800">
                              <span className="font-semibold text-xs">{lot.collectorName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{lot.collectorId}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-600 font-sans font-medium mb-1 truncate max-w-[150px]" title={lot.materialName}>{lot.materialName}</div>
                            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                              {lot.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-emerald-800 text-sm">{lot.weighbridgeWeightKg || lot.weightKg} kg</span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500">
                            ₹{lot.ratePerKg}/kg
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-emerald-700 text-sm">
                              ₹{lot.finalPayoutAmount || lot.totalAmount}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono border border-emerald-200 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> {lot.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={paidPage}
                  totalPages={paidTotalPages}
                  totalItems={filteredPaidLots.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPaidPage}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VENDORS / COLLECTORS */}
        {activeTab === 'vendors' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>Collector Partners & KYC</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage registered last-mile informal collector partners. Select any vendor folder below to audit their specific paid or pending deposits.
                </p>
              </div>

              {/* Vendor List Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Register Partner / Vendor</span>
                </button>

                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search vendor name, ID..."
                    value={vendorSearch}
                    onChange={(e) => {
                      setVendorSearch(e.target.value);
                      setVendorPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  <select
                    value={vendorSort}
                    onChange={(e) => {
                      setVendorSort(e.target.value as typeof vendorSort);
                      setVendorPage(1);
                    }}
                    aria-label="Sort vendor partners"
                    className="bg-transparent font-medium text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="mass_desc">Deposited Mass: High → Low</option>
                    <option value="mass_asc">Deposited Mass: Low → High</option>
                    <option value="lots_desc">Total Lots: High → Low</option>
                    <option value="name_asc">Partner Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Registered Partners Table (10 per page) */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-mono uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Partner Profile & ID</th>
                      <th className="py-3 px-4">Safety Tier</th>
                      <th className="py-3 px-4">Total Lots</th>
                      <th className="py-3 px-4">Total E-Waste Deposited</th>
                      <th className="py-3 px-4">Total Payouts Released</th>
                      <th className="py-3 px-4 text-right">Folder Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {paginatedVendors.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-slate-500 font-sans">No vendor partners matching search query.</td></tr>
                    ) : paginatedVendors.map((vendor) => {
                      const isSelected = selectedVendorId === vendor.id;
                      return (
                        <tr 
                          key={vendor.id} 
                          onClick={() => {
                            setSelectedVendorId(vendor.id);
                            setSelectedVendorPage(1);
                          }}
                          className={`transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/90 border-l-4 border-indigo-600' : 'hover:bg-slate-50'}`}
                        >
                          <td className="py-3.5 px-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold overflow-hidden shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'}`}>
                              {vendor.id === 'KBD-MH-4402' ? (
                                <img src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80" alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                {vendor.name}
                                {vendor.id === 'KBD-MH-4402' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" title="KYC Verified" />}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{vendor.id} • {vendor.phone}</div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${vendor.id === 'KBD-MH-4402' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {vendor.id === 'KBD-MH-4402' ? 'Gold Partner' : 'Standard Partner'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            {vendor.totalLots} Lots
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-900">
                            {vendor.totalMass.toFixed(1)} kg
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            ₹{vendor.totalPaid.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVendorId(vendor.id);
                                setSelectedVendorPage(1);
                              }}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                              {isSelected ? 'Open Folder ✓' : 'View Folder'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={vendorPage}
                totalPages={vendorTotalPages}
                totalItems={filteredVendors.length}
                pageSize={PAGE_SIZE}
                onPageChange={setVendorPage}
              />
            </div>
            
            {/* SELECTED VENDOR DEDICATED FOLDER & AUDIT LEDGER */}
            <div className="bg-white border-2 border-indigo-200 rounded-3xl p-6 shadow-sm mt-8 animate-fadeIn">
              {/* Folder Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <FolderCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        Vendor Dedicated Folder
                      </span>
                      <span className="text-xs font-mono text-slate-400">ID: {selectedVendorId}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                      {lots.find(l => l.collectorId === selectedVendorId)?.collectorName || selectedVendorId}
                    </h3>
                  </div>
                </div>

                {/* Quick Stats for this Vendor */}
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 text-center">
                    <div className="text-[10px] text-indigo-600 font-mono uppercase font-semibold">Total Paid Lots</div>
                    <div className="text-sm font-bold text-indigo-900 font-mono">
                      {selectedVendorPaidLots.length}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-center">
                    <div className="text-[10px] text-amber-700 font-mono uppercase font-semibold">Pending Verification</div>
                    <div className="text-sm font-bold text-amber-900 font-mono">
                      {selectedVendorPendingLots.length}
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-center">
                    <div className="text-[10px] text-emerald-700 font-mono uppercase font-semibold">Total Paid Value</div>
                    <div className="text-sm font-bold text-emerald-900 font-mono">
                      ₹{selectedVendorPaidLots.reduce((sum, l) => sum + (l.finalPayoutAmount || l.totalAmount), 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Folder Filter Tabs: Paid Lots vs Pending Lots vs All */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-5 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVendorFilter('paid');
                      setSelectedVendorPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedVendorFilter === 'paid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Paid Lots ({selectedVendorPaidLots.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVendorFilter('pending');
                      setSelectedVendorPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedVendorFilter === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Pending Lots ({selectedVendorPendingLots.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVendorFilter('all');
                      setSelectedVendorPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedVendorFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>All Lots ({selectedVendorRawLots.length})</span>
                  </button>
                </div>

                {/* Search and Sort for Selected Vendor */}
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:w-52">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search lot, date, item..."
                      value={selectedVendorSearch}
                      onChange={(e) => {
                        setSelectedVendorSearch(e.target.value);
                        setSelectedVendorPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <select
                      value={selectedVendorSort}
                      onChange={(e) => {
                        setSelectedVendorSort(e.target.value as typeof selectedVendorSort);
                        setSelectedVendorPage(1);
                      }}
                      aria-label="Sort vendor table"
                      className="bg-transparent font-medium text-slate-700 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="date_desc">Newest Date</option>
                      <option value="date_asc">Oldest Date</option>
                      <option value="mass_desc">Mass: High → Low</option>
                      <option value="mass_asc">Mass: Low → High</option>
                      <option value="amount_desc">Payout: High → Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Selected Vendor Category Tags Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold flex items-center gap-1 mr-1">
                  <Tag className="w-3 h-3 text-indigo-500" /> Category:
                </span>
                {['ALL', 'pcb', 'copper', 'battery', 'crt', 'plastic', 'magnet'].map((cat) => {
                  const isSelected = selectedVendorCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedVendorCategory(cat);
                        setSelectedVendorPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors whitespace-nowrap ${
                        isSelected
                          ? 'bg-indigo-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              
              {/* The Dedicated Vendor Table (Strict 10 items per page limit) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-mono uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Transaction / Lot ID</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Material / Category</th>
                        <th className="py-3 px-4">Weighed Mass</th>
                        <th className="py-3 px-4">Unit Rate</th>
                        <th className="py-3 px-4">Final Payout</th>
                        <th className="py-3 px-4 text-right">Status & Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {paginatedSelectedVendorLots.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                            No {selectedVendorFilter} transactions found for this vendor matching your filter.
                          </td>
                        </tr>
                      ) : paginatedSelectedVendorLots.map(lot => (
                        <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-700 flex items-center gap-1.5">
                            <span>{lot.id}</span>
                            {lot.anomalyFlag && (
                              <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.5 rounded font-mono">
                                Flag
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-sans">{lot.timestamp}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-sans font-medium text-slate-900 mb-0.5 truncate max-w-[140px]">{lot.materialName}</div>
                            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                              {lot.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-900 font-bold text-sm">
                            {lot.weighbridgeWeightKg || lot.weightKg} kg
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            ₹{lot.ratePerKg}/kg
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-sm text-emerald-800">
                            ₹{lot.finalPayoutAmount || lot.totalAmount}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {lot.status === 'pending' ? (
                              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 uppercase inline-flex items-center gap-1">
                                <Scale className="w-3 h-3" /> In Queue
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> Paid ({lot.paymentMode || 'UPI'})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={selectedVendorPage}
                  totalPages={selectedVendorTotalPages}
                  totalItems={filteredSelectedVendorLots.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setSelectedVendorPage}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DAILY BUYING RATE PUBLISHER */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Facility Daily Mandi Buying Rate Publisher</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publish authoritative procurement rates per kilogram. Rates synchronize live to registered collectors' mobile application.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl border border-slate-300 shadow-xs flex items-center gap-1.5 transition-colors text-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>+ Add New Scrap Category</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublishPrices}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-2 transition-colors text-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Rates to Mandi Board</span>
                </button>
              </div>
            </div>

            {priceSuccessToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Rates published! Collectors in Pune Ward 1 to 24 will now see updated figures.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((mat) => {
                const currentPrice = editedPrices[mat.id] !== undefined ? editedPrices[mat.id] : mat.pricePerKg;

                return (
                  <div key={mat.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs hover:border-emerald-500 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{mat.name_en}</h4>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{mat.grade}</div>
                      </div>
                      <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                        {mat.trend > 0 ? `+${mat.trend}%` : `${mat.trend}%`}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1 font-semibold">
                        Procurement Rate (₹ / kg)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono text-emerald-700 font-bold">₹</span>
                        <input
                          type="number"
                          value={currentPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditedPrices((prev) => ({ ...prev, [mat.id]: val }));
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span>Benchmark Middlemen Rate:</span>
                        <span className="text-rose-500 line-through">₹{Math.round(mat.pricePerKg * 0.72)}/kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Direct Formal Benefit:</span>
                        <span className="text-emerald-700 font-bold">+28% to Collector</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AI ANOMALY & FRAUD DETECTION ENGINE */}
        {activeTab === 'fraud' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>AI Anomaly, Contamination & Fraud Detection Engine</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated heuristic flags for price spikes, abnormal mass ratios, burnt cable contamination, and hazardous tampering.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs">
                <div className="text-xs font-mono text-amber-800 font-bold uppercase">Price Deviation Flag</div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">&gt; 25% Above Cap</div>
                <p className="text-xs text-slate-500 mt-1">
                  Alerts if lot declaration exceeds maximum sanctioned mandi price benchmark.
                </p>
              </div>

              <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-xs">
                <div className="text-xs font-mono text-rose-700 font-bold uppercase">Open Cable Burning</div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">Soot & Char ML Filter</div>
                <p className="text-xs text-slate-500 mt-1">
                  Computer vision rejects cable lots with carbon soot residue from toxic open burning.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-xs font-mono text-slate-700 font-bold uppercase">Weight-to-Category Mismatch</div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">Physical Density Bounds</div>
                <p className="text-xs text-slate-500 mt-1">
                  Rejects mathematically impossible volumes (e.g. 50kg cell phone motherboards in single bag).
                </p>
              </div>
            </div>

            {/* Sub-tabs for Suspicious Lots Requiring Review vs Rejected Lots */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAnomalySubTab('flagged');
                    setAnomalyPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    anomalySubTab === 'flagged'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Suspicious Lots Requiring Review ({flaggedAnomalyLots.length})</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnomalySubTab('rejected');
                    setRejectedPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    anomalySubTab === 'rejected'
                      ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Rejected & Quarantined Lots ({rejectedLots.length})</span>
                  </span>
                </button>
              </div>

              {/* Table Search & Sorting Controls */}
              {anomalySubTab === 'flagged' ? (
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search lot, collector, risk..."
                      value={anomalySearch}
                      onChange={(e) => {
                        setAnomalySearch(e.target.value);
                        setAnomalyPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <select
                      value={anomalySort}
                      onChange={(e) => {
                        setAnomalySort(e.target.value as typeof anomalySort);
                        setAnomalyPage(1);
                      }}
                      aria-label="Sort anomaly lots"
                      className="bg-transparent font-medium text-slate-700 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="risk_desc">Anomaly Risk: High → Low</option>
                      <option value="date_desc">Newest First</option>
                      <option value="date_asc">Oldest First</option>
                      <option value="mass_desc">Mass: High → Low</option>
                      <option value="amount_desc">Declared Value: High → Low</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search rejected ID, reason, partner..."
                      value={rejectedSearch}
                      onChange={(e) => {
                        setRejectedSearch(e.target.value);
                        setRejectedPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <select
                      value={rejectedSort}
                      onChange={(e) => {
                        setRejectedSort(e.target.value as typeof rejectedSort);
                        setRejectedPage(1);
                      }}
                      aria-label="Sort rejected lots"
                      className="bg-transparent font-medium text-slate-700 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="date_desc">Rejection Date: Newest First</option>
                      <option value="date_asc">Rejection Date: Oldest First</option>
                      <option value="mass_desc">Disallowed Mass: High → Low</option>
                      <option value="amount_desc">Disallowed Value: High → Low</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3 text-xs">
              <span className="text-slate-400 font-mono text-[11px] mr-1">Category:</span>
              {['ALL', 'pcb', 'copper', 'battery', 'crt', 'plastic', 'magnet'].map((cat) => {
                const isSelected = anomalySubTab === 'flagged' ? anomalyCategory === cat : rejectedCategory === cat;
                const activeCount = anomalySubTab === 'flagged' 
                  ? (cat === 'ALL' ? flaggedAnomalyLots.length : flaggedAnomalyLots.filter(l => l.category.toLowerCase() === cat.toLowerCase()).length)
                  : (cat === 'ALL' ? rejectedLots.length : rejectedLots.filter(l => l.category.toLowerCase() === cat.toLowerCase()).length);

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (anomalySubTab === 'flagged') {
                        setAnomalyCategory(cat);
                        setAnomalyPage(1);
                      } else {
                        setRejectedCategory(cat);
                        setRejectedPage(1);
                      }
                    }}
                    className={`px-3 py-1 rounded-lg font-mono font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? anomalySubTab === 'flagged'
                          ? 'bg-amber-700 text-white shadow-2xs font-bold'
                          : 'bg-rose-700 text-white shadow-2xs font-bold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.toUpperCase()}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {activeCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SUB-TAB A: SUSPICIOUS LOTS REQUIRING REVIEW DATA TABLE */}
            {anomalySubTab === 'flagged' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-4">Lot ID & Arrival</th>
                          <th className="py-3 px-4">Field Scrap Photo & Item</th>
                          <th className="py-3 px-4">Collector Partner</th>
                          <th className="py-3 px-4 text-right">Declared Mass & Rate</th>
                          <th className="py-3 px-4">Anomaly Flag & Severity</th>
                          <th className="py-3 px-4 text-center">Review Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {paginatedAnomalyLots.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                              No suspicious lots matching search or filter criteria.
                            </td>
                          </tr>
                        ) : (
                          paginatedAnomalyLots.map((lot) => {
                            const liveResult = liveAnomalyResults[lot.id];
                            const isScanning = analyzingLotId === lot.id;
                            const isExpanded = expandedAnomalyLotId === lot.id || !!liveResult;

                            return (
                              <React.Fragment key={lot.id}>
                                <tr className="hover:bg-amber-50/30 transition-colors">
                                  {/* Lot ID & Telemetry */}
                                  <td className="py-3 px-4 font-mono">
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span>{lot.id}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{lot.timestamp}</div>
                                    <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                                      {lot.distanceKm} km • Bhosari Hub
                                    </div>
                                  </td>

                                  {/* Scrap Photo & Item */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={lot.photoUrl}
                                        alt={lot.materialName}
                                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                                      />
                                      <div>
                                        <div className="font-bold text-slate-900 line-clamp-1">{lot.materialName}</div>
                                        <div className="mt-1">
                                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                            {lot.category}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Collector Partner */}
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-slate-900">{lot.collectorName}</div>
                                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{lot.collectorId}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{lot.collectorPhone}</div>
                                  </td>

                                  {/* Declared Mass & Rate */}
                                  <td className="py-3 px-4 text-right font-mono">
                                    <div className="font-bold text-slate-900 text-sm">{lot.weightKg.toFixed(1)} kg</div>
                                    <div className="text-slate-500 text-[11px]">₹{lot.ratePerKg}/kg</div>
                                    <div className="text-amber-800 font-bold mt-0.5">₹{lot.totalAmount.toLocaleString()}</div>
                                  </td>

                                  {/* Anomaly Detection & Severity */}
                                  <td className="py-3 px-4 max-w-xs">
                                    <div className="mb-1">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border inline-flex items-center gap-1 ${
                                        liveResult
                                          ? liveResult.isAnomaly 
                                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-amber-50 text-amber-900 border-amber-300'
                                      }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${liveResult ? (liveResult.isAnomaly ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-amber-500'}`}></span>
                                        {liveResult
                                          ? `${liveResult.riskCategory.toUpperCase()} RISK (${liveResult.anomalyScore}%)`
                                          : '88% CRITICAL RISK'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-amber-900 font-sans leading-tight">
                                      {liveResult?.anomalyReason || lot.anomalyReason || 'Declared rate ₹950/kg exceeds sanctioned mandi price ceiling of ₹720/kg.'}
                                    </p>
                                  </td>

                                  {/* Review Actions */}
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col gap-1.5 items-center justify-center">
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleRunLiveGeminiAudit(lot)}
                                          disabled={isScanning}
                                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                                          title="Run Gemini AI Vision & Heuristic Audit"
                                        >
                                          <Sparkles className={`w-3.5 h-3.5 text-emerald-600 ${isScanning ? 'animate-spin' : ''}`} />
                                          <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Gemini AI'}</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => openWeighbridgeModal(lot)}
                                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs transition-colors flex items-center gap-1"
                                          title="Supervisor Clearance Weighbridge Override"
                                        >
                                          <Scale className="w-3.5 h-3.5 text-slate-600" />
                                          <span className="hidden sm:inline">Override</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const reason = liveResult?.suggestedAction || lot.anomalyReason || 'Lot rejected due to toxic contamination & rate deviation.';
                                            rejectLot(lot.id, reason);
                                            speak(`Lot ${lot.id} rejected and transferred to Quarantined Buffer.`);
                                          }}
                                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                                          title="Reject Lot and Transfer to Quarantined Buffer"
                                        >
                                          <Ban className="w-3.5 h-3.5 text-rose-600" />
                                          <span>Reject</span>
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setExpandedAnomalyLotId(expandedAnomalyLotId === lot.id ? null : lot.id)}
                                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono mt-0.5"
                                      >
                                        <span>{isExpanded ? 'Hide AI Details' : 'View AI Audit'}</span>
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* Expandable Detail Row for Gemini AI Multi-Factor Analysis */}
                                {isExpanded && (
                                  <tr className="bg-amber-50/20 border-b border-amber-200/60">
                                    <td colSpan={6} className="px-4 py-3">
                                      <div className="bg-white border border-emerald-200 rounded-xl p-3.5 text-xs font-mono space-y-1.5 text-slate-800 shadow-xs">
                                        <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                                          <Sparkles className="w-4 h-4 text-emerald-600" />
                                          <span>Gemini 3.8 Multi-Factor Audit Note & Sensor Cross-Validation:</span>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed font-sans">
                                          {liveResult?.auditNote || 'Spectrographic analysis indicates potential lead-tin solder alteration and price deviation above regional mandi caps. CPCB protocol stipulates mandatory supervisor quarantine or manual XRF test before disbursement.'}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                                          <div className="text-emerald-800 font-bold">
                                            Recommended CPCB Action: <span className="font-normal text-slate-700">{liveResult?.suggestedAction || 'Hold in quarantine; perform physical weighbridge tare audit.'}</span>
                                          </div>
                                          <div className="text-slate-400">
                                            Telemetry Hash: SHA256-ANOM-{lot.id.replace('LOT-', '')}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <TablePagination
                    currentPage={anomalyPage}
                    totalPages={anomalyTotalPages}
                    totalItems={filteredAnomalyLots.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setAnomalyPage}
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB B: REJECTED & QUARANTINED LOTS DATA TABLE */}
            {anomalySubTab === 'rejected' && (
              <div className="space-y-4">
                {/* Quarantine explanation banner */}
                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-900 font-mono uppercase">
                        CPCB & SPCB Statutory Quarantine Ledger
                      </div>
                      <p className="text-rose-700 mt-0.5">
                        These lots have been rejected and quarantined due to hazardous contamination, toxic open burning, illegal acid stripping, or fraudulent mass manipulation. Disallowed lots are held in custody for mandatory regulatory reporting.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono bg-rose-200/80 text-rose-900 px-3 py-1 rounded-full font-bold whitespace-nowrap">
                    {filteredRejectedLots.length} Quarantined
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-4">Quarantine Lot ID & Status</th>
                          <th className="py-3 px-4">Scrap Photo & Item</th>
                          <th className="py-3 px-4">Collector Partner</th>
                          <th className="py-3 px-4 text-right">Disallowed Mass & Value</th>
                          <th className="py-3 px-4">Regulatory Violation Reason</th>
                          <th className="py-3 px-4 text-center">Compliance Docket & Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {paginatedRejectedLots.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                              No rejected or quarantined lots matching criteria.
                            </td>
                          </tr>
                        ) : (
                          paginatedRejectedLots.map((lot) => (
                            <tr key={lot.id} className="hover:bg-rose-50/30 transition-colors">
                              {/* Quarantine ID & Status */}
                              <td className="py-3 px-4 font-mono">
                                <div className="mb-1">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                    QUARANTINED
                                  </span>
                                </div>
                                <div className="font-bold text-slate-900">{lot.id}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{lot.timestamp}</span>
                                </div>
                              </td>

                              {/* Scrap Item & Photo */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={lot.photoUrl}
                                    alt={lot.materialName}
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs grayscale-25"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900 line-clamp-1">{lot.materialName}</div>
                                    <div className="mt-1">
                                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                        {lot.category}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Collector Partner */}
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">{lot.collectorName}</div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{lot.collectorId}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{lot.collectorPhone}</div>
                              </td>

                              {/* Disallowed Mass & Value */}
                              <td className="py-3 px-4 text-right font-mono">
                                <div className="font-bold text-slate-900 text-sm">{lot.weightKg.toFixed(1)} kg</div>
                                <div className="text-slate-400 text-[11px]">Disallowed Rate: ₹{lot.ratePerKg}/kg</div>
                                <div className="text-rose-700 font-bold line-through mt-0.5">
                                  ₹{lot.totalAmount.toLocaleString()}
                                </div>
                              </td>

                              {/* Regulatory Violation Reason */}
                              <td className="py-3 px-4 max-w-xs">
                                <div className="flex items-start gap-1.5 text-rose-900 text-[11px] font-medium leading-tight">
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                  <span>
                                    {lot.anomalyReason || 'Statutory Non-Compliance: Toxic soot contamination and illegal pre-treatment identified.'}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 mt-1">
                                  Breach Code: SPCB-ENV-ACT-SEC14
                                </div>
                              </td>

                              {/* Regulatory Actions & Incident Docket */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col gap-1.5 items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedIncidentReportLot(lot)}
                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors w-full justify-center"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Quarantine Docket</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (reopenLot) {
                                        reopenLot(lot.id);
                                        speak(`Lot ${lot.id} restored to pending inspection queue.`);
                                      }
                                    }}
                                    className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-[11px] rounded-xl flex items-center gap-1 transition-colors w-full justify-center shadow-2xs"
                                    title="Restore lot back to pending review"
                                  >
                                    <RotateCcw className="w-3 h-3 text-slate-500" />
                                    <span>Supervisor Re-open</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <TablePagination
                    currentPage={rejectedPage}
                    totalPages={rejectedTotalPages}
                    totalItems={filteredRejectedLots.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setRejectedPage}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CRM MASS LEDGER & EPR CERTIFICATE */}
        {activeTab === 'epr' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Critical Raw Material (CRM) Mass Ledger & EPR Compliance</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time mass balance accounting of recovered critical minerals mandated by MoEFCC E-Waste Management Rules 2022.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateEprCert}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Generate Official CPCB Certificate</span>
              </button>
            </div>

            {/* CRM Elements Recovery Tally Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Copper (Cu 99%)</div>
                <div className="text-2xl font-black text-amber-600 font-mono mt-1">
                  {(copperTallyKg + 18200).toLocaleString('en-IN')} kg
                </div>
                <div className="text-[11px] text-emerald-700 font-mono mt-0.5 font-medium">Smelter Grade</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Lithium (Li)</div>
                <div className="text-2xl font-black text-cyan-600 font-mono mt-1">
                  {(lithiumTallyKg + 2100).toLocaleString('en-IN')} kg
                </div>
                <div className="text-[11px] text-cyan-700 font-mono mt-0.5 font-medium">Battery Carbonate</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Cobalt (Co)</div>
                <div className="text-2xl font-black text-indigo-600 font-mono mt-1">
                  {(cobaltTallyKg + 1400).toLocaleString('en-IN')} kg
                </div>
                <div className="text-[11px] text-indigo-700 font-mono mt-0.5 font-medium">High Purity</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Neodymium (NdFeB)</div>
                <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                  {(neodymiumTallyKg + 640).toLocaleString('en-IN')} kg
                </div>
                <div className="text-[11px] text-emerald-800 font-mono mt-0.5 font-medium">Rare-Earth Magnets</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 col-span-2 sm:col-span-1 shadow-xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Gold Trace (Au)</div>
                <div className="text-2xl font-black text-amber-500 font-mono mt-1">
                  {(goldTallyGrams + 450).toLocaleString('en-IN')} g
                </div>
                <div className="text-[11px] text-amber-700 font-mono mt-0.5 font-medium">Refinery 24K Equiv</div>
              </div>
            </div>

            {/* Mass Ledger Regulatory Mapping Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Statutory E-Waste Rules 2022 Schedule-III Traceability Matrix</span>
              </h3>
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">E-Waste Category</th>
                      <th className="py-2.5 px-3">CPCB Target Code</th>
                      <th className="py-2.5 px-3">Aggregated Mass</th>
                      <th className="py-2.5 px-3">Yield Efficiency</th>
                      <th className="py-2.5 px-3">EPR Credits Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">ITEW1 to ITEW16 (IT & Telecom)</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold">CPCB-SCH-1-IT</td>
                      <td className="py-2.5 px-3 text-slate-700">28.4 MT</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">96.4%</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">27.38 EPR-Tons</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">CEEW1 to CEEW5 (Consumer Electronics)</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold">CPCB-SCH-1-CE</td>
                      <td className="py-2.5 px-3 text-slate-700">14.4 MT</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">92.1%</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">13.26 EPR-Tons</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inbound Dispatched Batches Traceability Table (10 per page) */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Inbound Verified Batches for Statutory EPR Audit</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Individual weighbridge verified receipts eligible for state pollution board credit filing.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:w-52">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search lot, collector..."
                      value={eprSearch}
                      onChange={(e) => {
                        setEprSearch(e.target.value);
                        setEprPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <select
                      value={eprSort}
                      onChange={(e) => {
                        setEprSort(e.target.value as typeof eprSort);
                        setEprPage(1);
                      }}
                      aria-label="Sort EPR batches"
                      className="bg-transparent font-medium text-slate-700 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="date_desc">Newest First</option>
                      <option value="date_asc">Oldest First</option>
                      <option value="mass_desc">Mass: High → Low</option>
                      <option value="amount_desc">Value: High → Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Traceable Batch ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Partner Origin</th>
                      <th className="py-3 px-4">Material Category</th>
                      <th className="py-3 px-4">Verified Mass</th>
                      <th className="py-3 px-4 text-right">EPR Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedEprLots.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                          No verified batches found matching search.
                        </td>
                      </tr>
                    ) : paginatedEprLots.map(lot => (
                      <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800">{lot.id}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-sans">{lot.timestamp}</td>
                        <td className="py-3.5 px-4 font-sans">
                          <div className="font-semibold text-slate-800">{lot.collectorName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{lot.collectorId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">
                            {lot.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-800">
                          {lot.weighbridgeWeightKg || lot.weightKg} kg
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> CPCB Traceable
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <TablePagination
                currentPage={eprPage}
                totalPages={eprTotalPages}
                totalItems={filteredEprLots.length}
                pageSize={PAGE_SIZE}
                onPageChange={setEprPage}
              />
            </div>
          </div>
        )}

      </main>

      {/* WEIGHBRIDGE VERIFICATION MODAL */}
      {verifyingLot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative animate-scaleUp text-slate-900">
            <button
              type="button"
              onClick={() => setVerifyingLot(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Weighbridge Clearance & Payout Authorization</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Field Scrap Photo</div>
                <img
                  src={verifyingLot.photoUrl}
                  alt="Scrap item"
                  className="w-full h-32 rounded-xl object-cover mt-1.5 border border-slate-200"
                />
                <div className="text-xs font-bold text-slate-900 mt-2">{verifyingLot.materialName}</div>
                <div className="text-[11px] text-slate-500 font-mono">Declared: {verifyingLot.weightKg} kg</div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Calibrated Weighbridge Reading</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="number"
                      step="0.05"
                      value={weighbridgeInput}
                      onChange={(e) => setWeighbridgeInput(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border-2 border-emerald-600 rounded-xl px-3 py-2 text-xl font-mono font-black text-slate-900 focus:outline-none"
                    />
                    <span className="font-mono text-sm text-slate-500">kg</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-mono mt-1 font-semibold">
                    Tolerance Variance: {Math.abs(Number((weighbridgeInput - verifyingLot.weightKg).toFixed(2)))} kg (Within ±2% SLA)
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Total Approved Payout</div>
                  <div className="text-2xl font-black font-mono text-emerald-700">
                    ₹{Math.round(weighbridgeInput * verifyingLot.ratePerKg)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="mb-5">
              <label className="text-xs font-mono text-slate-600 uppercase block mb-1.5 font-semibold">
                Disbursement Mode to Collector:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMode('UPI')}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    selectedPaymentMode === 'UPI'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Instant UPI Transfer (Auto)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMode('CASH')}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    selectedPaymentMode === 'CASH'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Facility Cash Voucher</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVerifyingLot(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveLot}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Release Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL CPCB EPR COMPLIANCE CERTIFICATE MODAL */}
      {generatedEprCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative animate-scaleUp text-slate-900">
            <button
              type="button"
              onClick={() => setGeneratedEprCert(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Certificate Design */}
            <div className="border-4 border-double border-emerald-600/70 p-6 rounded-2xl bg-emerald-50/30 text-slate-900 relative">
              <div className="text-center border-b border-emerald-200 pb-4 mb-4">
                <div className="text-xs font-mono text-emerald-800 tracking-widest uppercase font-bold">
                  GOVERNMENT OF INDIA • MINISTRY OF ENVIRONMENT, FOREST & CLIMATE CHANGE
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  CENTRAL POLLUTION CONTROL BOARD (CPCB)
                </h3>
                <div className="text-xs font-mono text-emerald-700 font-semibold mt-0.5">
                  Statutory Extended Producer Responsibility (EPR) Certificate of Dismantling
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Certificate No: <span className="text-slate-900 font-bold">{generatedEprCert.certId}</span> • Date: {generatedEprCert.date}
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-4 font-sans">
                This is to certify that <span className="text-slate-900 font-bold">{recycler.name}</span> (CPCB Reg: {recycler.cpcbId}) has procured and dismantled <span className="text-emerald-700 font-bold">{generatedEprCert.totalMassTons} Metric Tons</span> of verifiable electronic scrap sourced via registered informal collectors through the <span className="text-slate-900 font-bold">E-Kabad Setu</span> bridge.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center bg-white p-3 rounded-xl border border-slate-200 mb-4 font-mono text-xs shadow-xs">
                <div>
                  <div className="text-slate-500 text-[10px] font-semibold">Copper Recovered</div>
                  <div className="text-amber-700 font-bold">{generatedEprCert.copperKg.toLocaleString()} kg</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] font-semibold">Lithium Recovered</div>
                  <div className="text-cyan-700 font-bold">{generatedEprCert.lithiumKg.toLocaleString()} kg</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] font-semibold">Cobalt Recovered</div>
                  <div className="text-indigo-700 font-bold">{generatedEprCert.cobaltKg.toLocaleString()} kg</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] font-semibold">Gold Recovered</div>
                  <div className="text-amber-600 font-bold">{generatedEprCert.goldGrams.toLocaleString()} g</div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-emerald-200 pt-3 text-xs font-mono text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center shadow-xs">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold">QR Hash: CPCB-VERIFIED-2026</div>
                    <div className="text-[10px] text-slate-500">E-Waste (Management) Rules, 2022</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-800 font-bold">Authorized Signatory</div>
                  <div className="text-[10px] text-slate-500">EPR Cell, Ministry of Environment</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setGeneratedEprCert(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  playFeedbackChime('success');
                  alert('EPR Certificate PDF downloaded to local device for regulatory submission.');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Regulatory PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CPCB STATUTORY NON-COMPLIANCE & QUARANTINE DOCKET MODAL */}
      {selectedIncidentReportLot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-600 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative animate-scaleUp text-slate-900">
            <button
              type="button"
              onClick={() => setSelectedIncidentReportLot(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Docket Design */}
            <div className="border-4 border-double border-rose-600/70 p-6 rounded-2xl bg-rose-50/20 text-slate-900 relative">
              <div className="text-center border-b border-rose-200 pb-4 mb-4">
                <div className="text-xs font-mono text-rose-800 tracking-widest uppercase font-bold">
                  GOVERNMENT OF INDIA • MINISTRY OF ENVIRONMENT, FOREST & CLIMATE CHANGE
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  CENTRAL POLLUTION CONTROL BOARD (CPCB)
                </h3>
                <div className="text-xs font-mono text-rose-700 font-semibold mt-0.5">
                  Statutory Non-Compliance Notice & Quarantine Consignment Docket
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Docket Ref: <span className="text-slate-900 font-bold">CPCB-QRNT-2026-{selectedIncidentReportLot.id.replace('LOT-', '')}</span> • Timestamp: {selectedIncidentReportLot.timestamp}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs font-sans">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Consignment Details</div>
                  <div className="font-bold text-slate-900">{selectedIncidentReportLot.materialName}</div>
                  <div className="text-slate-600 font-mono">Lot ID: <span className="font-bold text-slate-800">{selectedIncidentReportLot.id}</span></div>
                  <div className="text-slate-600 font-mono">Declared Mass: <span className="font-bold text-slate-800">{selectedIncidentReportLot.weightKg} kg</span></div>
                  <div className="text-slate-600 font-mono">Disallowed Valuation: <span className="font-bold text-rose-700">₹{selectedIncidentReportLot.totalAmount.toLocaleString()}</span></div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Collector Information</div>
                  <div className="font-bold text-slate-900">{selectedIncidentReportLot.collectorName}</div>
                  <div className="text-slate-600 font-mono">Registration: <span className="font-bold text-slate-800">{selectedIncidentReportLot.collectorId}</span></div>
                  <div className="text-slate-600 font-mono">Contact: <span className="font-bold text-slate-800">{selectedIncidentReportLot.collectorPhone}</span></div>
                  <div className="text-slate-600 font-mono">Origin: Swargate Hub / Swachh Transit Point</div>
                </div>
              </div>

              {/* Breach Specification */}
              <div className="bg-rose-100/60 border border-rose-300 rounded-xl p-3.5 mb-4 text-xs">
                <div className="font-bold text-rose-900 flex items-center gap-1.5 mb-1 font-mono uppercase">
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span>Statutory Violation Reason & Findings:</span>
                </div>
                <p className="text-rose-950 font-sans leading-relaxed">
                  {selectedIncidentReportLot.anomalyReason || 'Consignment flagged for serious non-compliance with E-Waste (Management) Rules, 2022. Detected hazardous residue, burning soot or unauthorized chemical de-soldering.'}
                </p>
                <div className="mt-2 pt-2 border-t border-rose-200 text-[11px] text-rose-800 font-mono flex items-center justify-between">
                  <span>Clause: Section 14 (Environmental Protection Act)</span>
                  <span className="font-bold">Status: Quarantined in Hazmat Bay #3</span>
                </div>
              </div>

              {/* QR Verification & Signatures */}
              <div className="flex items-center justify-between border-t border-rose-200 pt-3 text-xs font-mono text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center shadow-xs">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold">SHA-256: CPCB-QUARANTINE-VERIFIED</div>
                    <div className="text-[10px] text-slate-500">Facility ID: {recycler.cpcbId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-rose-800 font-bold">Chief Environmental Officer</div>
                  <div className="text-[10px] text-slate-500">Maharashtra Pollution Control Board</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setSelectedIncidentReportLot(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  playFeedbackChime('warning');
                  alert(`CPCB Quarantine Docket for Lot ${selectedIncidentReportLot.id} downloaded for regulatory filing.`);
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Non-Compliance PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW SCRAP CATEGORY */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add New Scrap Category</h3>
                  <p className="text-[11px] text-slate-500">Publish to Live Mandi & Mobile App</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Category Name (English / Hindi / Regional) *
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Telecom SMPS Board / Lithium Polymer Battery"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Procurement Rate (₹ / kg) *
                  </label>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5">
                    <span className="text-sm font-bold text-emerald-700 font-mono">₹</span>
                    <input
                      type="number"
                      value={newCatPrice}
                      onChange={(e) => setNewCatPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Grade Specification
                  </label>
                  <input
                    type="text"
                    value={newCatGrade}
                    onChange={(e) => setNewCatGrade(e.target.value)}
                    placeholder="e.g. Grade A / Industrial"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Hazard Classification & Handling Protocol
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCatHazard('safe')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newCatHazard === 'safe'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Safe / Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatHazard('medium')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newCatHazard === 'medium'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatHazard('high')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newCatHazard === 'high'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    High / Hazmat
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newCatName.trim()) {
                    alert('Please enter a category name.');
                    return;
                  }
                  const id = `mat_custom_${Date.now()}`;
                  addCustomMaterial({
                    id,
                    name_en: newCatName.trim(),
                    name_hi: newCatName.trim(),
                    name_mr: newCatName.trim(),
                    grade: newCatGrade,
                    pricePerKg: newCatPrice,
                    trend: 0,
                    category: 'custom_e_waste',
                    hazardLevel: newCatHazard,
                    audioText_en: `${newCatName.trim()} trading at ${newCatPrice} rupees per kg`,
                    audioText_hi: `${newCatName.trim()} भाव ₹${newCatPrice} प्रति किलो`,
                    audioText_mr: `${newCatName.trim()} दर ₹${newCatPrice} प्रति किलो`,
                    crmYield: {
                      copperPct: 18,
                      lithiumPct: 2,
                      cobaltPct: 1,
                      neodymiumPct: 0.5,
                      goldGramsPerTon: 50
                    }
                  });
                  playFeedbackChime('beep');
                  setIsAddCategoryOpen(false);
                  setNewCatName('');
                  speak(`New category ${newCatName.trim()} added with rate ₹${newCatPrice} per kg.`);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Category & Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER NEW COLLECTOR / VENDOR */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Register Collector / Vendor Partner</h3>
                  <p className="text-[11px] text-slate-500">Formalize Informal Waste Pickers & Suppliers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVendorOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Partner Full Name (e.g. रामसेवक कांबळे / Suresh Patil) *
                </label>
                <input
                  type="text"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="e.g. Suresh V. Patil"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Phone / Mobile No. *
                  </label>
                  <input
                    type="text"
                    value={newVendorPhone}
                    onChange={(e) => setNewVendorPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    UPI VPA ID (For Instant Payout)
                  </label>
                  <input
                    type="text"
                    value={newVendorUpi}
                    onChange={(e) => setNewVendorUpi(e.target.value)}
                    placeholder="partner@upi"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Safety & Partner Tier
                </label>
                <select
                  value={newVendorTier}
                  onChange={(e) => setNewVendorTier(e.target.value as typeof newVendorTier)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="Standard Partner">Standard Partner (Informal Collector / Safai Sathi)</option>
                  <option value="Silver Partner">Silver Partner (Aggregator / Ward Depot)</option>
                  <option value="Gold Partner">Gold Partner (KYC Verified Commercial Vendor)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddVendorOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newVendorName.trim()) {
                    alert('Please enter partner name.');
                    return;
                  }
                  const vendorId = `KBD-MH-${Math.floor(1000 + Math.random() * 9000)}`;
                  const newEntry = {
                    id: vendorId,
                    name: newVendorName.trim(),
                    phone: newVendorPhone.trim() || '+91 98000 11223',
                    tier: newVendorTier,
                    upiId: newVendorUpi.trim() || `${newVendorName.toLowerCase().replace(/\s+/g, '')}@upi`
                  };
                  setCustomRegisteredVendors((prev) => [newEntry, ...prev]);
                  setSelectedVendorId(vendorId);
                  playFeedbackChime('beep');
                  setIsAddVendorOpen(false);
                  setNewVendorName('');
                  setNewVendorPhone('');
                  setNewVendorUpi('');
                  speak(`Partner ${newVendorName.trim()} registered with ID ${vendorId}.`);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Register Partner</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
