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
  Folder
} from 'lucide-react';
import { DatasetsExplorerModal } from './DatasetsExplorerModal';
import { FieldResearchModal } from './FieldResearchModal';
import { UnitEconomicsModal } from './UnitEconomicsModal';
import { CpcbCategoryApprovalsDesk } from './CpcbCategoryApprovalsDesk';
import { GovernmentTransactionLedger } from './GovernmentTransactionLedger';
import { playFeedbackChime } from '../utils/speech';

export const GovernmentAuditPortal: React.FC = () => {
  const { setCurrentView, lots, recycler, categoryRequests } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions_ledger' | 'category_approvals' | 'datasets' | 'field_research' | 'unit_economics' | 'state_audit'>('transactions_ledger');
  const [showDatasetsModal, setShowDatasetsModal] = useState(false);
  const [showFieldResearchModal, setShowFieldResearchModal] = useState(false);
  const [showUnitEconomicsModal, setShowUnitEconomicsModal] = useState(false);

  const pendingRequestsCount = categoryRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Ministry Banner */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-slate-200 font-semibold">MINISTRY OF ENVIRONMENT, FOREST AND CLIMATE CHANGE (MoEFCC)</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">CPCB REGULATORY PORTAL</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded font-mono">
            SECURE ACCESS: GOVT / REGULATOR ONLY
          </span>
          <button
            type="button"
            onClick={() => {
              playFeedbackChime('beep');
              setCurrentView('gateway');
            }}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Gateway</span>
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-0.5 shadow-lg flex items-center justify-center text-white">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">
                  National E-Waste Regulatory & Research Portal
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                  E-Waste Rules 2022
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Central Pollution Control Board (CPCB) Regulatory Cell • Formalization & EPR Audit
              </p>
            </div>
          </div>

          {/* Quick Nav Switches */}
          <div className="flex items-center gap-2">
            <div className="text-right mr-3 hidden lg:block">
              <div className="text-[11px] font-mono text-slate-400">Authenticated Auditor</div>
              <div className="text-xs font-bold text-slate-200">Dr. R. K. Sharma (CPCB Western Zone)</div>
            </div>
            <button
              type="button"
              onClick={() => {
                playFeedbackChime('beep');
                setCurrentView('recycler');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Switch to Recycler ERP View"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recycler ERP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playFeedbackChime('beep');
                setCurrentView('collector');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Switch to Collector Saathi View"
            >
              <span>Collector App</span>
            </button>
          </div>
        </div>
      </header>

      {/* Nav Tabs */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 sticky top-[73px] z-20">
        <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto py-2">
          {[
            { id: 'transactions_ledger', label: '1. Vendor-to-Collector Transactions & Folders', icon: FolderOpen, highlight: true },
            { id: 'overview', label: '2. National Regulatory Overview', icon: ShieldCheck },
            { id: 'category_approvals', label: `3. CPCB Category Approval Desk ${pendingRequestsCount > 0 ? `(${pendingRequestsCount} PENDING)` : ''}`, icon: Award, hasBadge: pendingRequestsCount > 0 },
            { id: 'datasets', label: '4. Field Datasets & Schemas', icon: Database },
            { id: 'field_research', label: '5. Field Usability Research', icon: BookOpen },
            { id: 'unit_economics', label: '6. Macro Unit Economics Model', icon: Calculator },
            { id: 'state_audit', label: '7. State PCB Compliance Ledger', icon: Layers }
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
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : tab.hasBadge
                    ? 'bg-amber-950/60 border border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.hasBadge && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Total Traceable E-Waste</div>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                  {(lots.reduce((acc, l) => acc + (l.weighbridgeWeightKg || l.weightKg), 0) / 1000).toFixed(2)} MT
                </div>
                <div className="text-[11px] text-emerald-500 font-mono mt-1">Verified on CPCB Registry</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Registered Kabadiwalas</div>
                <div className="text-2xl font-black font-mono text-teal-300 mt-1">4,812</div>
                <div className="text-[11px] text-teal-400 font-mono mt-1">Formalized with Digital ID</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Direct UPI Disbursed</div>
                <div className="text-2xl font-black font-mono text-amber-400 mt-1">₹4.82 Cr</div>
                <div className="text-[11px] text-amber-300 font-mono mt-1">Zero Middleman Arbitrage</div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Authorized Units (EPR)</div>
                <div className="text-2xl font-black font-mono text-indigo-400 mt-1">128 Facilities</div>
                <div className="text-[11px] text-indigo-300 font-mono mt-1">100% SPCB Authorized</div>
              </div>
            </div>

            {/* Regulatory Research Modules Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 hover:border-emerald-500/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                  <Database className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">National E-Waste Datasets</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Structured CPCB datasets covering 12,000+ transaction points, hazardous material schemas, recyclers registry, and AI calibration metrics.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDatasetsModal(true)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Launch Interactive Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 hover:border-indigo-500/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Field Usability Research</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Comprehensive socio-economic field research across 45 Pune scrap aggregators. Illiteracy mitigation, multilingual voice adoption, and safety protocol outcomes.
                </p>
                <button
                  type="button"
                  onClick={() => setShowFieldResearchModal(true)}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Open Field Research Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 hover:border-amber-500/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                  <Calculator className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Unit Economics & EPR Model</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Macro and micro unit economics models comparing informal acid-leaching vs formal hydrometallurgical recovery, margins, and EPR certificate revenue.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUnitEconomicsModal(true)}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Open Economics Simulator</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Ministry Mandate Notice */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Statutory Compliance with E-Waste (Management) Rules, 2022</span>
              </div>
              <p className="leading-relaxed text-slate-400">
                Under Section 4(1) and Schedule III of the E-Waste Rules 2022, all informal collection channels are mandated to be integrated into formal digital registries. E-Kabad Setu provides the official digital trail from the scrap collector's hand directly to SPCB/CPCB licensed hydrometallurgical recycling facilities with end-to-end mass balance validation.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: DATASETS DIRECT VIEW */}
        {activeTab === 'datasets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <h2 className="text-base font-bold text-white">National E-Waste Datasets & Schema Hub</h2>
                <p className="text-xs text-slate-400">View CPCB validated datasets across materials, pricing, recyclers, and traceability logs.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDatasetsModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full-Screen Explorer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                <div className="text-xs font-bold text-emerald-400 uppercase font-mono mb-2">Available Schemas</div>
                <ul className="text-xs space-y-2 text-slate-300">
                  <li className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                    <span>1. Material Master (CPCB Hazard & Composition)</span>
                    <span className="font-mono text-emerald-400 font-bold">12 Items</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                    <span>2. Mandi Price Index (Historical Scrap Rates)</span>
                    <span className="font-mono text-emerald-400 font-bold">7 Days</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                    <span>3. Authorized Recycler Facilities Registry</span>
                    <span className="font-mono text-emerald-400 font-bold">4 Units</span>
                  </li>
                  <li className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                    <span>4. Traceability Ledger & GPS Handover Records</span>
                    <span className="font-mono text-emerald-400 font-bold">14 Records</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>5. AI Vision Multimodal Diagnostic Benchmarks</span>
                    <span className="font-mono text-emerald-400 font-bold">94.8% SLA</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200 uppercase font-mono mb-2">Export Data Format</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All datasets are downloadable in standard CSV and JSON schemas conforming to National Open Digital Ecosystem (NODE) standards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDatasetsModal(true)}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mt-4"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Access Data Tables & CSV Download</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FIELD RESEARCH */}
        {activeTab === 'field_research' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <h2 className="text-base font-bold text-white">Pune Informal Sector Usability & Ethnographic Study</h2>
                <p className="text-xs text-slate-400">Ground data collected from 45 scrap collectors in Shivajinagar, Bhosari MIDC, and Kasba Peth.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFieldResearchModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full Research Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                <div className="text-2xl font-black font-mono text-indigo-400">84%</div>
                <div className="text-xs font-bold text-slate-200 mt-1">Audio/Voice Preference</div>
                <p className="text-[11px] text-slate-400 mt-1">Illiterate or semi-literate collectors rely on spoken Hindi/Marathi rate readouts over text.</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                <div className="text-2xl font-black font-mono text-emerald-400">3.2x</div>
                <div className="text-xs font-bold text-slate-200 mt-1">PPE Gear Adoption</div>
                <p className="text-[11px] text-slate-400 mt-1">Visual gamified badges increased heavy glove and mask usage from 22% to 71%.</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                <div className="text-2xl font-black font-mono text-amber-400">100%</div>
                <div className="text-xs font-bold text-slate-200 mt-1">Direct Settlement SLA</div>
                <p className="text-[11px] text-slate-400 mt-1">Instant UPI transfer eliminated the typical 7-14 day payment delay imposed by informal mafia aggregators.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: UNIT ECONOMICS */}
        {activeTab === 'unit_economics' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <h2 className="text-base font-bold text-white">Macro E-Waste Unit Economics & EPR Trading Engine</h2>
                <p className="text-xs text-slate-400">Detailed financial analysis of procurement margins, refining recovery rates, and EPR certificate values.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUnitEconomicsModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Financial Model</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                <div className="text-2xl font-black font-mono text-emerald-400">₹85,000 / MT</div>
                <div className="text-xs font-bold text-slate-200 mt-1">Gross Margin (Formal Recycler)</div>
                <p className="text-[11px] text-slate-400 mt-1">Derived from hydrometallurgical extraction of copper, gold, palladium, and lithium.</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                <div className="text-2xl font-black font-mono text-teal-400">₹14,500 / MT</div>
                <div className="text-xs font-bold text-slate-200 mt-1">EPR Trading Credit Yield</div>
                <p className="text-[11px] text-slate-400 mt-1">Monetized by selling CPCB verified recycling credits to electronics OEMs (e.g. Dell, Samsung).</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                <div className="text-2xl font-black font-mono text-amber-400">+38%</div>
                <div className="text-xs font-bold text-slate-200 mt-1">Kabadiwala Income Boost</div>
                <p className="text-[11px] text-slate-400 mt-1">Direct aggregator-bypassing price parity transfers additional value to the waste picker.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STATE PCB AUDIT */}
        {activeTab === 'state_audit' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <h2 className="text-base font-bold text-white">State Pollution Control Boards (SPCB) Real-Time Compliance</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live monitoring of authorized formal recyclers and inbound verification quotas.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">State SPCB</th>
                    <th className="py-3 px-4">Authorized Units</th>
                    <th className="py-3 px-4">Monthly Quota</th>
                    <th className="py-3 px-4">Current Diverted</th>
                    <th className="py-3 px-4">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-300">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">Maharashtra (MPCB)</td>
                    <td className="py-3 px-4">42 Facilities</td>
                    <td className="py-3 px-4">1,200 MT</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">1,048 MT (87%)</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        COMPLIANT
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">Gujarat (GPCB)</td>
                    <td className="py-3 px-4">38 Facilities</td>
                    <td className="py-3 px-4">980 MT</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">892 MT (91%)</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        COMPLIANT
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">Karnataka (KSPCB)</td>
                    <td className="py-3 px-4">29 Facilities</td>
                    <td className="py-3 px-4">750 MT</td>
                    <td className="py-3 px-4 text-amber-400 font-bold">590 MT (78%)</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        ACTIVE AUDIT
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">Delhi NCR (DPCC)</td>
                    <td className="py-3 px-4">19 Facilities</td>
                    <td className="py-3 px-4">500 MT</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">465 MT (93%)</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
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
    </div>
  );
};
