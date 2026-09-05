import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CategoryApprovalRequest } from '../types';
import { CPCB_STANDARD_CATEGORIES } from '../data/mockData';
import { playFeedbackChime } from '../utils/speech';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Sparkles, 
  TrendingUp, 
  ExternalLink,
  Layers,
  User,
  Phone,
  Calendar,
  DollarSign,
  Scale,
  Check,
  X,
  ChevronRight,
  Info
} from 'lucide-react';

export const CpcbCategoryApprovalsDesk: React.FC = () => {
  const { categoryRequests, approveCategoryRequest, rejectCategoryRequest, materials, lots } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected request for action modal
  const [selectedRequestForAction, setSelectedRequestForAction] = useState<CategoryApprovalRequest | null>(null);
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | 'view'>('view');
  
  // Approval Form States
  const [assignedCategory, setAssignedCategory] = useState<string>('pcb');
  const [approvedRate, setApprovedRate] = useState<number>(450);
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [officerName, setOfficerName] = useState<string>('Dr. R. K. Sharma (CPCB Western Zone)');
  
  // Rejection Form States
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const [inspectingPhotoUrl, setInspectingPhotoUrl] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return categoryRequests.filter(req => {
      const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
      const matchesSearch = 
        req.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.collectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.collectorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.description && req.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [categoryRequests, filterStatus, searchTerm]);

  const pendingCount = useMemo(() => categoryRequests.filter(r => r.status === 'pending').length, [categoryRequests]);
  const approvedCount = useMemo(() => categoryRequests.filter(r => r.status === 'approved').length, [categoryRequests]);
  const rejectedCount = useMemo(() => categoryRequests.filter(r => r.status === 'rejected').length, [categoryRequests]);

  const openApproveModal = (req: CategoryApprovalRequest) => {
    playFeedbackChime('beep');
    setSelectedRequestForAction(req);
    setActionMode('approve');
    setApprovedRate(req.suggestedRatePerKg || 450);
    setAssignedCategory(req.assignedStandardCategory || 'pcb');
    setOfficerNotes(`Authorized under CPCB E-Waste Rules 2022. Certified hydrometallurgical recovery potential at authorized smelting units.`);
    setOfficerName('Dr. R. K. Sharma (CPCB Western Zone)');
  };

  const openRejectModal = (req: CategoryApprovalRequest) => {
    playFeedbackChime('beep');
    setSelectedRequestForAction(req);
    setActionMode('reject');
    setRejectionReason('Does not meet CPCB Schedule I specifications or contains banned domestic municipal hazardous waste.');
    setOfficerName('Dr. R. K. Sharma (CPCB Western Zone)');
  };

  const handleConfirmApproval = () => {
    if (!selectedRequestForAction) return;
    playFeedbackChime('beep');
    approveCategoryRequest(
      selectedRequestForAction.id,
      approvedRate,
      assignedCategory,
      officerNotes,
      officerName
    );
    setActionSuccessMessage(`✓ Category "${selectedRequestForAction.categoryName}" Approved & Mandi Tariff Published at ₹${approvedRate}/kg! Linked lots updated.`);
    setSelectedRequestForAction(null);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  const handleConfirmRejection = () => {
    if (!selectedRequestForAction) return;
    playFeedbackChime('warning');
    rejectCategoryRequest(
      selectedRequestForAction.id,
      rejectionReason || 'Category rejected by CPCB Regulatory Officer',
      officerName
    );
    setActionSuccessMessage(`⚠️ Category request "${selectedRequestForAction.categoryName}" marked Rejected.`);
    setSelectedRequestForAction(null);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Action Success Toast */}
      {actionSuccessMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg animate-fadeIn border border-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                CPCB Regulatory Desk
              </span>
              <span className="text-[10px] font-mono text-slate-400">Section 4(1) Schedule Review</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Collector Category Authorization & Mandi Tariff Gateway</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              When informal kabadiwalas scan unclassified or out-of-schedule electronics, they submit samples with weight and photo. Authorize new categories, assign standard CPCB schedules, and set the mandatory minimum Mandi tariff.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-center min-w-[95px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Pending</div>
              <div className="text-2xl font-black font-mono text-amber-400">{pendingCount}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-center min-w-[95px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Approved</div>
              <div className="text-2xl font-black font-mono text-emerald-400">{approvedCount}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-center min-w-[95px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Rejected</div>
              <div className="text-2xl font-black font-mono text-rose-400">{rejectedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700/80 text-xs font-bold w-full sm:w-auto">
          {[
            { id: 'pending', label: `Pending Review (${pendingCount})`, color: 'text-amber-400' },
            { id: 'approved', label: `Approved Tariffs (${approvedCount})`, color: 'text-emerald-400' },
            { id: 'rejected', label: `Rejected (${rejectedCount})`, color: 'text-rose-400' },
            { id: 'all', label: `All Requests (${categoryRequests.length})`, color: 'text-slate-300' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playFeedbackChime('beep');
                setFilterStatus(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search category, collector, ID..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Requests Grid / Table */}
      {filteredRequests.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="text-base font-bold text-slate-300">No Category Requests in this view</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterStatus === 'pending'
              ? 'All collector category approval submissions have been audited and resolved.'
              : 'Try changing the status filter or searching for a different keyword.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className={`bg-slate-800/80 border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                  isPending 
                    ? 'border-amber-500/40 hover:border-amber-400' 
                    : isApproved 
                    ? 'border-emerald-500/40' 
                    : 'border-rose-500/30'
                }`}
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                        {req.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{req.timestamp}</span>
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>CPCB Approved</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Category Info with Photo */}
                  <div className="flex gap-3 mb-3">
                    {req.samplePhotoUrl && (
                      <div 
                        onClick={() => setInspectingPhotoUrl(req.samplePhotoUrl)}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 cursor-pointer group relative shadow-xs"
                        title="Click to view full reference photo"
                      >
                        <img 
                          src={req.samplePhotoUrl} 
                          alt={req.categoryName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-white leading-snug">
                        {req.categoryName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {req.description || 'Custom scrap item submitted via AI Scanner without predefined CPCB classification.'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-900/70 border border-slate-700/60 rounded-xl p-2.5 text-xs font-mono text-slate-300 mb-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Collector</span>
                      <span className="font-bold text-white truncate block">{req.collectorName}</span>
                      <span className="text-[10px] text-slate-400">{req.collectorId}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Declared Weight</span>
                      <span className="font-bold text-emerald-400">{req.weightKg || 5.0} kg</span>
                      <span className="text-[10px] text-slate-500 block">Sample Batch</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">
                        {isApproved ? 'Approved Tariff' : 'Proposed Rate'}
                      </span>
                      <span className="font-bold text-amber-300">
                        {isApproved ? `₹${req.approvedRatePerKg}/kg` : (req.suggestedRatePerKg ? `₹${req.suggestedRatePerKg}/kg` : 'Pending CPCB')}
                      </span>
                    </div>
                  </div>

                  {/* Audit Review Details (If already reviewed) */}
                  {isApproved && (
                    <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 text-xs text-emerald-300 space-y-1 mb-3">
                      <div className="font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Auditor: {req.reviewedBy || 'CPCB Regulatory Officer'}</span>
                      </div>
                      <div className="text-[11px] text-emerald-200/90 leading-relaxed">
                        {req.reviewNotes || 'Approved under CPCB E-Waste Rules 2022.'}
                      </div>
                      {req.assignedStandardCategory && (
                        <div className="text-[10px] font-mono text-emerald-400 mt-1">
                          Assigned Schedule: <span className="uppercase font-bold">{req.assignedStandardCategory}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isRejected && (
                    <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-2.5 text-xs text-rose-300 space-y-1 mb-3">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Rejection Reason:</span>
                      </div>
                      <div className="text-[11px] text-rose-200/90 leading-relaxed">
                        {req.reviewNotes || 'Non-electronic or non-compliant hazardous waste.'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons for Pending items */}
                {isPending && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => openApproveModal(req)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Set Tariff</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openRejectModal(req)}
                      className="py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVE ACTION MODAL */}
      {selectedRequestForAction && actionMode === 'approve' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black text-white">
                  CPCB Category Authorization & Tariff Determination
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedRequestForAction(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item summary */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">{selectedRequestForAction.id}</span>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedRequestForAction.categoryName}</div>
                </div>
                <span className="font-mono text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                  {selectedRequestForAction.weightKg} kg Sample
                </span>
              </div>
              <div className="text-slate-400 text-[11px] leading-relaxed">
                Submitted by: <span className="font-bold text-slate-200">{selectedRequestForAction.collectorName}</span> ({selectedRequestForAction.collectorId})
              </div>
            </div>

            {/* Input 1: Standard CPCB Category Assignment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                1. Assign Official CPCB Standard Schedule
              </label>
              <select
                value={assignedCategory}
                onChange={(e) => setAssignedCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              >
                {CPCB_STANDARD_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.code} - {cat.name} (Base: ₹{cat.baseRate}/kg)
                  </option>
                ))}
              </select>
            </div>

            {/* Input 2: Approved Mandi Tariff Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300">
                  2. Set Mandatory Mandi Tariff Rate (₹ / kg)
                </label>
                <span className="text-xs font-mono text-emerald-400 font-bold">₹{approvedRate}/kg</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-mono font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={approvedRate}
                  onChange={(e) => setApprovedRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-1.5 pt-1">
                {[250, 350, 480, 650, 850].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setApprovedRate(rate)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 cursor-pointer"
                  >
                    ₹{rate}
                  </button>
                ))}
              </div>
            </div>

            {/* Input 3: Reviewer Officer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                3. Authorizing Regulatory Officer
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Input 4: Officer Audit Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                4. Statutory Inspection & Recovery Notes
              </label>
              <textarea
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                placeholder="Details of material composition, recycling safety parameters, and EPR credit schedule..."
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRequestForAction(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Authorize & Publish Tariff</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT ACTION MODAL */}
      {selectedRequestForAction && actionMode === 'reject' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
                <h3 className="text-base font-black text-white">
                  Reject Category & Flag Lots
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedRequestForAction(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Rejecting this request will mark the material non-compliant under CPCB E-Waste Management Rules and notify the collector that this material cannot be traded in formal Mandi channels.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Statutory Rejection Reason (Mandatory)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 leading-relaxed"
                placeholder="Reason for non-compliance or hazardous restriction..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Auditing Officer
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRequestForAction(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO INSPECTION MODAL */}
      {inspectingPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl p-4">
            <button
              type="button"
              onClick={() => setInspectingPhotoUrl(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={inspectingPhotoUrl} 
              alt="Inspecting scrap photo" 
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-black"
            />
            <div className="mt-3 text-center text-xs font-mono text-slate-400">
              High-Resolution CPCB Vision Digital Stamped Inspection Reference
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
