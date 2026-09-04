import React, { useState } from 'react';
import { 
  X, 
  Users, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Volume2, 
  Quote, 
  FileText,
  DollarSign
} from 'lucide-react';
import { FIELD_RESEARCH_CASE_STUDIES } from '../data/datasets';

interface FieldResearchModalProps {
  onClose: () => void;
}

export const FieldResearchModal: React.FC<FieldResearchModalProps> = ({ onClose }) => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const activeCase = FIELD_RESEARCH_CASE_STUDIES[activeCaseIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Field Research & Usability Study</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Primary Scrapyard Fieldwork
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Conducted with working informal scrap collectors and aggregators in Dharavi (Mumbai) and Bhosari MIDC (Pune).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collector Selector Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 p-2 flex gap-2">
          {FIELD_RESEARCH_CASE_STUDIES.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => setActiveCaseIndex(idx)}
              className={`flex-1 py-3 px-4 rounded-xl text-left transition-all ${
                activeCaseIndex === idx
                  ? 'bg-white shadow-sm border border-slate-200 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm">{c.collectorName}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {c.experienceYears} yrs scrap exp.
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span className="truncate">{c.cluster.split(',')[0]}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Active Collector Details */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50">
          
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{activeCase.collectorName}</h3>
                  <span className="text-xs text-slate-500 font-semibold">Age {activeCase.age}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{activeCase.cluster}</span>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-right">
                <div className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider">Pilot Income Impact</div>
                <div className="text-lg font-black text-emerald-800 font-mono">+60.5% Net Monthly Gain</div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Literacy & Technology Profile</h4>
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {activeCase.literacyLevel}
              </p>
            </div>
          </div>

          {/* Core Findings: Before vs After Platform Bridge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Informal Baseline Practice */}
            <div className="bg-red-50/70 rounded-2xl p-5 border border-red-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-red-800 font-extrabold text-sm border-b border-red-200 pb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Informal Baseline (Pre-Platform)</span>
              </div>

              <div>
                <h5 className="text-xs font-bold text-red-900 mb-1">Hazardous Backyard Processing</h5>
                <p className="text-xs text-red-950 leading-relaxed">
                  {activeCase.initialInformalPractice}
                </p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-red-900 mb-1.5">Key Field Pain Points Observed:</h5>
                <ul className="space-y-1.5 text-xs text-red-900">
                  {activeCase.painPointsIdentified.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-red-500 font-bold mt-0.5">✕</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: E-Kabad Setu Formal Bridge */}
            <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm border-b border-emerald-200 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>E-Kabad Setu Formal Pilot Outcome</span>
              </div>

              <div>
                <h5 className="text-xs font-bold text-emerald-900 mb-1">Formal Handover & Safety Transition</h5>
                <p className="text-xs text-emerald-950 leading-relaxed">
                  Connected directly to CPCB authorized dismantling units with calibrated digital weighbridge verification and safety gear support.
                </p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-emerald-900 mb-1.5">Measured Field Usability Gains:</h5>
                <ul className="space-y-1.5 text-xs text-emerald-900">
                  {activeCase.platformInterventionOutcomes.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* Specific Usability Accommodations Built into App */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h4 className="font-black text-slate-900 text-sm sm:text-base mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              Direct Usability Accommodations Implemented from Fieldwork
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-0.5">1. Voice First & Vernacular Audio</div>
                <p className="text-slate-600">Every price card, hazard guideline, and lot value can be spoken aloud in Hindi or Marathi with one tap.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-0.5">2. Paperless Offline QR Token</div>
                <p className="text-slate-600">Zero paperwork required from collector. Recycler scans digital QR code to verify weight and issue immediate cash.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-0.5">3. Optional Cash Payout</div>
                <p className="text-slate-600">Collectors are never forced to use digital bank accounts. Cash is fully tracked on the CPCB chain of custody.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Fieldwork Conducted under Ministry of Environment, Forest & Climate Change guidelines</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close Field Study
          </button>
        </div>

      </div>
    </div>
  );
};
