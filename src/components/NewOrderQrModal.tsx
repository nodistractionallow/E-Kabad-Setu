import React, { useState } from 'react';
import { QrCode, X, ExternalLink, CheckCircle2, Copy, Check, ShieldCheck, MapPin, Scale } from 'lucide-react';
import { EWasteLot } from '../types';
import { playFeedbackChime } from '../utils/speech';

interface NewOrderQrModalProps {
  lot: EWasteLot;
  isOpen: boolean;
  onClose: () => void;
  onViewTrackingPage?: (orderId: string) => void;
}

export const NewOrderQrModal: React.FC<NewOrderQrModalProps> = ({
  lot,
  isOpen,
  onClose,
  onViewTrackingPage
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // The official public domain tracking URL as requested by user
  const trackingUrl = `https://e-kabad-setu.vercel.app/?orderId=${encodeURIComponent(lot.id)}&view=order_status`;
  
  // Safe QR code image using standard reliable public generator with high error correction
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(trackingUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    playFeedbackChime('beep');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden p-6 text-slate-800 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Order Created & Inward QR</h3>
              <p className="text-xs text-slate-500 font-mono">Lot: {lot.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-slate-50 border-2 border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center justify-center mb-4 text-center relative group">
          <div className="bg-white p-2.5 rounded-xl shadow-xs border border-slate-200 mb-2">
            <img 
              src={qrCodeImgSrc} 
              alt={`QR Code for Order ${lot.id}`}
              className="w-44 h-44 object-contain rounded-lg"
              loading="lazy"
            />
          </div>
          <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Scan with phone to track on <strong className="text-slate-800 font-mono">e-kabad-setu.vercel.app</strong></span>
          </p>
        </div>

        {/* Lot Quick Meta */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 mb-4 font-mono">
          <div className="flex justify-between text-slate-600">
            <span>Material:</span>
            <span className="font-bold text-slate-900 truncate max-w-[180px]">{lot.materialName}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Weight:</span>
            <span className="font-bold text-emerald-700">{lot.weightKg} kg</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Statutory Value:</span>
            <span className="font-bold text-slate-900">₹{lot.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Facility:</span>
            <span className="text-slate-700 truncate max-w-[180px]">{lot.facilityName}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {onViewTrackingPage && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewTrackingPage(lot.id);
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Preview Public Tracking Page</span>
            </button>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Go to Pending Lots
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
