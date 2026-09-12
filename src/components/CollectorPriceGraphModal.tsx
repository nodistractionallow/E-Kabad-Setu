import React, { useState } from 'react';
import { 
  X, 
  Volume2, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Coins,
  ArrowRight
} from 'lucide-react';
import { MaterialItem, Language } from '../types';
import { playFeedbackChime } from '../utils/speech';
import { getMaterialPriceTrend } from '../data/authoritiesAndTransactionsData';

interface CollectorPriceGraphModalProps {
  material: MaterialItem;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  speak: (text: string) => void;
  onSelectForScan?: (material: MaterialItem) => void;
}

export const CollectorPriceGraphModal: React.FC<CollectorPriceGraphModalProps> = ({
  material,
  isOpen,
  onClose,
  language,
  speak,
  onSelectForScan
}) => {
  const [selectedWeight, setSelectedWeight] = useState<number>(10);

  if (!isOpen) return null;

  const matName = language === 'hi' ? material.name_hi : language === 'mr' ? material.name_mr : material.name_en;
  const currentRate = material.pricePerKg;

  // Retrieve or generate 7-day historical prices
  const trendData = getMaterialPriceTrend(material.id, currentRate);
  const history7d = trendData?.history7d || [
    { date: 'Day 1', marketSpotRate: Math.round(currentRate * 0.94) },
    { date: 'Day 2', marketSpotRate: Math.round(currentRate * 0.95) },
    { date: 'Day 3', marketSpotRate: Math.round(currentRate * 0.96) },
    { date: 'Day 4', marketSpotRate: Math.round(currentRate * 0.97) },
    { date: 'Day 5', marketSpotRate: Math.round(currentRate * 0.98) },
    { date: 'Day 6', marketSpotRate: Math.round(currentRate * 0.99) },
    { date: 'Day 7', marketSpotRate: currentRate }
  ];

  const yesterdayRate = history7d[history7d.length - 2]?.marketSpotRate || Math.round(currentRate * 0.98);
  const weekAgoRate = history7d[0]?.marketSpotRate || Math.round(currentRate * 0.94);
  const dailyDiff = currentRate - yesterdayRate;
  const weeklyDiff = currentRate - weekAgoRate;
  const isTrendingUp = weeklyDiff >= 0;

  // Find min and max for proportional bar heights
  const rates = history7d.map(h => h.marketSpotRate);
  const minRate = Math.min(...rates) * 0.92;
  const maxRate = Math.max(...rates) * 1.05;
  const range = maxRate - minRate || 1;

  // Vernacular day names
  const dayLabels = language === 'hi'
    ? ['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'आज']
    : language === 'mr'
    ? ['सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'आज']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];

  // Audio speech narration text
  const getAudioNarrationText = () => {
    if (language === 'hi') {
      const trendWord = isTrendingUp ? 'बढ़ा' : 'कम हुआ';
      const advice = isTrendingUp ? 'यह कबाड़ बेचने का बहुत अच्छा समय है।' : 'भाव सामान्य है, सही वजन तौलवा कर बेचें।';
      return `${matName} का आज का भाव ₹${currentRate} प्रति किलो है। पिछले हफ्ते से भाव में ₹${Math.abs(weeklyDiff)} का फायदा ${trendWord} है। 10 किलो पर लगभग ₹${currentRate * 10} मिलेंगे। ${advice}`;
    }
    if (language === 'mr') {
      const trendWord = isTrendingUp ? 'वाढला' : 'कमी झाला';
      const advice = isTrendingUp ? 'हा माल विकण्यासाठी उत्तम वेळ आहे.' : 'दर सामान्य आहे, योग्य वजन करून विक्री करा.';
      return `${matName} चा आजचा दर ₹${currentRate} प्रति किलो आहे. मागील आठवड्यापेक्षा ₹${Math.abs(weeklyDiff)} ${trendWord} आहे. 10 किलोवर सुमारे ₹${currentRate * 10} मिळतील. ${advice}`;
    }
    return `Today's rate for ${material.name_en} is ₹${currentRate} per kilogram. Price is ${isTrendingUp ? 'up' : 'down'} by ₹${Math.abs(weeklyDiff)} over the past 7 days. Ten kilograms will earn you ₹${currentRate * 10}.`;
  };

  const handlePlayVoice = () => {
    playFeedbackChime('beep');
    speak(getAudioNarrationText());
  };

  const estimatedEarnings = selectedWeight * currentRate;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border-2 border-emerald-600 shadow-2xl overflow-hidden my-auto flex flex-col text-slate-900 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[11px] font-bold font-mono">
                {language === 'hi' ? 'दैनिक मंडी भाव ग्राफ' : language === 'mr' ? 'दैनंदिन बाजारभाव आलेख' : 'Daily Mandi Trend'}
              </span>
              <span className="text-xs text-emerald-300 font-mono">
                CPCB Mandi Index
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              {matName}
            </h3>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">
              {material.name_en}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Big Audio Narration & Market Signal */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePlayVoice}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span>
                {language === 'hi' ? '📢 बोलकर भाव सुनें' : language === 'mr' ? '📢 आवाजात दर ऐका' : '📢 Listen in Voice'}
              </span>
            </button>

            <div className={`px-3 py-2.5 rounded-2xl border flex items-center gap-1.5 font-bold text-xs font-mono ${
              isTrendingUp 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}>
              {isTrendingUp ? (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'hi' ? 'तेजी ↗' : language === 'mr' ? 'तेजी ↗' : 'Bullish ↗'}</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-amber-600" />
                  <span>{language === 'hi' ? 'मंदी ↘' : language === 'mr' ? 'मंदी ↘' : 'Bearish ↘'}</span>
                </>
              )}
            </div>
          </div>

          {/* Today's Rate Hero Display */}
          <div className="bg-emerald-50/80 border-2 border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block font-mono">
                {language === 'hi' ? 'आज का मंडी भाव (Today)' : language === 'mr' ? 'आजचा दर (Today)' : "Today's Mandi Rate"}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                  ₹{currentRate}
                </span>
                <span className="text-sm font-bold text-slate-600 font-mono">
                  /kg
                </span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 font-bold text-xs font-mono shadow-2xs">
                <span>{dailyDiff >= 0 ? `+₹${dailyDiff}` : `-₹${Math.abs(dailyDiff)}`}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {language === 'hi' ? '(कल से)' : language === 'mr' ? '(कालपेक्षा)' : '(vs yest)'}
                </span>
              </div>
              <div className="text-[11px] font-bold text-emerald-700 font-mono">
                {weeklyDiff >= 0 ? `+₹${weeklyDiff} फायदा (7 दिन)` : `-₹${Math.abs(weeklyDiff)} (7 दिन)`}
              </div>
            </div>
          </div>

          {/* Intuitive 7-Day Visual Comparison Ladder */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{language === 'hi' ? '7 दिनों का आसान भाव ग्राफ' : language === 'mr' ? '7 दिवसांचा सोपा दर आलेख' : '7-Day Visual Price Ladder'}</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                {isTrendingUp ? (language === 'hi' ? 'भाव ऊपर चढ़ रहा है ✓' : 'Price Going Up ✓') : (language === 'hi' ? 'भाव स्थिर है' : 'Price Stable')}
              </span>
            </div>

            {/* Visual Bars Container */}
            <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-44 pt-6 px-1 pb-1">
              {history7d.map((item, idx) => {
                const rate = item.marketSpotRate;
                const heightPct = Math.max(22, Math.min(100, Math.round(((rate - minRate) / range) * 100)));
                const isToday = idx === history7d.length - 1;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                    {/* Exact Rupee Price Label on top of Bar */}
                    <span className={`text-[10px] sm:text-xs font-black font-mono mb-1.5 transition-all ${
                      isToday 
                        ? 'text-emerald-800 scale-110' 
                        : 'text-slate-600 group-hover:text-slate-900'
                    }`}>
                      ₹{rate}
                    </span>

                    {/* Proportional Bar */}
                    <div 
                      className={`w-full rounded-t-xl transition-all duration-300 relative ${
                        isToday
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                          : 'bg-gradient-to-t from-slate-300 to-emerald-300/80 hover:bg-emerald-400'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    >
                      {isToday && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                      )}
                    </div>

                    {/* Day Name Label */}
                    <div className="mt-2 text-center">
                      <span className={`text-[10px] sm:text-xs font-bold font-mono block ${
                        isToday 
                          ? 'text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full font-black' 
                          : 'text-slate-500'
                      }`}>
                        {dayLabels[idx]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 font-mono text-center mt-2 border-t border-slate-200/80 pt-1.5">
              {language === 'hi' 
                ? 'ऊपर की हरी पट्टी जितनी ऊंची, उतना अधिक भाव व मुनाफा!' 
                : 'Higher bar means higher rate and more money in hand!'}
            </p>
          </div>

          {/* Quick 1-Tap Weight Payout Calculator (कैलकुलेटर) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>{language === 'hi' ? 'अनुमानित कमाई (कैश कैलकुलेटर)' : language === 'mr' ? 'अंदाजे कमाई (कॅश कॅल्क्युलेटर)' : 'Instant Cash Estimator'}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500 font-mono">
                {selectedWeight} kg
              </span>
            </div>

            {/* Quick Weight Selector Chips */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[5, 10, 20, 50].map((kg) => (
                <button
                  key={kg}
                  type="button"
                  onClick={() => {
                    playFeedbackChime('beep');
                    setSelectedWeight(kg);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold font-mono text-center transition-all cursor-pointer ${
                    selectedWeight === kg
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 font-black'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <div>{kg} kg</div>
                  <div className={`text-[9px] ${selectedWeight === kg ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {kg === 5 ? 'थैली' : kg === 10 ? '1 कट्टा' : kg === 20 ? 'बड़ी बोरी' : 'थोक'}
                  </div>
                </button>
              ))}
            </div>

            {/* Resulting Payout Badge */}
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 font-bold block">
                  {selectedWeight} kg {language === 'hi' ? 'का पक्का नगद भुगतान' : language === 'mr' ? 'ची रोकड रक्कम' : 'Estimated Net Cash'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedWeight} kg × ₹{currentRate}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-700">
                ₹{estimatedEarnings.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Action: Select and scan this material */}
          {onSelectForScan && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectForScan(material);
              }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-[0.99] cursor-pointer"
            >
              <span>
                {language === 'hi' ? `📸 इस सामग्री (${matName}) का लॉट बनाएं` : language === 'mr' ? `📸 या मालाचा लॉट बनवा` : `📸 Create Lot for this Scrap`}
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
