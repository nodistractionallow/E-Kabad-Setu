import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Scale, 
  MapPin, 
  Building2, 
  User, 
  QrCode, 
  ExternalLink, 
  Copy, 
  Check, 
  Printer, 
  AlertTriangle, 
  FileText,
  CreditCard,
  Award
} from 'lucide-react';
import { EWasteLot } from '../types';
import { playFeedbackChime } from '../utils/speech';

interface PublicOrderTrackingViewProps {
  orderId: string;
  lot?: EWasteLot;
  onBackToApp?: () => void;
}

export const PublicOrderTrackingView: React.FC<PublicOrderTrackingViewProps> = ({
  orderId,
  lot,
  onBackToApp
}) => {
  const [copied, setCopied] = useState(false);

  // Fallback demo mock if lot not found in memory (e.g. opened in fresh incognito tab)
  const displayLot: EWasteLot = lot || {
    id: orderId || 'LOT-2026-EW-8812',
    collectorId: 'KBD-MH-4402',
    collectorName: 'Ram Sevak (रामसेवक कांबळे)',
    collectorPhone: '+91 98234 56789',
    materialId: 'mat_pcb_high',
    materialName: 'High-Grade Server & Telecom Motherboard',
    category: 'pcb',
    weightKg: 5.0,
    ratePerKg: 480,
    totalAmount: 2400,
    status: 'pending',
    timestamp: new Date().toISOString(),
    gpsLocation: '18.5204° N, 73.8567° E (Ward 12, Pune)',
    facilityId: 'REC-MH-PN-004',
    facilityName: 'EcoMetals CPCB Authorized Dismantling Unit #4',
    distanceKm: 3.8,
    hazardFlag: false,
    photoUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=400&auto=format&fit=crop&q=80'
  };

  const trackingUrl = `https://e-kabad-setu.vercel.app/?orderId=${encodeURIComponent(displayLot.id)}&view=order_status`;
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(trackingUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    playFeedbackChime('beep');
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine stage progress
  const isVerified = displayLot.status === 'verified' || displayLot.status === 'paid';
  const isPaid = displayLot.status === 'paid';
  const isRejected = displayLot.status === 'rejected';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Top MoEFCC Statutory Header Bar */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-2 px-4 border-b border-emerald-800">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold tracking-wide">MINISTRY OF ENVIRONMENT, FOREST & CLIMATE CHANGE (MoEFCC)</span>
            <span className="hidden sm:inline text-emerald-300">|</span>
            <span className="hidden sm:inline text-emerald-200">CPCB National E-Waste Traceability Ledger</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-300">
            Node: IN-MH-PUNE-V2
          </div>
        </div>
      </div>

      {/* Main Nav Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Return to Portal"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  E-Kabad Setu Official Order Tracking
                </h1>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  Verified Lot
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Manifest #{displayLot.id} • https://e-kabad-setu.vercel.app
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer hidden sm:flex"
              title="Print Official Manifest"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share QR Link'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Status Hero Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                Current Statutory Status
              </span>
              <div className="flex items-center gap-2.5 mt-1">
                {isPaid ? (
                  <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xl sm:text-2xl">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    <span>Settled & EPR Credit Generated</span>
                  </div>
                ) : isRejected ? (
                  <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xl sm:text-2xl">
                    <AlertTriangle className="w-7 h-7 text-rose-600" />
                    <span>Rejected & Quarantined</span>
                  </div>
                ) : isVerified ? (
                  <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xl sm:text-2xl">
                    <CheckCircle2 className="w-7 h-7 text-blue-600" />
                    <span>Weighbridge Mass Verified (Pending Payout)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xl sm:text-2xl">
                    <Clock className="w-7 h-7 text-amber-500 animate-pulse" />
                    <span>Pending Recycler Inward Weighment</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isPaid
                  ? 'The scrap lot has completed weighing, contamination review, and direct statutory UPI transfer. CPCB EPR recycling certificate has been registered.'
                  : isRejected
                  ? 'This lot was rejected by facility inspectors due to safety hazard, high chemical contamination, or statutory variance.'
                  : isVerified
                  ? 'Inward gross and tare weights recorded on Class-III weighbridge. UPI settlement is currently in queue.'
                  : 'Scrap lot registered by collector. Awaiting arrival at authorized recycler facility gate for digital weighbridge audit.'}
              </p>
            </div>

            {/* Small QR Code seal */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl shrink-0 self-start md:self-auto">
              <img 
                src={qrCodeImgSrc} 
                alt="Order QR Code" 
                className="w-24 h-24 object-contain rounded-lg border border-slate-200 bg-white p-1" 
              />
              <span className="text-[10px] font-mono text-slate-500 mt-1">Scan for Live Status</span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="pt-6">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-4">
              Statutory Custody Chain & Inward Stepper
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              {/* Step 1 */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1. Lot Created</span>
                </div>
                <p className="text-[11px] text-slate-600">Geo-tagged at source by registered Safai Sathi.</p>
                <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-1">
                  {displayLot.timestamp.split('T')[0] || 'Today'}
                </div>
              </div>

              {/* Step 2 */}
              <div className={`p-3 rounded-2xl border ${isVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex items-center gap-2 font-bold text-xs mb-1 ${isVerified ? 'text-emerald-800' : 'text-slate-600'}`}>
                  {isVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span>2. Weighbridge Audit</span>
                </div>
                <p className="text-[11px] text-slate-600">Class-III certified gross/tare weight verification.</p>
                <div className="text-[10px] font-mono text-slate-500 font-semibold mt-1">
                  {displayLot.weighbridgeWeightKg ? `${displayLot.weighbridgeWeightKg} kg Verified` : 'Pending Gate Arrival'}
                </div>
              </div>

              {/* Step 3 */}
              <div className={`p-3 rounded-2xl border ${isVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex items-center gap-2 font-bold text-xs mb-1 ${isVerified ? 'text-emerald-800' : 'text-slate-600'}`}>
                  {isVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span>3. AI Contamination Scan</span>
                </div>
                <p className="text-[11px] text-slate-600">Purity and hazardous component audit.</p>
                <div className="text-[10px] font-mono text-slate-500 font-semibold mt-1">
                  {displayLot.hazardFlag ? 'Hazard Segregated' : 'Cleared (Non-Hazardous)'}
                </div>
              </div>

              {/* Step 4 */}
              <div className={`p-3 rounded-2xl border ${isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex items-center gap-2 font-bold text-xs mb-1 ${isPaid ? 'text-emerald-800' : 'text-slate-600'}`}>
                  {isPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span>4. Direct Settlement</span>
                </div>
                <p className="text-[11px] text-slate-600">Instant UPI transfer & CPCB EPR certificate.</p>
                <div className="text-[10px] font-mono text-slate-500 font-semibold mt-1">
                  {isPaid ? `₹${displayLot.totalAmount.toLocaleString('en-IN')} Paid` : 'Awaiting Final Pay'}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Detailed Manifest Specification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Scrap Specification */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Scrap Lot Specifications</span>
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Material Category:</span>
                <span className="font-bold text-slate-900 text-right">{displayLot.materialName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">CPCB Schedule:</span>
                <span className="font-bold text-slate-800 uppercase">{displayLot.category}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Declared Mass:</span>
                <span className="font-bold text-slate-800">{displayLot.weightKg} kg</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Verified Weighbridge Mass:</span>
                <span className="font-bold text-emerald-700">
                  {displayLot.weighbridgeWeightKg ? `${displayLot.weighbridgeWeightKg} kg` : 'Pending Gate Weighment'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Statutory CPCB Floor Rate:</span>
                <span className="font-bold text-slate-900">₹{displayLot.ratePerKg} / kg</span>
              </div>
              <div className="flex justify-between items-center py-1.5 pt-2">
                <span className="text-slate-700 font-bold">Total Statutory Value:</span>
                <span className="font-black text-base text-emerald-800">
                  ₹{displayLot.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Facility & Collector Custody */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Custody & Compliance Seal</span>
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Collector / Safai Sathi:</span>
                <span className="font-bold text-slate-900 text-right">{displayLot.collectorName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Digital Saathi ID:</span>
                <span className="font-bold text-slate-800">{displayLot.collectorId}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Authorized Recycler:</span>
                <span className="font-bold text-slate-900 text-right">{displayLot.facilityName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">CPCB Authorization:</span>
                <span className="font-bold text-emerald-700">CPCB/EW-REC/2026/8812</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Geo-Tag Handover:</span>
                <span className="font-semibold text-slate-700 text-right">{displayLot.gpsLocation}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 pt-2">
                <span className="text-slate-500">EPR Certificate Ref:</span>
                <span className="font-bold text-slate-900 text-right">
                  {displayLot.id.replace('LOT', 'EPR-CPCB-CERT')}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* CPCB Regulatory Guarantee Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-start gap-3.5 shadow-xs">
          <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 space-y-1">
            <p className="font-bold text-emerald-900">
              Guaranteed by E-Waste (Management) Rules 2022, Ministry of Environment, Forest & Climate Change
            </p>
            <p className="text-slate-600 leading-relaxed">
              Every transaction registered on <strong className="font-mono text-emerald-800">https://e-kabad-setu.vercel.app</strong> is cryptographically recorded, preventing informal open-acid burning, illegal dumping, and unfair informal exploitation. Direct UPI transfer is mandated upon certified weighbridge deposit.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};
