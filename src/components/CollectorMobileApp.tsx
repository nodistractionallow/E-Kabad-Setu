import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Language, MaterialItem } from '../types';
import { AI_CLASSIFICATION_PRESETS, SAFETY_PRACTICES, CPCB_STANDARD_CATEGORIES } from '../data/mockData';
import { playFeedbackChime } from '../utils/speech';
import { LiveCameraViewfinder, analyzeImageForSafety } from './LiveCameraViewfinder';
import { CollectorOrdersManagement } from './CollectorOrdersManagement';
import { LotPriceHistoryModal } from './LotPriceHistoryModal';
import { NewOrderQrModal } from './NewOrderQrModal';
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
    requestNewCategory,
    setActivePublicOrderId
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
  const [selectedCpcbCategory, setSelectedCpcbCategory] = useState<string>('pcb');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(() => materials[0]?.id || 'mat_pcb_high');
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState<boolean>(false);
  const [customWeight, setCustomWeight] = useState<number>(5.0);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [savedSuccessBanner, setSavedSuccessBanner] = useState<boolean>(false);
  const [newOrderLotForModal, setNewOrderLotForModal] = useState<any>(null);

  // Passbook payment mode filter
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'UPI' | 'CASH'>('ALL');

  // Price history modal state for scrap collector
  const [priceGraphLot, setPriceGraphLot] = useState<{ name: string; rate?: number; materialId?: string; lotId?: string } | null>(null);

  // Live Gemini Vision Classification State
  const [isAiClassifying, setIsAiClassifying] = useState(false);
  const [aiResult, setAiResult] = useState<{
    isEWaste?: boolean;
    unableToDetect?: boolean;
    detectedObject?: string;
    detectedCategory: string;
    category?: string;
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
    name_en?: string;
    name_hi?: string;
    name_mr?: string;
    grade?: string;
    suggestedRatePerKg?: number;
    anomalyReason?: string;
  } | null>(null);

  // CPCB Statutory Rates map - Authority locked (13 Standard Schedules)
  const CPCB_STATUTORY_RATES: Record<string, { baseRate: number; name_en: string; name_hi: string; name_mr: string; code: string }> = {
    pcb: { baseRate: 480, name_en: 'Printed Circuit Boards & Motherboards', name_hi: 'सर्किट बोर्ड व मदरबोर्ड', name_mr: 'सर्किट बोर्ड व मदरबोर्ड', code: 'CPCB-SCH-I-PCB' },
    copper: { baseRate: 720, name_en: 'Insulated & Bare Copper Wires', name_hi: 'तांबे के तार व वाइंडिंग', name_mr: 'तांब्याची वायर व वाइंडिंग', code: 'CPCB-SCH-I-CU' },
    battery: { baseRate: 310, name_en: 'Lithium & Lead-Acid Batteries', name_hi: 'लिथियम व लेड-एसिड बैटरी', name_mr: 'लिथियम व लेड-ॲसिड बॅटरी', code: 'CPCB-SCH-I-BAT' },
    crt: { baseRate: 45, name_en: 'CRT Displays & Leaded Glass Tubes', name_hi: 'सीआरटी डिस्प्ले व ग्लास', name_mr: 'सीआरटी डिस्प्ले व ग्लास', code: 'CPCB-SCH-I-CRT' },
    lcd: { baseRate: 180, name_en: 'LCD / LED Display Modules', name_hi: 'एलसीडी / एलईडी पैनल', name_mr: 'एलसीडी / एलईडी पॅनेल', code: 'CPCB-SCH-I-LCD' },
    magnet: { baseRate: 540, name_en: 'Rare Earth Neodymium Magnets', name_hi: 'नियोडिमियम चुंबक हार्ड ड्राइव', name_mr: 'निओडिमियम चुंबक हार्ड ड्राइव्ह', code: 'CPCB-SCH-I-MAG' },
    plastic: { baseRate: 65, name_en: 'Flame-Retardant E-Plastics', name_hi: 'ई-प्लास्टिक केसिंग (ABS-FR)', name_mr: 'ई-प्लास्टिक केसिंग (ABS-FR)', code: 'CPCB-SCH-I-PLAS' },
    telecom: { baseRate: 650, name_en: 'Telecom & Network Hardware (ITEW1)', name_hi: 'दूरसंचार व नेटवर्क गियर', name_mr: 'दूरसंचार व नेटवर्क गियर', code: 'CPCB-SCH-I-TEL' },
    solar: { baseRate: 240, name_en: 'Solar PV Panels & Inverter Modules', name_hi: 'सोलर पैनल व इन्वर्टर मॉड्यूल', name_mr: 'सोलर पॅनेल व इन्व्हर्टर मॉड्यूल', code: 'CPCB-SCH-I-PV' },
    cooling: { baseRate: 160, name_en: 'Cooling & Compressor Units (CEEW1)', name_hi: 'रेफ्रिजरेटर व एसी कंप्रेसर', name_mr: 'रेफ्रिजरेटर व एसी कॉम्प्रेसर', code: 'CPCB-SCH-I-COMP' },
    medical: { baseRate: 410, name_en: 'Medical & Diagnostic Electronics', name_hi: 'चिकित्सा व डायग्नोस्टिक उपकरण', name_mr: 'वैद्यकीय व डायग्नोस्टिक उपकरणे', code: 'CPCB-SCH-I-MED' },
    lighting: { baseRate: 35, name_en: 'Fluorescent & Discharge Lamps', name_hi: 'फ्लोरोसेंट ट्यूब व डिस्चार्ज लैंप', name_mr: 'फ्लोरोसेंट ट्यूब व डिस्चार्ज दिवे', code: 'CPCB-SCH-I-LAMP' },
    mixed: { baseRate: 120, name_en: 'Dismantled Small Appliances / Mix', name_hi: 'मिश्रित छोटे इलेक्ट्रॉनिक उपकरण', name_mr: 'मिश्रित लहान उपकरणे', code: 'CPCB-SCH-I-MIX' }
  };

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId) || materials[0];
  const isOutOfCategory = Boolean(aiResult?.isOutOfCategory);
  // STRICT: Prices are decided by authorities. Rate cannot change if category is in standard schedule!
  const currentStatutoryRate = isOutOfCategory ? 0 : (CPCB_STATUTORY_RATES[selectedCpcbCategory]?.baseRate ?? 0);
  const currentRate = currentStatutoryRate;
  const calculatedTotal = isOutOfCategory || aiResult?.isEWaste === false || !selectedCpcbCategory ? 0 : Math.round(customWeight * currentRate);

  const triggerLiveAiClassification = async (base64OrUrl: string, isHumanHint?: boolean, isDarkHint?: boolean) => {
    setIsAiClassifying(true);

    // Run client-side safety heuristics instantly on the captured frame
    let isDarkDetected = Boolean(isDarkHint);
    let isHumanDetected = Boolean(isHumanHint);

    try {
      const safety = await analyzeImageForSafety(base64OrUrl);
      if (safety.isBlackOrBlank) isDarkDetected = true;
      if (safety.isHuman) isHumanDetected = true;
    } catch (e) {
      console.warn('Safety analyze error:', e);
    }

    // 1. Immediate client rejection for dark / black / blank photos
    if (isDarkDetected) {
      setIsAiClassifying(false);
      const darkReject = {
        isEWaste: false,
        detectedObject: 'Black / Dark / Blank Photo',
        detectedCategory: 'Non E-Waste (Dark / Blank)',
        name_en: 'Dark / Blank / Obscured Photo (Not E-Waste)',
        name_hi: 'काला / अंधेरा फोटो (ई-कबाड़ नहीं है)',
        name_mr: 'काळा / अस्पष्ट फोटो (ई-कचरा नाही)',
        grade: 'Rejected - Invalid Frame',
        suggestedWeightKg: 0,
        estimatedRatePerKg: 0,
        hazardLevel: 'high' as const,
        hazardWarning: language === 'hi'
          ? 'सत्यापन अस्वीकृत: फोटो बहुत अंधेरा, काला या बिना इलेक्ट्रॉनिक वस्तु का है। कृपया रोशनी में असली इलेक्ट्रॉनिक कचरे का साफ फोटो खींचें।'
          : language === 'mr'
          ? 'सत्यापन नाकारले: फोटो खूप काळा किंवा अस्पष्ट आहे. कृपया प्रकाशात स्पष्ट फोटो काढा.'
          : 'Verification Blocked: Photo is pitch dark, blank, or camera lens is obscured.',
        safeAction: language === 'hi'
          ? 'कृपया अच्छी रोशनी में वास्तविक इलेक्ट्रॉनिक हार्डवेयर का फोटो लें।'
          : 'Please move to well-lit area and capture real electronic hardware.',
        criticalMaterials: [],
        confidenceScore: 99.9,
        recommendedRecycler: 'N/A - Blocked'
      };
      setAiResult(darkReject);
      setCustomCategoryName('Black / Dark Photo (Rejected)');
      setCustomWeight(0);
      setSelectedCpcbCategory('');
      playFeedbackChime('warning');
      speak(darkReject.hazardWarning);
      return;
    }

    // 2. Immediate client rejection for human selfie / person
    if (isHumanDetected) {
      setIsAiClassifying(false);
      const humanReject = {
        isEWaste: false,
        detectedObject: 'Human Face / Person (Selfie)',
        detectedCategory: 'Non E-Waste (Human Face)',
        name_en: 'Human Face / Person (Non-EWaste)',
        name_hi: 'मानव चेहरा / व्यक्ति (ई-कबाड़ नहीं है)',
        name_mr: 'मानवी चेहरा / व्यक्ती (ई-कचरा नाही)',
        grade: 'Rejected - Non Electronic',
        suggestedWeightKg: 0,
        estimatedRatePerKg: 0,
        hazardLevel: 'high' as const,
        hazardWarning: language === 'hi' 
          ? 'सत्यापन अस्वीकृत: मानव चेहरा या सेल्फी ई-कबाड़ के रूप में जमा नहीं की जा सकती।' 
          : 'Rejected: Human face or non-electronic item cannot be submitted as scrap.',
        safeAction: 'कृपया केवल वास्तविक इलेक्ट्रॉनिक हार्डवेयर का फोटो लें।',
        criticalMaterials: [],
        confidenceScore: 99.8,
        recommendedRecycler: 'N/A - Blocked'
      };
      setAiResult(humanReject);
      setCustomCategoryName('Human Face (Rejected)');
      setCustomWeight(0);
      setSelectedCpcbCategory('');
      playFeedbackChime('warning');
      speak(humanReject.hazardWarning);
      return;
    }

    try {
      const res = await fetch('/api/ai/classify-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: base64OrUrl, 
          language, 
          isHumanHint: isHumanDetected,
          isBlackOrBlankHint: isDarkDetected,
          notes: ''
        })
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        const data = resData.data;
        setAiResult(data);

        // Non-electronic waste detected
        if (data.isEWaste === false) {
          playFeedbackChime('warning');
          setCustomCategoryName(data.detectedObject || 'Non-EWaste Item');
          setCustomWeight(0);
          setSelectedCpcbCategory('');
          const warnMsg = data.hazardWarning || (language === 'en'
            ? `Warning: Not electronic waste. Identified as ${data.detectedObject || 'non-scrap'}. Submission blocked.`
            : language === 'mr'
            ? `चेतावणी: हे ई-कचरा नाही. ओळख: ${data.detectedObject || 'इतर वस्तू'}. सबमिशन नाकारले.`
            : `चेतावनी: यह ई-कबाड़ नहीं है! पहचान: "${data.detectedObject || 'मानव/अन्य वस्तु'}". सबमिशन अस्वीकृत।`);
          speak(warnMsg);
          return;
        }

        // AI unable to detect or low confidence: Ask user to choose manually! (NEVER default to motherboard)
        if (data.unableToDetect || data.category === 'manual_select') {
          playFeedbackChime('warning');
          setSelectedCpcbCategory('');
          setCustomCategoryName('');
          setIsCustomCategoryMode(false);
          const msg = language === 'hi'
            ? 'एआई इस कबाड़ की पहचान करने में असमर्थ है। कृपया नीचे दी गई सूची से श्रेणी स्वयं चुनें।'
            : language === 'mr'
            ? 'AI या स्क्रॅपची ओळख पटवू शकले नाही. कृपया खालील पर्यायांमधून श्रेणी स्वतः निवडा.'
            : 'AI is unable to detect scrap in this photo. Please choose manually from the categories below.';
          speak(msg);
          return;
        }

        // Out of standard category
        if (data.isOutOfCategory) {
          playFeedbackChime('warning');
          setSelectedCpcbCategory('');
          setCustomCategoryName(data.detectedCategory || 'Unlisted E-Waste Scrap');
          setIsCustomCategoryMode(true);
          if (data.suggestedWeightKg && data.suggestedWeightKg > 0) {
            setCustomWeight(data.suggestedWeightKg);
          }
          const outMsg = language === 'hi'
            ? `यह स्क्रैप CPCB 13 श्रेणियों से बाहर है। प्राधिकरण से नया अनुमोदन मांगें। मूल्य बाद में तय होगा!`
            : language === 'mr'
            ? `हा स्क्रॅप मानक 13 श्रेणींमध्ये नाही. खालील श्रेणी निवडा किंवा मंजुरी मागा.`
            : `Out of standard CPCB categories. Select standard category or request authority approval. Price will be decided later!`;
          speak(outMsg);
          return;
        }

        // Standard category successfully identified
        playFeedbackChime('beep');
        let matchedCatKey = '';
        if (data.category && CPCB_STATUTORY_RATES[data.category]) {
          matchedCatKey = data.category;
        } else {
          const catLower = ((data.category || '') + ' ' + (data.detectedCategory || '')).toLowerCase();
          for (const key of Object.keys(CPCB_STATUTORY_RATES)) {
            if (catLower.includes(key)) {
              matchedCatKey = key;
              break;
            }
          }
        }

        if (matchedCatKey && CPCB_STATUTORY_RATES[matchedCatKey]) {
          setSelectedCpcbCategory(matchedCatKey);
          const targetMeta = CPCB_STATUTORY_RATES[matchedCatKey];
          const matchedMat = materials.find(m => m.category === matchedCatKey) || materials[0];
          setSelectedMaterialId(matchedMat.id);
          setCustomCategoryName(language === 'hi' ? targetMeta.name_hi : language === 'mr' ? targetMeta.name_mr : targetMeta.name_en);
          setIsCustomCategoryMode(false);

          if (data.suggestedWeightKg && data.suggestedWeightKg > 0) {
            setCustomWeight(data.suggestedWeightKg);
          }
          if (data.hazardWarning) {
            playFeedbackChime('warning');
            speak(data.hazardWarning);
          } else {
            speak(`${targetMeta.name_en} identified. CPCB Statutory Rate: ₹${targetMeta.baseRate} per kg.`);
          }
        } else {
          // If match key doesn't fit any known category, strictly require manual select
          setSelectedCpcbCategory('');
          speak(language === 'hi' ? 'कृपया नीचे दी गई सूची से श्रेणी स्वयं चुनें।' : 'Please choose category manually from the list below.');
        }
        return;
      }
    } catch (err) {
      console.warn('AI classification request error, applying fallback:', err);
    } finally {
      setIsAiClassifying(false);
    }

    // Client-side fallback if server fails or is unreachable:
    // STRICT: Do NOT default to motherboard! Prompt user to choose manually!
    const manualFallback = {
      isEWaste: true,
      unableToDetect: true,
      detectedObject: 'Unrecognized E-Waste (Manual Selection Required)',
      detectedCategory: 'Choose Manually',
      category: 'manual_select',
      confidenceScore: 35.0,
      estimatedRatePerKg: 0,
      suggestedWeightKg: 5.0,
      criticalMaterials: [],
      hazardLevel: 'safe' as const,
      hazardWarning: language === 'hi'
        ? 'एआई कबाड़ की पहचान नहीं कर पाया। कृपया नीचे से श्रेणी स्वयं चुनें।'
        : 'AI unable to detect. Please choose category manually.',
      safeAction: 'Please tap a category below.',
      recommendedRecycler: 'Select Category'
    };
    setAiResult(manualFallback);
    setSelectedCpcbCategory('');
    setIsCustomCategoryMode(false);
    playFeedbackChime('warning');
    speak(language === 'hi' ? 'एआई कबाड़ की पहचान नहीं कर पाया। कृपया नीचे से श्रेणी स्वयं चुनें।' : 'AI unable to detect. Please choose category manually.');
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

    const isOutCat = Boolean(aiResult?.isOutOfCategory);
    if (!selectedCpcbCategory && !isOutCat) {
      playFeedbackChime('warning');
      const errTxt = language === 'en'
        ? 'Please select a category from the CPCB standard schedule below.'
        : language === 'mr'
        ? 'कृपया खालील सीपीसीबी मानकांमधून श्रेणी निवडा.'
        : 'कृपया नीचे दी गई सीपीसीबी श्रेणियों में से एक श्रेणी चुनें।';
      speak(errTxt);
      alert(errTxt);
      return;
    }

    const isHazard = (aiResult?.hazardLevel || selectedMaterial.hazardLevel) === 'high';
    const statutoryInfo = selectedCpcbCategory ? CPCB_STATUTORY_RATES[selectedCpcbCategory] : null;
    const rateToUse = isOutCat || !statutoryInfo ? 0 : statutoryInfo.baseRate;
    const lotTotal = isOutCat || !statutoryInfo ? 0 : Math.round(customWeight * rateToUse);

    const finalMaterialName = isOutCat
      ? (customCategoryName.trim() || 'Unlisted E-Waste Scrap')
      : statutoryInfo 
      ? (language === 'hi' ? statutoryInfo.name_hi : language === 'mr' ? statutoryInfo.name_mr : statutoryInfo.name_en)
      : 'E-Waste Scrap';

    const matchedMat = materials.find(m => m.category === selectedCpcbCategory) || selectedMaterial;
    const finalMaterialId = matchedMat.id;

    const createdLotId = `LOT-2026-EW-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCreatedLot = {
      id: createdLotId,
      collectorId: collector.id,
      collectorName: collector.name,
      collectorPhone: collector.phone,
      materialId: finalMaterialId,
      materialName: finalMaterialName,
      category: isOutCat ? 'other' : selectedCpcbCategory,
      isOutOfCategory: isOutCat,
      isPendingCategoryApproval: isOutCat,
      requestedCategoryName: isOutCat ? finalMaterialName : undefined,
      weightKg: customWeight,
      ratePerKg: rateToUse,
      totalAmount: lotTotal,
      status: 'pending' as const,
      timestamp: new Date().toISOString(),
      gpsLocation: '18.5204° N, 73.8567° E (Ward 12, Pune)',
      facilityId: 'REC-MH-PN-004',
      facilityName: aiResult?.recommendedRecycler || 'EcoMetals CPCB Unit #4',
      distanceKm: 3.8,
      hazardFlag: isHazard,
      hazardNote: isHazard ? (aiResult?.hazardWarning || selectedMaterial.hazardWarning_hi) : undefined,
      photoUrl: livePhoto || undefined,
      photos: {
        topView: livePhoto || undefined,
      },
      requiresSticker: false,
      isOfflineCreated: !isOnline,
      needsOnlineAiCategorization: !isOnline
    };

    addLot(newCreatedLot);
    setActiveCreatedLot(newCreatedLot);
    setNewOrderLotForModal(newCreatedLot);

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
                        <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{language === 'hi' ? 'CPCB तय सांविधिक समर्थन दर' : language === 'mr' ? 'CPCB हमीभाव (कायदेशीर दर)' : 'CPCB Statutory Floor Rate'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Price Graph Button */}
                        <button
                          type="button"
                          onClick={() => {
                            playFeedbackChime('beep');
                            setPriceGraphLot({
                              name: matName,
                              rate: mat.pricePerKg,
                              materialId: mat.id
                            });
                          }}
                          className="h-10 px-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer text-xs font-bold"
                          title="View 30-Day Price Trend Graph"
                        >
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <span className="hidden sm:inline">{language === 'hi' ? 'ग्राफ़' : 'Graph'}</span>
                        </button>

                        {/* Audio Rate Player */}
                        <button
                          type="button"
                          onClick={() => {
                            playFeedbackChime('beep');
                            speak(audioDesc);
                          }}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                          title="Listen to statutory rate"
                        >
                          <Volume2 className="w-4 h-4" />
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
                        }
                        if (aiResult.isOutOfCategory) {
                          setIsCustomCategoryMode(true);
                        } else {
                          const matchedCat = CPCB_STANDARD_CATEGORIES.find(
                            c => c.name.toLowerCase().includes(aiResult.detectedCategory?.toLowerCase() || '') ||
                                 c.id.toLowerCase() === aiResult.detectedCategory?.toLowerCase()
                          );
                          if (matchedCat) {
                            setSelectedCpcbCategory(matchedCat.id);
                            const matchedMat = materials.find(m => m.category === matchedCat.id) || materials[0];
                            setSelectedMaterialId(matchedMat.id);
                          }
                          setIsCustomCategoryMode(false);
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
                
                {/* OUT OF CPCB CATEGORY BANNER */}
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
                            ? 'यह स्क्रैप CPCB 8 श्रेणियों से बाहर है। आप नीचे दी गई 8 मानक श्रेणियों में से चुन सकते हैं या CPCB प्राधिकरण से नया अनुमोदन मांग सकते हैं (मूल्य प्राधिकरण द्वारा बाद में तय होगा)।'
                            : language === 'mr'
                            ? 'हा ई-कचरा CPCB 8 श्रेणींमध्ये नाही. खालील 8 प्रमाणित श्रेणी निवडा किंवा CPCB कडून मंजुरी मागा (किंमत नंतर ठरेल).'
                            : 'This item is not in the standard CPCB scrap schedule. Choose an existing CPCB category below or request official category approval.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-300 text-[10px] font-mono text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 animate-pulse" />
                      <span>{language === 'hi' ? 'अनुरोध भेजने पर केवल वजन दर्ज होगा, मूल्य CPCB द्वारा बाद में तय होगा।' : 'If submitted unlisted, only weight is logged. Price decided later by CPCB.'}</span>
                    </div>
                  </div>
                )}

                {/* BLOCK 1: CPCB 13 STANDARD CATEGORIES SELECTOR (MANDATORY SELECTION) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'hi' ? 'CPCB मानक 13 श्रेणियां (निश्चित सरकारी दर)' : language === 'mr' ? 'CPCB 13 प्रमाणित श्रेणी (सरकारी हमीभाव)' : 'CPCB Standard 13 Categories (Authority Fixed Rates)'}</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      {selectedCpcbCategory && CPCB_STATUTORY_RATES[selectedCpcbCategory] && (
                        <button
                          type="button"
                          onClick={() => {
                            const name = language === 'hi' 
                              ? CPCB_STATUTORY_RATES[selectedCpcbCategory].name_hi 
                              : CPCB_STATUTORY_RATES[selectedCpcbCategory].name_en;
                            setPriceGraphLot({
                              name,
                              rate: currentRate,
                              materialId: selectedMaterial?.id
                            });
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                        >
                          <TrendingUp className="w-3 h-3 text-emerald-700" />
                          <span>{language === 'hi' ? 'मूल्य ग्राफ़' : 'Price Graph'}</span>
                        </button>
                      )}
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        13 Schedules
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {CPCB_STANDARD_CATEGORIES.map((cat) => {
                      const isSelected = !isOutOfCategory && selectedCpcbCategory === cat.id;
                      const catName = language === 'hi' ? cat.name_hi : language === 'mr' ? cat.name_mr : cat.name;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            playFeedbackChime('beep');
                            setSelectedCpcbCategory(cat.id);
                            const matched = materials.find(m => m.category === cat.id) || materials[0];
                            setSelectedMaterialId(matched.id);
                            setCustomCategoryName(catName);
                            setIsCustomCategoryMode(false);
                            if (aiResult) {
                              setAiResult({
                                ...aiResult,
                                isOutOfCategory: false,
                                detectedCategory: cat.name,
                                estimatedRatePerKg: cat.baseRate
                              });
                            }
                            speak(`${catName} selected. Statutory rate is ₹${cat.baseRate} per kg.`);
                          }}
                          className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                              {catName}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono mt-2 pt-1 border-t border-slate-100">
                            <span className="text-slate-500">{cat.code.replace('CPCB-SCH-I-', '')}</span>
                            <span className={`font-extrabold ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                              ₹{cat.baseRate}/kg
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {isOutOfCategory && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                        <span>अस्वीकृत गैर-सूचीबद्ध श्रेणी: {customCategoryName || 'Unlisted E-Waste'}</span>
                        <span className="text-[10px] font-mono font-extrabold uppercase text-amber-700">अनुरोध मोड</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* BLOCK 2: STATUTORY RATE & WEIGHT ADJUSTMENT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rate per kg: STRICTLY FIXED BY AUTHORITY */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'hi' ? 'सांविधिक दर (Statutory Rate)' : language === 'mr' ? 'कायदेशीर हमीभाव दर' : 'Statutory Rate'}</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        🔒 CPCB Locked
                      </span>
                    </div>

                    {isOutOfCategory ? (
                      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-center space-y-1 my-auto">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-950 font-mono">
                          <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                          <span>CPCB Tariff Pending</span>
                        </div>
                        <div className="text-[11px] text-amber-900 font-medium">
                          {language === 'hi' ? 'दर CPCB प्राधिकरण द्वारा बाद में तय की जाएगी (मूल्य: ₹0/kg)' : language === 'mr' ? 'किंमत CPCB द्वारे नंतर ठरेल (दर: ₹0/kg)' : 'Price will be determined by CPCB authority (Rate: ₹0/kg)'}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 my-auto">
                        <div className="flex items-baseline justify-between">
                          <div className="text-2xl font-mono font-black text-emerald-700">
                            ₹{currentRate}
                            <span className="text-xs text-slate-500 font-normal font-sans ml-1">/ kg</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                            सरकारी तय दर
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {language === 'hi'
                            ? 'CPCB प्राधिकरण द्वारा निश्चित दर। इसे बदला नहीं जा सकता।'
                            : 'Authority fixed statutory rate. Non-negotiable.'}
                        </p>
                      </div>
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
                  value={`https://e-kabad-setu.vercel.app/?orderId=${encodeURIComponent(activeCreatedLot.id)}&view=order_status`} 
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
              <div className="mt-2 text-[10px] font-mono text-emerald-800 font-bold">
                e-kabad-setu.vercel.app
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

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowQrModal(false);
                  setActivePublicOrderId(activeCreatedLot.id);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <span>View Live Order Status Page ↗</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer text-xs"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order QR Code Popup on Pending / Orders Screen */}
      {newOrderLotForModal && (
        <NewOrderQrModal
          lot={newOrderLotForModal}
          isOpen={Boolean(newOrderLotForModal)}
          onClose={() => setNewOrderLotForModal(null)}
          onViewTrackingPage={(id) => {
            setNewOrderLotForModal(null);
            setActivePublicOrderId(id);
          }}
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

      {/* CPCB 30-Day Statutory Price History Modal */}
      {priceGraphLot && (
        <LotPriceHistoryModal
          isOpen={Boolean(priceGraphLot)}
          onClose={() => setPriceGraphLot(null)}
          lotName={priceGraphLot.name}
          materialId={priceGraphLot.materialId}
          currentRate={priceGraphLot.rate}
          lotId={priceGraphLot.lotId}
        />
      )}

    </div>
  );
};
