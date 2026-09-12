import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { LotPricePoint } from '../types';
import {
  getMaterialPriceTrend
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
  lotId
}) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materialId || lotName);
  const [timeline, setTimeline] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);

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

  const isPositiveTrend = (trendData.trend30dPct ?? 0) >= 0;

  // Chart Geometry & Pure SVG Math
  const chartMath = useMemo(() => {
    const series = chartSeries || [];
    if (series.length === 0) {
      return {
        minRate: 0,
        maxRate: 100,
        gridValues: [0, 50, 100],
        spotPoints: [],
        lmePoints: [],
        areaPath: '',
        spotLinePath: '',
        lmeLinePath: '',
        yFloor: 130,
        xTicks: []
      };
    }

    const padLeft = 52;
    const padRight = 30;
    const padTop = 20;
    const padBottom = 35;
    const width = 800 - padLeft - padRight; // 718
    const height = 260 - padTop - padBottom; // 205

    const cpcbFloor = trendData.cpcbFloorRate ?? 0;
    let minVal = cpcbFloor;
    let maxVal = cpcbFloor;

    series.forEach((p) => {
      if (p.marketSpotRate < minVal) minVal = p.marketSpotRate;
      if (p.marketSpotRate > maxVal) maxVal = p.marketSpotRate;
      if (p.cpcbRate && p.cpcbRate < minVal) minVal = p.cpcbRate;
      if (p.cpcbRate && p.cpcbRate > maxVal) maxVal = p.cpcbRate;
      if (p.lmeEquivRate && p.lmeEquivRate < minVal) minVal = p.lmeEquivRate;
      if (p.lmeEquivRate && p.lmeEquivRate > maxVal) maxVal = p.lmeEquivRate;
    });

    // Add 10% breathing room
    const padding = Math.max((maxVal - minVal) * 0.12, 10);
    const minRate = Math.floor(Math.max(0, minVal - padding));
    const maxRate = Math.ceil(maxVal + padding);
    const range = maxRate - minRate || 1;

    const getY = (val: number) => {
      return padTop + height - ((val - minRate) / range) * height;
    };

    const getX = (idx: number) => {
      if (series.length <= 1) return padLeft + width / 2;
      return padLeft + (idx / (series.length - 1)) * width;
    };

    const spotPoints = series.map((p, idx) => ({
      x: getX(idx),
      y: getY(p.marketSpotRate),
      raw: p
    }));

    const lmePoints = series.map((p, idx) => ({
      x: getX(idx),
      y: getY(p.lmeEquivRate ?? p.marketSpotRate),
      raw: p
    }));

    // Area & Line Paths
    const baselineY = padTop + height;
    let spotLinePath = '';
    let areaPath = '';

    if (spotPoints.length > 0) {
      spotLinePath = `M ${spotPoints[0].x.toFixed(1)} ${spotPoints[0].y.toFixed(1)}`;
      areaPath = `M ${spotPoints[0].x.toFixed(1)} ${baselineY} L ${spotPoints[0].x.toFixed(1)} ${spotPoints[0].y.toFixed(1)}`;

      for (let i = 1; i < spotPoints.length; i++) {
        spotLinePath += ` L ${spotPoints[i].x.toFixed(1)} ${spotPoints[i].y.toFixed(1)}`;
        areaPath += ` L ${spotPoints[i].x.toFixed(1)} ${spotPoints[i].y.toFixed(1)}`;
      }

      const lastX = spotPoints[spotPoints.length - 1].x.toFixed(1);
      areaPath += ` L ${lastX} ${baselineY} Z`;
    }

    let lmeLinePath = '';
    if (lmePoints.length > 0) {
      lmeLinePath = `M ${lmePoints[0].x.toFixed(1)} ${lmePoints[0].y.toFixed(1)}`;
      for (let i = 1; i < lmePoints.length; i++) {
        lmeLinePath += ` L ${lmePoints[i].x.toFixed(1)} ${lmePoints[i].y.toFixed(1)}`;
      }
    }

    const yFloor = getY(cpcbFloor);

    // 4 Horizontal Grid lines
    const gridCount = 4;
    const gridValues = Array.from({ length: gridCount + 1 }, (_, i) => {
      const val = Math.round(minRate + (range * i) / gridCount);
      return { val, y: getY(val) };
    });

    // 5-7 X-Axis Date Ticks
    const tickStep = Math.max(1, Math.floor(series.length / 6));
    const xTicks: { label: string; x: number }[] = [];
    for (let i = 0; i < series.length; i += tickStep) {
      const parts = (series[i].date || '').split('-');
      const label = parts.length >= 3 ? `${parts[1]}/${parts[2]}` : series[i].date;
      xTicks.push({ label, x: getX(i) });
    }
    // Always include last date if not close to previous
    if (series.length > 1) {
      const lastParts = (series[series.length - 1].date || '').split('-');
      const lastLabel = lastParts.length >= 3 ? `${lastParts[1]}/${lastParts[2]}` : series[series.length - 1].date;
      const lastX = getX(series.length - 1);
      if (xTicks.length === 0 || lastX - xTicks[xTicks.length - 1].x > 40) {
        xTicks.push({ label: lastLabel, x: lastX });
      }
    }

    return {
      minRate,
      maxRate,
      gridValues,
      spotPoints,
      lmePoints,
      areaPath,
      spotLinePath,
      lmeLinePath,
      yFloor,
      xTicks
    };
  }, [chartSeries, trendData]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current || !chartSeries || chartSeries.length === 0) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    // Map screen clientX to SVG viewBox coordinate (0 to 800)
    const svgX = ((e.clientX - rect.left) / rect.width) * 800;
    // Data range is between padLeft (52) and padLeft + width (770), span = 718
    const ratio = Math.max(0, Math.min(1, (svgX - 52) / 718));
    const index = Math.round(ratio * (chartSeries.length - 1));
    if (index >= 0 && index < chartSeries.length) {
      setHoverIndex(index);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current || !chartSeries || chartSeries.length === 0 || e.touches.length === 0) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const touch = e.touches[0];
    const svgX = ((touch.clientX - rect.left) / rect.width) * 800;
    const ratio = Math.max(0, Math.min(1, (svgX - 52) / 718));
    const index = Math.round(ratio * (chartSeries.length - 1));
    if (index >= 0 && index < chartSeries.length) {
      setHoverIndex(index);
    }
  };

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

  const activeHoverPoint: LotPricePoint | null =
    hoverIndex !== null && chartSeries[hoverIndex] ? chartSeries[hoverIndex] : null;
  const activeSpotCoord =
    hoverIndex !== null && chartMath.spotPoints[hoverIndex] ? chartMath.spotPoints[hoverIndex] : null;

  return (
    <div
      id="lot-price-graph-container"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex items-start justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={scrollContainerRef}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-2 sm:my-4 flex flex-col text-slate-900 max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR: Title & Direct Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-800">
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
                  Schedule {(trendData.category || 'e-waste').toUpperCase()}
                </span>
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                  • Direct Fixed View
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {trendData.materialName}
              </h2>
              {trendData.materialName_hi && (
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {trendData.materialName_hi}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close modal"
              title="Close graph"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MATERIAL QUICK SWITCH BAR */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-600 shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            Scrap Grade:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {quickSwitchOptions.map((opt) => {
              const isSelected =
                selectedMaterialId === opt.id ||
                selectedMaterialId.toLowerCase().includes(opt.label.toLowerCase().slice(0, 5));
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedMaterialId(opt.id);
                    setHoverIndex(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`ml-1.5 font-mono text-[11px] ${
                      isSelected ? 'text-emerald-100' : 'text-emerald-700 font-bold'
                    }`}
                  >
                    ₹{opt.rate}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN BODY: Graph & KPIs */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* TOP GRAPH PANEL */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                    Spot Mandi Rate
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-emerald-700">
                      ₹{trendData.currentRate}
                    </span>
                    <span className="text-xs font-mono text-slate-600">/kg</span>
                    <span
                      className={`text-xs font-bold font-mono ml-1 ${
                        isPositiveTrend ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isPositiveTrend ? `+${trendData.trend30dPct}%` : `${trendData.trend30dPct}%`}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:block h-8 w-px bg-slate-200" />

                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                    Statutory Floor (MSP)
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-amber-700">
                      ₹{trendData.cpcbFloorRate}
                    </span>
                    <span className="text-xs font-mono text-slate-600">/kg</span>
                  </div>
                </div>

                <div className="hidden md:block h-8 w-px bg-slate-200" />

                <div className="hidden md:block">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                    30D Range & Volatility
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-800">
                    ₹{trendData.low30d} — ₹{trendData.high30d}{' '}
                    <span className="text-indigo-700 font-normal">
                      ({trendData.volatilityIndex}% vol)
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline Toggles */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                {(['7d', '30d', '90d', '1y'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTimeline(t);
                      setHoverIndex(null);
                    }}
                    className={`px-3 py-1 text-xs font-bold font-mono rounded-md transition-all cursor-pointer ${
                      timeline === t
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : t === '90d' ? '90 Days' : '1 Year'}
                  </button>
                ))}
              </div>
            </div>

            {/* PURE ZERO-DEPENDENCY RESPONSIVE SVG CHART */}
            <div className="relative w-full h-64 sm:h-72 select-none pt-2">
              {/* Top Chart Legend */}
              <div className="flex items-center justify-end gap-4 text-xs font-mono mb-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-1 bg-emerald-600 rounded"></div>
                  <span className="text-slate-700 font-semibold">Spot Rate (₹/kg)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-0.5 border-b-2 border-dashed border-indigo-600"></div>
                  <span className="text-slate-700 font-semibold">LME Ref</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-0.5 border-b-2 border-dashed border-amber-600"></div>
                  <span className="text-slate-700 font-semibold">CPCB Floor</span>
                </div>
              </div>

              <svg
                ref={chartSvgRef}
                viewBox="0 0 800 260"
                preserveAspectRatio="none"
                className="w-full h-[calc(100%-24px)] overflow-visible cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverIndex(null)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => setHoverIndex(null)}
              >
                <defs>
                  <linearGradient id="svgSpotLightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                    <stop offset="95%" stopColor="#059669" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines & Y-Axis Labels */}
                {chartMath.gridValues.map((g, idx) => (
                  <g key={`grid-${idx}`}>
                    <line
                      x1="52"
                      y1={g.y}
                      x2="770"
                      y2={g.y}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x="46"
                      y={g.y + 4}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="500"
                    >
                      ₹{g.val}
                    </text>
                  </g>
                ))}

                {/* X-Axis Date Ticks */}
                {chartMath.xTicks.map((tick, idx) => (
                  <g key={`xtick-${idx}`}>
                    <line
                      x1={tick.x}
                      y1="225"
                      x2={tick.x}
                      y2="230"
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <text
                      x={tick.x}
                      y="245"
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="11"
                      fontFamily="monospace"
                    >
                      {tick.label}
                    </text>
                  </g>
                ))}

                {/* Statutory Floor CPCB Reference Line */}
                <line
                  x1="52"
                  y1={chartMath.yFloor}
                  x2="770"
                  y2={chartMath.yFloor}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <text
                  x="765"
                  y={Math.max(16, chartMath.yFloor - 5)}
                  textAnchor="end"
                  fill="#d97706"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  MSP Floor ₹{trendData.cpcbFloorRate}
                </text>

                {/* LME Ref Line */}
                {chartMath.lmeLinePath && (
                  <path
                    d={chartMath.lmeLinePath}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Spot Rate Area Fill & Stroke */}
                {chartMath.areaPath && (
                  <path d={chartMath.areaPath} fill="url(#svgSpotLightGrad)" />
                )}
                {chartMath.spotLinePath && (
                  <path
                    d={chartMath.spotLinePath}
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Hover Indicator */}
                {activeSpotCoord && (
                  <g pointerEvents="none">
                    <line
                      x1={activeSpotCoord.x}
                      y1="20"
                      x2={activeSpotCoord.x}
                      y2="225"
                      stroke="#0f172a"
                      strokeDasharray="2 2"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={activeSpotCoord.x}
                      cy={activeSpotCoord.y}
                      r="5"
                      fill="#059669"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </svg>

              {/* Interactive Tooltip Card Overlay */}
              {activeHoverPoint && activeSpotCoord && (
                <div
                  className="absolute pointer-events-none z-20 bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs font-mono text-slate-800 transition-all duration-75"
                  style={{
                    left: `${Math.min(Math.max((activeSpotCoord.x / 800) * 100, 16), 84)}%`,
                    top: '24px',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="text-slate-600 font-bold mb-1.5 flex items-center justify-between gap-4 border-b border-slate-100 pb-1">
                    <span>{activeHoverPoint.date}</span>
                    {activeHoverPoint.volumeKg && (
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-emerald-800 font-bold">
                        Vol: {activeHoverPoint.volumeKg} kg
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                      <span className="text-emerald-800 font-bold">Spot Payout:</span>
                      <span className="font-bold text-slate-900">₹{activeHoverPoint.marketSpotRate} / kg</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-amber-800">CPCB Floor (MSP):</span>
                      <span className="text-slate-700">₹{activeHoverPoint.cpcbRate} / kg</span>
                    </div>
                    {activeHoverPoint.lmeEquivRate && (
                      <div className="flex justify-between gap-4">
                        <span className="text-indigo-800">LME Ref:</span>
                        <span className="text-slate-700">₹{activeHoverPoint.lmeEquivRate} / kg</span>
                      </div>
                    )}
                    {activeHoverPoint.low !== undefined && activeHoverPoint.high !== undefined && (
                      <div className="flex justify-between gap-4 border-t border-slate-100 pt-1 text-[11px] text-slate-600">
                        <span>Day Range:</span>
                        <span>₹{activeHoverPoint.low} - ₹{activeHoverPoint.high}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mass Balance Note */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-600 mt-2 px-1 border-t border-slate-100 pt-2 gap-2">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                Aggregated from 128 authorized recyclers across Maharashtra, Gujarat, Delhi NCR, and Karnataka.
              </span>
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified Mass-Balance Feed
              </span>
            </div>
          </div>

          {/* CRM COMPOSITION METRICS & FORECAST */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Forecast */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-600 flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-700" /> AI 15-Day Outlook
              </div>
              <div className="text-sm font-bold text-indigo-950">
                {trendData.forecastNextMonth}
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Calculated by tracking London Metal Exchange (LME) and MCX refined spot metals.
              </p>
            </div>

            {/* Critical Raw Material Yields */}
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-600 flex items-center gap-1 mb-2">
                <Award className="w-3.5 h-3.5 text-amber-700" /> Critical Raw Material (CRM) Recoverable Elements
              </div>
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase">Copper (Cu)</div>
                  <div className="text-base font-bold text-amber-800">
                    {trendData.crmComposition?.copperPct ?? 0}%
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase">Gold (Au)</div>
                  <div className="text-base font-bold text-yellow-700">
                    {trendData.crmComposition?.goldGramsPerTon ?? 0} g/t
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase">Lithium (Li)</div>
                  <div className="text-base font-bold text-teal-800">
                    {trendData.crmComposition?.lithiumPct ?? 0}%
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase">Cobalt (Co)</div>
                  <div className="text-base font-bold text-indigo-800">
                    {trendData.crmComposition?.cobaltPct ?? 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-700">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Statutory Floor Mandate: CPCB E-Waste (Management) Rules, 2022</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Close Graph
          </button>
        </div>
      </div>
    </div>
  );
};
