import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Language } from '../types';
import { 
  ShieldCheck, 
  Smartphone, 
  Factory, 
  CheckCircle2, 
  Camera, 
  ArrowRight, 
  RotateCcw, 
  MapPin, 
  QrCode, 
  FileText,
  Recycle,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { playFeedbackChime } from '../utils/speech';

export const OnboardingGateway: React.FC = () => {
  const { language, setLanguage, setCurrentView, collector, setCollector, speak } = useApp();

  // Active portal mode: 'collector' (default) or 'recycler'
  const [activePortal, setActivePortal] = useState<'collector' | 'recycler'>('collector');

  // Collector login flow state
  const [collectorStep, setCollectorStep] = useState<'mobile' | 'otp' | 'selfie' | 'idcard'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('9823456789');
  const [otpCode, setOtpCode] = useState('');
  const defaultMaleAvatar = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80';
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(
    !collector.selfieUrl || collector.selfieUrl.includes('1544717305') || collector.selfieUrl.includes('1544724569') || collector.selfieUrl.includes('1544716278')
      ? defaultMaleAvatar
      : collector.selfieUrl
  );

  // Recycler login flow state
  const [cpcbId, setCpcbId] = useState('CPCB/EW-REC/2026/8812');
  const [recyclerPassword, setRecyclerPassword] = useState('eco2026pass');
  const [recyclerError, setRecyclerError] = useState('');

  const handleNumpadPress = (digit: string) => {
    playFeedbackChime('beep');
    if (collectorStep === 'mobile') {
      if (mobileNumber.length < 10) {
        setMobileNumber((prev) => prev + digit);
      }
    } else if (collectorStep === 'otp') {
      if (otpCode.length < 4) {
        setOtpCode((prev) => prev + digit);
      }
    }
  };

  const handleNumpadBackspace = () => {
    playFeedbackChime('beep');
    if (collectorStep === 'mobile') {
      setMobileNumber((prev) => prev.slice(0, -1));
    } else if (collectorStep === 'otp') {
      setOtpCode((prev) => prev.slice(0, -1));
    }
  };

  const handleSendOtp = () => {
    if (mobileNumber.length < 10) {
      speak(
        language === 'en' 
          ? 'Please enter a 10 digit mobile number' 
          : language === 'mr'
          ? 'कृपया 10 अंकी मोबाईल नंबर प्रविष्ट करा'
          : 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें'
      );
      return;
    }
    setCollectorStep('otp');
    setOtpCode('7492'); // Pre-fill mock OTP for demo speed
    playFeedbackChime('beep');
    speak(
      language === 'en' 
        ? 'OTP sent to mobile. Verification code is 7492.' 
        : language === 'mr'
        ? 'OTP मोबाईलवर पाठवला आहे. पडताळणी कोड 7492 आहे.'
        : 'ओटीपी भेजा गया है। सत्यापन कोड 7492 है।'
    );
  };

  const handleVerifyOtp = () => {
    if (otpCode.length === 4) {
      setCollectorStep('selfie');
      playFeedbackChime('success');
      speak(
        language === 'en' 
          ? 'Verification successful. Please capture a quick selfie for your ID card.' 
          : language === 'mr'
          ? 'पडताळणी यशस्वी. ओळखपत्रासाठी सेल्फी घ्या.'
          : 'सत्यापन सफल रहा। कृपया पहचान पत्र के लिए एक सेल्फी लें।'
      );
    }
  };

  const handleCaptureSelfie = () => {
    setCapturedPhotoUrl('https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80');
    setCollector((prev) => ({
      ...prev,
      phone: `+91 ${mobileNumber}`
    }));
    setCollectorStep('idcard');
    playFeedbackChime('success');
    speak(
      language === 'en' 
        ? 'Digital ID card generated successfully.' 
        : language === 'mr'
        ? 'डिजिटल ओळखपत्र तयार झाले आहे.'
        : 'आपका डिजिटल पहचान पत्र तैयार हो चुका है।'
    );
  };

  const handleRecyclerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpcbId || !recyclerPassword) {
      setRecyclerError(
        language === 'en'
          ? 'Please enter CPCB ID and password'
          : language === 'mr'
          ? 'कृपया CPCB ID आणि पासवर्ड प्रविष्ट करा'
          : 'कृपया CPCB ID और पासवर्ड दर्ज करें'
      );
      return;
    }
    playFeedbackChime('success');
    setCurrentView('recycler');
  };

  const translations = {
    hi: {
      portalTitle: 'ई-कबाड़ सेतु',
      portalSubtitle: 'Ministry of Environment, Forest & Climate Change (MoEFCC) & CPCB Compliant Bridge',
      tagline: 'अनौपचारिक कबाड़ संकलनकर्ताओं और सीपीसीबी अधिकृत रिसाइक्लर्स का सीधा डिजिटल सेतु',
      selectLang: 'भाषा:',
      card1Title: 'कबाड़ीवाला साथी',
      card1Role: 'अनौपचारिक कबाड़ संकलनकर्ता व एग्रीगेटर',
      card1Subtext: 'दैनिक सही मंडी भाव पाएं, सुरक्षित ई-कबाड़ हैंडओवर करें और सीधे बैंक/कैश में तुरंत भुगतान लें।',
      card2Title: 'अधिकृत रिसाइक्लर',
      card2Role: 'CPCB / SPCB अधिकृत रिसाइक्लर ERP',
      card2Subtext: 'E-Waste Rules 2022 के तहत 100% ट्रेसिबल स्क्रैप लॉट प्राप्त करें और CPCB EPR क्रेडिट जनरेट करें।',
      stepMobile: 'मोबाइल नंबर दर्ज करें',
      enterOtp: '4-अंकों का ओटीपी दर्ज करें',
      sentTo: 'इस नंबर पर भेजा गया:',
      verifyBtn: 'ओटीपी सत्यापित करें',
      takeSelfie: 'पहचान पत्र के लिए सेल्फी लें',
      selfieHint: 'कैमरे की ओर देखें और एक स्पष्ट फोटो लें',
      clickSelfieBtn: 'कैमरा फोटो खींचें',
      idReady: 'डिजिटल पहचान पत्र (E-Kabad Saathi ID)',
      enterMobileApp: 'कबाड़ीवाला मोबाइल ऐप खोलें',
      recyclerIdLabel: 'CPCB Authorization License Number',
      passwordLabel: 'Facility Secret Password',
      loginRecyclerBtn: 'इंडस्ट्रियल ERP डैशबोर्ड में प्रवेश करें',
      statDiverted: 'कुल ई-कबाड़ निस्तारण',
      statPartners: 'पंजीकृत कबाड़ी साथी',
      statDisbursed: 'सीधा भुगतान हस्तांतरण',
      statUnits: 'अधिकृत डिस्मेंटलिंग यूनिट्स',
      getOtpBtn: 'ओटीपी प्राप्त करें',
      changeNumber: 'बदलें',
      step1Badge: 'चरण 1 / 3: ओटीपी',
      demoOtp: 'डेमो ओटीपी',
      quotaLabel: 'अधिकृत डिस्मेंटलिंग कोटा:',
      spcbLabel: 'राज्य प्रदूषण नियंत्रण बोर्ड:',
      calibrationLabel: 'वेब्रिज सत्यापन:',
      class3Verified: 'Class-III सत्यापित 2026',
      systemStatusLabel: 'सिस्टम स्थिति:',
      operationalLabel: 'सक्रिय (Operational)',
      backToCollector: '← कबाड़ीवाला साथी लॉगिन पर वापस जाएं',
      switchToRecycler: 'क्या आप अधिकृत रिसाइक्लर हैं? ERP पोर्टल लॉगिन करें →',
      switchToCollector: 'कबाड़ी साथी हैं? कबाड़ीवाला साथी लॉगिन पर जाएं →',
      headerRecyclerBtn: 'अधिकृत रिसाइक्लर',
      headerCollectorBtn: 'कबाड़ीवाला साथी',
      cpcbCardTitle: 'CPCB मान्यताप्राप्त ई-कबाड़ संकलक पहचान पत्र',
      liveCameraStream: 'कैमरा लाइव',
      collectorPortalBadge: 'कबाड़ी साथी ऐप (Mobile Portal)',
      recyclerPortalBadge: 'अधिकृत रिसाइक्लर पोर्टल (Desktop ERP)',
      facilitySubtext: 'EcoMetals CPCB Authorized Dismantling Unit #4 (Pune MIDC)'
    },
    mr: {
      portalTitle: 'ई-कबाड सेतू',
      portalSubtitle: 'Ministry of Environment, Forest & Climate Change (MoEFCC) & CPCB Compliant Bridge',
      tagline: 'कचरा वेचक बांधव आणि अधिकृत रिसायकलर यांच्यातील थेट डिजिटल सेतू',
      selectLang: 'भाषा:',
      card1Title: 'कबाडीवाला साथी',
      card1Role: 'कचरा वेचक / भंगार संकलक',
      card1Subtext: 'दररोजचा अधिकृत बाजारभाव मिळवा, सुरक्षित कचरा जमा करा आणि लगेच रोख/UPI रक्कम मिळवा.',
      card2Title: 'अधिकृत रिसायकलर',
      card2Role: 'CPCB / SPCB अधिकृत रिसायकलर ERP',
      card2Subtext: 'E-Waste Rules 2022 नुसार 100% ट्रेसिबल ई-कचरा मिळवा आणि EPR क्रेडिट्स सुरक्षित निर्माण करा.',
      stepMobile: 'मोबाईल नंबर प्रविष्ट करा',
      enterOtp: '4-अंकी OTP प्रविष्ट करा',
      sentTo: 'या क्रमांकावर पाठवले:',
      verifyBtn: 'OTP तपासा',
      takeSelfie: 'ओळखपत्रासाठी सेल्फी घ्या',
      selfieHint: 'कॅमेऱ्याकडे पाहून स्पष्ट फोटो काढा',
      clickSelfieBtn: 'फोटो क्लिक करा',
      idReady: 'डिजिटल ओळखपत्र (E-Kabad Saathi ID)',
      enterMobileApp: 'कबाडीवाला ॲप सुरू करा',
      recyclerIdLabel: 'CPCB परवाना क्रमांक',
      passwordLabel: 'सुरक्षा पासवर्ड',
      loginRecyclerBtn: 'ERP डॅशबोर्ड उघडा',
      statDiverted: 'एकूण पुनर्प्रक्रिया ई-कचरा',
      statPartners: 'नोंदणीकृत कबाडी मित्र',
      statDisbursed: 'थेट खात्यात वर्ग रक्कम',
      statUnits: 'अधिकृत कारखाने',
      getOtpBtn: 'OTP मिळवा',
      changeNumber: 'बदला',
      step1Badge: 'पायरी 1 / 3: OTP',
      demoOtp: 'डेमो OTP',
      quotaLabel: 'अधिकृत डिस्मेंटलिंग कोटा:',
      spcbLabel: 'राज्य प्रदूषण नियंत्रण मंडळ:',
      calibrationLabel: 'वेब्रिज पडताळणी:',
      class3Verified: 'Class-III पडताळणी 2026',
      systemStatusLabel: 'प्रणाली स्थिती:',
      operationalLabel: 'पूर्णपणे कार्यरत',
      backToCollector: '← कबाडीवाला साथी लॉगिनकडे परत जा',
      switchToRecycler: 'तुम्ही अधिकृत रिसायकलर आहात का? ERP पोर्टल लॉगिन करा →',
      switchToCollector: 'कचरा वेचक किंवा कबाडी बांधव आहात? साथी लॉगिनवर जा →',
      headerRecyclerBtn: 'अधिकृत रिसायकलर',
      headerCollectorBtn: 'कबाडीवाला साथी',
      cpcbCardTitle: 'CPCB अधिकृत ई-कचरा संकलक ओळखपत्र',
      liveCameraStream: 'कॅमेरा सुरू आहे',
      collectorPortalBadge: 'कबाडी साथी ॲप (Mobile Portal)',
      recyclerPortalBadge: 'अधिकृत रिसायकलर पोर्टल (ERP)',
      facilitySubtext: 'EcoMetals CPCB Authorized Dismantling Unit #4 (Pune MIDC)'
    },
    en: {
      portalTitle: 'E-Kabad Setu',
      portalSubtitle: 'Ministry of Environment, Forest & Climate Change (MoEFCC) & CPCB Compliant Bridge',
      tagline: 'Bridging informal scrap collectors with authorized e-waste recyclers under E-Waste Rules 2022',
      selectLang: 'Language:',
      card1Title: 'Kabadiwala Saathi',
      card1Role: 'Informal Waste-Picker / Scrap Aggregator',
      card1Subtext: 'Get guaranteed 24h mandi rates, hand over hazardous scrap safely, and receive instant digital payouts.',
      card2Title: 'Authorized Recycler',
      card2Role: 'CPCB / SPCB Authorized Recycler ERP',
      card2Subtext: 'Procure geo-tagged traceable e-waste lots, verify weighbridge mass, and generate statutory EPR credits.',
      stepMobile: 'Enter Mobile Number',
      enterOtp: 'Enter 4-Digit OTP Code',
      sentTo: 'Sent to registered number:',
      verifyBtn: 'Verify & Continue',
      takeSelfie: 'Capture Onboarding Selfie',
      selfieHint: 'Position face inside the frame for official registry',
      clickSelfieBtn: 'Capture & Verify Selfie',
      idReady: 'Digital Collector ID Generated',
      enterMobileApp: 'Launch Collector Mobile App',
      recyclerIdLabel: 'CPCB Authorization License Number',
      passwordLabel: 'Facility Secret Password',
      loginRecyclerBtn: 'Access Industrial ERP Portal',
      statDiverted: 'E-Waste Diverted',
      statPartners: 'Registered Collectors',
      statDisbursed: 'Direct Payouts Disbursed',
      statUnits: 'Authorized Plants',
      getOtpBtn: 'Get OTP',
      changeNumber: 'Change',
      step1Badge: 'Step 1 of 3: OTP',
      demoOtp: 'Demo OTP',
      quotaLabel: 'Authorized Dismantling Quota:',
      spcbLabel: 'State Pollution Control Board:',
      calibrationLabel: 'Weighbridge Calibration:',
      class3Verified: 'Class-III Verified 2026',
      systemStatusLabel: 'System Status:',
      operationalLabel: 'Fully Operational',
      backToCollector: '← Back to Kabadiwala Saathi Login',
      switchToRecycler: 'Are you an authorized recycler? Go to Recycler ERP Portal →',
      switchToCollector: 'Informal collector or scrap aggregator? Go to Kabadiwala Saathi →',
      headerRecyclerBtn: 'Authorized Recycler',
      headerCollectorBtn: 'Kabadiwala Saathi',
      cpcbCardTitle: 'CPCB Recognized E-Waste Collector ID',
      liveCameraStream: 'Live Camera Stream',
      collectorPortalBadge: 'Saathi Mobile Portal',
      recyclerPortalBadge: 'Authorized Recycler ERP Portal',
      facilitySubtext: 'EcoMetals CPCB Authorized Dismantling Unit #4 (Pune MIDC)'
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Official Government / CPCB Top Header Ribbon */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 border border-emerald-700 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <Recycle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-emerald-950 flex items-center gap-2 font-['Rozha_One',serif]">
                  {t.portalTitle}
                </h1>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                  SIH-2026 • SIH26229
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono hidden sm:block">
                {t.portalSubtitle}
              </p>
            </div>
          </div>

          {/* Right Header Navigation: Portal Switching & Language Selector */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            
            {/* Header Portal Switch Buttons */}
            <div className="flex items-center gap-2">
              {activePortal === 'collector' ? (
                <button
                  type="button"
                  onClick={() => {
                    playFeedbackChime('beep');
                    setActivePortal('recycler');
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 font-bold text-xs rounded-full flex items-center gap-1.5 shadow-sm transition-all hover:border-emerald-500 active:scale-95"
                  title="Switch to Authorized Recycler ERP Login"
                >
                  <Factory className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.headerRecyclerBtn}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playFeedbackChime('beep');
                    setActivePortal('collector');
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  title="Switch to Kabadiwala Saathi Login"
                >
                  <Smartphone className="w-3.5 h-3.5 text-white" />
                  <span>{t.headerCollectorBtn}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  playFeedbackChime('beep');
                  setCurrentView('government');
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                title="Open Government & CPCB Regulatory Research Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Govt / CPCB Portal</span>
              </button>
            </div>

            {/* Language Selection Bar (No loud speech reading upon clicking) */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-full shadow-xs">
              <span className="text-xs text-slate-500 px-2 font-medium">
                {t.selectLang}
              </span>
              {(['hi', 'mr', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    language === lang
                      ? 'bg-emerald-100 text-emerald-800 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'hi' ? 'हिंदी' : lang === 'mr' ? 'मराठी' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Single-Portal Isolated View */}
      <main className="max-w-7xl mx-auto w-full px-4 py-8 sm:py-10 flex-1 flex flex-col justify-center">
        
        {/* Banner Tag & Portal Context */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Circular Economy & E-Waste Management Rules 2022</span>
          </div>

          {activePortal === 'collector' ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t.card1Title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                {t.card1Subtext}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t.card2Title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                {t.card2Subtext}
              </p>
            </>
          )}
        </div>

        {/* CONTAINER: Only the selected role's login is shown */}
        <div className="max-w-xl mx-auto w-full">

          {/* =========================================================================
              VIEWPORT: KABADIWALA SAATHI (Informal Collector Login)
              Shown ONLY when activePortal === 'collector'
          ========================================================================== */}
          {activePortal === 'collector' && (
            <div className="relative bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur transition-all animate-fadeIn">
              
              {/* Card Header Badge */}
              <div className="absolute -top-3.5 left-6 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <Smartphone className="w-3.5 h-3.5" />
                <span>{t.collectorPortalBadge}</span>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    {t.card1Title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">{t.card1Role}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
              </div>

              {/* Step-by-step Collector Onboarding Flow */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                
                {/* STEP 1: Mobile Input */}
                {collectorStep === 'mobile' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        {t.stepMobile}
                      </label>
                      <span className="text-[11px] text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                        {t.step1Badge}
                      </span>
                    </div>

                    <div className="relative mb-4">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono text-sm font-semibold">
                        🇮🇳 +91
                      </div>
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98234 56789"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-18 pr-4 py-2.5 text-lg font-mono text-slate-900 font-semibold tracking-widest focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                      />
                    </div>

                    {/* Visual On-Screen Numpad for waste-pickers / touch devices */}
                    <div className="grid grid-cols-3 gap-1.5 mb-4">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '⌫'].map((btn) => (
                        <button
                          key={btn}
                          type="button"
                          onClick={() => {
                            if (btn === 'Clear') setMobileNumber('');
                            else if (btn === '⌫') handleNumpadBackspace();
                            else handleNumpadPress(btn);
                          }}
                          className="py-2.5 bg-white hover:bg-slate-100 text-slate-800 active:bg-emerald-600 active:text-white font-bold rounded-xl text-sm border border-slate-200 shadow-xs transition-colors"
                        >
                          {btn}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-transform active:scale-[0.99]"
                    >
                      <span>{t.getOtpBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2: OTP Verification */}
                {collectorStep === 'otp' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        {t.enterOtp}
                      </label>
                      <button
                        type="button"
                        onClick={() => setCollectorStep('mobile')}
                        className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{t.changeNumber}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {t.sentTo} <span className="font-mono text-emerald-700 font-bold">+91 {mobileNumber}</span>
                    </p>

                    <div className="flex justify-center gap-3 mb-4">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className="w-12 h-14 bg-white border-2 border-emerald-500 rounded-xl flex items-center justify-center text-2xl font-mono font-bold text-emerald-700 shadow-xs"
                        >
                          {otpCode[idx] || '—'}
                        </div>
                      ))}
                    </div>

                    {/* Numpad for OTP */}
                    <div className="grid grid-cols-3 gap-1.5 mb-4">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Demo OTP', '0', '⌫'].map((btn) => (
                        <button
                          key={btn}
                          type="button"
                          onClick={() => {
                            if (btn === 'Demo OTP') setOtpCode('7492');
                            else if (btn === '⌫') handleNumpadBackspace();
                            else handleNumpadPress(btn);
                          }}
                          className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                            btn === 'Demo OTP'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 col-span-1 shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs active:bg-emerald-600 active:text-white'
                          }`}
                        >
                          {btn === 'Demo OTP' ? t.demoOtp : btn}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpCode.length < 4}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.verifyBtn}</span>
                    </button>
                  </div>
                )}

                {/* STEP 3: Selfie Capture */}
                {collectorStep === 'selfie' && (
                  <div className="text-center">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">{t.takeSelfie}</h4>
                    <p className="text-xs text-slate-500 mb-4">{t.selfieHint}</p>

                    <div className="w-36 h-36 mx-auto rounded-2xl bg-slate-100 border-2 border-dashed border-emerald-500 overflow-hidden relative mb-4 flex items-center justify-center shadow-inner">
                      <img
                        src={capturedPhotoUrl}
                        alt="Collector Selfie"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent flex items-end justify-center pb-2">
                        <span className="text-[10px] text-emerald-300 font-mono flex items-center gap-1 font-semibold">
                          <Camera className="w-3 h-3" /> {t.liveCameraStream}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCaptureSelfie}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{t.clickSelfieBtn}</span>
                    </button>
                  </div>
                )}

                {/* STEP 4: Generated Digital ID Card */}
                {collectorStep === 'idcard' && (
                  <div>
                    <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 border border-emerald-200 rounded-2xl p-4 shadow-sm mb-4 relative overflow-hidden text-slate-900">
                      <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                        <Recycle className="w-36 h-36 text-emerald-600" />
                      </div>

                      <div className="flex items-center justify-between border-b border-emerald-100 pb-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                            {t.cpcbCardTitle}
                          </span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                          VERIFIED
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <img
                          src={capturedPhotoUrl}
                          alt="Collector"
                          className="w-16 h-16 rounded-xl object-cover border border-emerald-400 shadow-xs shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-slate-900 leading-tight truncate">{collector.name}</h4>
                          <div className="text-xs font-mono text-emerald-700 font-bold mt-0.5">
                            ID: {collector.id}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{collector.ward}, {collector.city}</span>
                          </div>
                        </div>
                        <div className="w-14 h-14 bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center shrink-0">
                          <QrCode className="w-12 h-12 text-slate-900" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playFeedbackChime('success');
                        setCurrentView('collector');
                      }}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition-transform active:scale-[0.99]"
                    >
                      <span>{t.enterMobileApp}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

              </div>

              {/* Bottom Navigation Hint: Jump to Recycler */}
              <div className="mt-5 text-center border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    playFeedbackChime('beep');
                    setActivePortal('recycler');
                  }}
                  className="text-xs text-slate-500 hover:text-emerald-700 font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Factory className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.switchToRecycler}</span>
                </button>
              </div>

            </div>
          )}

          {/* =========================================================================
              VIEWPORT: AUTHORIZED RECYCLER (CPCB / SPCB Industrial ERP Portal)
              Shown ONLY when activePortal === 'recycler'
          ========================================================================== */}
          {activePortal === 'recycler' && (
            <div className="relative bg-slate-800 rounded-3xl p-6 sm:p-8 border-2 border-slate-700 hover:border-emerald-400 transition-all shadow-xl group text-white animate-fadeIn">
              
              {/* Card Header Badge */}
              <div className="absolute -top-3.5 left-6 bg-emerald-500 text-slate-950 text-xs font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <Factory className="w-3.5 h-3.5" />
                <span>{t.recyclerPortalBadge}</span>
              </div>

              {/* Return to Collector button inside card */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    {t.card2Title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-400 mt-0.5">{t.card2Role}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                  <Factory className="w-6 h-6" />
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                {t.card2Subtext}
              </p>

              <form onSubmit={handleRecyclerLogin} className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5">
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                    {t.recyclerIdLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={cpcbId}
                      onChange={(e) => setCpcbId(e.target.value)}
                      placeholder="CPCB/EW-REC/2026/8812"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t.facilitySubtext}
                  </p>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                    {t.passwordLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={recyclerPassword}
                      onChange={(e) => setRecyclerPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {recyclerError && (
                  <div className="mb-4 p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                    {recyclerError}
                  </div>
                )}

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5 mb-5 font-mono">
                  <div className="flex justify-between">
                    <span>{t.quotaLabel}</span>
                    <span className="text-emerald-400 font-bold">120.0 MT / Month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.spcbLabel}</span>
                    <span className="text-slate-300">MPCB-PUNE-EW-902</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.calibrationLabel}</span>
                    <span className="text-emerald-400">{t.class3Verified}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-[0.99]"
                >
                  <span>{t.loginRecyclerBtn}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {/* Bottom Navigation Hint: Back to Kabadiwala Saathi */}
              <div className="mt-5 text-center border-t border-slate-700/80 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    playFeedbackChime('beep');
                    setActivePortal('collector');
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-300 font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.backToCollector}</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Official System Stats Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.statDiverted}</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-700">42.8 <span className="text-base font-medium text-emerald-500">MT</span></p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.statPartners}</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-700">1,240+</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.statDisbursed}</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-700">₹1.82 <span className="text-base font-medium text-slate-500">Cr</span></p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.statUnits}</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-700">84 <span className="text-base font-medium text-slate-500">Units</span></p>
            </div>
          </div>
          <div className="text-right w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
            <p className="text-xs text-slate-400 font-medium">
              {t.systemStatusLabel} <span className="text-emerald-500 font-bold">● {t.operationalLabel}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">CPCB-NODE: MH-PUNE-V2-2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
