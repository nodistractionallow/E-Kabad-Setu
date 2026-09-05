import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Database, 
  BookOpen, 
  Calculator, 
  ArrowLeft, 
  ExternalLink,
  Award,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  Building2,
  TrendingUp,
  Download,
  CheckCircle2,
  Lock,
  Search,
  ChevronRight,
  FolderOpen,
  Folder,
  Headphones,
  UserCheck,
  Check,
  XCircle,
  FileCheck
} from 'lucide-react';
import { DatasetsExplorerModal } from './DatasetsExplorerModal';
import { FieldResearchModal } from './FieldResearchModal';
import { UnitEconomicsModal } from './UnitEconomicsModal';
import { CpcbCategoryApprovalsDesk } from './CpcbCategoryApprovalsDesk';
import { GovernmentTransactionLedger } from './GovernmentTransactionLedger';
import { HelpDeskModal } from './HelpDeskModal';
import { PartnerRegistrationModal } from './PartnerRegistrationModal';
import { playFeedbackChime } from '../utils/speech';

export const GovernmentAuditPortal: React.FC = () => {
  const { 
    setCurrentView, 
    lots, 
    recycler, 
    categoryRequests,
    partnerRegistrations = [],
    approvePartner,
    rejectPartner
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions_ledger' | 'category_approvals' | 'partner_approvals' | 'datasets' | 'field_research' | 'unit_economics' | 'state_audit'>('transactions_ledger');
  const [showDatasetsModal, setShowDatasetsModal] = useState(false);
  const [showFieldResearchModal, setShowFieldResearchModal] = useState(false);
  const [showUnitEconomicsModal, setShowUnitEconomicsModal] = useState(false);
  const [showHelpDeskModal, setShowHelpDeskModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [rejectModalData, setRejectModalData] = useState<{ id: string; name: string } | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const pendingRequestsCount = categoryRequests.filter(r => r.status === 'pending').length;
  const pendingPartnersCount = partnerRegistrations.filter(p => p.status === 'PENDING_GOVT_APPROVAL').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Ministry Banner */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-xs font-mono text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></div>
          <span className="text-slate-900 font-bold">MINISTRY OF ENVIRONMENT, FOREST AND CLIMATE CHANGE (MoEFCC)</span>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-700 font-bold">CPCB REGULATORY PORTAL</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-emerald-100 border border-emerald-300 text-emerald-800 px-2.5 py-0.5 rounded font-mono font-bold">
            SECURE ACCESS: GOVT / REGULATOR ONLY
          </span>
          <button
            type="button"
            onClick={() => {
              playFeedbackChime('beep');
              setCurrentView('gateway');
            }}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Gateway</span>
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 p-0.5 shadow-md flex items-center justify-center text-white">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900">
                  National E-Waste Regulatory & Research Portal
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded">
                  E-Waste Rules 2022
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Central Pollution Control Board (CPCB) Regulatory Cell • Formalization & EPR Audit
              </p>
            </div>
          </div>

          {/* Quick Nav Switches */}
          <div className="flex items-center gap-2">
            <div className="text-right mr-3 hidden lg:block">
              <div className="text-[11px] font-mono text-slate-500">Authenticated Auditor</div>
              <div className="text-xs font-bold text-slate-900">Dr. R. K. Sharma (CPCB Western Zone)</div>
            </div>
            <button
              type="button"
              onClick={() => {
                playFeedbackChime('beep');
                setCurrentView('recycler');
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Switch to Recycler ERP View"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Recycler ERP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playFeedbackChime('beep');
                setCurrentView('collector');
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Switch to Collector Saathi View"
            >
              <span>Collector App</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playFeedbackChime('beep');
                setShowHelpDeskModal(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Open Government Help Desk & Statutory Regulatory Agent Bot"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Gov Help Desk</span>
            </button>
          </div>
        </div>
      </header>

      {/* Nav Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 sticky top-[73px] z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto py-2">
          {[
            { id: 'transactions_ledger', label: '1. Vendor-to-Collector Transactions & Folders', icon: FolderOpen, highlight: true },
            { id: 'overview', label: '2. National Regulatory Overview', icon: ShieldCheck },
            { id: 'category_approvals', label: `3. CPCB Category Approval Desk ${pendingRequestsCount > 0 ? `(${pendingRequestsCount} PENDING)` : ''}`, icon: Award, hasBadge: pendingRequestsCount > 0 },
            { id: 'partner_approvals', label: `4. Partner Registrations Desk ${pendingPartnersCount > 0 ? `(${pendingPartnersCount} PENDING)` : ''}`, icon: UserCheck, hasBadge: pendingPartnersCount > 0 },
            { id: 'datasets', label: '5. Field Datasets & Schemas', icon: Database },
            { id: 'field_research', label: '6. Field Usability Research', icon: BookOpen },
            { id: 'unit_economics', label: '7. Macro Unit Economics Model', icon: Calculator },
            { id: 'state_audit', label: '8. State PCB Compliance Ledger', icon: Layers }
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
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : tab.hasBadge
                    ? 'bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.hasBadge && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* TAB 1: VENDOR-TO-COLLECTOR TRANSACTIONS & AUTHORITY FOLDERS */}
        {activeTab === 'transactions_ledger' && (
          <div className="animate-fadeIn">
            <GovernmentTransactionLedger lots={lots} />
          </div>
        )}

        {/* TAB: CPCB CATEGORY APPROVAL DESK */}
        {activeTab === 'category_approvals' && (
          <div className="animate-fadeIn">
            <CpcbCategoryApprovalsDesk />
          </div>
        )}

        {/* TAB: PARTNER REGISTRATIONS DESK (APPLIED VIA AUTHORITY -> REQUIRES GOVT APPROVAL) */}
        {activeTab === 'partner_approvals' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                      Statutory Clearance
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-mono font-bold">
                      Authority Endorsed Queue
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Partner Registration & Formal Accreditation Desk
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                    Partner applications initiated via State Regulatory Authorities (MPCB, KSPCB, DPCC).
                    Government CPCB clearance is required to activate operational permits and issue official Central E-Waste IDs.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-900">
                    Pending Clearance: <span className="font-bold text-amber-700">{pendingPartnersCount}</span>
                  </div>
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900">
                    Total Registered: <span className="font-bold text-emerald-700">{partnerRegistrations.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Registrations List */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Applications Queue ({partnerRegistrations.length} Total Records)</span>
                </h3>

                <button
                  type="button"
                  onClick={() => setShowPartnerModal(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>+ Submit Partner Application</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Entity & License</th>
                      <th className="py-3 px-4">Authority & Region</th>
                      <th className="py-3 px-4">Contact Person</th>
                      <th className="py-3 px-4">Type & Capacity</th>
                      <th className="py-3 px-4">Authorized Streams</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Clearance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {partnerRegistrations.map((partner) => {
                      const isPending = partner.status === 'PENDING_GOVT_APPROVAL';
                      return (
                        <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs">
                              {partner.facilityName || partner.companyName || partner.name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              Lic/ID: {partner.spcbLicenseNo || partner.aadhaarOrGst || partner.id}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">Applied: {partner.appliedDate}</div>
                            {partner.assignedCpcbPartnerId && (
                              <div className="text-[10px] text-emerald-700 font-bold mt-1">
                                CPCB ID: {partner.assignedCpcbPartnerId}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">
                              {partner.statePcb || `${partner.state} SPCB (${partner.registeredByAuthorityId})`}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                              {partner.facilityAddress || `${partner.ward}, ${partner.city}`}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{partner.applicantName || partner.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{partner.contactPhone || partner.phone}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{partner.contactEmail || partner.bankUpi}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold">
                              {partner.partnerType ? (partner.partnerType === 'RECYCLER_FACILITY' ? 'Recycling Plant' : 'Aggregator Hub') : partner.tier}
                            </span>
                            <div className="text-[10px] text-slate-600 mt-1 font-bold">
                              {partner.annualCapacityMetricTons 
                                ? `${partner.annualCapacityMetricTons} MT / Year`
                                : partner.tier === 'Gold Partner' 
                                ? '120 MT / Year' 
                                : partner.tier === 'Silver Partner' 
                                ? '60 MT / Year' 
                                : '30 MT / Year'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {(partner.categoriesHandled || ['PCBs & Chips', 'Lithium Batteries', 'Copper Wiring']).map((cat, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px]">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              partner.status === 'APPROVED' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : partner.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {partner.status === 'PENDING_GOVT_APPROVAL' ? 'PENDING APPROVAL' : partner.status}
                            </span>
                            {partner.rejectionReason && (
                              <div className="text-[9px] text-rose-600 mt-1 italic">
                                Reason: {partner.rejectionReason}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => approvePartner(partner.id, 'Dr. R. K. Sharma (CPCB Western Zone)')}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                  title="Issue official CPCB Partner Registration ID"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectModalData({ id: partner.id, name: partner.companyName });
                                    setRejectReasonInput('');
                                  }}
                                  className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Reject application with statutory reason"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 font-mono text-right">
                                {partner.status === 'APPROVED' ? `Cleared by ${partner.approvedBy || 'Govt'}` : 'Clearance Denied'}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Total Traceable E-Waste</div>
                <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
                  {(lots.reduce((acc, l) => acc + (l.weighbridgeWeightKg || l.weightKg), 0) / 1000).toFixed(2)} MT
                </div>
                <div className="text-[11px] text-emerald-700 font-mono mt-1 font-semibold">Verified on CPCB Registry</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Registered Kabadiwalas</div>
                <div className="text-2xl font-black font-mono text-teal-700 mt-1">4,812</div>
                <div className="text-[11px] text-teal-700 font-mono mt-1 font-semibold">Formalized with Digital ID</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Direct UPI Disbursed</div>
                <div className="text-2xl font-black font-mono text-amber-700 mt-1">₹4.82 Cr</div>
                <div className="text-[11px] text-amber-700 font-mono mt-1 font-semibold">Zero Middleman Arbitrage</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Authorized Units (EPR)</div>
                <div className="text-2xl font-black font-mono text-indigo-700 mt-1">128 Facilities</div>
                <div className="text-[11px] text-indigo-700 font-mono mt-1 font-semibold">100% SPCB Authorized</div>
              </div>
            </div>

            {/* Regulatory Research Modules Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:shadow-md transition-all shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3 text-emerald-700">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">National E-Waste Datasets</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Structured CPCB datasets covering 12,000+ transaction points, hazardous material schemas, recyclers registry, and AI calibration metrics.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDatasetsModal(true)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Launch Interactive Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-500 hover:shadow-md transition-all shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-3 text-indigo-700">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Field Usability Research</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Comprehensive socio-economic field research across 45 Pune scrap aggregators. Illiteracy mitigation, multilingual voice adoption, and safety protocol outcomes.
                </p>
                <button
                  type="button"
                  onClick={() => setShowFieldResearchModal(true)}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Open Field Research Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-500 hover:shadow-md transition-all shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3 text-amber-700">
                  <Calculator className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Unit Economics & EPR Model</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Macro and micro unit economics models comparing informal acid-leaching vs formal hydrometallurgical recovery, margins, and EPR certificate revenue.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUnitEconomicsModal(true)}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Open Economics Simulator</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Ministry Mandate Notice */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-950 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Statutory Compliance with E-Waste (Management) Rules, 2022</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                Under Section 4(1) and Schedule III of the E-Waste Rules 2022, all informal collection channels are mandated to be integrated into formal digital registries. E-Kabad Setu provides the official digital trail from the scrap collector's hand directly to SPCB/CPCB licensed hydrometallurgical recycling facilities with end-to-end mass balance validation.
              </p>
            </div>
          </div>
        )}

        {/* TAB: DATASETS DIRECT VIEW */}
        {activeTab === 'datasets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">National E-Waste Datasets & Schema Hub</h2>
                <p className="text-xs text-slate-500">View CPCB validated datasets across materials, pricing, recyclers, and traceability logs.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDatasetsModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full-Screen Explorer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-xs font-bold text-emerald-800 uppercase font-mono mb-2">Available Schemas</div>
                <ul className="text-xs space-y-2 text-slate-700">
                  <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span>1. Material Master (CPCB Hazard & Composition)</span>
                    <span className="font-mono text-emerald-700 font-bold">12 Items</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span>2. Mandi Price Index (Historical Scrap Rates)</span>
                    <span className="font-mono text-emerald-700 font-bold">7 Days</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span>3. Authorized Recycler Facilities Registry</span>
                    <span className="font-mono text-emerald-700 font-bold">4 Units</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span>4. Traceability Ledger & GPS Handover Records</span>
                    <span className="font-mono text-emerald-700 font-bold">14 Records</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>5. AI Vision Multimodal Diagnostic Benchmarks</span>
                    <span className="font-mono text-emerald-700 font-bold">94.8% SLA</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase font-mono mb-2">Export Data Format</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    All datasets are downloadable in standard CSV and JSON schemas conforming to National Open Digital Ecosystem (NODE) standards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDatasetsModal(true)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mt-4 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Access Data Tables & CSV Download</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: FIELD RESEARCH */}
        {activeTab === 'field_research' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pune Informal Sector Usability & Ethnographic Study</h2>
                <p className="text-xs text-slate-500">Ground data collected from 45 scrap collectors in Shivajinagar, Bhosari MIDC, and Kasba Peth.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFieldResearchModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full Research Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-2xl font-black font-mono text-indigo-700">84%</div>
                <div className="text-xs font-bold text-slate-900 mt-1">Audio/Voice Preference</div>
                <p className="text-[11px] text-slate-600 mt-1">Illiterate or semi-literate collectors rely on spoken Hindi/Marathi rate readouts over text.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-2xl font-black font-mono text-emerald-700">3.2x</div>
                <div className="text-xs font-bold text-slate-900 mt-1">PPE Gear Adoption</div>
                <p className="text-[11px] text-slate-600 mt-1">Visual gamified badges increased heavy glove and mask usage from 22% to 71%.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-2xl font-black font-mono text-amber-700">100%</div>
                <div className="text-xs font-bold text-slate-900 mt-1">Direct Settlement SLA</div>
                <p className="text-[11px] text-slate-600 mt-1">Instant UPI transfer eliminated the typical 7-14 day payment delay imposed by informal mafia aggregators.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: UNIT ECONOMICS */}
        {activeTab === 'unit_economics' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">Macro E-Waste Unit Economics & EPR Trading Engine</h2>
                <p className="text-xs text-slate-500">Detailed financial analysis of procurement margins, refining recovery rates, and EPR certificate values.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUnitEconomicsModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Financial Model</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-2xl font-black font-mono text-emerald-700">₹85,000 / MT</div>
                <div className="text-xs font-bold text-slate-900 mt-1">Gross Margin (Formal Recycler)</div>
                <p className="text-[11px] text-slate-600 mt-1">Derived from hydrometallurgical extraction of copper, gold, palladium, and lithium.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-2xl font-black font-mono text-teal-700">₹14,500 / MT</div>
                <div className="text-xs font-bold text-slate-900 mt-1">EPR Trading Credit Yield</div>
                <p className="text-[11px] text-slate-600 mt-1">Monetized by selling CPCB verified recycling credits to electronics OEMs (e.g. Dell, Samsung).</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="text-2xl font-black font-mono text-amber-700">+38%</div>
                <div className="text-xs font-bold text-slate-900 mt-1">Kabadiwala Income Boost</div>
                <p className="text-[11px] text-slate-600 mt-1">Direct aggregator-bypassing price parity transfers additional value to the waste picker.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: STATE PCB AUDIT */}
        {activeTab === 'state_audit' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">State Pollution Control Boards (SPCB) Real-Time Compliance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live monitoring of authorized formal recyclers and inbound verification quotas.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">State SPCB</th>
                    <th className="py-3 px-4">Authorized Units</th>
                    <th className="py-3 px-4">Monthly Quota</th>
                    <th className="py-3 px-4">Current Diverted</th>
                    <th className="py-3 px-4">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Maharashtra (MPCB)</td>
                    <td className="py-3 px-4">42 Facilities</td>
                    <td className="py-3 px-4">1,200 MT</td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">1,048 MT (87%)</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                        COMPLIANT
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Gujarat (GPCB)</td>
                    <td className="py-3 px-4">38 Facilities</td>
                    <td className="py-3 px-4">980 MT</td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">892 MT (91%)</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                        COMPLIANT
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Karnataka (KSPCB)</td>
                    <td className="py-3 px-4">29 Facilities</td>
                    <td className="py-3 px-4">750 MT</td>
                    <td className="py-3 px-4 text-amber-700 font-bold">590 MT (78%)</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                        ACTIVE AUDIT
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Delhi NCR (DPCC)</td>
                    <td className="py-3 px-4">19 Facilities</td>
                    <td className="py-3 px-4">500 MT</td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">465 MT (93%)</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                        COMPLIANT
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals Hosted Exclusively for Government Role */}
      {showDatasetsModal && (
        <DatasetsExplorerModal onClose={() => setShowDatasetsModal(false)} />
      )}

      {showFieldResearchModal && (
        <FieldResearchModal onClose={() => setShowFieldResearchModal(false)} />
      )}

      {showUnitEconomicsModal && (
        <UnitEconomicsModal onClose={() => setShowUnitEconomicsModal(false)} />
      )}

      {/* GOVERNMENT HELPDESK MODAL */}
      <HelpDeskModal
        isOpen={showHelpDeskModal}
        onClose={() => setShowHelpDeskModal(false)}
        portalType="government"
        userName="Dr. R. K. Sharma"
        userId="GOV-OFFICER-CPCB"
        userPhone="+91 11 4310 2000"
      />

      {/* PARTNER REJECTION REASON MODAL */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Reject Partner Application</span>
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Please specify the statutory justification for rejecting accreditation of{' '}
              <span className="font-bold text-slate-900">{rejectModalData.name}</span>.
            </p>
            <textarea
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="e.g. Inadequate hazardous emission containment systems; invalid CTE/CTO under Air & Water Act."
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalData(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectReasonInput.trim()) return;
                  rejectPartner(rejectModalData.id, rejectReasonInput.trim());
                  setRejectModalData(null);
                }}
                disabled={!rejectReasonInput.trim()}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PARTNER REGISTRATION MODAL */}
      <PartnerRegistrationModal
        isOpen={showPartnerModal}
        onClose={() => setShowPartnerModal(false)}
      />
    </div>
  );
};
