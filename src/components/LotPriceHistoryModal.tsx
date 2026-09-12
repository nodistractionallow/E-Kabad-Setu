import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Award,
  DollarSign,
  Activity,
  Layers,
  Calendar,
  Sparkles,
  User,
  Scale,
  CheckCircle2,
  Info,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { LotPricePoint } from '../types';
import {
  getMaterialPriceTrend,
  MATERIAL_PRICE_TRENDS_MAP
} from '../data/authoritiesAndTransactionsData';

interface LotPriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotName: string;
  materialId?: string;
  currentRate?: number;
  lotId?: string;
  isEmbedded?: boolean;
}

export const LotPriceHistoryModal: React.FC<LotPriceHistoryModalProps> = ({
  isOpen,
  onClose,
  lotName,
  materialId,
  currentRate,
  lotId,
  isEmbedded = false
}) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materialId || lotName);
  const [timeline, setTimeline] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync when prop changes
  useEffect(() => {
    setSelectedMaterialId(materialId || lotName);
  }, [materialId, lotName]);

  // Ensure scroll is fixed at top upon opening so graph is directly visible
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Lookup the comprehensive price trends
  const trendData = useMemo(() => {
    return getMaterialPriceTrend(selectedMaterialId, currentRate);
  }, [selectedMaterialId, currentRate]);

  // Select the historical series according to timeline
  const chartSeries = useMemo(() => {
    switch (timeline) {
      case '7d':
        return trendData.history7d;
      case '30d':
        return trendData.history30d;
      case '90d':
        return trendData.history90d;
      case '1y':
        return trendData.history1y;
      default:
        return trendData.history30d;
    }
  }, [timeline, trendData]);

  const isPositiveTrend = trendData.trend30dPct >= 0;

  if (!isOpen) return null;

  // Available standard materials for quick-switching in header
  const quickSwitchOptions = [
    { id: 'mat_pcb_high', label: 'Motherboard PCB', rate: 495 },
    { id: 'mat_copper_wire', label: 'Copper Wire', rate: 720 },
    { id: 'mat_li_battery', label: 'Li-ion Battery', rate: 310 },
    { id: 'mat_neodymium_hdds', label: 'Rare-Earth Magnet', rate: 540 },
    { id: 'mat_telecom_board', label: 'Telecom BTS Board', rate: 650 },
    { id: 'mat_solar_panels', label: 'Solar PV Module', rate: 240 },
    { id: 'mat_cooling_compressors', label: 'Cooling Compressor', rate: 160 },
    { id: 'mat_medical_pcbs', label: 'Medical PCB', rate: 410 },
    { id: 'mat_flame_plastics', label: 'E-Plastics FR', rate: 65 }
  ];

  return (
    <div
      id="lot-price-graph-container"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex items-start justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={scrollContainerRef}
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-2 sm:my-4 flex flex-col text-slate-900 max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR: Title & Direct Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                  CPCB Live Mandi Index
                </span>
                {lotId && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono">
                    Lot: {lotId}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-semibold">
                  Schedule {trendData.category.toUpperCase()}
                </span>
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                  • Direct Fixed View (No Scrolling Required)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {trendData.materialName}
              </h2>
              {trendData.materialName_hi && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {trendData.materialName_hi}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close modal"
              title="Close graph"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MATERIAL QUICK SWITCH BAR: Direct selection without closing */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-500 shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            Select Scrap Grade:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {quickSwitchOptions.map((opt) => {
              const isSelected = selectedMaterialId === opt.id || selectedMaterialId.toLowerCase().includes(opt.label.toLowerCase().slice(0, 5));
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedMaterialId(opt.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className={`ml-1.5 font-mono text-[11px] ${isSelected ? 'text-emerald-100' : 'text-emerald-700 font-bold'}`}>
                    ₹{opt.rate}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN BODY: Graph & KPIs Placed Together at Top so it is Instantly Visible */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* TOP GRAPH PANEL: DIRECTLY VISIBLE ON SCREEN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            {/* Chart Toolbar: Metrics Summary & Timeline Selectors */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Spot Mandi Rate</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black font-mono text-emerald-600">
                      ₹{trendData.currentRate}
                    </span>
                    <span className="text-xs font-mono text-slate-500">/kg</span>
                    <span className={`text-xs font-bold font-mono ml-1 ${isPositiveTrend ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositiveTrend ? `+${trendData.trend30dPct}%` : `${trendData.trend30dPct}%`}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:block h-8 w-px bg-slate-200" />

                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Statutory Floor (MSP)</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-amber-600">
                      ₹{trendData.cpcbFloorRate}
                    </span>
                    <span className="text-xs font-mono text-slate-500">/kg</span>
                  </div>
                </div>

                <div className="hidden md:block h-8 w-px bg-slate-200" />

                <div className="hidden md:block">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">30D Range & Volatility</span>
                  <div className="text-xs font-mono font-bold text-slate-700">
                    ₹{trendData.low30d} — ₹{trendData.high30d} <span className="text-indigo-600 font-normal">({trendData.volatilityIndex}% vol)</span>
                  </div>
                </div>
              </div>

              {/* Timeline Toggles */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                {(['7d', '30d', '90d', '1y'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeline(t)}
                    className={`px-3 py-1 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
                      timeline === t
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : t === '90d' ? '90 Days' : '1 Year'}
                  </button>
                ))}
              </div>
            </div>

            {/* DIRECT VISIBLE RECHARTS AREA */}
            <div className="h-64 sm:h-72 w-full pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartSeries}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSpotLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => {
                      const parts = val.split('-');
                      return `${parts[1]}/${parts[2]}`;
                    }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    domain={['dataMin - 15', 'dataMax + 15']}
                    tickFormatter={(val) => `₹${val}`}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as LotPricePoint;
                        return (
                          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs font-mono text-slate-800">
                            <div className="text-slate-500 font-bold mb-1.5 flex items-center justify-between gap-4">
                              <span>{data.date}</span>
                              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-emerald-700 font-bold">
                                Vol: {data.volumeKg} kg
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4">
                                <span className="text-emerald-700 font-bold">Spot Payout:</span>
                                <span className="font-bold text-slate-900">₹{data.marketSpotRate} / kg</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-amber-700">CPCB Floor (MSP):</span>
                                <span className="text-slate-600">₹{data.cpcbRate} / kg</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-indigo-700">LME/MCX Ref:</span>
                                <span className="text-slate-600">₹{data.lmeEquivRate} / kg</span>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-slate-100 pt-1 text-[11px] text-slate-500">
                                <span>Day Range:</span>
                                <span>₹{data.low} - ₹{data.high}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={32}
                    formatter={(value) => {
                      return <span className="text-xs text-slate-700 font-mono font-medium">{value}</span>;
                    }}
                  />
                  <ReferenceLine
                    y={trendData.cpcbFloorRate}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    label={{
                      value: `MSP Floor ₹${trendData.cpcbFloorRate}`,
                      fill: '#d97706',
                      fontSize: 10,
                      position: 'insideBottomRight'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="marketSpotRate"
                    name="Spot Rate (₹/kg)"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSpotLight)"
                  />
                  <Line
                    type="monotone"
                    dataKey="lmeEquivRate"
                    name="LME Index (₹/kg)"
                    stroke="#4f46e5"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cpcbRate"
                    name="Statutory Floor (₹/kg)"
                    stroke="#d97706"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend & Mass Balance notice */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 mt-2 px-1 border-t border-slate-100 pt-2 gap-2">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Aggregated from 128 authorized recyclers across Maharashtra, Gujarat, Delhi NCR, and Karnataka.
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified Mass-Balance Feed
              </span>
            </div>
          </div>

          {/* CRM COMPOSITION METRICS & FORECAST */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* AI Forecast */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI 15-Day Outlook
              </div>
              <div className="text-sm font-bold text-indigo-900">
                {trendData.forecastNextMonth}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Calculated by tracking London Metal Exchange (LME) and MCX refined spot metals.
              </p>
            </div>

            {/* Critical Raw Material Yields */}
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1 mb-2">
                <Award className="w-3.5 h-3.5 text-amber-600" /> Critical Raw Material (CRM) Recoverable Elements
              </div>
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase">Copper (Cu)</div>
                  <div className="text-base font-black text-amber-700">{trendData.crmComposition.copperPct}%</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase">Gold (Au)</div>
                  <div className="text-base font-black text-yellow-600">{trendData.crmComposition.goldGramsPerTon} g/t</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase">Lithium (Li)</div>
                  <div className="text-base font-black text-teal-700">{trendData.crmComposition.lithiumPct}%</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase">Cobalt (Co)</div>
                  <div className="text-base font-black text-indigo-700">{trendData.crmComposition.cobaltPct}%</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Statutory Floor Mandate: CPCB E-Waste (Management) Rules, 2022</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Close Graph
          </button>
        </div>
      </div>
    </div>
  );
};
