import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  CreditCard, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { REGULATORY_AUTHORITIES } from '../data/authoritiesAndTransactionsData';
import { playFeedbackChime } from '../utils/speech';

interface PartnerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAuthorityId?: string;
}

export const PartnerRegistrationModal: React.FC<PartnerRegistrationModalProps> = ({
  isOpen,
  onClose,
  defaultAuthorityId = 'auth_mpcb'
}) => {
  const { registerPartner } = useApp();

  const [partnerType, setPartnerType] = useState<'RECYCLER_FACILITY' | 'AGGREGATOR_HUB'>('RECYCLER_FACILITY');
  const [applicantName, setApplicantName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankUpi, setBankUpi] = useState('');
  const [selectedAuthorityId, setSelectedAuthorityId] = useState(defaultAuthorityId);
  const [city, setCity] = useState('Pune');
  const [ward, setWard] = useState('Bhosari Industrial MIDC Sector 7');
  const [licenseOrGst, setLicenseOrGst] = useState('');
  const [tier, setTier] = useState<'Standard Partner' | 'Silver Partner' | 'Gold Partner'>('Silver Partner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ regId: string; authorityName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAuthority = REGULATORY_AUTHORITIES.find(a => a.id === selectedAuthorityId) || REGULATORY_AUTHORITIES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!applicantName.trim() || !facilityName.trim() || !phone.trim() || !bankUpi.trim()) {
      setErrorMsg('Please fill in all mandatory fields (Contact Person, Facility Name, Phone, and UPI).');
      return;
    }

    setIsSubmitting(true);
    try {
      const annualCapacity = tier === 'Gold Partner' ? 120 : tier === 'Silver Partner' ? 60 : 30;
      const categoriesHandled = partnerType === 'RECYCLER_FACILITY' 
        ? ['Printed Circuit Boards (ITEW1)', 'Lithium-Ion Batteries', 'Copper Scrap', 'Ferrous Metals']
        : ['Consumer Electronics', 'Mixed Cables', 'Alloy Heat Sinks'];

      const res = await registerPartner({
        name: applicantName.trim(),
        applicantName: applicantName.trim(),
        facilityName: facilityName.trim(),
        companyName: facilityName.trim(),
        phone: phone.trim(),
        contactPhone: phone.trim(),
        city: city.trim(),
        state: currentAuthority.state,
        statePcb: `${currentAuthority.code} (${currentAuthority.state})`,
        ward: ward.trim(),
        facilityAddress: `${ward.trim()}, ${city.trim()}`,
        bankUpi: bankUpi.trim(),
        contactEmail: bankUpi.trim(),
        tier,
        aadhaarOrGst: licenseOrGst.trim() || `${currentAuthority.code}-CTO-2026-APPLIED`,
        spcbLicenseNo: licenseOrGst.trim() || `${currentAuthority.code}-EW-${Math.floor(1000 + Math.random() * 9000)}`,
        registeredByAuthorityId: currentAuthority.id,
        partnerType,
        annualCapacityMetricTons: annualCapacity,
        categoriesHandled
      });

      playFeedbackChime('success');
      setSuccessData({
        regId: res.id,
        authorityName: currentAuthority.name
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err?.message || 'Failed to submit application. Please check input data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSuccessData(null);
    setErrorMsg(null);
    setApplicantName('');
    setFacilityName('');
    setPhone('');
    setBankUpi('');
    setLicenseOrGst('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-mono">
                Partner Accreditation Application
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Formal SPCB / CPCB Circular Economy Accreditation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Screen */}
        {successData ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-14 h-14 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 font-mono">
                Application Successfully Submitted!
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Your dossier has been queued for official scrutiny under{' '}
                <span className="font-bold text-slate-800">{successData.authorityName}</span>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-left font-mono text-xs space-y-2 shadow-2xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tracking Reference:</span>
                <span className="font-bold text-emerald-700">{successData.regId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                  PENDING GOVT APPROVAL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Next Action:</span>
                <span className="text-slate-700 font-semibold">Government CPCB clearance desk review</span>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs font-mono transition-colors shadow-xs"
            >
              Close & Return to Portal
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1 font-mono">
                <span>1. Select Entity Type:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPartnerType('RECYCLER_FACILITY')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    partnerType === 'RECYCLER_FACILITY'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-mono text-xs">🏭 Recycler Facility</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Dismantling & smelting plant</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerType('AGGREGATOR_HUB')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    partnerType === 'AGGREGATOR_HUB'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-mono text-xs">🛵 Aggregator Hub</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Ward-level collection point</div>
                </button>
              </div>
            </div>

            {/* Entity Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Enterprise / Facility Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex CleanTech Recyclers LLP"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Authorized Signatory Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra Patel"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                />
              </div>
            </div>

            {/* Contact & Banking */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Contact Mobile Number *</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98XXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  <span>Settlement Bank UPI / ID *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. apex.metals@okhdfcbank"
                  value={bankUpi}
                  onChange={(e) => setBankUpi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                />
              </div>
            </div>

            {/* Regulatory Authority & License */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-slate-400" />
                  <span>Jurisdiction State PCB:</span>
                </label>
                <select
                  value={selectedAuthorityId}
                  onChange={(e) => setSelectedAuthorityId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  {REGULATORY_AUTHORITIES.map((auth) => (
                    <option key={auth.id} value={auth.id}>
                      {auth.code} ({auth.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>SPCB CTO / GST / Aadhaar:</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27AAACR1234F1Z0 / CTO-902"
                  value={licenseOrGst}
                  onChange={(e) => setLicenseOrGst(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            {/* Location & Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>City:</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Industrial Ward:
                </label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Capacity Tier:
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono"
                >
                  <option value="Standard Partner">Standard (30 MT/yr)</option>
                  <option value="Silver Partner">Silver (60 MT/yr)</option>
                  <option value="Gold Partner">Gold (120 MT/yr)</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Application...' : 'Submit Accreditation Dossier'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
