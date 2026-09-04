import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  MapPin, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MaterialItem } from '../types';

interface AiMandiInsightsModalProps {
  material: MaterialItem;
  onClose: () => void;
}

export const AiMandiInsightsModal: React.FC<AiMandiInsightsModalProps> = ({ material, onClose }) => {
  const { language, speak, stopAudio } = useApp();
  const [location, setLocation] = useState('Pune (MIDC Bhosari)');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    summary_hi: string;
    summary_mr: string;
    summary_en: string;
    trendForecast: 'up' | 'down' | 'stable';
    expectedChangePct: number;
    keyDriver: string;
    recommendedAction_hi: string;
    recommendedAction_mr: string;
    recommendedAction_en: string;
  } | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/price-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialName: material.name_en,
          currentRate: material.pricePerKg,
          location,
          language
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setInsights(json.data);
      }
    } catch (e) {
      console.warn('Failed to fetch AI price insights:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [material.id, location]);

  const activeSummary = insights
    ? language === 'mr'
      ? insights.summary_mr
      : language === 'en'
      ? insights.summary_en
      : insights.summary_hi
    : '';

  const activeRecommendation = insights
    ? language === 'mr'
      ? insights.recommendedAction_mr
      : language === 'en'
      ? insights.recommendedAction_en
      : insights.recommendedAction_hi
    : '';

  const handleSpeak = () => {
    if (activeSummary) {
      speak(`${activeSummary} ${activeRecommendation}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Gemini AI Mandi Intelligence</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live Commodity Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'mr' ? material.name_mr : language === 'en' ? material.name_en : material.name_hi}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto bg-slate-50 text-slate-800">
          
          {/* Rate Card & Location Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Today's Mandi Rate</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5 flex items-center gap-2">
                <span>₹{material.pricePerKg}/kg</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  material.trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {material.trend >= 0 ? `+${material.trend}%` : `${material.trend}%`}
                </span>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select Scrap Mandi</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Pune (MIDC Bhosari)">Pune (MIDC Bhosari)</option>
                <option value="Mumbai (Kurla Scrap Market)">Mumbai (Kurla Scrap Market)</option>
                <option value="Delhi-NCR (Mayapuri Hub)">Delhi-NCR (Mayapuri Hub)</option>
                <option value="Bengaluru (Peenya Hub)">Bengaluru (Peenya Hub)</option>
              </select>
            </div>
          </div>

          {/* AI Explanation Box */}
          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-3 relative">
            <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Market Dynamics Analysis</span>
              </div>
              <button
                onClick={handleSpeak}
                className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-indigo-200 shadow-xs transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Listen</span>
              </button>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-indigo-600 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-xs font-semibold">Gemini AI analyzing LME & CPCB market data...</span>
              </div>
            ) : insights ? (
              <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-indigo-950">
                <p className="font-medium">{activeSummary}</p>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">7-Day Prediction</span>
                    <span className="font-bold flex items-center gap-1 mt-0.5 text-emerald-700 font-mono">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{insights.expectedChangePct}% ({insights.trendForecast.toUpperCase()})
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Key Market Driver</span>
                    <span className="font-bold text-slate-800 truncate block mt-0.5" title={insights.keyDriver}>
                      {insights.keyDriver}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-100/70 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Collector Recommendation: </span>
                    <span>{activeRecommendation}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">
                Unable to load AI insights. Check network connection.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Powered by Gemini 3.8 Flash • Real-time Mandi Grounding</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
