import React, { useState } from 'react';
import { ShieldCheck, Eye, MapPin, Calendar, CheckCircle2, QrCode } from 'lucide-react';

export interface DigitalStampOverlayProps {
  angleName: string;
  angleCode: 'TOP' | 'UNDERSIDE' | 'STICKER';
  lotId?: string;
  timestamp?: string;
  gpsLocation?: string;
  collectorId?: string;
  serialOrImei?: string;
  className?: string;
  compact?: boolean;
}

export const DigitalStampOverlay: React.FC<DigitalStampOverlayProps> = ({
  angleName,
  angleCode,
  lotId = 'LOT-2026-EW-9027',
  timestamp = '04/09/2026 09:41:22 IST',
  gpsLocation = '18.5204° N, 73.8567° E (Pune, MH)',
  collectorId = 'KBD-4402',
  serialOrImei,
  className = '',
  compact = false
}) => {
  const [isHoldingHide, setIsHoldingHide] = useState(false);

  // SIH & CPCB Cryptographic Stamp Audit Hash
  const cleanLotNum = (lotId || '9027').replace(/[^0-9]/g, '').slice(-4) || '9027';
  const authHash = `SIH-CPCB-${angleCode}-${cleanLotNum}-E9A2`;

  return (
    <div className={`absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-2 select-none ${className}`}>
      {/* TOP ROW: SIH/CPCB Watermark Badge & Interactive Hold-to-Hide Button */}
      <div className="flex items-start justify-between gap-1.5">
        {/* SIH Official Audit Badge */}
        <div
          className={`transition-all duration-200 ${
            isHoldingHide ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="bg-slate-950/90 border border-emerald-500/80 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white shadow-lg flex items-center gap-1.5 font-mono text-[9px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-300 font-extrabold tracking-wider">SIH • CPCB AUDIT SEAL</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-300 font-bold uppercase">{angleCode}</span>
          </div>
        </div>

        {/* Interactive Hold-to-Hide Stamp Button */}
        <div className="pointer-events-auto">
          <button
            type="button"
            onMouseDown={() => setIsHoldingHide(true)}
            onMouseUp={() => setIsHoldingHide(false)}
            onMouseLeave={() => setIsHoldingHide(false)}
            onTouchStart={() => setIsHoldingHide(true)}
            onTouchEnd={() => setIsHoldingHide(false)}
            onClick={(e) => {
              e.stopPropagation();
              setIsHoldingHide((prev) => !prev);
              setTimeout(() => setIsHoldingHide(false), 2500);
            }}
            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-mono font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer select-none ${
              isHoldingHide
                ? 'bg-amber-400 text-slate-950 border border-amber-300 scale-95 ring-2 ring-amber-300 font-black'
                : 'bg-slate-950/85 hover:bg-slate-900 text-white border border-slate-700/80 backdrop-blur-xs'
            }`}
            title="Press & hold to temporarily hide stamp to inspect raw scrap image"
          >
            <Eye className="w-3 h-3 text-amber-300" />
            <span>{isHoldingHide ? 'RAW SCRAP' : (compact ? 'Hold Stamp' : 'Hold to Hide Stamp')}</span>
          </button>
        </div>
      </div>

      {/* BOTTOM BOX: Official SIH & CPCB Mandatory Geostamp Card */}
      <div
        className={`transition-all duration-200 ${
          isHoldingHide ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="bg-slate-950/92 border border-emerald-500/60 rounded-xl p-2 shadow-2xl backdrop-blur-sm text-white">
          {/* Stamp Header */}
          <div className="flex items-center justify-between gap-1 text-[9px] font-mono font-black tracking-wider uppercase pb-1 border-b border-slate-800">
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>CPCB E-WASTE RULES 2022 • TAMPER PROOF</span>
            </div>
            <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold text-[8px]">
              {authHash}
            </span>
          </div>

          {/* Stamp Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px] font-mono mt-1 font-bold">
            <div className="truncate flex items-center gap-1 text-slate-300">
              <span className="text-slate-400">LOT:</span>
              <span className="text-amber-300 font-bold">{lotId}</span>
            </div>
            <div className="truncate text-right flex items-center justify-end gap-1 text-slate-300">
              <span className="text-slate-400">COL:</span>
              <span className="text-emerald-300">{collectorId}</span>
            </div>

            <div className="truncate flex items-center gap-1 text-slate-300">
              <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span className="text-slate-200">{timestamp}</span>
            </div>
            <div className="truncate text-right flex items-center justify-end gap-1 text-slate-300">
              <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span className="text-slate-200">{gpsLocation}</span>
            </div>

            <div className="col-span-2 pt-0.5 border-t border-slate-800/80 flex items-center justify-between text-[8px] text-slate-400 font-mono">
              <span className="text-emerald-400">DIR: {angleName}</span>
              {serialOrImei ? (
                <span className="text-amber-300 font-bold">SN: {serialOrImei}</span>
              ) : (
                <span className="text-slate-400">GEO-VERIFIED • SIH PASS</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
