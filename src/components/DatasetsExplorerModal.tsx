import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Database, 
  Search, 
  Filter, 
  CheckCircle2, 
  Eye, 
  FileText, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Table, 
  Code2,
  RefreshCw
} from 'lucide-react';
import { 
  STRUCTURED_MATERIAL_DATASET, 
  STRUCTURED_PRICE_DATASET, 
  STRUCTURED_RECYCLER_DATASET, 
  STRUCTURED_TRANSACTION_DATASET, 
  STRUCTURED_TRACEABILITY_DATASET, 
  STRUCTURED_COLLECTOR_DATASET, 
  STRUCTURED_AIML_METRICS,
  exportDatasetToCSV 
} from '../data/datasets';

interface DatasetsExplorerModalProps {
  onClose: () => void;
}

export const DatasetsExplorerModal: React.FC<DatasetsExplorerModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'prices' | 'recyclers' | 'transactions' | 'traceability' | 'collectors' | 'aiml'>('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [copiedJson, setCopiedJson] = useState(false);

  const handleDownloadCsv = () => {
    const csvContent = exportDatasetToCSV(activeTab);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ekabad_setu_${activeTab}_dataset.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyJsonToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Structured Field & Operational Datasets</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CPCB E-Waste Rules 2022 Compliant
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Dynamic, verifiable operational datasets powering price discovery, traceability, and AI/ML model inference.
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

        {/* Dataset Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'materials', label: 'Material Dataset', count: STRUCTURED_MATERIAL_DATASET.length },
            { id: 'prices', label: 'Price & Mandi Dataset', count: STRUCTURED_PRICE_DATASET.length },
            { id: 'recyclers', label: 'Authorized Recyclers', count: STRUCTURED_RECYCLER_DATASET.length },
            { id: 'transactions', label: 'Transaction Audit Log', count: STRUCTURED_TRANSACTION_DATASET.length },
            { id: 'traceability', label: 'Traceability & Chain-of-Custody', count: STRUCTURED_TRACEABILITY_DATASET.length },
            { id: 'collectors', label: 'Minimal Collector Dataset', count: STRUCTURED_COLLECTOR_DATASET.length },
            { id: 'aiml', label: 'AI/ML Training Specs', count: 1 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 border-t-2 border-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === tab.id ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter and Action Bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab} dataset records...`}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'json' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JSON Schema</span>
              </button>
            </div>

            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Dataset Content Table */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          {viewMode === 'json' ? (
            <div className="relative bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-[500px]">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-slate-400">
                <span>Schema & Raw Records: {activeTab}</span>
                <button
                  onClick={() => {
                    const data = activeTab === 'materials' ? STRUCTURED_MATERIAL_DATASET
                      : activeTab === 'prices' ? STRUCTURED_PRICE_DATASET
                      : activeTab === 'recyclers' ? STRUCTURED_RECYCLER_DATASET
                      : activeTab === 'transactions' ? STRUCTURED_TRANSACTION_DATASET
                      : activeTab === 'traceability' ? STRUCTURED_TRACEABILITY_DATASET
                      : activeTab === 'collectors' ? STRUCTURED_COLLECTOR_DATASET
                      : STRUCTURED_AIML_METRICS;
                    copyJsonToClipboard(data);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-sans font-bold"
                >
                  {copiedJson ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="text-emerald-300">
                {JSON.stringify(
                  activeTab === 'materials' ? STRUCTURED_MATERIAL_DATASET
                  : activeTab === 'prices' ? STRUCTURED_PRICE_DATASET
                  : activeTab === 'recyclers' ? STRUCTURED_RECYCLER_DATASET
                  : activeTab === 'transactions' ? STRUCTURED_TRANSACTION_DATASET
                  : activeTab === 'traceability' ? STRUCTURED_TRACEABILITY_DATASET
                  : activeTab === 'collectors' ? STRUCTURED_COLLECTOR_DATASET
                  : STRUCTURED_AIML_METRICS,
                  null,
                  2
                )}
              </pre>
            </div>
          ) : (
            <>
              {/* 1. Materials Table */}
              {activeTab === 'materials' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Ref ID</th>
                        <th className="p-3">Category & Sub-Category</th>
                        <th className="p-3">Source & Condition</th>
                        <th className="p-3">Avg Weight</th>
                        <th className="p-3">Fair Mandi Rate</th>
                        <th className="p-3">Hazard Class</th>
                        <th className="p-3">CRM Yields</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {STRUCTURED_MATERIAL_DATASET.filter(m => 
                        m.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        m.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.id.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-emerald-700">{m.id}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{m.subCategory}</div>
                            <div className="text-xs text-slate-500">{m.category}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {m.condition}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-0.5">{m.sourceType}</div>
                          </td>
                          <td className="p-3 font-mono font-semibold">{m.approxWeightRangeKg.min} - {m.approxWeightRangeKg.max} kg</td>
                          <td className="p-3 font-mono font-extrabold text-emerald-700">₹{m.estimatedValuePerKg}/kg</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              m.hazardClass === 'Class-9 Hazardous' ? 'bg-red-100 text-red-700 border border-red-200' :
                              m.hazardClass === 'Toxic Heavy Metal' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {m.hazardClass}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="text-[11px] space-y-0.5 font-mono">
                              {m.crmYield.copperPct > 0 && <div>Cu: <span className="font-bold text-slate-800">{m.crmYield.copperPct}%</span></div>}
                              {m.crmYield.lithiumPct > 0 && <div>Li: <span className="font-bold text-amber-600">{m.crmYield.lithiumPct}%</span></div>}
                              {m.crmYield.cobaltPct > 0 && <div>Co: <span className="font-bold text-blue-600">{m.crmYield.cobaltPct}%</span></div>}
                              {m.crmYield.goldGramsPerTon > 0 && <div>Au: <span className="font-bold text-yellow-600">{m.crmYield.goldGramsPerTon}g/t</span></div>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 2. Prices Table */}
              {activeTab === 'prices' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Price ID</th>
                        <th className="p-3">Material Category</th>
                        <th className="p-3">Location & Mandi Hub</th>
                        <th className="p-3">Prevailing Buy Rate</th>
                        <th className="p-3">30-Day Range</th>
                        <th className="p-3">7-Day Trend</th>
                        <th className="p-3">CPCB Mandi Cap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {STRUCTURED_PRICE_DATASET.filter(p => 
                        p.materialCategory.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.subCategory.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-emerald-700">{p.id}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{p.subCategory}</div>
                            <div className="text-xs text-slate-500 capitalize">{p.materialCategory}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{p.location}</div>
                            <div className="text-[11px] text-slate-400">{p.dateTime}</div>
                          </td>
                          <td className="p-3 font-mono font-extrabold text-base text-slate-900">₹{p.prevailingBuyingPrice}/kg</td>
                          <td className="p-3 font-mono text-xs text-slate-600">₹{p.historicalRange30d.low} - ₹{p.historicalRange30d.high}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              p.priceTrendPct7d > 0 ? 'bg-emerald-100 text-emerald-700' :
                              p.priceTrendPct7d < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {p.priceTrendPct7d > 0 ? `+${p.priceTrendPct7d}%` : `${p.priceTrendPct7d}%`}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-500">₹{p.cpcbMandiCap}/kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. Recyclers Table */}
              {activeTab === 'recyclers' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Recycler / Facility</th>
                        <th className="p-3">CPCB / SPCB License</th>
                        <th className="p-3">Location & Radius</th>
                        <th className="p-3">Logistics / Pickup</th>
                        <th className="p-3">Materials Handled</th>
                        <th className="p-3">Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {STRUCTURED_RECYCLER_DATASET.filter(r => 
                        r.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        r.cpcbRegistrationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.facilityLocation.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{r.facilityName}</div>
                            <div className="text-xs text-slate-500">{r.contactPerson} • {r.phone}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-xs font-bold text-emerald-700">{r.cpcbRegistrationNo}</div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {r.authorizationStatus}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="text-xs font-semibold text-slate-800">{r.facilityLocation}</div>
                            <div className="text-[11px] text-slate-500">Radius: {r.serviceAreaRadiusKm} km</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {r.pickupAvailability}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {r.materialsAccepted.map((m) => (
                                <span key={m} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] uppercase font-bold text-slate-600">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs font-bold text-slate-800">
                            {r.monthlyCapacityTons} T/mo
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 4. Transactions Table */}
              {activeTab === 'transactions' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Lot Reference</th>
                        <th className="p-3">Collector</th>
                        <th className="p-3">Material & Weight</th>
                        <th className="p-3">Final Rate & Payout</th>
                        <th className="p-3">Payment Mode</th>
                        <th className="p-3">Recycler Facility</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {STRUCTURED_TRANSACTION_DATASET.filter(t => 
                        t.lotId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.collectorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.materialCategory.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((t) => (
                        <tr key={t.lotId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-mono font-bold text-emerald-700">{t.lotId}</div>
                            <div className="text-[11px] text-slate-400">{t.dateTime}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{t.collectorName}</div>
                            <div className="font-mono text-[11px] text-slate-500">{t.collectorId}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{t.subCategory}</div>
                            <div className="font-mono text-xs font-bold text-slate-600">{t.quantityWeightKg} kg</div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-extrabold text-sm text-emerald-700">₹{t.totalPayoutINR.toLocaleString('en-IN')}</div>
                            <div className="font-mono text-[11px] text-slate-500">@ ₹{t.finalPricePerKg}/kg</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              t.paymentMode === 'CASH' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {t.paymentMode} ({t.paymentStatus})
                            </span>
                          </td>
                          <td className="p-3 text-xs text-slate-700">{t.recyclerFacilityName}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {t.transactionStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. Traceability Table */}
              {activeTab === 'traceability' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Lot & QR Token</th>
                        <th className="p-3">Certified Weight (Tare/Gross)</th>
                        <th className="p-3">GPS Provenance Coordinates</th>
                        <th className="p-3">CPCB Form-6 Manifest</th>
                        <th className="p-3">Processing Stage</th>
                        <th className="p-3">Cryptographic Signature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {STRUCTURED_TRACEABILITY_DATASET.map((tr) => (
                        <tr key={tr.lotId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-mono font-bold text-emerald-700">{tr.lotId}</div>
                            <div className="font-mono text-[11px] text-slate-500">{tr.handoverTokenQR}</div>
                          </td>
                          <td className="p-3 font-mono">
                            <div className="font-bold text-slate-900">{tr.netCertifiedWeightKg} kg net</div>
                            <div className="text-[10px] text-slate-400">Gross: {tr.calibratedWeighbridgeGrossKg}kg | Tare: {tr.tareWeightKg}kg</div>
                          </td>
                          <td className="p-3 text-xs">
                            <div className="text-slate-700">Origin: {tr.gpsCollectionCoords}</div>
                            <div className="text-slate-500">Dest: {tr.gpsHandoverCoords}</div>
                          </td>
                          <td className="p-3 font-mono text-xs font-bold text-blue-700">{tr.cpcbForm6ManifestId}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {tr.downstreamProcessingStage}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                            {tr.recyclerConfirmationSignature}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 6. Collectors Minimal Dataset */}
              {activeTab === 'collectors' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-semibold">
                    🔒 Privacy-Preserving Dataset: Only pseudonymous aliases, operating wards, and transaction aggregates are maintained. No sensitive Aadhaar or KYC papers are exposed.
                  </div>
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Collector ID</th>
                        <th className="p-3">Alias / Ward</th>
                        <th className="p-3">Safety Tier</th>
                        <th className="p-3">Total Deliveries</th>
                        <th className="p-3">Total Mass Handed Over</th>
                        <th className="p-3">Cumulative Formal Earnings</th>
                        <th className="p-3">Safety Bag Deposits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {STRUCTURED_COLLECTOR_DATASET.map((c) => (
                        <tr key={c.collectorId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-emerald-700">{c.collectorId}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{c.aliasName}</div>
                            <div className="text-xs text-slate-500">{c.primaryOperatingWard}, {c.city}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                              c.safetyTier === 'Gold' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              c.safetyTier === 'Silver' ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                              'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}>
                              ★ {c.safetyTier}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-semibold">{c.totalTransactionsCount} lots</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{c.cumulativeWeightDeliveredKg} kg</td>
                          <td className="p-3 font-mono font-black text-emerald-700">₹{c.cumulativeEarningsINR.toLocaleString('en-IN')}</td>
                          <td className="p-3 font-mono text-xs text-slate-700">
                            {c.safetyBagsDelivered} bags (+₹{c.securityDepositRefundINR} refund)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 7. AI/ML Training Specs */}
              {activeTab === 'aiml' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                      <div>
                        <h3 className="font-black text-slate-900 text-lg">Model Architecture & Training Dataset Manifest</h3>
                        <p className="text-xs text-slate-500">Fine-tuned for Indian electronic waste scrap under variable scrapyard illumination.</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold text-xs rounded-full border border-emerald-200">
                        {STRUCTURED_AIML_METRICS.datasetId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-medium">Total Labeled Images</div>
                        <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{STRUCTURED_AIML_METRICS.totalLabeledImages}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Multi-spectral scrap photos</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-medium">Top-1 Accuracy</div>
                        <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">{STRUCTURED_AIML_METRICS.top1AccuracyPct}%</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Test set validation</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-medium">Edge Inference Latency</div>
                        <div className="text-xl font-black text-blue-600 font-mono mt-0.5">{STRUCTURED_AIML_METRICS.latencyOnEntryAndroidMs} ms</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Entry-level Android (2GB RAM)</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-medium">Dataset Split</div>
                        <div className="text-sm font-black text-slate-800 font-mono mt-1">70% / 15% / 15%</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Train / Val / Test</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">7 Target Classification Classes</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {STRUCTURED_AIML_METRICS.classesList.map((cls, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              {cls}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Dataset Origin & Provenance: </span>
                        {STRUCTURED_AIML_METRICS.datasetSource}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Data Cleaning & Normalization: </span>
                        {STRUCTURED_AIML_METRICS.dataCleaningProtocol}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Sync Active: Real-time CPCB E-Waste Rules 2022 Schema</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close Datasets Explorer
          </button>
        </div>

      </div>
    </div>
  );
};
