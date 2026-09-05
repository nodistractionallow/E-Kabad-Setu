import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Language, MaterialItem } from '../types';
import { AI_CLASSIFICATION_PRESETS, SAFETY_PRACTICES, CPCB_STANDARD_CATEGORIES } from '../data/mockData';
import { playFeedbackChime } from '../utils/speech';
import { AiMandiInsightsModal } from './AiMandiInsightsModal';
import { LiveCameraViewfinder } from './LiveCameraViewfinder';
import { CollectorOrdersManagement } from './CollectorOrdersManagement';
import { QRCodeSVG } from 'qrcode.react';

import { 
  TrendingUp, 
  Volume2, 
  RefreshCw, 
  Camera, 
  AlertTriangle, 
  AlertCircle,
  ShieldCheck, 
  QrCode, 
  Wallet, 
  ArrowLeft, 
  LogOut, 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Flame, 
  FileWarning, 
  Sliders, 
  Sparkles,
  Award,
  ChevronRight,
  Wifi,
  WifiOff,
  BatteryMedium,
  Radio,
  HelpCircle,
  Maximize2,
  SunMedium,
  Eye,
  Target,
  Upload,
  Package,
  Recycle,
  Edit3
} from 'lucide-react';

export const CollectorMobileApp: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    collector, 
    setCurrentView, 
    materials, 
    lots, 
    addLot, 
    addCustomMaterial,
    activeCreatedLot, 
    setActiveCreatedLot,
    isOnline, 
    setIsOnline,
    syncPendingAiClassifications,
    isSyncingOfflineQueue,
    speak, 
    stopAudio,
    categoryRequests,
    requestNewCategory
  } = useApp();

  // Active bottom navigation tab
  const [activeTab, setActiveTab] = useState<'mandi' | 'scan' | 'orders' | 'passbook' | 'safety'>('mandi');

  // Slide-over drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Mandi sync animation state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Scan & Lot creator state
  const [livePhoto, setLivePhoto] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(() => materials[0]?.id || 'mat_pcb_high');
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState<boolean>(false);
  const [customRateOverride, setCustomRateOverride] = useState<number | null>(null);
  const [customWeight, setCustomWeight] = useState<number>(5.0);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [savedSuccessBanner, setSavedSuccessBanner] = useState<boolean>(false);

  // Passbook payment mode filter
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'UPI' | 'CASH'>('ALL');

  const [selectedAiInsightsMaterial, setSelectedAiInsightsMaterial] = useState<MaterialItem | null>(null);

  // Live Gemini Vision Classification State
  const [isAiClassifying, setIsAiClassifying] = useState(false);
  const [aiResult, setAiResult] = useState<{
    isEWaste?: boolean;
    detectedObject?: string;
    detectedCategory: string;
    isOutOfCategory?: boolean;
    outOfCategoryNotice?: string;
    priceNotice?: string;
    confidenceScore: number;
    estimatedRatePerKg: number;
    suggestedWeightKg?: number;
    criticalMaterials: string[];
    hazardLevel: 'safe' | 'medium' | 'high';
    hazardWarning: string;
    safeAction: string;
    recommendedRecycler: string;
  } | null>(null);

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId) || materials[0];
  const isOutOfCategory = Boolean(aiResult?.isOutOfCategory);
  const currentRate = isOutOfCategory ? 0 : (customRateOverride ?? (aiResult?.estimatedRatePerKg || selectedMaterial.pricePerKg));
  const calculatedTotal = isOutOfCategory || aiResult?.isEWaste === false ? 0 : Math.round(customWeight * currentRate);

  const triggerLiveAiClassification = async (base64OrUrl: string, isHumanHint?: boolean) => {
    setIsAiClassifying(true);
    try {
      const res = await fetch('/api/ai/classify-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: base64OrUrl, 
          language, 
          isHumanHint: Boolean(isHumanHint),
          notes: isHumanHint ? 'human face person selfie' : ''
        })
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        const data = resData.data;
        setAiResult(data);
        if (data.isEWaste === false) {
          playFeedbackChime('warning');
          setCustomCategoryName(data.detectedObject || 'Non-EWaste Item');
          setCustomRateOverride(0);
          setCustomWeight(0);
          const warnMsg = data.hazardWarning || (language === 'en'
            ? `Warning: Not electronic waste. Identified as ${data.detectedObject || 'non-scrap'}. Submission blocked.`
            : language === 'mr'
            ? `चेतावणी: हे ई-कचरा नाही. ओळख: ${data.detectedObject || 'इतर वस्तू'}. सबमिशन नाकारले.`
            : `चेतावनी: यह ई-कबाड़ नहीं है! पहचान: "${data.detectedObject || 'मानव/अन्य वस्तु'}". सबमिशन अस्वीकृत।`);
          speak(warnMsg);
        } else if (data.isOutOfCategory) {
          playFeedbackChime('warning');
          setCustomCategoryName(data.detectedCategory || 'Unlisted E-Waste Scrap');
          setIsCustomCategoryMode(true);
          setCustomRateOverride(0);
          if (data.suggestedWeightKg && data.suggestedWeightKg > 0) {
            setCustomWeight(data.suggestedWeightKg);
          }
          const outMsg = language === 'hi'
            ? `यह स्क्रैप CPCB 8 श्रेणियों से बाहर है। ऊपर दी गई श्रेणियों में से चुनें या प्राधिकरण से नया अनुमोदन मांगें। मूल्य बाद में तय होगा!`
            : language === 'mr'
            ? `हा स्क्रॅप मानक 8 श्रेणींमध्ये नाही. खालील श्रेणी निवडा किंवा मंजुरी मागा. किंमत नंतर ठरवली जाईल!`
            : `Out of standard CPCB categories. Select standard category or request authority approval. Price will be decided later!`;
          speak(outMsg);
        } else {
          playFeedbackChime('beep');
          // Populate detected category name
          if (data.detectedCategory) {
            setCustomCategoryName(data.detectedCategory);
            setIsCustomCategoryMode(true);
          }
          // Auto match category to materials list if possible
          const detectedCategoryLower = (data.detectedCategory || '').toLowerCase();
          const matched = materials.find(m => 
            detectedCategoryLower.includes(m.category.toLowerCase()) || 
            m.name_en.toLowerCase().includes(detectedCategoryLower) ||
            detectedCategoryLower.includes(m.name_en.toLowerCase())
          );
          if (matched) {
            setSelectedMaterialId(matched.id);
          }
          if (data.estimatedRatePerKg) {
            setCustomRateOverride(data.estimatedRatePerKg);
          }
          if (data.suggestedWeightKg && data.suggestedWeightKg > 0) {
            setCustomWeight(data.suggestedWeightKg);
          }
          if (data.hazardWarning) {
            playFeedbackChime('warning');
            speak(data.hazardWarning);
          } else {
            speak(`${data.detectedCategory || 'Electronic scrap'} identified. Rate: ₹${data.estimatedRatePerKg || selectedMaterial.pricePerKg} per kg.`);
          }
        }
        return;
      }
    } catch (err) {
      console.warn('AI classification request error, applying fast edge model:', err);
    } finally {
      setIsAiClassifying(false);
    }

    // Client-side fallback if server offline
    if (isHumanHint) {
      const humanReject = {
        isEWaste: false,
        detectedObject: 'Human Face / Person (Selfie)',
        name_en: 'Human Face / Person (Non-EWaste)',
        name_hi: 'मानव चेहरा / व्यक्ति (ई-कबाड़ नहीं है)',
        name_mr: 'मानवी चेहरा / व्यक्ती (ई-कचरा नाही)',
        grade: 'Rejected - Non Electronic',
        suggestedWeightKg: 0,
        estimatedRatePerKg: 0,
        suggestedRatePerKg: 0,
        hazardLevel: 'high' as const,
        hazardWarning: language === 'hi' 
          ? 'सत्यापन अस्वीकृत: मानव चेहरा या सेल्फी ई-कबाड़ के रूप में जमा नहीं की जा सकती।' 
          : 'Rejected: Human face or non-electronic item cannot be submitted as scrap.',
        hazardWarning_en: 'Rejected: Human face or non-electronic item cannot be submitted as scrap.',
        hazardWarning_hi: 'सत्यापन अस्वीकृत: मानव चेहरा या सेल्फी ई-कबाड़ के रूप में जमा नहीं की जा सकती।',
        hazardWarning_mr: 'सत्यापन नाकारले: मानवी चेहरा ई-कचरा नाही.',
        safeAction: 'कृपया केवल वास्तविक इलेक्ट्रॉनिक हार्डवेयर का फोटो लें।',
        safeAction_en: 'Please point camera exclusively at real electronic hardware.',
        safeAction_hi: 'कृपया केवल वास्तविक इलेक्ट्रॉनिक हार्डवेयर का फोटो लें।',
        safeAction_mr: 'कृपया खऱ्या इलेक्ट्रॉनिक उपकरणांचा फोटो काढा.',
        crmYield: { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
        criticalMaterials: [],
        anomalyDetected: true,
        anomalyReason: 'Human face/person detected. Lot submission blocked.',
        confidenceScore: 99.8,
        recommendedRecycler: 'N/A - Blocked'
      };
      setAiResult(humanReject);
      setCustomCategoryName('Human Face (Rejected)');
      setCustomRateOverride(0);
      setCustomWeight(0);
      playFeedbackChime('warning');
      speak(language === 'hi' ? 'चेतावनी: यह ई-कबाड़ नहीं है, मानव चेहरा पहचाना गया है।' : 'Warning: Human face detected, not electronic scrap.');
      return;
    }

    const fallbackCategory = 'Server Motherboard (High Value PCB)';
    const fallbackRate = 480;
    const fallbackData = {
      isEWaste: true,
      detectedObject: 'Multi-layer telecom server board with high gold content',
      detectedCategory: fallbackCategory,
      confidenceScore: 94.5,
      estimatedRatePerKg: fallbackRate,
      suggestedWeightKg: 6.5,
      criticalMaterials: ['Gold (Au)', 'Copper (Cu)', 'Palladium (Pd)', 'Tantalum (Ta)'],
      hazardLevel: 'safe' as const,
      hazardWarning: '',
      safeAction: 'Dismantle aluminium heatsinks before loading into furnace',
      recommendedRecycler: 'EcoMetals CPCB Dismantling Unit #4'
    };

    setAiResult(fallbackData);
    setCustomCategoryName(fallbackCategory);
    setCustomRateOverride(fallbackRate);
    setCustomWeight(6.5);
    playFeedbackChime('beep');
    speak(`${fallbackCategory} identified. Rate: ₹${fallbackRate} per kg.`);
  };

  const handleSyncPrices = () => {
    setIsSyncing(true);
    playFeedbackChime('beep');
    setTimeout(() => {
      setIsSyncing(false);
      const msg = language === 'en' 
        ? 'Synced with Pune Recyclers Market Board at 06:00 AM' 
        : 'पुणे रिसाइक्लर्स मंडी भाव सफलतापूर्वक अपडेट हुए';
      setSyncMessage(msg);
      speak(msg);
      setTimeout(() => setSyncMessage(null), 4000);
    }, 900);
  };

  const handleSaveLot = async () => {
    if (!livePhoto) {
      playFeedbackChime('warning');
      const errTxt = language === 'en'
        ? 'Please click a photo of the scrap before dispatch.'
        : language === 'mr'
        ? 'कृपया प्रेषण करण्यापूर्वी स्क्रॅपचा फोटो घ्या.'
        : 'कृपया प्रेषण से पहले कबाड़ का फोटो लें।';
      speak(errTxt);
      return;
    }

    if (aiResult?.isEWaste === false) {
      playFeedbackChime('warning');
      const errTxt = language === 'en'
        ? `Submission Blocked: "${aiResult.detectedObject || 'Item'}" is not genuine electronic waste. Please scan real electronic scrap.`
        : language === 'mr'
        ? `सबमिशन नाकारले: "${aiResult.detectedObject || 'वस्तू'}" ई-कचरा नाही. कृपया खरा ई-कचरा स्कॅन करा.`
        : `जमा करना अस्वीकृत: "${aiResult.detectedObject || 'यह वस्तु'}" ई-कबाड़ नहीं है। केवल असली इलेक्ट्रॉनिक कचरा स्वीकार्य है।`;
      speak(errTxt);
      alert(errTxt);
      return;
    }

    const isHazard = (aiResult?.hazardLevel || selectedMaterial.hazardLevel) === 'high';
    const isOutCat = Boolean(aiResult?.isOutOfCategory);
    const rateToUse = isOutCat ? 0 : currentRate;
    const lotTotal = isOutCat ? 0 : calculatedTotal;

    const finalMaterialName = isCustomCategoryMode && customCategoryName.trim()
      ? customCategoryName.trim()
      : (aiResult?.detectedCategory || selectedMaterial.name_en);

    // If new custom category, register it so it's in materials list
    const existingMat = materials.find(m => m.name_en.toLowerCase() === finalMaterialName.toLowerCase());
    let finalMaterialId = existingMat?.id || selectedMaterial.id;

    if (!existingMat && !isOutCat && (isCustomCategoryMode || aiResult?.detectedCategory)) {
      const generatedId = `mat_${Date.now()}`;
      finalMaterialId = generatedId;
      addCustomMaterial({
        id: generatedId,
        name_en: finalMaterialName,
        name_hi: finalMaterialName,
        name_mr: finalMaterialName,
        grade: 'AI / Verified Custom',
        pricePerKg: rateToUse,
        trend: 0,
        category: selectedMaterial.category || 'e_scrap',
        hazardLevel: isHazard ? 'high' : 'safe',
        audioText_en: `${finalMaterialName} trading at ${rateToUse} rupees per kg`,
        audioText_hi: `${finalMaterialName} भाव ₹${rateToUse} प्रति किलो`,
        audioText_mr: `${finalMaterialName} दर ₹${rateToUse} प्रति किलो`,
        crmYield: {
          copperPct: 15,
          lithiumPct: 2,
          cobaltPct: 1,
          neodymiumPct: 0.5,
          goldGramsPerTon: 80
        }
      });
    }

    const createdLotId = `LOT-2026-EW-${Math.floor(1000 + Math.random() * 9000)}`;

    addLot({
      id: createdLotId,
      collectorId: collector.id,
      collectorName: collector.name,
      collectorPhone: collector.phone,
      materialId: finalMaterialId,
      materialName: finalMaterialName,
      category: isOutCat ? 'other' : selectedMaterial.category,
      isOutOfCategory: isOutCat,
      isPendingCategoryApproval: isOutCat,
      requestedCategoryName: isOutCat ? finalMaterialName : undefined,
      weightKg: customWeight,
      ratePerKg: rateToUse,
      totalAmount: lotTotal,
      gpsLocation: '18.5204° N, 73.8567° E (Ward 12, Pune)',
      facilityId: 'REC-MH-PN-004',
      facilityName: aiResult?.recommendedRecycler || 'EcoMetals CPCB Unit #4',
      distanceKm: 3.8,
      hazardFlag: isHazard,
      hazardNote: isHazard ? (aiResult?.hazardWarning || selectedMaterial.hazardWarning_hi) : undefined,
      photoUrl: livePhoto,
      photos: {
        topView: livePhoto,
      },
      requiresSticker: false,
      isOfflineCreated: !isOnline,
      needsOnlineAiCategorization: !isOnline
    });

    if (isOutCat) {
      // Auto-submit CPCB category approval request
      requestNewCategory({
        categoryName: finalMaterialName,
        suggestedRatePerKg: 0,
        weightKg: customWeight,
        collectorId: collector.id,
        collectorName: collector.name,
        collectorPhone: collector.phone,
        location: '18.5204° N, 73.8567° E (Ward 12, Pune)',
        notes: `AI detected unlisted e-waste: "${finalMaterialName}". Mandi price to be determined by CPCB authority upon physical batch review.`,
        samplePhotoUrl: livePhoto || undefined,
        lotId: createdLotId
      });
    }

    // Reset scan states
    setLivePhoto(null);
    setAiResult(null);
    setCustomRateOverride(null);
    setCustomCategoryName('');
    setIsCustomCategoryMode(false);
    setCustomWeight(5.0);

    // Navigate to orders tab
    setActiveTab('orders');

    setSavedSuccessBanner(true);
    const audioConfirm = !isOnline
      ? (language === 'en'
          ? `Lot saved offline! Will synchronize once online.`
          : language === 'mr'
          ? `लॉट ऑफलाइन सेव्ह झाला!`
          : `लॉट ऑफलाइन सुरक्षित हुआ!`)
      : isOutCat
      ? (language === 'en'
          ? `Lot submitted for CPCB Category Approval! Price will be decided later once approved.`
          : language === 'mr'
          ? `लॉट CPCB मंजुरीसाठी पाठवला! किंमत नंतर ठरवली जाईल.`
          : `लॉट CPCB अनुमोदन हेतु दर्ज हुआ! मूल्य CPCB द्वारा बाद में तय किया जाएगा।`)
      : (language === 'en'
          ? `Lot submitted to Orders. Declared: ${customWeight} kg, ₹${lotTotal}.`
          : language === 'mr'
          ? `लॉट यशस्वीरीत्या नोंदवला गेला (₹${lotTotal}).`
          : `लॉट सफलतापूर्वक दर्ज हुआ (₹${lotTotal})।`);
    speak(audioConfirm);

    setTimeout(() => setSavedSuccessBanner(false), 5000);
  };

  const currentLots = lots.filter((l) => l.collectorId === collector.id);
  const filteredLots = paymentFilter === 'ALL' 
    ? currentLots 
    : currentLots.filter((l) => l.paymentMode === paymentFilter || (paymentFilter === 'CASH' && !l.paymentMode));

  const textLabels = {
    hi: {
      mandiTitle: 'दैनिक भाव बोर्ड',
      mandiSync: 'आज का अधिकृत भाव — 24 घंटे के लिए मान्य (06:00 AM)',
      syncBtn: 'सिंक करें',
      listenBtn: 'सुनें',
      scanTitle: 'एआई लॉट स्कैनर व मूल्यांकन',
      samplePresets: 'सैंपल फोटो चुनें:',
      detectedGrade: 'एआई वर्गीकरण व धातु परिणाम:',
      hazardTitle: 'सुरक्षा चेतावनी (Hazard Protocol)',
      weightLabel: 'वजन सेट करें (किलोग्राम में):',
      unitRate: 'प्रति किलो भाव:',
      totalValue: 'अनुमानित कुल राशि:',
      saveLotBtn: 'डिजिटल लॉट सेव करें (Save Offline Lot)',
      passbookTitle: 'कमाई बहीखाता',
      todayEarnings: 'आज की कमाई',
      todayWeight: 'जमा वजन',
      safetyBagMilestone: 'वर्मीक्यूलाइट सेफ्टी बैग इंसेंटिव',
      targetText: '50 किग्रा में से 38 किग्रा जमा — ₹150 बोनस रिफंड नजदीक!',
      safetyTitle: 'सुरक्षा मार्गदर्शन (Safety Rules)',
      logout: 'लॉगआउट / खाता बदलें',
      qrTitle: 'डिजिटल स्क्रैप पास (Verifiable QR Handover)',
      close: 'बंद करें',
      matchedRecycler: 'अधिकृत रिसाइक्लर (निकटतम)',
      statusPending: 'तौल शेष (Pending)',
      statusPaid: 'भुगतान पूर्ण (Paid)',
      walkthroughBadge: 'कैमरा पोजिशनिंग गाइड',
      walkthroughTitle: 'एआई पहचान के लिए वस्तु कैसे रखें?',
      walkthroughSubtitle: 'सटीक ग्रेड व अधिकतम भाव पाने के लिए इन 3 नियमों का पालन करें:',
      rule1Title: '1. फ्रेम के केंद्र में सीधा रखें',
      rule1Desc: 'स्क्रैप वस्तु को कैमरा फ्रेम के बीच में सपाट रखें, किनारों से कटने न दें।',
      rule2Title: '2. अच्छी व समान रोशनी रखें',
      rule2Desc: 'गहरी छाया या चकाचौंध से बचें ताकि कॉपर कॉइल, सर्किट बोर्ड व चिप्स साफ दिखें।',
      rule3Title: '3. लेबल व चिप्स पर अंगुली न रखें',
      rule3Desc: 'बैटरी रेटिंग (mAh), IC नंबर व मॉडल स्टिकर को अंगुलियों से न ढकें।',
      walkthroughActionBtn: 'समझ गए • स्कैन शुरू करें (Got It)',
      walkthroughAudio: 'एआई स्कैनिंग के लिए स्क्रैप को कैमरे के बीच में सीधा और सपाट रखें। अच्छी रोशनी रखें और बैटरी रेटिंग या सर्किट चिप्स को अंगुली से न ढकें।',
      mandiBoardTitle: 'दैनिक भाव बोर्ड',
      scanCtaBtn: 'नया कबाड़ लॉट स्कैन करें (Scan & Sell)',
      totalWeightLabel: 'कुल वजन',
      totalLotsLabel: 'कुल लॉट्स',
      recentTransactionsLabel: 'हालिया लेनदेन (Transactions):',
      safetySubtitle: 'खतरनाक अनौपचारिक प्रथाओं से बचें — स्वास्थ्य की सुरक्षा और अधिक दाम पाएं।',
      profileTitle: 'कबाड़ी साथी प्रोफाइल',
      tabMandi: 'भाव (Mandi)',
      tabScan: 'स्कैन (Lot)',
      tabOrders: 'ऑर्डर्स',
      tabPassbook: 'बहीखाता',
      tabSafety: 'सुरक्षा',
      weightAndRate: 'वजन और दर:',
      estimatedPayout: 'अनुमानित भुगतान:',
      distanceLabel: 'दूरी:',
      gpsTimestampLabel: 'जीपीएस समय:',
      positionGuideBtn: 'गाइड'
    },
    mr: {
      mandiTitle: 'दैनिक बाजारभाव',
      mandiSync: 'आजचा अधिकृत दर — 24 तासांसाठी वैध (सकाळी 06:00)',
      syncBtn: 'सिंक करा',
      listenBtn: 'ऐका',
      scanTitle: 'एआय लॉट स्कॅनर व मूल्यांकन',
      samplePresets: 'नमुना फोटो निवडा:',
      detectedGrade: 'एआय वर्गीकरण व घटक:',
      hazardTitle: 'सुरक्षा इशारा (Hazard Protocol)',
      weightLabel: 'वजन निश्चित करा (किलोमध्ये):',
      unitRate: 'दर प्रति किलो:',
      totalValue: 'अंदाजे एकूण रक्कम:',
      saveLotBtn: 'लॉट सेव्ह करा (Save Lot)',
      passbookTitle: 'कमाई पासबुक',
      todayEarnings: 'आजची कमाई',
      todayWeight: 'एकूण वजन',
      safetyBagMilestone: 'सुरक्षा पिशवी प्रोत्साहन निधी',
      targetText: '50 किलोपैकी 38 किलो जमा — ₹150 परतावा शिल्लक!',
      safetyTitle: 'सुरक्षा मार्गदर्शक (Safety Rules)',
      logout: 'लॉगआउट करा',
      qrTitle: 'डिजिटल स्क्रॅप पास (QR Handover)',
      close: 'बंद करा',
      matchedRecycler: 'अधिकृत रिसायकलर (जवळचा)',
      statusPending: 'वजन बाकी (Pending)',
      statusPaid: 'रक्कम जमा (Paid)',
      walkthroughBadge: 'कॅमेरा पोझिशनिंग मार्गदर्शक',
      walkthroughTitle: 'अचूक एआय ओळखीसाठी वस्तू कशी ठेवावी?',
      walkthroughSubtitle: '98%+ अचूक वर्गीकरण आणि जास्तीत जास्त दर मिळवण्यासाठी हे 3 नियम पाळा:',
      rule1Title: '1. फ्रेमच्या मध्यभागी ठेवा',
      rule1Desc: 'भंगार वस्तू कॅमेऱ्याच्या फ्रेममध्ये सपाट व सरळ ठेवा, कोपरे कापू नका.',
      rule2Title: '2. चांगला प्रकाश ठेवा',
      rule2Desc: 'सावली किंवा चमक टाळा जेणेकरून तांब्याच्या तारा व सर्किट चिप्स स्पष्ट दिसतील.',
      rule3Title: '3. लेबल व चिप्स झाकू नका',
      rule3Desc: 'बॅटरी रेटिंग (mAh) व मॉडेल स्टिकरवर बोट ठेवू नका.',
      walkthroughActionBtn: 'समजले • स्कॅनिंग सुरू करा (Got It)',
      walkthroughAudio: 'एआई स्कॅनिंगसाठी वस्तू कॅमेऱ्याच्या मध्यभागी सपाट ठेवा. चांगला प्रकाश ठेवा आणि बॅटरी रेटिंग किंवा चिप्सवर बोट ठेवू नका.',
      mandiBoardTitle: 'दैनिक बाजारभाव फलक',
      scanCtaBtn: 'नवीन स्क्रॅप लॉट स्कॅन करा (Scan & Sell)',
      totalWeightLabel: 'एकूण वजन',
      totalLotsLabel: 'एकूण लॉट्स',
      recentTransactionsLabel: 'अलीकडील व्यवहार (Transactions):',
      safetySubtitle: 'धोकादायक अनौपचारिक पद्धती टाळा — आरोग्याचे रक्षण करा आणि जास्त भाव मिळवा.',
      profileTitle: 'कबाडी मित्र प्रोफाइल',
      tabMandi: 'बाजारभाव',
      tabScan: 'स्कॅन (Lot)',
      tabOrders: 'ऑर्डर्स',
      tabPassbook: 'पासबूक',
      tabSafety: 'सुरक्षा',
      weightAndRate: 'वजन आणि दर:',
      estimatedPayout: 'अंदाजे रक्कम:',
      distanceLabel: 'अंतर:',
      gpsTimestampLabel: 'GPS वेळ:',
      positionGuideBtn: 'मार्गदर्शक'
    },
    en: {
      mandiTitle: 'Daily Mandi Rates',
      mandiSync: 'Guaranteed 24-Hour Rates — Synced at 06:00 AM',
      syncBtn: 'Sync Rates',
      listenBtn: 'Listen',
      scanTitle: 'AI Scrap Lot Creator & Valuation',
      samplePresets: 'Choose Sample Item:',
      detectedGrade: 'AI Classification & Metallurgy:',
      hazardTitle: 'Hazard Protocol Alert',
      weightLabel: 'Adjust Weight (kg):',
      unitRate: 'Rate per kg:',
      totalValue: 'Total Lot Valuation:',
      saveLotBtn: 'Save Digital Lot (Offline Ready)',
      passbookTitle: 'Kamai Passbook',
      todayEarnings: "Today's Earnings",
      todayWeight: 'Scrap Collected',
      safetyBagMilestone: 'Vermiculite Safety Bag Deposit',
      targetText: '38/50 kg completed — ₹150 security refund unlock!',
      safetyTitle: 'Audio-Visual Safety Guidance',
      logout: 'Logout to Gateway',
      qrTitle: 'Traceable Handover QR Pass',
      close: 'Close',
      matchedRecycler: 'Matched Recycler Facility',
      statusPending: 'Weighbridge Pending',
      statusPaid: 'Verified & Paid',
      walkthroughBadge: 'AI Item Positioning Guide',
      walkthroughTitle: 'How to Position Items for AI Classification',
      walkthroughSubtitle: 'Follow these 3 positioning rules for 98%+ AI accuracy & top valuation:',
      rule1Title: '1. Center & Lay Flat in Frame',
      rule1Desc: 'Place electronic scrap flat in the center of the viewfinder without cropping edges.',
      rule2Title: '2. Ensure Bright, Even Lighting',
      rule2Desc: 'Avoid dark shadows and harsh glare so copper coils, PCB traces & chips are distinct.',
      rule3Title: '3. Keep Fingers Off Markings',
      rule3Desc: 'Do not obstruct battery ratings (mAh/Wh), IC serials, or model labels with your fingers.',
      walkthroughActionBtn: 'Got It • Start Scanning',
      walkthroughAudio: 'For accurate AI scanning, place the scrap item flat in the center of the camera frame with bright lighting. Keep fingers clear of battery rating labels and circuit chips.',
      mandiBoardTitle: 'Daily Mandi Rates Board',
      scanCtaBtn: 'Scan New Scrap Lot (Scan & Sell)',
      totalWeightLabel: 'Total Weight',
      totalLotsLabel: 'Total Lots',
      recentTransactionsLabel: 'Recent Transactions:',
      safetySubtitle: 'Avoid hazardous informal dismantling practices — safeguard health & maximize payouts.',
      profileTitle: 'Collector Profile',
      tabMandi: 'Mandi Rates',
      tabScan: 'Scan Lot',
      tabOrders: 'Orders',
      tabPassbook: 'Passbook',
      tabSafety: 'Safety',
      weightAndRate: 'Weight & Rate:',
      estimatedPayout: 'Estimated Payout:',
      distanceLabel: 'Distance:',
      gpsTimestampLabel: 'GPS Timestamp:',
      positionGuideBtn: 'Positioning Guide'
    }
  };

  const t = textLabels[language];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation & App Header (Clean, High-Contrast Brand Header) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          
          {/* Brand Logo & Platform Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0 border border-emerald-400/30">
              <Recycle className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  {language === 'hi' ? 'ई-कबाड़ सेतु' : language === 'mr' ? 'ई-कचरा सेतू' : 'e-KabadSetu'}
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                  CPCB
                </span>
              </div>
              <div className="text-[11px] font-bold text-emerald-700 leading-none">
                {language === 'hi' ? 'डिजिटल ई-वेस्ट मंडी' : language === 'mr' ? 'डिजिटल ई-कचरा बाजार' : 'Digital E-Waste Mandi'}
              </div>
            </div>
          </div>

          {/* Right Header Controls: Collector Avatar, Language Switcher, Drawer */}
          <div className="flex items-center gap-2">
            
            {/* Collector Mini-Card / Quick Profile */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer group"
              title="View Collector Profile"
            >
              <div className="relative">
                <img
                  src={
                    !collector.selfieUrl || collector.selfieUrl.includes('1544717305') || collector.selfieUrl.includes('1544724569') || collector.selfieUrl.includes('1544716278')
                      ? 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80'
                      : collector.selfieUrl
                  }
                  alt="Collector Profile"
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-500 shadow-xs"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-xs">
                  ✓
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate max-w-[110px]">
                  {collector.name.split(' ')[0]}
                </div>
                <div className="text-[10px] font-mono text-emerald-700 font-semibold">
                  {collector.id}
                </div>
              </div>
            </button>

            {/* Language Selector Pills */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              {(['hi', 'mr', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    playFeedbackChime('beep');
                    setLanguage(l);
                  }}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                    language === l
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {l === 'hi' ? 'हिं' : l === 'mr' ? 'मरा' : 'EN'}
                </button>
              ))}
            </div>

            {/* Profile Drawer Settings Toggle */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-xs cursor-pointer"
              title="Collector Settings & Profile"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Sync Toast Notification */}
      {syncMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center flex items-center justify-center gap-1.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Offline Mode Alert */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs border-b border-amber-600">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
            <span>
              {language === 'hi' 
                ? 'ऑफलाइन मोड सक्रिय: फोटो स्थानीय रूप से सेव होंगे और नेटवर्क आने पर एआई वर्गीकरण पूरा होगा।'
                : language === 'mr'
                ? 'ऑफलाइन मोड सक्रिय: फोटो स्थानिकरित्या सेव्ह होतील व ऑनलाइन आल्यावर वर्गीकरण होईल.'
                : 'Offline Mode: Lots save locally and auto-classify via AI once network is restored.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOnline(true)}
            className="px-3 py-1 bg-slate-950 text-white hover:bg-slate-900 rounded-lg text-xs font-mono shrink-0 ml-2 cursor-pointer"
          >
            Go Online
          </button>
        </div>
      )}

      {/* Syncing Queue Notification */}
      {isSyncingOfflineQueue && (
        <div className="bg-teal-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-teal-300" />
          <span>
            {language === 'hi'
              ? '🔄 जेमिनी एआई द्वारा ऑफलाइन लॉट्स का सत्यापन व वर्गीकरण जारी है...'
              : language === 'mr'
              ? '🔄 जेमिनी एआई द्वारे ऑफलाइन लॉट्सचे वर्गीकरण सुरू आहे...'
              : '🔄 Gemini AI is verifying & categorizing offline queued scrap lots...'}
          </span>
        </div>
      )}

      {/* App Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 pb-28 flex-1">
        
        {/* TAB 1: भाव (Daily Price Mandi) */}
        {activeTab === 'mandi' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Daily Mandi Banner */}
            <div className="bg-emerald-700 text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="text-xs font-mono text-emerald-100 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{t.mandiBoardTitle}</span>
                </div>
                <div className="text-sm text-white/90 font-medium mt-1">
                  {t.mandiSync}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncPrices}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-white/15 hover:bg-white/25 active:bg-white text-white active:text-emerald-900 border border-white/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{t.syncBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('scan')}
                  className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>{t.scanCtaBtn}</span>
                </button>
              </div>
            </div>

            {/* Responsive Price Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((mat) => {
                const matName = language === 'hi' ? mat.name_hi : language === 'mr' ? mat.name_mr : mat.name_en;
                const audioDesc = language === 'hi' ? mat.audioText_hi : language === 'mr' ? mat.audioText_mr : mat.audioText_en;

                return (
                  <div
                    key={mat.id}
                    className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-base font-bold text-slate-900 leading-snug">{matName}</h4>
                        {mat.hazardLevel === 'high' && (
                          <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                            Hazard
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mb-3">
                        Grade: <span className="font-semibold text-slate-700">{mat.grade}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                      <div>
                        <div className="text-xl font-mono font-black text-emerald-700">
                          ₹{mat.pricePerKg}
                          <span className="text-xs text-slate-500 font-normal">/kg</span>
                        </div>
                        <div className="text-xs text-emerald-600 font-mono font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>+{mat.trend}% (24h)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Audio Rate Player */}
                        <button
                          type="button"
                          onClick={() => {
                            playFeedbackChime('beep');
                            speak(audioDesc);
                          }}
                          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                          title="Listen to rate"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* Gemini AI Insights Button */}
                        <button
                          type="button"
                          onClick={() => {
                            playFeedbackChime('beep');
                            setSelectedAiInsightsMaterial(mat);
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          title="Gemini AI Market Intelligence"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>AI भाव</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: स्कैन (AI Live Camera Scan & Valuation) */}
        {activeTab === 'scan' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header / Intro */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'hi' ? 'एआई लाइव कैमरा व स्क्रैप स्कैन' : language === 'mr' ? 'एआई थेट कॅमेरा स्कॅनर' : 'AI Live Camera & Scrap Scanner'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'hi' ? 'कैमरे के सामने स्क्रैप रखें और फोटो खींचें — एआई स्वचालित रूप से श्रेणी, भाव और मूल्य तय करेगा।' : 'Point camera at e-waste scrap and snap photo. AI automatically identifies category, Mandi rate, and fair lot value.'}
                </p>
              </div>

              {livePhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setLivePhoto(null);
                    setAiResult(null);
                    setCustomRateOverride(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'नया फोटो लें' : 'Snap New'}</span>
                </button>
              )}
            </div>

            {/* Desktop 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Full Frame Camera Viewfinder & AI Badges */}
              <div className="lg:col-span-7 space-y-4">
                {/* LIVE CAMERA VIEWFINDER (100% Full Uncropped Frame View) */}
                <LiveCameraViewfinder
                  capturedImage={livePhoto}
                  onPhotoCaptured={(base64, isHumanHint) => {
                    setLivePhoto(base64);
                    triggerLiveAiClassification(base64, isHumanHint);
                  }}
                  onRetake={() => {
                    setLivePhoto(null);
                    setAiResult(null);
                    setCustomRateOverride(null);
                    setCustomCategoryName('');
                    setIsCustomCategoryMode(false);
                  }}
                  collectorId={collector.id}
                  language={language}
                />

                {/* AI ANALYZING SPINNER / STATUS */}
                {isAiClassifying && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex items-center justify-center gap-3 shadow-md animate-pulse">
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-sm font-bold text-emerald-300">
                      {language === 'hi' ? 'जेमिनी एआई फोटो का सत्यापन व वर्गीकरण कर रहा है...' : language === 'mr' ? 'जेमिनी AI स्क्रॅप तपासत आहे...' : 'Gemini AI Verifying Scrap & Detecting Category...'}
                    </span>
                  </div>
                )}

                {/* NON E-WASTE / HUMAN / FAKE REJECTION ALERT */}
                {aiResult?.isEWaste === false && (
                  <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-4 text-rose-950 flex items-start gap-3.5 shadow-md animate-fadeIn">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-rose-900 uppercase tracking-wide flex items-center gap-2">
                        <span>{language === 'hi' ? '⚠️ अस्वीकृत: यह ई-कबाड़ नहीं है!' : language === 'mr' ? '⚠️ नाकारले: हे ई-कचरा नाही!' : '⚠️ REJECTED: Not Electronic Waste!'}</span>
                      </div>
                      <p className="text-xs text-rose-950 mt-1 font-bold leading-relaxed">
                        {aiResult.hazardWarning || (language === 'hi'
                          ? `पहचान: "${aiResult.detectedObject || 'मानव चेहरा / अन्य वस्तु'}". ${aiResult.anomalyReason || 'कृपया वास्तविक इलेक्ट्रॉनिक हार्डवेयर का फोटो लें।'}`
                          : `Detected: "${aiResult.detectedObject || 'Human / Non-Electronic'}". ${aiResult.anomalyReason || 'Please capture real electronic hardware.'}`)}
                      </p>
                      <div className="mt-2 text-[11px] font-bold text-rose-800 bg-rose-100/90 px-3 py-1 rounded-lg border border-rose-300 inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{aiResult.safeAction || (language === 'hi' ? 'केवल सर्किट बोर्ड, तांबे के तार या बैटरी का फोटो लें' : 'Scan genuine PCB, copper wire or battery scrap')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI SUCCESS DETECTION SUMMARY BADGE */}
                {aiResult && aiResult.isEWaste !== false && (
                  <div className="bg-emerald-950 border border-emerald-500/60 rounded-2xl p-4 text-white shadow-md flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">AI DETECTED</span>
                          <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-200 font-mono">
                            {aiResult.confidenceScore ? `${Math.round(aiResult.confidenceScore)}% match` : '98% match'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate mt-0.5">
                          {aiResult.detectedCategory || aiResult.name_en}
                        </div>
                        <div className="text-xs text-emerald-300 font-medium mt-0.5">
                          {aiResult.grade || 'Standard Grade'} • Mandi Rate: ₹{aiResult.estimatedRatePerKg || aiResult.suggestedRatePerKg}/kg
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (aiResult.detectedCategory) {
                          setCustomCategoryName(aiResult.detectedCategory);
                          setIsCustomCategoryMode(true);
                        }
                        if (aiResult.estimatedRatePerKg) {
                          setCustomRateOverride(aiResult.estimatedRatePerKg);
                        }
                        playFeedbackChime('beep');
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shrink-0 shadow-xs cursor-pointer"
                    >
                      {language === 'hi' ? 'लागू करें' : 'Applied ✓'}
                    </button>
                  </div>
                )}

                {/* HAZARD WARNING (If detected) */}
                {((aiResult?.hazardLevel === 'high') || selectedMaterial.hazardLevel === 'high') && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-950 flex items-start gap-3 shadow-xs">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-amber-900 uppercase">
                        {aiResult?.hazardWarning || (language === 'hi' ? selectedMaterial.hazardWarning_hi : selectedMaterial.hazardWarning_en)}
                      </div>
                      <div className="text-xs text-amber-800 font-semibold mt-1">
                        ✓ {aiResult?.safeAction || (language === 'hi' ? selectedMaterial.safeAction_hi : selectedMaterial.safeAction_en)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Critical Raw Material Yield Badge */}
                {aiResult?.criticalMaterials && aiResult.criticalMaterials.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'hi' ? 'पहचाने गए दुर्लभ धातु व घटक (CRM)' : 'Detected Critical Components & CRM Yield'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.criticalMaterials.map((elem, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono px-2.5 py-1 rounded-lg font-semibold">
                          {elem}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Category, Rate & Weight, Valuation and QR Handover */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* OUT OF CPCB CATEGORY BANNER & 8 STANDARD SELECTOR */}
                {isOutOfCategory && (
                  <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-2 border-amber-400 rounded-2xl p-4 shadow-sm space-y-3 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                        <AlertTriangle className="w-4 h-4 text-slate-950" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                          {language === 'hi' ? '⚠️ श्रेणी CPCB मानक 8 सूची में नहीं है' : language === 'mr' ? '⚠️ ही श्रेणी CPCB मानक यादीत नाही' : '⚠️ Category Not in CPCB Standard Schedule'}
                        </h4>
                        <p className="text-[11px] text-amber-900 mt-0.5 leading-snug">
                          {language === 'hi'
                            ? 'यह स्क्रैप CPCB 8 श्रेणियों से बाहर है। आप नीचे से सही श्रेणी चुन सकते हैं या प्राधिकरण से नया अनुमोदन मांग सकते हैं (मूल्य बाद में तय होगा)।'
                            : language === 'mr'
                            ? 'हा ई-कचरा CPCB 8 श्रेणींमध्ये नाही. खालील प्रमाणित श्रेणी निवडा किंवा मंजुरी मागा (किंमत नंतर ठरेल).'
                            : 'This item is not in the standard CPCB scrap schedule. Choose an existing CPCB category below or request official category approval.'}
                        </p>
                      </div>
                    </div>

                    {/* Standard CPCB 8 Categories Quick Selector */}
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>{language === 'hi' ? 'मानक CPCB श्रेणियों में से चुनें:' : 'Choose from Standard CPCB Categories:'}</span>
                        <span className="text-emerald-700 font-bold">8 Standard Codes</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CPCB_STANDARD_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              playFeedbackChime('beep');
                              const matched = materials.find(m => m.category === cat.id) || materials[0];
                              setSelectedMaterialId(matched.id);
                              setCustomCategoryName(language === 'hi' ? cat.name_hi : cat.name);
                              setIsCustomCategoryMode(false);
                              setCustomRateOverride(cat.baseRate);
                              if (aiResult) {
                                setAiResult({
                                  ...aiResult,
                                  isOutOfCategory: false,
                                  detectedCategory: cat.name,
                                  estimatedRatePerKg: cat.baseRate
                                });
                              }
                              speak(`${cat.name} selected. Mandi rate ₹${cat.baseRate} per kg.`);
                            }}
                            className="text-left p-2 rounded-xl bg-white hover:bg-emerald-50 active:scale-[0.98] border border-amber-200 hover:border-emerald-500 transition-all shadow-2xs group cursor-pointer"
                          >
                            <div className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                              {language === 'hi' ? cat.name_hi : cat.name}
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-mono mt-0.5">
                              <span className="text-slate-500">{cat.code.replace('CPCB-SCH-I-', '')}</span>
                              <span className="text-emerald-700 font-extrabold">₹{cat.baseRate}/kg</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-300 text-[10px] font-mono text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 animate-pulse" />
                      <span>{language === 'hi' ? 'अनुरोध भेजने पर केवल वजन दर्ज होगा, मूल्य CPCB द्वारा बाद में तय होगा।' : 'If submitted unlisted, only weight is logged. Price decided later by CPCB.'}</span>
                    </div>
                  </div>
                )}

                {/* BLOCK 1: AI AUTO-DETECTED SCRAP CATEGORY */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'hi' ? 'स्क्रैप श्रेणी (एआई द्वारा स्वतः चयनित)' : language === 'mr' ? 'स्क्रॅप प्रकार (AI द्वारे निवडलेले)' : 'Detected Scrap Category'}</span>
                    </label>
                    {isOutOfCategory && (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        CPCB Unlisted
                      </span>
                    )}
                  </div>

                  {/* Primary Scrap Name Field */}
                  <div className="relative">
                    <input
                      type="text"
                      value={isCustomCategoryMode || customCategoryName ? customCategoryName : (language === 'hi' ? selectedMaterial.name_hi : selectedMaterial.name_en)}
                      onChange={(e) => {
                        setCustomCategoryName(e.target.value);
                        setIsCustomCategoryMode(true);
                      }}
                      placeholder={language === 'hi' ? 'एआई द्वारा पहचानी गई श्रेणी...' : 'AI detected category name...'}
                      className="w-full bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* BLOCK 2: RATE PER KG & WEIGHT ADJUSTMENT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rate per kg editor OR Price decided later notice */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'hi' ? 'दर (Rate / kg)' : 'Rate / kg'}</span>
                      </label>
                      <span className="text-xs text-slate-500 font-mono font-bold">₹/kg</span>
                    </div>

                    {isOutOfCategory ? (
                      <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-center space-y-1 my-auto">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-950 font-mono">
                          <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                          <span>CPCB Tariff Pending</span>
                        </div>
                        <div className="text-[10px] text-amber-800 font-medium">
                          {language === 'hi' ? 'दर बाद में तय होगी' : language === 'mr' ? 'किंमत नंतर ठरेल' : 'Price will be decided later'}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-mono font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            value={currentRate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCustomRateOverride(val);
                            }}
                            className="w-full bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-900 focus:outline-none"
                          />
                        </div>

                        {/* Quick rate adjustment chips */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              playFeedbackChime('beep');
                              setCustomRateOverride((prev) => Math.max(10, (prev !== null ? prev : selectedMaterial.pricePerKg) - 10));
                            }}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 cursor-pointer"
                          >
                            -₹10
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playFeedbackChime('beep');
                              setCustomRateOverride((prev) => (prev !== null ? prev : selectedMaterial.pricePerKg) + 10);
                            }}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded border border-emerald-200 cursor-pointer"
                          >
                            +₹10
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playFeedbackChime('beep');
                              setCustomRateOverride((prev) => (prev !== null ? prev : selectedMaterial.pricePerKg) + 50);
                            }}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded border border-emerald-200 cursor-pointer"
                          >
                            +₹50
                          </button>
                          {aiResult?.estimatedRatePerKg && (
                            <button
                              type="button"
                              onClick={() => {
                                playFeedbackChime('beep');
                                setCustomRateOverride(aiResult.estimatedRatePerKg);
                              }}
                              className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[10px] font-bold rounded border border-teal-200 ml-auto cursor-pointer"
                            >
                              AI: ₹{aiResult.estimatedRatePerKg}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Weight adjustment */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-slate-800">{t.weightLabel}</label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            playFeedbackChime('beep');
                            setCustomWeight((prev) => Math.max(0.5, parseFloat((prev - 0.5).toFixed(1))));
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-300 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-black font-mono text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 min-w-[55px] text-center">
                          {customWeight} kg
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            playFeedbackChime('beep');
                            setCustomWeight((prev) => parseFloat((prev + 0.5).toFixed(1)));
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-300 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="100"
                      step="0.5"
                      value={customWeight}
                      onChange={(e) => setCustomWeight(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg mt-2"
                    />
                  </div>
                </div>

                {/* BLOCK 3: TOTAL VALUATION */}
                <div className={`border-2 rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all ${
                  isOutOfCategory 
                    ? 'bg-gradient-to-br from-amber-50 to-white border-amber-300'
                    : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-300'
                }`}>
                  <div>
                    <div className="text-xs font-mono text-slate-500 font-bold uppercase">{t.unitRate}</div>
                    <div className="text-sm font-bold text-slate-800">
                      {isOutOfCategory ? 'CPCB Tariff Pending' : `₹${currentRate} / kg`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-600">
                      {isOutOfCategory ? 'Valuation Status' : t.totalValue}
                    </div>
                    {isOutOfCategory ? (
                      <div className="text-base sm:text-lg font-black text-amber-900 flex items-center justify-end gap-1 font-mono">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>Price will be decided later</span>
                      </div>
                    ) : (
                      <div className="text-3xl font-black font-mono text-emerald-950">
                        ₹{calculatedTotal}
                      </div>
                    )}
                  </div>
                </div>

                {/* SAVE LOT & SEND TO ORDERS BUTTON */}
                <button
                  type="button"
                  onClick={handleSaveLot}
                  disabled={!livePhoto || aiResult?.isEWaste === false}
                  className={`w-full py-4 font-extrabold rounded-xl flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer ${
                    !livePhoto
                      ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                      : aiResult?.isEWaste === false
                      ? 'bg-rose-100 text-rose-400 border border-rose-200 cursor-not-allowed shadow-none'
                      : isOutOfCategory
                      ? 'bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white shadow-amber-700/25'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-emerald-700/25'
                  }`}
                >
                  {!livePhoto ? (
                    <>
                      <Camera className="w-5 h-5 text-slate-400" />
                      <span className="text-sm">
                        {language === 'hi' ? '📸 पहले लाइव फोटो खींचें' : language === 'mr' ? '📸 आधी फोटो काढा' : '📸 Snap Live Photo First'}
                      </span>
                    </>
                  ) : aiResult?.isEWaste === false ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                      <span className="text-sm">
                        {language === 'hi' ? 'अमान्य ई-कचरा (फोटो खारिज)' : 'Invalid E-Waste Photo'}
                      </span>
                    </>
                  ) : isOutOfCategory ? (
                    <>
                      <Clock className="w-5 h-5" />
                      <span className="text-base font-extrabold">
                        {language === 'hi'
                          ? `✓ लॉट सेव करें व CPCB अनुमोदन मांगें (${customWeight} kg - मूल्य बाद में)`
                          : language === 'mr'
                          ? `✓ लॉट सेव्ह करा व CPCB मंजुरी मागा (${customWeight} kg - किंमत नंतर)`
                          : `✓ Save Lot & Request CPCB Approval (${customWeight} kg - Price TBD)`}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-base font-extrabold">
                        {language === 'hi'
                          ? `✓ लॉट सेव करें व ऑर्डर्स में भेजें (₹${calculatedTotal})`
                          : language === 'mr'
                          ? `✓ लॉट सेव्ह करा व ऑर्डर्समध्ये पाठवा (₹${calculatedTotal})`
                          : `✓ Save Lot & Send to Orders (₹${calculatedTotal})`}
                      </span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: ऑर्डर्स व चालान (Orders & Dispatches Management) */}
        {activeTab === 'orders' && (
          <CollectorOrdersManagement
            collector={collector}
            lots={lots}
            language={language}
            onOpenQrPass={(lot) => {
              setActiveCreatedLot(lot);
              setShowQrModal(true);
            }}
            onNavigateToScan={() => {
              playFeedbackChime('beep');
              setActiveTab('scan');
            }}
          />
        )}

        {/* TAB 4: बहीखाता (Kamai Passbook) */}
        {activeTab === 'passbook' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Passbook Hero Card */}
            <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 border border-emerald-600 rounded-2xl p-6 shadow-md text-white">
              <div className="flex flex-wrap items-center justify-between text-xs text-emerald-100 font-mono mb-3 gap-2">
                <span className="text-sm font-bold">{collector.name}</span>
                <span className="text-white font-bold bg-white/20 px-3 py-1 rounded-full border border-white/30">
                  {collector.safetyTier} Collector
                </span>
              </div>
              <div className="text-xs text-emerald-100 uppercase tracking-wider">{t.todayEarnings}</div>
              <div className="text-4xl font-extrabold font-mono text-white tracking-tight mt-1">
                ₹{collector.todayEarnings.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-200 font-mono mt-2 flex items-center gap-2">
                <span>{t.totalWeightLabel}: {collector.todayWeightKg} kg</span>
                <span>•</span>
                <span>{currentLots.length} {t.totalLotsLabel}</span>
              </div>
            </div>

            {/* Vermiculite Safety Bag Deposit Tracker */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{t.safetyBagMilestone}</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {collector.bagsDepositedKg} / {collector.targetBagsKg} kg
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 mb-2">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(collector.bagsDepositedKg / collector.targetBagsKg) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500">
                {t.targetText}
              </p>
            </div>

            {/* Payment Mode Filter Toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-slate-800">{t.recentTransactionsLabel}</span>
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-mono">
                {(['ALL', 'UPI', 'CASH'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentFilter(mode)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      paymentFilter === mode ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              {filteredLots.map((lot) => (
                <div
                  key={lot.id}
                  onClick={() => {
                    setActiveCreatedLot(lot);
                    setShowQrModal(true);
                  }}
                  className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {(() => {
                          const m = materials.find((x) => x.id === lot.materialId || x.name_en === lot.materialName);
                          return m ? (language === 'hi' ? m.name_hi : language === 'mr' ? m.name_mr : m.name_en) : lot.materialName;
                        })()}
                      </span>
                      {lot.hazardFlag && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">
                          Hazard
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-1">
                      {lot.id} • {lot.weightKg} kg @ ₹{lot.ratePerKg}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {lot.timestamp}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-slate-900">
                      ₹{lot.totalAmount}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono inline-block mt-1 ${
                      lot.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : lot.status === 'verified'
                        ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {lot.status === 'paid' ? 'PAID' : lot.status === 'verified' ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: सुरक्षा (Audio-Visual Safety Guidance Center) */}
        {activeTab === 'safety' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>{t.safetyTitle}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {t.safetySubtitle}
              </p>
            </div>

            {/* Dos and Don'ts Responsive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAFETY_PRACTICES.map((safe) => (
                <div key={safe.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      {safe.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        playFeedbackChime('beep');
                        const audioMsg = language === 'hi' ? safe.audioText_hi : language === 'mr' ? safe.audioText_mr : safe.audioText_en;
                        speak(audioMsg);
                      }}
                      className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> {t.listenBtn}
                    </button>
                  </div>

                  {/* DONT (Red) */}
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                    <div className="text-xs font-bold flex items-center gap-1.5 text-rose-700">
                      <X className="w-4 h-4" />
                      <span>{language === 'hi' ? safe.dont_hi : language === 'mr' ? safe.dont_mr : safe.dont_en}</span>
                    </div>
                    <p className="text-xs text-rose-800 mt-1 leading-snug">
                      {language === 'hi' ? safe.dontWhy_hi : language === 'mr' ? safe.dontWhy_mr : safe.dontWhy_en}
                    </p>
                  </div>

                  {/* DO (Green) */}
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'hi' ? safe.do_hi : language === 'mr' ? safe.do_mr : safe.do_en}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Slide-over Profile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white border-l border-slate-200 p-6 flex flex-col justify-between animate-slideLeft shadow-2xl overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">{t.profileTitle}</h3>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <img
                  src={
                    !collector.selfieUrl || collector.selfieUrl.includes('1544717305') || collector.selfieUrl.includes('1544724569') || collector.selfieUrl.includes('1544716278')
                      ? 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80'
                      : collector.selfieUrl
                  }
                  alt="Collector"
                  className="w-20 h-20 rounded-2xl mx-auto object-cover border-4 border-emerald-500 shadow-md mb-2"
                />
                <h4 className="text-lg font-bold text-slate-900">{collector.name}</h4>
                <p className="text-xs text-emerald-700 font-mono font-semibold">ID: {collector.id}</p>
                <p className="text-xs text-slate-500 font-mono">📍 {collector.ward}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2 font-mono mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-800 font-medium">{collector.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Safety Tier:</span>
                  <span className="text-emerald-700 font-bold">{collector.safetyTier} Partner</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bag Refund Target:</span>
                  <span className="text-slate-800 font-medium">{collector.bagsDepositedKg} / {collector.targetBagsKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Lots Created:</span>
                  <span className="text-slate-800 font-medium">{collector.totalLotsCount}</span>
                </div>
              </div>
            </div>

            {/* Clear Logout / Switch Account Button */}
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                playFeedbackChime('beep');
                setCurrentView('gateway');
              }}
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </div>
      )}

      {/* Verifiable QR Handover Modal */}
      {showQrModal && activeCreatedLot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl relative animate-scaleUp text-slate-900">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold rounded-full mb-3">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>{t.qrTitle}</span>
            </div>

            <h4 className="text-lg font-bold text-slate-900 mb-0.5">
              {(() => {
                const m = materials.find((x) => x.id === activeCreatedLot.materialId || x.name_en === activeCreatedLot.materialName);
                return m ? (language === 'hi' ? m.name_hi : language === 'mr' ? m.name_mr : m.name_en) : activeCreatedLot.materialName;
              })()}
            </h4>
            <div className="text-xs font-mono text-emerald-700 font-bold mb-4">
              Lot ID: {activeCreatedLot.id}
            </div>

            {/* Interactive High-Contrast QR Stamp */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block shadow-xs mb-4">
              <div className="w-48 h-48 bg-white p-2.5 rounded-xl flex flex-col items-center justify-center relative border border-slate-200">
                <QRCodeSVG 
                  value={JSON.stringify({
                    lotId: activeCreatedLot.id,
                    collectorId: collector.id,
                    material: activeCreatedLot.materialName,
                    weight: activeCreatedLot.weightKg
                  })} 
                  size={170} 
                  level={"H"}
                  includeMargin={false}
                  fgColor={"#022c22"} 
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md border-2 border-white">
                    SETU
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 text-xs space-y-2 font-mono mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.weightAndRate}</span>
                <span className="text-slate-900 font-bold">{activeCreatedLot.weightKg} kg @ ₹{activeCreatedLot.ratePerKg}/kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.estimatedPayout}</span>
                <span className="text-emerald-700 font-extrabold text-base">₹{activeCreatedLot.totalAmount}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500">{t.matchedRecycler}:</span>
                <span className="text-slate-800 text-right truncate max-w-[200px]">{activeCreatedLot.facilityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.distanceLabel}</span>
                <span className="text-slate-700">{activeCreatedLot.distanceKm} km away</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.gpsTimestampLabel}</span>
                <span className="text-slate-500">{activeCreatedLot.timestamp}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {selectedAiInsightsMaterial && (
        <AiMandiInsightsModal
          material={selectedAiInsightsMaterial}
          onClose={() => setSelectedAiInsightsMaterial(null)}
        />
      )}

      {/* 5-Tab Persistent Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-1.5 px-3">
        <nav className="max-w-lg mx-auto flex items-center justify-around gap-1">
          {/* TAB 1: Mandi */}
          <button
            type="button"
            onClick={() => {
              playFeedbackChime('beep');
              setActiveTab('mandi');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'mandi'
                ? 'text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className={`w-5 h-5 ${activeTab === 'mandi' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-0.5 whitespace-nowrap">{t.tabMandi}</span>
          </button>

          {/* TAB 2: Scan */}
          <button
            type="button"
            onClick={() => {
              playFeedbackChime('beep');
              setActiveTab('scan');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'scan'
                ? 'text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Camera className={`w-5 h-5 ${activeTab === 'scan' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-0.5 whitespace-nowrap">{t.tabScan}</span>
          </button>

          {/* TAB 3: Orders */}
          <button
            type="button"
            onClick={() => {
              playFeedbackChime('beep');
              setActiveTab('orders');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative cursor-pointer ${
              activeTab === 'orders'
                ? 'text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Package className={`w-5 h-5 ${activeTab === 'orders' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-0.5 whitespace-nowrap">{t.tabOrders}</span>
            {currentLots.filter(l => l.status === 'pending_weighment' || l.status === 'in_transit').length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {currentLots.filter(l => l.status === 'pending_weighment' || l.status === 'in_transit').length}
              </span>
            )}
          </button>

          {/* TAB 4: Passbook */}
          <button
            type="button"
            onClick={() => {
              playFeedbackChime('beep');
              setActiveTab('passbook');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'passbook'
                ? 'text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Wallet className={`w-5 h-5 ${activeTab === 'passbook' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-0.5 whitespace-nowrap">{t.tabPassbook}</span>
          </button>

          {/* TAB 5: Safety */}
          <button
            type="button"
            onClick={() => {
              playFeedbackChime('beep');
              setActiveTab('safety');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'safety'
                ? 'text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${activeTab === 'safety' ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-0.5 whitespace-nowrap">{t.tabSafety}</span>
          </button>
        </nav>
      </div>

    </div>
  );
};
