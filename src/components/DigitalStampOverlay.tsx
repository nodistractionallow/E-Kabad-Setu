import React, { useState } from 'react';
import { ShieldCheck, Eye, MapPin, Calendar, QrCode } from 'lucide-react';

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
  lotId = 'LOT-2026-EW-PENDING',
  timestamp = '04/09/2026 09:41 IST',
  gpsLocation = '18.5204° N, 73.8567° E (Pune)',
  collectorId = 'KBD-MH-4402',
  serialOrImei,
  className = '',
  compact = false
}) => {
  const [isHoldingHide, setIsHoldingHide] = useState(false);

  // Short hash for authenticity watermark
  const authHash = `CPCB-${angleCode}-${(lotId || 'LOT').replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`;

  return (
    <div className={`relative w-full h-full select-none ${className}`}>
      {/* Cryptographic Digital Stamp with Adaptive High-Contrast Inverted Odd Blending */}
      <div 
        className={`absolute inset-x-1.5 bottom-1.5 transition-all duration-150 z-20 pointer-events-none ${
          isHoldingHide ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <div 
          className="rounded-xl p-2 border-2 border-dashed shadow-2xl backdrop-blur-xs"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            borderColor: '#00ffcc',
            // Odd color blend against scrap background
            mixBlendMode: 'difference',
            color: '#00ffff'
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between gap-1 text-[9px] font-mono font-black tracking-wider uppercase pb-1 border-b border-white/40">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#39FF14]" />
              <span>CPCB GOVT STAMP • ANGLE: {angleCode}</span>
            </span>
            <span className="bg-white/30 text-black px-1 rounded font-bold text-[8px]">
              {authHash}
            </span>
          </div>

          {/* Body details */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px] font-mono mt-1 font-bold">
            <div className="truncate">
              <span className="opacity-75">DIR: </span>
              <span className="text-[#39FF14]">{angleName}</span>
            </div>
            <div className="truncate text-right">
              <span className="opacity-75">COL: </span>
              <span>{collectorId}</span>
            </div>
            <div className="truncate flex items-center gap-0.5">
              <Calendar className="w-2.5 h-2.5 opacity-75 shrink-0" />
              <span>{timestamp}</span>
            </div>
            <div className="truncate text-right flex items-center justify-end gap-0.5">
              <MapPin className="w-2.5 h-2.5 opacity-75 shrink-0" />
              <span>{gpsLocation}</span>
            </div>
            {serialOrImei && (
              <div className="col-span-2 truncate text-[8px] bg-yellow-400/30 px-1 py-0.2 rounded text-yellow-200 mt-0.5 font-black border border-yellow-300/40">
                IMEI/SN: {serialOrImei}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Hold-to-Hide Stamp Button */}
      <div className="absolute top-1.5 right-1.5 z-30 pointer-events-auto">
        <button
          type="button"
          onMouseDown={() => setIsHoldingHide(true)}
          onMouseUp={() => setIsHoldingHide(false)}
          onMouseLeave={() => setIsHoldingHide(false)}
          onTouchStart={() => setIsHoldingHide(true)}
          onTouchEnd={() => setIsHoldingHide(false)}
          onClick={(e) => {
            e.stopPropagation();
            // Quick toggle fallback
            setIsHoldingHide(prev => !prev);
            setTimeout(() => setIsHoldingHide(false), 2000);
          }}
          className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer select-none ${
            isHoldingHide
              ? 'bg-amber-400 text-slate-950 border border-amber-300 scale-95 ring-2 ring-amber-300'
              : 'bg-slate-950/80 hover:bg-slate-900 text-white border border-slate-700/80 backdrop-blur-xs'
          }`}
          title="Press & hold to temporarily hide stamp to inspect raw scrap image"
        >
          <Eye className="w-3 h-3 text-amber-300" />
          <span>{isHoldingHide ? 'RAW IMAGE' : (compact ? 'Hold Stamp' : 'Hold to Hide Stamp')}</span>
        </button>
      </div>
    </div>
  );
};
