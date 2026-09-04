import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  Scale, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  PieChart,
  HelpCircle
} from 'lucide-react';

interface UnitEconomicsModalProps {
  onClose: () => void;
}

export const UnitEconomicsModal: React.FC<UnitEconomicsModalProps> = ({ onClose }) => {
  // Volume slider for monthly collection simulation
  const [copperWireKg, setCopperWireKg] = useState<number>(30);
  const [pcbMotherboardKg, setPcbMotherboardKg] = useState<number>(20);
  const [liBatteryKg, setLiBatteryKg] = useState<number>(10);

  // Rates in Informal Market vs E-Kabad Setu Formal Mandi
  // Copper
  const informalCopperRate = 490; // ₹/kg (marked down for burnt wire)
  const formalCopperRate = 720;   // ₹/kg (unburnt pure wire)
  const wireBurningLossPct = 0.25; // 25% wire mass burned away in open fire

  // PCB
  const informalPcbRate = 290;    // ₹/kg (local intermediary cut)
  const formalPcbRate = 480;      // ₹/kg (direct CPCB smelter)

  // Battery
  const informalBatteryRate = 180;// ₹/kg (dangerous dump)
  const formalBatteryRate = 310;  // ₹/kg (vermiculite safe pouch)

  // Calculations
  // Informal Earnings
  const burntCopperMass = copperWireKg * (1 - wireBurningLossPct);
  const informalCopperTotal = Math.round(burntCopperMass * informalCopperRate);
  const informalPcbTotal = Math.round(pcbMotherboardKg * informalPcbRate);
  const informalBatteryTotal = Math.round(liBatteryKg * informalBatteryRate);
  const informalGrossEarnings = informalCopperTotal + informalPcbTotal + informalBatteryTotal;
  const informalHealthDeduction = 1500; // Estimated medicine for smoke inhalation
  const informalNetEarnings = Math.max(0, informalGrossEarnings - informalHealthDeduction);

  // Formal Earnings with E-Kabad Setu
  const formalCopperTotal = Math.round(copperWireKg * formalCopperRate); // Full weight saved with mechanical strip
  const formalPcbTotal = Math.round(pcbMotherboardKg * formalPcbRate);
  const formalBatteryTotal = Math.round(liBatteryKg * formalBatteryRate);
  const formalGrossEarnings = formalCopperTotal + formalPcbTotal + formalBatteryTotal;
  const formalSafetyBonus = 200; // Safety vermiculite pouch deposit refund
  const formalEprBonus = Math.round(formalGrossEarnings * 0.02); // 2% CPCB formalization DBT bonus
  const formalNetEarnings = formalGrossEarnings + formalSafetyBonus + formalEprBonus;

  // Comparison
  const netEarningsGain = formalNetEarnings - informalNetEarnings;
  const percentageGain = Number(((netEarningsGain / informalNetEarnings) * 100).toFixed(1));

  // Platform Sustainability Fee (1.5% paid by Recycler / Producer, 0% paid by Collector)
  const totalMaterialValue = formalGrossEarnings;
  const platformTraceabilityFee = Math.round(totalMaterialValue * 0.015);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Unit-Economics & Platform Sustainability</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SIH26229 Financial Model
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Quantified comparison of informal intermediary leakage vs formal direct channel earnings, plus long-term operational sustainability.
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50">
          
          {/* Interactive Collector Simulator Sliders */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg">Interactive Scrap Lot Simulator</h3>
                <p className="text-xs text-slate-500">Adjust the collection volume to compare monthly earnings between the two routes.</p>
              </div>
              <span className="text-xs font-bold font-mono px-3 py-1 bg-slate-100 rounded-full text-slate-700">
                Total Lot Mass: {copperWireKg + pcbMotherboardKg + liBatteryKg} kg
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Copper Slider */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-1">
                  <span>Copper Wire Mass</span>
                  <span className="font-mono text-emerald-700">{copperWireKg} kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={copperWireKg}
                  onChange={(e) => setCopperWireKg(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>Informal: ₹490/kg (burnt)</span>
                  <span>Formal: ₹720/kg</span>
                </div>
              </div>

              {/* PCB Slider */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-1">
                  <span>Server PCBs Mass</span>
                  <span className="font-mono text-emerald-700">{pcbMotherboardKg} kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={pcbMotherboardKg}
                  onChange={(e) => setPcbMotherboardKg(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>Informal: ₹290/kg</span>
                  <span>Formal: ₹480/kg</span>
                </div>
              </div>

              {/* Battery Slider */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-1">
                  <span>Li-ion Batteries</span>
                  <span className="font-mono text-emerald-700">{liBatteryKg} kg</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="2"
                  value={liBatteryKg}
                  onChange={(e) => setLiBatteryKg(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>Informal: ₹180/kg</span>
                  <span>Formal: ₹310/kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side by Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Informal Channel */}
            <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-red-100 text-red-800 font-extrabold text-[10px] rounded-bl-xl uppercase tracking-wider">
                Existing Informal Route
              </div>

              <h4 className="font-black text-slate-900 text-base mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Traditional 3-Tier Middlemen
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Copper (burnt wire: {burntCopperMass.toFixed(1)}kg @ ₹490):</span>
                  <span className="font-mono font-bold text-slate-900">₹{informalCopperTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[11px] text-red-600 font-medium -mt-1 pl-2">
                  ⚠ 25% wire mass burned off in open fire (-{(copperWireKg * wireBurningLossPct).toFixed(1)} kg lost)
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">PCBs (middleman markdown: {pcbMotherboardKg}kg @ ₹290):</span>
                  <span className="font-mono font-bold text-slate-900">₹{informalPcbTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Batteries ({liBatteryKg}kg @ ₹180):</span>
                  <span className="font-mono font-bold text-slate-900">₹{informalBatteryTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-red-700">
                  <span>Health Costs (smoke inhalation medicines):</span>
                  <span className="font-mono font-bold">-₹{informalHealthDeduction}</span>
                </div>

                <div className="pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Net Collector Take-Home:</span>
                  <span className="font-mono text-base text-red-700">₹{informalNetEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Formal Channel */}
            <div className="bg-white rounded-2xl p-5 border border-emerald-300 shadow-sm relative overflow-hidden bg-gradient-to-b from-emerald-50/30 to-white">
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-600 text-white font-extrabold text-[10px] rounded-bl-xl uppercase tracking-wider">
                E-Kabad Setu Bridge
              </div>

              <h4 className="font-black text-slate-900 text-base mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Direct CPCB Authorized Recycler
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Copper (clean unburnt: {copperWireKg}kg @ ₹720):</span>
                  <span className="font-mono font-bold text-slate-900">₹{formalCopperTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-medium -mt-1 pl-2">
                  ✓ Mechanical stripping retains 100% mass (+{(copperWireKg * wireBurningLossPct).toFixed(1)} kg saved)
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">PCBs (CPCB Smelter Mandi Rate @ ₹480):</span>
                  <span className="font-mono font-bold text-slate-900">₹{formalPcbTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Batteries (Safe vermiculite deposit @ ₹310):</span>
                  <span className="font-mono font-bold text-slate-900">₹{formalBatteryTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-emerald-700">
                  <span>Safety Vermiculite Bag Deposit Refund:</span>
                  <span className="font-mono font-bold">+₹{formalSafetyBonus}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-emerald-700">
                  <span>CPCB Formalization DBT Incentive (+2%):</span>
                  <span className="font-mono font-bold">+₹{formalEprBonus}</span>
                </div>

                <div className="pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Net Collector Take-Home:</span>
                  <span className="font-mono text-base text-emerald-700">₹{formalNetEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Value Created Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">Total Net Income Increase</div>
              <div className="text-2xl sm:text-3xl font-black font-mono">
                +₹{netEarningsGain.toLocaleString('en-IN')} ({percentageGain > 0 ? `+${percentageGain}%` : '0%'})
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                The informal collector earns over 60% more money by directly accessing transparent CPCB mandi prices.
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-emerald-500/50 sm:pl-6">
              <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">Critical Raw Materials Saved</div>
              <div className="text-lg font-black font-mono mt-0.5">
                {(pcbMotherboardKg * 0.24).toFixed(1)}g Gold • {(liBatteryKg * 0.14).toFixed(1)}kg Cobalt
              </div>
              <div className="text-[11px] text-emerald-200">Kept out of illegal acid leaching & ground water</div>
            </div>
          </div>

          {/* Platform Sustainability Section */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-700" />
              How the Platform Sustains Operations (Business Model)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">1. Recycler EPR Fee (1.5%)</div>
                <p className="text-slate-600 leading-relaxed">
                  Authorized recyclers and electronics brands (Dell, HP, Samsung) pay a 1.5% facilitation fee (₹{platformTraceabilityFee} on this lot) to obtain certified CPCB Form-6 digital chain-of-custody tokens needed for annual EPR fulfillment.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">2. Zero Collector Deduction</div>
                <p className="text-slate-600 leading-relaxed">
                  Collectors pay <span className="font-bold text-emerald-700">₹0 commission</span>. Creating an economic incentive rather than a compliance burden ensures informal aggregators naturally flock to the platform.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">3. Corporate ESG Data Credits</div>
                <p className="text-slate-600 leading-relaxed">
                  Automated aggregation of Critical Raw Materials (Lithium, Neodymium, Gold) generates auditable Scope-3 ESG sustainability reports, monetized via enterprise SaaS subscriptions.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Modeled on CPCB Extended Producer Responsibility Framework (E-Waste Rules 2022)</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close Economics
          </button>
        </div>

      </div>
    </div>
  );
};
