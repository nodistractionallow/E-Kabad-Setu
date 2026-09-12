import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Zap, 
  Wifi, 
  WifiOff, 
  RotateCcw, 
  Smartphone, 
  Factory, 
  Home, 
  ChevronUp, 
  ChevronDown,
  PlusCircle,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { playFeedbackChime } from '../utils/speech';

export const JudgeDemoToolbar: React.FC = () => {
  const { 
    isOnline, 
    setIsOnline, 
    currentView, 
    setCurrentView, 
    resetAllData, 
    addLot, 
    collector,
    materials 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);

  const handleSimulateLot = () => {
    const wireMat = materials.find((m) => m.category === 'copper') || materials[1];
    addLot({
      collectorId: collector.id,
      collectorName: collector.name,
      collectorPhone: collector.phone,
      materialId: wireMat.id,
      materialName: wireMat.name_en,
      category: wireMat.category,
      weightKg: 12.5,
      ratePerKg: wireMat.pricePerKg,
      totalAmount: 12.5 * wireMat.pricePerKg,
      gpsLocation: '18.5204° N, 73.8567° E (Shivajinagar, Pune)',
      facilityId: 'REC-MH-PN-004',
      facilityName: 'EcoMetals CPCB Unit #4',
      distanceKm: 3.2,
      hazardFlag: false,
      photoUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80'
    });
    playFeedbackChime('success');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      {/* Expanded Controls Panel */}
      {isOpen && (
        <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl p-4 mb-2 shadow-xl w-80 font-sans animate-scaleUp">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 font-mono">
              <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>SIH-2026 JURY EVALUATION SUITE</span>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Direct Navigation Jumps */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block mb-1.5">
                Direct Viewport Jump:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playFeedbackChime('beep');
                    setCurrentView('gateway');
                  }}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors ${
                    currentView === 'gateway'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Home className="w-3 h-3" />
                  <span>Gateway</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playFeedbackChime('beep');
                    setCurrentView('collector');
                  }}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors ${
                    currentView === 'collector'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Collector</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playFeedbackChime('beep');
                    setCurrentView('recycler');
                  }}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors ${
                    currentView === 'recycler'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Factory className="w-3 h-3" />
                  <span>Recycler</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playFeedbackChime('beep');
                    setCurrentView('government');
                  }}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors ${
                    currentView === 'government'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Govt/CPCB</span>
                </button>
              </div>
            </div>

            {/* Network Simulator */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block mb-1.5">
                Offline PWA Storage Simulation:
              </label>
              <button
                type="button"
                onClick={() => {
                  playFeedbackChime('beep');
                  setIsOnline(!isOnline);
                }}
                className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition-colors border ${
                  isOnline
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  <span>Status: {isOnline ? 'Online (Connected)' : 'Offline (Local Storage Mode)'}</span>
                </div>
                <span className="text-[10px] font-mono underline">Toggle</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="pt-1 space-y-1.5">
              <button
                type="button"
                onClick={handleSimulateLot}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simulate Incoming Collector Lot</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all mock databases and local storage to initial demo state?')) {
                    resetAllData();
                  }
                }}
                className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset All Mock Datasets</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discreet Collapsible Floating Pill */}
      <button
        type="button"
        onClick={() => {
          playFeedbackChime('beep');
          setIsOpen(!isOpen);
        }}
        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-full shadow-lg flex items-center gap-2 text-xs font-extrabold font-mono transition-transform active:scale-95"
      >
        <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
        <span>⚡ SIH Demo Controls</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
      </button>
    </div>
  );
};
