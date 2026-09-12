import React, { useState, useMemo } from 'react';
import { EWasteLot, CollectorProfile } from '../types';
import { TablePagination } from './TablePagination';
import { DigitalStampOverlay } from './DigitalStampOverlay';
import { QRCodeSVG } from 'qrcode.react';
import { playFeedbackChime } from '../utils/speech';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ArrowUpDown, 
  QrCode, 
  Eye, 
  EyeOff, 
  MapPin, 
  X, 
  FileText, 
  Calendar, 
  Scale, 
  DollarSign, 
  Truck, 
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface CollectorOrdersManagementProps {
  collector: CollectorProfile;
  lots: EWasteLot[];
  language: 'hi' | 'mr' | 'en';
  onOpenQrPass?: (lot: EWasteLot) => void;
  onNavigateToScan?: () => void;
}

export const CollectorOrdersManagement: React.FC<CollectorOrdersManagementProps> = ({
  collector,
  lots,
  language,
  onOpenQrPass,
  onNavigateToScan
}) => {
  // Folder sub-tab: 'pending' | 'completed' | 'quarantined'
  const [activeFolder, setActiveFolder] = useState<'pending' | 'completed' | 'quarantined'>('pending');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'mass_desc' | 'amount_desc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Lot for Multi-Angle Photo Inspector Modal
  const [inspectingLot, setInspectingLot] = useState<EWasteLot | null>(null);
  const [inspectingAngle, setInspectingAngle] = useState<'top' | 'underside' | 'sticker'>('top');

  // Selected Lot for QR Modal
  const [viewingQrLot, setViewingQrLot] = useState<EWasteLot | null>(null);

  // Selected Lot for Settlement Voucher Modal
  const [viewingVoucherLot, setViewingVoucherLot] = useState<EWasteLot | null>(null);

  // Filter lots belonging to this collector
  const collectorLots = useMemo(() => {
    return lots.filter(l => l.collectorId === collector.id);
  }, [lots, collector.id]);

  // Folder metrics
  const pendingLots = useMemo(() => {
    return collectorLots.filter(l => l.status === 'pending' || l.status === 'verified');
  }, [collectorLots]);

  const completedLots = useMemo(() => {
    return collectorLots.filter(l => l.status === 'paid');
  }, [collectorLots]);

  const quarantinedLots = useMemo(() => {
    return collectorLots.filter(l => l.status === 'rejected' || l.anomalyFlag === true);
  }, [collectorLots]);

  // Current folder data
  const currentFolderLots = useMemo(() => {
    if (activeFolder === 'pending') return pendingLots;
    if (activeFolder === 'completed') return completedLots;
    return quarantinedLots;
  }, [activeFolder, pendingLots, completedLots, quarantinedLots]);

  // Filtered & sorted lots
  const filteredLots = useMemo(() => {
    return currentFolderLots
      .filter(lot => {
        const matchesCategory = selectedCategory === 'ALL' || lot.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch = 
          lot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lot.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lot.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lot.serialOrImei && lot.serialOrImei.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.id.localeCompare(a.id);
        if (sortBy === 'date_asc') return a.id.localeCompare(b.id);
        if (sortBy === 'mass_desc') return (b.weighbridgeWeightKg || b.weightKg) - (a.weighbridgeWeightKg || a.weightKg);
        if (sortBy === 'amount_desc') return (b.finalPayoutAmount || b.totalAmount) - (a.finalPayoutAmount || a.totalAmount);
        return 0;
      });
  }, [currentFolderLots, selectedCategory, searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredLots.length / pageSize) || 1;
  const paginatedLots = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLots.slice(start, start + pageSize);
  }, [filteredLots, currentPage, pageSize]);

  // Handle folder switch
  const handleFolderChange = (folder: 'pending' | 'completed' | 'quarantined') => {
    playFeedbackChime('beep');
    setActiveFolder(folder);
    setCurrentPage(1);
  };

  const labels = {
    hi: {
      title: 'चालान व ऑर्डर प्रबंधन (Orders Ledger)',
      subtitle: 'प्रशासनिक व प्राधिकृत रीसाइक्लर स्तर की पारदर्शी लॉट ट्रैकिंग',
      pendingTab: 'लंबित तौल चालान (Pending)',
      completedTab: 'स्वीकृत व भुगतान पूर्ण (Completed)',
      quarantinedTab: 'क्वारंटाइन / रिजेक्टेड (Flagged)',
      searchPlaceholder: 'लॉट आईडी, स्क्रैप या रीसाइक्लर खोजें...',
      newLotBtn: '+ नया लॉट स्कैन करें',
      lotIdHeader: 'लॉट विवरण',
      materialHeader: 'स्क्रैप सामग्री व फोटो',
      weightRateHeader: 'वजन व मंडी दर',
      facilityStatusHeader: 'सुविधा व स्थिति',
      actionsHeader: 'कार्यवाही',
      inspectPhotosBtn: 'दिशा फोटो व स्टैम्प',
      qrPassBtn: 'गेट पास QR',
      voucherBtn: 'भुगतान रसीद',
      emptyPending: 'वर्तमान में कोई लंबित चालान नहीं है।',
      emptyCompleted: 'कोई पूर्ण भुगतान रिकॉर्ड नहीं मिला।',
      emptyQuarantined: 'कोई क्वारंटाइन लॉट नहीं है - आपका सुरक्षा रिकॉर्ड बेहतरीन है!'
    },
    mr: {
      title: 'ऑर्डर्स व पाठवणी व्यवस्थापन',
      subtitle: 'अधिकृत रिसायकलर व सरकारी मानकानुसार ट्रॅकिंग',
      pendingTab: 'प्रलंबित वजन (Pending)',
      completedTab: 'पूर्ण झालेले व्यवहार (Completed)',
      quarantinedTab: 'क्वारंटाईन / नाकारलेले (Flagged)',
      searchPlaceholder: 'लॉट आयडी, स्क्रॅप किंवा युनिट शोधा...',
      newLotBtn: '+ नवीन लॉट स्कॅन करा',
      lotIdHeader: 'लॉट तपशील',
      materialHeader: 'स्क्रॅप वस्तू व फोटो',
      weightRateHeader: 'वजन व दर',
      facilityStatusHeader: 'सुविधा व स्थिती',
      actionsHeader: 'कृती',
      inspectPhotosBtn: 'दिशा फोटो व स्टॅम्प',
      qrPassBtn: 'गेट पास QR',
      voucherBtn: 'पावती',
      emptyPending: 'सध्या कोणतीही प्रलंबित पाठवणी नाही.',
      emptyCompleted: 'पूर्ण व्यवहारांची नोंद नाही.',
      emptyQuarantined: 'कोणताही नाकारलेला लॉट नाही!'
    },
    en: {
      title: 'Consignment Orders & Dispatches',
      subtitle: 'Authority-Grade Real-Time Weighbridge Tracking & Verified Audit Tables',
      pendingTab: 'Pending Weighbridge Clearance',
      completedTab: 'Completed & Settled Dispatches',
      quarantinedTab: 'Quarantined & Flagged',
      searchPlaceholder: 'Search Lot ID, Scrap Material, Recycler Unit...',
      newLotBtn: '+ Scan New Scrap Lot',
      lotIdHeader: 'Lot ID & Date',
      materialHeader: 'Scrap & Inspection Photos',
      weightRateHeader: 'Weight & Rate',
      facilityStatusHeader: 'Recycler & Status',
      actionsHeader: 'Actions',
      inspectPhotosBtn: 'Photos & Stamp',
      qrPassBtn: 'Gate QR Pass',
      voucherBtn: 'Settlement Receipt',
      emptyPending: 'No consignments pending weighbridge clearance.',
      emptyCompleted: 'No completed consignments found in this filter.',
      emptyQuarantined: 'Zero quarantined lots. Your compliance score is spotless!'
    }
  }[language];

  return (
    <div className="space-y-3.5 animate-fadeIn text-slate-800">
      {/* Top Header & Folder Navigation Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>{labels.title}</span>
            </h3>
            <p className="text-[10px] text-slate-500">{labels.subtitle}</p>
          </div>
          {onNavigateToScan && (
            <button
              type="button"
              onClick={onNavigateToScan}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0"
            >
              <span>{labels.newLotBtn}</span>
            </button>
          )}
        </div>

        {/* 3 Folder Tabs Just Like Authorities */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-[11px] font-semibold">
          {/* Pending Folder */}
          <button
            type="button"
            onClick={() => handleFolderChange('pending')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 relative ${
              activeFolder === 'pending'
                ? 'bg-white text-emerald-950 font-bold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1">
              <Clock className={`w-3.5 h-3.5 ${activeFolder === 'pending' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className="truncate">Pending</span>
            </div>
            <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full ${
              activeFolder === 'pending' ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
            }`}>
              {pendingLots.length} Lots
            </span>
          </button>

          {/* Completed Folder */}
          <button
            type="button"
            onClick={() => handleFolderChange('completed')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 relative ${
              activeFolder === 'completed'
                ? 'bg-white text-emerald-950 font-bold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1">
              <CheckCircle2 className={`w-3.5 h-3.5 ${activeFolder === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="truncate">Settled</span>
            </div>
            <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full ${
              activeFolder === 'completed' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'
            }`}>
              {completedLots.length} Lots
            </span>
          </button>

          {/* Quarantined Folder */}
          <button
            type="button"
            onClick={() => handleFolderChange('quarantined')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 relative ${
              activeFolder === 'quarantined'
                ? 'bg-white text-rose-950 font-bold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1">
              <AlertTriangle className={`w-3.5 h-3.5 ${activeFolder === 'quarantined' ? 'text-rose-600' : 'text-slate-400'}`} />
              <span className="truncate">Quarantine</span>
            </div>
            <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full ${
              activeFolder === 'quarantined' ? 'bg-rose-100 text-rose-900' : 'bg-slate-200 text-slate-700'
            }`}>
              {quarantinedLots.length}
            </span>
          </button>
        </div>
      </div>

      {/* Table Controls: Search, Category Filter, and Sorting */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Instant Search Bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={labels.searchPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="mass_desc">Weight: High → Low</option>
              <option value="amount_desc">Valuation: High → Low</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-mono scrollbar-none">
          {['ALL', 'PCB', 'Copper', 'Battery', 'CRT', 'Plastic', 'Magnet'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3 font-bold">{labels.lotIdHeader}</th>
                <th className="py-2.5 px-3 font-bold">{labels.materialHeader}</th>
                <th className="py-2.5 px-3 font-bold">{labels.weightRateHeader}</th>
                <th className="py-2.5 px-3 font-bold">{labels.facilityStatusHeader}</th>
                <th className="py-2.5 px-3 font-bold text-right">{labels.actionsHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLots.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center">
                    <div className="max-w-xs mx-auto text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <div className="text-xs font-bold text-slate-700">
                        {activeFolder === 'pending' && labels.emptyPending}
                        {activeFolder === 'completed' && labels.emptyCompleted}
                        {activeFolder === 'quarantined' && labels.emptyQuarantined}
                      </div>
                      {searchTerm && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          No results matching "{searchTerm}". Try clearing search or filters.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLots.map((lot) => {
                  const declaredWeight = lot.weightKg;
                  const verifiedWeight = lot.weighbridgeWeightKg || declaredWeight;
                  const lotAmount = lot.finalPayoutAmount || lot.totalAmount;
                  const isPaid = lot.status === 'paid';
                  const isPending = lot.status === 'pending' || lot.status === 'verified';
                  const isFlagged = lot.anomalyFlag || lot.status === 'rejected';

                  // Multi-angle photo available check
                  const topPhoto = lot.photos?.topView || lot.photoUrl;
                  const undersidePhoto = lot.photos?.undersideView;
                  const stickerPhoto = lot.photos?.stickerView;

                  return (
                    <tr key={lot.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Column 1: Lot ID & Date */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1">
                          <span>{lot.id}</span>
                          {lot.anomalyFlag && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Flagged for anomaly"></span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{lot.timestamp}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono truncate max-w-[130px] mt-0.5 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{lot.gpsLocation}</span>
                        </div>
                      </td>

                      {/* Column 2: Material & Photos */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex items-center gap-2">
                          {/* Main Thumbnail (clickable to inspect multi-angle photos with digital stamps) */}
                          <div 
                            onClick={() => {
                              playFeedbackChime('beep');
                              setInspectingLot(lot);
                              setInspectingAngle('top');
                            }}
                            className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer group shadow-2xs"
                            title="Click to view full inspection photos with digital stamp"
                          >
                            <img
                              src={topPhoto}
                              alt={lot.materialName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                            {/* Direction Indicator Badge */}
                            <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[7px] font-mono text-emerald-300 text-center font-bold">
                              {undersidePhoto ? 'MULTI-VIEW' : 'STAMPED'}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate max-w-[140px]">
                              {lot.materialName}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                {lot.category}
                              </span>
                              {lot.hazardFlag && (
                                <span className="text-[9px] font-mono px-1 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                                  Hazard
                                </span>
                              )}
                            </div>
                            {lot.serialOrImei && (
                              <div className="text-[9px] font-mono text-emerald-800 truncate max-w-[130px] mt-0.5">
                                SN: {lot.serialOrImei}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Weight & Rate */}
                      <td className="py-2.5 px-3 align-top font-mono">
                        <div className="text-xs font-bold text-slate-900">
                          {isPaid ? (
                            <span>{verifiedWeight} kg <span className="text-[10px] text-slate-500 font-normal">(Tare)</span></span>
                          ) : (
                            <span>{declaredWeight} kg</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ₹{lot.ratePerKg}/kg
                        </div>
                        <div className="text-xs font-extrabold text-emerald-700 mt-0.5">
                          ₹{lotAmount.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Column 4: Facility & Status */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="text-[11px] font-bold text-slate-800 truncate max-w-[130px]">
                          {lot.facilityName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {lot.distanceKm} km away
                        </div>

                        {/* Status Badge */}
                        <div className="mt-1 flex flex-col gap-1">
                          {lot.needsOnlineAiCategorization ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                              <span>Pending AI Classification</span>
                            </span>
                          ) : isPaid ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Paid ({lot.paymentMode || 'UPI'})</span>
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Awaiting Weighbridge</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                              <span>Quarantined</span>
                            </span>
                          )}
                          {lot.isOfflineCreated && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-mono text-slate-500">
                              <span>Saved Offline</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Action Buttons */}
                      <td className="py-2.5 px-3 align-top text-right">
                        <div className="flex flex-col items-end gap-1">
                          {/* QR Gate Pass Button */}
                          <button
                            type="button"
                            onClick={() => {
                              playFeedbackChime('beep');
                              if (onOpenQrPass) {
                                onOpenQrPass(lot);
                              } else {
                                setViewingQrLot(lot);
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 transition-colors shadow-2xs"
                            title="Open Weighbridge QR Pass"
                          >
                            <QrCode className="w-3 h-3 text-emerald-600" />
                            <span>QR Pass</span>
                          </button>

                          {/* Photos & Digital Stamp Inspector Button */}
                          <button
                            type="button"
                            onClick={() => {
                              playFeedbackChime('beep');
                              setInspectingLot(lot);
                              setInspectingAngle('top');
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                            title="Inspect multi-angle photos with digital stamps"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>Stamp</span>
                          </button>

                          {/* Settlement Voucher (if paid) */}
                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                playFeedbackChime('beep');
                                setViewingVoucherLot(lot);
                              }}
                              className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-bold border border-indigo-200 flex items-center gap-1 transition-colors"
                              title="View official settlement slip"
                            >
                              <FileText className="w-3 h-3 text-indigo-600" />
                              <span>Slip</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standardized 10-Item Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLots.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MULTI-ANGLE PHOTO INSPECTOR WITH DIGITAL STAMP & HOLD-TO-HIDE */}
      {/* ========================================================================= */}
      {inspectingLot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-4 max-w-sm w-full text-slate-900 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-emerald-700">{inspectingLot.id}</span>
                  {inspectingLot.needsOnlineAiCategorization && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold border border-cyan-200">
                      Pending AI
                    </span>
                  )}
                  {inspectingLot.isOfflineCreated && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                      Offline
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 truncate max-w-[220px]">
                  {inspectingLot.materialName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Angle Selection Tabs inside Inspector */}
            <div className="flex gap-1 mb-2.5">
              <button
                type="button"
                onClick={() => setInspectingAngle('top')}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-mono font-bold border transition-colors ${
                  inspectingAngle === 'top'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                1. Top / Front
              </button>

              <button
                type="button"
                onClick={() => setInspectingAngle('underside')}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-mono font-bold border transition-colors ${
                  inspectingAngle === 'underside'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                2. Underside
              </button>

              {inspectingLot.photos?.stickerView && (
                <button
                  type="button"
                  onClick={() => setInspectingAngle('sticker')}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-mono font-bold border transition-colors ${
                    inspectingAngle === 'sticker'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  3. IMEI Sticker
                </button>
              )}
            </div>

            {/* Photo Display Viewport with Digital Stamp & Hold-to-Hide */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 h-64 shadow-md">
              <img
                src={
                  inspectingAngle === 'top'
                    ? inspectingLot.photos?.topView || inspectingLot.photoUrl
                    : inspectingAngle === 'underside'
                    ? inspectingLot.photos?.undersideView || inspectingLot.photoUrl
                    : inspectingLot.photos?.stickerView || inspectingLot.photoUrl
                }
                alt={`${inspectingAngle} scrap photo`}
                className="w-full h-full object-cover"
              />

              {/* Digital Stamp with Odd Color Inversion */}
              <DigitalStampOverlay
                angleName={
                  inspectingAngle === 'top'
                    ? 'Top / Front'
                    : inspectingAngle === 'underside'
                    ? 'Reverse / Underside'
                    : 'IMEI / Spec Sticker'
                }
                angleCode={
                  inspectingAngle === 'top' ? 'TOP' : inspectingAngle === 'underside' ? 'UNDERSIDE' : 'STICKER'
                }
                lotId={inspectingLot.id}
                timestamp={inspectingLot.timestamp}
                gpsLocation={inspectingLot.gpsLocation}
                collectorId={inspectingLot.collectorId}
                serialOrImei={inspectingLot.serialOrImei}
              />
            </div>

            {/* Instruction Banner on How to Peek Raw Image */}
            <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[10px] flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-700" />
                <span>Hold "Hold to Hide Stamp" to view clean raw scrap</span>
              </span>
              <span className="font-mono text-amber-800 font-bold">100% Tamper-Proof</span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setInspectingLot(null)}
              className="w-full mt-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QR CODE WEIGHBRIDGE HANDOVER PASS */}
      {/* ========================================================================= */}
      {viewingQrLot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-5 max-w-sm w-full text-center text-slate-900 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setViewingQrLot(null)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold rounded-full mb-3">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>Weighbridge Handover Pass</span>
            </div>

            <h4 className="text-base font-bold text-slate-900 mb-0.5">
              {viewingQrLot.materialName}
            </h4>
            <div className="text-xs font-mono text-emerald-700 font-bold mb-4">
              {viewingQrLot.id}
            </div>

            {/* High Contrast QR Code */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block shadow-xs mb-4">
              <div className="w-44 h-44 bg-white p-2 rounded-xl flex flex-col items-center justify-center relative border border-slate-200">
                <QRCodeSVG
                  value={JSON.stringify({
                    lotId: viewingQrLot.id,
                    collectorId: collector.id,
                    material: viewingQrLot.materialName,
                    weight: viewingQrLot.weightKg
                  })}
                  size={160}
                  level={"H"}
                  includeMargin={false}
                  fgColor={"#022c22"}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md border-2 border-white">
                    SETU
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 text-left border border-slate-200 text-xs space-y-1.5 font-mono mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Weight & Rate:</span>
                <span className="text-slate-900 font-bold">{viewingQrLot.weightKg} kg @ ₹{viewingQrLot.ratePerKg}/kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Declared Valuation:</span>
                <span className="text-emerald-700 font-extrabold">₹{viewingQrLot.totalAmount}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-slate-500">Destination:</span>
                <span className="text-slate-800 text-right truncate max-w-[170px]">{viewingQrLot.facilityName}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewingQrLot(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COMPLETED SETTLEMENT VOUCHER */}
      {/* ========================================================================= */}
      {viewingVoucherLot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-5 max-w-sm w-full text-slate-900 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setViewingVoucherLot(null)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Official Settlement Voucher</h4>
                <div className="text-[10px] font-mono text-emerald-700 font-bold">CPCB Form-2 Disbursal Voucher</div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs font-mono space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Lot ID:</span>
                <span className="font-bold text-slate-900">{viewingVoucherLot.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Collector:</span>
                <span className="font-medium text-slate-800">{collector.name} ({collector.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recycler Facility:</span>
                <span className="text-right font-medium text-slate-800 truncate max-w-[170px]">{viewingVoucherLot.facilityName}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500">Weighbridge Tare:</span>
                <span className="font-bold text-slate-900">{viewingVoucherLot.weighbridgeWeightKg || viewingVoucherLot.weightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit Mandi Rate:</span>
                <span className="font-bold text-slate-900">₹{viewingVoucherLot.ratePerKg} / kg</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 bg-emerald-50/70 p-2 rounded-xl">
                <span className="font-bold text-emerald-900">Settled Payout:</span>
                <span className="text-base font-extrabold text-emerald-700">
                  ₹{(viewingVoucherLot.finalPayoutAmount || viewingVoucherLot.totalAmount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Disbursal Mode:</span>
                <span className="font-bold text-indigo-700">{viewingVoucherLot.paymentMode || 'UPI Instant Pay'}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>EPR Credit Reference:</span>
                <span>EPR-CREDIT-2026-{(viewingVoucherLot.weighbridgeWeightKg || viewingVoucherLot.weightKg)}KG</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewingVoucherLot(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Close Voucher
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
