import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Database, 
  BookOpen, 
  Calculator, 
  ArrowLeft, 
  ExternalLink,
  Layers,
  Building2,
  TrendingUp,
  Download,
  CheckCircle2,
  Lock,
  Folder,
  ChevronRight,
  ChevronDown,
  User,
  Scale,
  Award,
  Clock,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { GovernmentTransactionLedger } from './GovernmentTransactionLedger';
import { DatasetsExplorerModal } from './DatasetsExplorerModal';
import { FieldResearchModal } from './FieldResearchModal';
import { UnitEconomicsModal } from './UnitEconomicsModal';
import { playFeedbackChime } from '../utils/speech';

export const GovernmentAuditPortal: React.FC = () => {
  const { setCurrentView, logout, lots } = useApp();

  // Primary navigation: Tab 1 (Default: 4-Tier State Folders Transaction Dossier), Tab 2 (National Overview & Compliance), Tab 3 (Research & Schemas Repository)
  const [activeTab, setActiveTab] = useState<'dossier' | 'overview' | 'research_repository'>('dossier');

  // Sub-folder accordion states for Tab 3 (Repository)
  const [expandedSubFolders, setExpandedSubFolders] = useState<Record<string, boolean>>({
    datasets: true,
    ethnographic: true,
    economics: true
  });

  const toggleSubFolder = (id: string) => {
    setExpandedSubFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Modals
  const [showDatasetsModal, setShowDatasetsModal] = useState(false);
  const [showFieldResearchModal, setShowFieldResearchModal] = useState(false);
  const [showUnitEconomicsModal, setShowUnitEconomicsModal] = useState(false);

  // Calculate live KPI metrics
  const totalVerifiedWeightMT = (
    lots.reduce((acc, l) => acc + (l.weighbridgeWeightKg || l.weightKg || 0), 0) / 1000 +
    1420.5
  ).toFixed(2);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* TOP MINISTRY GOVERNMENT BANNER (Formal, High-Contrast Regulatory Top Bar) */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-bold text-slate-100">
            MINISTRY OF ENVIRONMENT, FOREST AND CLIMATE CHANGE (MoEFCC)
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-semibold">
            CENTRAL POLLUTION CONTROL BOARD (CPCB)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
            SECURE AUDIT CLEARANCE: CPCB OFFICER ONLY
          </span>
          <button
            type="button"
            onClick={() => {
              playFeedbackChime('beep');
              logout();
            }}
            className="text-xs text-slate-400 hover:text-slate-100 flex items-center gap-1 transition-colors cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Gateway</span>
          </button>
        </div>
      </div>

      {/* MAIN HEADER (Utilitarian Engineer Aesthetic, Light Theme with Emerald Accents) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Portal Authority Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  National E-Waste Regulatory & Audit Portal
                </h1>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                  E-Waste Rules 2022
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Official Digital Surveillance • Formalization & Mass Balance Traceability Ledger
              </p>
            </div>
          </div>

          {/* Officer Credentials & Cross-Portal Nav Switcher */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <div className="text-right mr-2 hidden lg:block font-mono">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Authenticated Auditor</div>
              <div className="text-xs font-bold text-slate-800">Dr. R. K. Sharma (CPCB Western Zone)</div>
            </div>

            <button
              type="button"
              onClick={() => {
                playFeedbackChime('beep');
                setCurrentView('recycler');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Recycler ERP Portal"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-700" />
              <span>Recycler ERP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playFeedbackChime('beep');
                setCurrentView('collector');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Scrap Collector Portal"
            >
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>Collector App</span>
            </button>
          </div>
        </div>

        {/* PRIMARY NAVIGATION TABS (Tab 1 is Default) */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto py-2">
            {[
              {
                id: 'dossier',
                label: '1. Transaction Audit Dossier (State Folders)',
                icon: Folder,
                highlight: true
              },
              {
                id: 'overview',
                label: '2. National Overview & SPCB Compliance',
                icon: ShieldCheck,
                highlight: false
              },
              {
                id: 'research_repository',
                label: '3. Research, Schemas & Economic Models Repository',
                icon: Database,
                highlight: false
              }
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
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold font-mono flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex-1 w-full space-y-6">
        {/* TAB 1: 4-TIER TRANSACTION AUDIT DOSSIER (DEFAULT VIEW) */}
        {activeTab === 'dossier' && (
          <GovernmentTransactionLedger lots={lots} />
        )}

        {/* TAB 2: NATIONAL OVERVIEW & SPCB COMPLIANCE */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Total Traceable E-Waste
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-800 mt-1 tabular-nums">
                  {totalVerifiedWeightMT} MT
                </div>
                <div className="text-[11px] text-emerald-700 font-mono mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified CPCB Registry
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Registered Kabadiwalas
                </div>
                <div className="text-2xl font-bold font-mono text-indigo-900 mt-1 tabular-nums">
                  4,812
                </div>
                <div className="text-[11px] text-indigo-700 font-mono mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Formalized with Digital ID
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Direct UPI Disbursed
                </div>
                <div className="text-2xl font-bold font-mono text-amber-800 mt-1 tabular-nums">
                  ₹4.82 Cr
                </div>
                <div className="text-[11px] text-amber-700 font-mono mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Zero Middleman Arbitrage
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Authorized Units (EPR)
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  128 Facilities
                </div>
                <div className="text-[11px] text-slate-600 font-mono mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  100% SPCB Authorized
                </div>
              </div>
            </div>

            {/* SPCB REAL-TIME COMPLIANCE TABLE */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-900">
                  State Pollution Control Boards (SPCB) Real-Time Compliance Ledger
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Surveillance quotas and authorized informal channel integration rates across frontline state jurisdictions.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 text-slate-700 uppercase border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">State SPCB</th>
                      <th className="py-2.5 px-4">Authorized Units</th>
                      <th className="py-2.5 px-4">Monthly Quota</th>
                      <th className="py-2.5 px-4">Current Diverted</th>
                      <th className="py-2.5 px-4">Compliance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">Maharashtra (MPCB)</td>
                      <td className="py-3 px-4 text-slate-700">42 Facilities</td>
                      <td className="py-3 px-4 text-slate-700">1,200 MT</td>
                      <td className="py-3 px-4 text-emerald-800 font-bold tabular-nums">1,048 MT (87%)</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                          COMPLIANT
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">Gujarat (GPCB)</td>
                      <td className="py-3 px-4 text-slate-700">38 Facilities</td>
                      <td className="py-3 px-4 text-slate-700">980 MT</td>
                      <td className="py-3 px-4 text-emerald-800 font-bold tabular-nums">892 MT (91%)</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                          COMPLIANT
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">Karnataka (KSPCB)</td>
                      <td className="py-3 px-4 text-slate-700">29 Facilities</td>
                      <td className="py-3 px-4 text-slate-700">750 MT</td>
                      <td className="py-3 px-4 text-amber-800 font-bold tabular-nums">590 MT (78%)</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                          ACTIVE AUDIT
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">Delhi NCR (DPCC)</td>
                      <td className="py-3 px-4 text-slate-700">19 Facilities</td>
                      <td className="py-3 px-4 text-slate-700">500 MT</td>
                      <td className="py-3 px-4 text-emerald-800 font-bold tabular-nums">465 MT (93%)</td>
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

            {/* STATUTORY MANDATE NOTICE */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
              <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Statutory Compliance Notice: E-Waste (Management) Rules, 2022</span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Under Section 4(1) and Schedule III of the E-Waste Rules 2022, all informal collection channels are mandated to be integrated into formal digital registries. E-Kabad Setu provides the official digital audit trail from the scrap collector directly to SPCB/CPCB licensed hydrometallurgical recycling facilities with end-to-end mass balance validation.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: RESEARCH, SCHEMAS & ECONOMIC MODELS REPOSITORY (MINIMIZED INTO 3 ACCORDION FOLDER CARDS) */}
        {activeTab === 'research_repository' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">
                Government Research, Schemas & Economic Repository
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Organized into 3 expandable reference sub-folders. 100% of field studies, data models, and economic simulators are preserved and accessible below.
              </p>
            </div>

            {/* SUB-FOLDER 3.1: NATIONAL DATASETS & SCHEMAS */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleSubFolder('datasets')}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      3.1 National E-Waste Datasets & Schema Hub
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Structured CPCB datasets covering 12,000+ transaction points, hazardous schemas, and NODE formats
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    5 Schemas Active
                  </span>
                  {expandedSubFolders.datasets ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {expandedSubFolders.datasets && (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Available Schemas List */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      <div className="text-xs font-bold text-slate-700 uppercase font-mono mb-2">
                        Available Open Schemas
                      </div>
                      <ul className="text-xs space-y-2 text-slate-700 font-mono">
                        <li className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span>1. Material Master (CPCB Hazard & Composition)</span>
                          <span className="text-emerald-800 font-bold">12 Items</span>
                        </li>
                        <li className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span>2. Mandi Price Index (Historical Scrap Rates)</span>
                          <span className="text-emerald-800 font-bold">7 Days</span>
                        </li>
                        <li className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span>3. Authorized Recycler Facilities Registry</span>
                          <span className="text-emerald-800 font-bold">4 Units</span>
                        </li>
                        <li className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span>4. Traceability Ledger & GPS Handover Records</span>
                          <span className="text-emerald-800 font-bold">14 Records</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>5. AI Vision Multimodal Diagnostic Benchmarks</span>
                          <span className="text-emerald-800 font-bold">94.8% SLA</span>
                        </li>
                      </ul>
                    </div>

                    {/* Export Format Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-700 uppercase font-mono mb-1.5">
                          NODE Data Interoperability
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          All datasets are downloadable in standard CSV and JSON schemas conforming to National Open Digital Ecosystem (NODE) interoperability standards for statutory reporting.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => setShowDatasetsModal(true)}
                          className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Launch Interactive Explorer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SUB-FOLDER 3.2: PUNE INFORMAL STUDY */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleSubFolder('ethnographic')}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-800">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      3.2 Pune Informal Aggregators Usability & Ethnographic Study
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Field empirical research across 45 scrap collectors in Shivajinagar, Bhosari MIDC, and Kasba Peth
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                    45 Aggregators Sampled
                  </span>
                  {expandedSubFolders.ethnographic ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {expandedSubFolders.ethnographic && (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      <div className="text-2xl font-bold font-mono text-indigo-900 tabular-nums">
                        84%
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1">
                        Audio/Voice Preference
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Illiterate or semi-literate collectors rely on spoken Hindi/Marathi rate readouts over text.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      <div className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                        3.2x
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1">
                        PPE Gear Adoption
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Visual gamified badges increased heavy glove and mask usage from 22% to 71%.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      <div className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
                        100%
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1">
                        Direct Settlement SLA
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Instant UPI transfer eliminated the typical 7-14 day payment delay imposed by informal mafia aggregators.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowFieldResearchModal(true)}
                      className="py-2 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Full Ethnographic Dossier</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SUB-FOLDER 3.3: UNIT ECONOMICS & EPR MODEL */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleSubFolder('economics')}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      3.3 Macro Hydrometallurgical Unit Economics & EPR Engine
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Macro and micro unit economics models comparing informal acid-leaching vs formal hydrometallurgical recovery
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                    EPR Certificate Model
                  </span>
                  {expandedSubFolders.economics ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {expandedSubFolders.economics && (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      <div className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                        ₹85,000 / MT
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1">
                        Gross Margin (Formal Recycler)
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Derived from hydrometallurgical extraction of copper, gold, palladium, and lithium.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      <div className="text-2xl font-bold font-mono text-teal-800 tabular-nums">
                        ₹14,500 / MT
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1">
                        EPR Trading Credit Yield
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Monetized by selling CPCB verified recycling credits to electronics OEMs (e.g. Dell, Samsung).
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      <div className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
                        +38%
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1">
                        Kabadiwala Income Boost
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Direct aggregator-bypassing price parity transfers additional value to the waste picker.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowUnitEconomicsModal(true)}
                      className="py-2 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Economics Simulator</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODALS (PRESERVED 100%) */}
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
