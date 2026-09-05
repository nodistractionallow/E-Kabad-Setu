import React, { useState, useMemo } from 'react';
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
  Building2,
  User,
  Scale,
  CheckCircle2,
  Info
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
import { getMaterialPriceTrend, NATIONAL_TRANSACTIONS_LOG } from '../data/authoritiesAndTransactionsData';

interface LotPriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotName: string;
  materialId?: string;
  currentRate?: number;
  lotId?: string;
}

export const LotPriceHistoryModal: React.FC<LotPriceHistoryModalProps> = ({
  isOpen,
  onClose,
  lotName,
  materialId,
  currentRate,
  lotId
}) => {
  const [timeline, setTimeline] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeMetric, setActiveMetric] = useState<'all' | 'spot' | 'cpcb' | 'lme'>('all');

  // Lookup the comprehensive price trends
  const trendData = useMemo(() => {
    return getMaterialPriceTrend(materialId || lotName, currentRate);
  }, [materialId, lotName, currentRate]);

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

  // Find recent transactions related to this material or category
  const relatedTransactions = useMemo(() => {
    const term = (materialId || lotName).toLowerCase();
    return NATIONAL_TRANSACTIONS_LOG.filter(
      (tx) =>
        tx.materialName.toLowerCase().includes(term) ||
        tx.materialId.toLowerCase() === term ||
        tx.category.toLowerCase() === trendData.category.toLowerCase()
    ).slice(0, 5);
  }, [materialId, lotName, trendData.category]);

  if (!isOpen) return null;

  const isPositiveTrend = trendData.trend30dPct >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  CPCB Real-Time Mandi Index
                </span>
                {lotId && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                    Lot: {lotId}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                  {trendData.category.toUpperCase()} Schedule
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {trendData.materialName}
              </h2>
              {trendData.materialName_hi && (
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {trendData.materialName_hi} • Daily Mandi Spot & Historical Valuation
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Current Spot Rate */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 relative overflow-hidden">
              <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase">Current Spot Mandi Rate</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  ₹{trendData.currentRate}
                </span>
                <span className="text-xs font-mono text-slate-400">/ kg</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] font-bold font-mono">
                {isPositiveTrend ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +{trendData.trend30dPct}%
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" /> {trendData.trend30dPct}%
                  </span>
                )}
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>

            {/* CPCB Minimum Floor Rate */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
              <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase">CPCB Statutory Floor (MSP)</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  ₹{trendData.cpcbFloorRate}
                </span>
                <span className="text-xs font-mono text-slate-400">/ kg</span>
              </div>
              <div className="text-[11px] text-amber-300 font-mono mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Minimum Legal Payout
              </div>
            </div>

            {/* 30-Day High / Low Range */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
              <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase">30-Day Price Range</div>
              <div className="text-sm font-black font-mono text-slate-200 mt-1">
                <span className="text-rose-400">₹{trendData.low30d}</span>
                <span className="text-slate-500 mx-1.5">—</span>
                <span className="text-emerald-400">₹{trendData.high30d}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                Volatility Index: <span className="text-indigo-300 font-bold">{trendData.volatilityIndex}%</span>
              </div>
            </div>

            {/* AI Price Forecast */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
              <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> AI 15-Day Forecast
              </div>
              <div className="text-base font-black font-mono text-indigo-300 mt-1 flex items-center gap-1">
                {trendData.forecastChangePct >= 0 ? `+${trendData.forecastChangePct}%` : `${trendData.forecastChangePct}%`}
                <span className="text-xs font-normal text-slate-400">expected</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                {trendData.forecastNextMonth}
              </div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-4 sm:p-5">
            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Price Fluctuation & Trading Volume Curve
                </span>
              </div>

              {/* Timeline Toggles */}
              <div className="flex items-center bg-slate-850 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                {(['7d', '30d', '90d', '1y'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeline(t)}
                    className={`px-3 py-1 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${
                      timeline === t
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : t === '90d' ? '90 Days' : '1 Year'}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Recharts Area / Line Chart */}
            <div className="h-64 sm:h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartSeries}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSpot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorLme" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => {
                      const parts = val.split('-');
                      return `${parts[1]}/${parts[2]}`;
                    }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    domain={['dataMin - 15', 'dataMax + 15']}
                    tickFormatter={(val) => `₹${val}`}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as LotPricePoint;
                        return (
                          <div className="bg-slate-900/95 border border-slate-700 rounded-2xl p-3 shadow-xl backdrop-blur-md text-xs font-mono text-slate-200">
                            <div className="text-slate-400 font-bold mb-1.5 flex items-center justify-between gap-4">
                              <span>{data.date}</span>
                              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400">
                                Vol: {data.volumeKg} kg
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4">
                                <span className="text-emerald-400 font-bold">Spot Payout:</span>
                                <span className="font-bold text-white">₹{data.marketSpotRate} / kg</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-amber-400">CPCB Floor (MSP):</span>
                                <span className="text-slate-300">₹{data.cpcbRate} / kg</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-indigo-400">LME/MCX Ref:</span>
                                <span className="text-slate-300">₹{data.lmeEquivRate} / kg</span>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-slate-800 pt-1 text-[11px]">
                                <span className="text-slate-400">Daily Range:</span>
                                <span className="text-slate-300">₹{data.low} - ₹{data.high}</span>
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
                    height={36}
                    formatter={(value) => {
                      return <span className="text-xs text-slate-300 font-mono font-medium">{value}</span>;
                    }}
                  />
                  <ReferenceLine
                    y={trendData.cpcbFloorRate}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: `MSP Floor (₹${trendData.cpcbFloorRate})`,
                      fill: '#f59e0b',
                      fontSize: 10,
                      position: 'insideBottomRight'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="marketSpotRate"
                    name="Market Spot Rate (₹/kg)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSpot)"
                  />
                  <Line
                    type="monotone"
                    dataKey="lmeEquivRate"
                    name="LME / MCX Benchmark (₹/kg)"
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cpcbRate"
                    name="CPCB Floor Rate (₹/kg)"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Trading Volume Sub-note */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 px-2 border-t border-slate-800/80 pt-2">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                Aggregated from 128 authorized recyclers across Maharashtra, Gujarat, Delhi NCR, and Karnataka.
              </span>
              <span className="text-emerald-400 font-semibold">Verified Mass-Balance Feed</span>
            </div>
          </div>

          {/* CRM (Critical Raw Material) Composition Breakdown */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              CRM Elemental Yields Driving Valuation
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Copper (Cu)</div>
                <div className="text-lg font-black font-mono text-amber-400 mt-0.5">
                  {trendData.crmComposition.copperPct}%
                </div>
                <div className="text-[10px] text-slate-500">Pure Grade Cu</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Gold (Au) Yield</div>
                <div className="text-lg font-black font-mono text-yellow-400 mt-0.5">
                  {trendData.crmComposition.goldGramsPerTon} g/t
                </div>
                <div className="text-[10px] text-slate-500">Gold Plated Contacts</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Lithium (Li)</div>
                <div className="text-lg font-black font-mono text-teal-400 mt-0.5">
                  {trendData.crmComposition.lithiumPct}%
                </div>
                <div className="text-[10px] text-slate-500">Battery Salts</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Cobalt (Co)</div>
                <div className="text-lg font-black font-mono text-blue-400 mt-0.5">
                  {trendData.crmComposition.cobaltPct}%
                </div>
                <div className="text-[10px] text-slate-500">Cathode Precursor</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Neodymium (Nd)</div>
                <div className="text-lg font-black font-mono text-purple-400 mt-0.5">
                  {trendData.crmComposition.neodymiumPct}%
                </div>
                <div className="text-[10px] text-slate-500">Rare-Earth Magnet</div>
              </div>
            </div>
          </div>

          {/* Cross-Vendor Real-Time Settlement Records for this Material */}
          {relatedTransactions.length > 0 && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Recent Multi-Vendor Verified Settlements for this Lot Material
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {relatedTransactions.length} Verified Records
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700/80">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Buyer (Vendor / Plant)</th>
                      <th className="py-2.5 px-3">Seller (Collector)</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3">Settled Rate</th>
                      <th className="py-2.5 px-3">Total Payout</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {relatedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{tx.date}</td>
                        <td className="py-2 px-3 font-semibold text-white whitespace-nowrap">
                          {tx.vendorName}
                        </td>
                        <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                          {tx.collectorName}
                        </td>
                        <td className="py-2 px-3 text-emerald-400 font-bold whitespace-nowrap">
                          {tx.weighbridgeWeightKg || tx.declaredWeightKg} kg
                        </td>
                        <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                          ₹{tx.ratePerKg} / kg
                        </td>
                        <td className="py-2 px-3 font-black text-amber-400 whitespace-nowrap">
                          ₹{tx.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.paymentStatus === 'settled'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : tx.paymentStatus === 'flagged'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {tx.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Regulated under CPCB Extended Producer Responsibility (EPR) Gazette 2026</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
