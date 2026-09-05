import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Initialize Google GenAI client (Lazy/Safe initialization with fallback)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 1. AI Material Classification & Vision Scan Endpoint
app.post("/api/ai/classify-material", async (req, res) => {
  try {
    const { imageBase64, mimeType, notes = "", isHumanHint, isBlackOrBlankHint, language = "hi" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 in request body" });
    }

    const lowerNotes = (notes || "").toLowerCase();

    // Fast-path 1: Immediate Black / Pitch Dark / Blank / Obscured Photo Check
    if (
      isBlackOrBlankHint ||
      lowerNotes.includes("black") ||
      lowerNotes.includes("dark") ||
      lowerNotes.includes("blank") ||
      lowerNotes.includes("obscured") ||
      lowerNotes.includes("काला") ||
      lowerNotes.includes("अंधेरा") ||
      lowerNotes.includes("काळा")
    ) {
      const fallback = getIntelligentFallbackClassification(notes, false, true);
      return res.json({ success: true, data: fallback, source: "safety_dark_rejection" });
    }

    // Fast-path 2: Immediate Human / Face / Selfie Rejection
    if (
      isHumanHint ||
      lowerNotes.includes("human") ||
      lowerNotes.includes("face") ||
      lowerNotes.includes("person") ||
      lowerNotes.includes("selfie") ||
      lowerNotes.includes("चेहरा") ||
      lowerNotes.includes("मानव") ||
      lowerNotes.includes("माणूस")
    ) {
      const fallback = getIntelligentFallbackClassification(notes, true, false);
      return res.json({ success: true, data: fallback, source: "safety_human_rejection" });
    }

    // If Gemini API is configured, use Gemini Flash model
    if (ai) {
      let detectedMime = mimeType || "image/jpeg";
      let base64Data = imageBase64;

      // Extract proper mimeType and clean base64 data
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
      if (mimeMatch) {
        detectedMime = mimeMatch[1];
        base64Data = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, "");
      } else if (imageBase64.startsWith("http://") || imageBase64.startsWith("https://")) {
        // If an external image URL was provided (e.g. sample presets)
        try {
          const fetchRes = await fetch(imageBase64);
          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          base64Data = buffer.toString("base64");
          const contentType = fetchRes.headers.get("content-type");
          if (contentType) detectedMime = contentType;
        } catch (fetchErr) {
          console.warn("Could not fetch remote preset image for Gemini vision:", fetchErr);
        }
      }

      const prompt = `You are an official CPCB (Central Pollution Control Board, Ministry of Environment, Forest & Climate Change, India) certified E-Waste Computer Vision Inspector.
Analyze the provided photograph with extreme precision and adhere strictly to all mandatory inspection rules below.

=========================================
MANDATORY STEP 1: VALIDITY & REJECTION CHECKS
=========================================
You MUST immediately REJECT the image (isEWaste = false) if ANY of the following conditions are met:

Condition 1.1: BLACK / BLANK / DARK / SOLID COLOR / OBSERVED / BLURRED / FINGER-COVERED PHOTO:
- The image is completely or mostly pitch black, very dark, shadowed, underexposed, blurred beyond recognition, or the camera lens is covered by a finger/object.
- The image is a flat single solid color (e.g., solid black, solid white wall, gray sheet, table surface, floor tile, blank paper, colored cloth) with NO distinct electronic components or circuit assemblies visible.
- If true, you MUST return:
  "isEWaste": false,
  "detectedObject": "Black / Dark / Solid Color / Obscured Photo",
  "category": "non_ewaste",
  "name_en": "Obscured / Black / Blank Photo (Not E-Waste)",
  "name_hi": "काला / अस्पष्ट / खाली फोटो (ई-कबाड़ नहीं है)",
  "name_mr": "काळा / अस्पष्ट / रिकामा फोटो (ई-कचरा नाही)",
  "grade": "Rejected - Invalid Photo",
  "suggestedWeightKg": 0,
  "suggestedRatePerKg": 0,
  "estimatedRatePerKg": 0,
  "hazardLevel": "high",
  "hazardWarning_en": "Verification Blocked: Photo is pitch dark, blank, solid color, or camera lens is obscured.",
  "hazardWarning_hi": "सत्यापन अस्वीकृत: फोटो बहुत अंधेरा, काला या बिना इलेक्ट्रॉनिक वस्तु का है। कृपया रोशनी में असली इलेक्ट्रॉनिक कचरे का साफ फोटो खींचें।",
  "hazardWarning_mr": "सत्यापन नाकारले: फोटो खूप काळा किंवा अस्पष्ट आहे. कृपया प्रकाशात खऱ्या ई-कचऱ्याचा फोटो काढा.",
  "safeAction_en": "Turn on flashlight or move to well-lit area and capture clear electronic hardware.",
  "safeAction_hi": "कृपया लाइट चालू करें या अच्छी रोशनी में इलेक्ट्रॉनिक सामान का साफ फोटो लें।",
  "safeAction_mr": "कृपया चांगल्या प्रकाशात इलेक्ट्रॉनिक वस्तूंचा स्पष्ट फोटो काढा.",
  "anomalyDetected": true,
  "anomalyReason": "Dark, solid-color, blank or obscured frame detected with zero electronic scrap features.",
  "confidenceScore": 99.9,
  "vernacularVoiceSummary_hi": "चेतावनी! फोटो बहुत अंधेरा या काला है। कृपया अच्छी रोशनी में असली ई-कचरे का साफ फोटो खींचें।",
  "vernacularVoiceSummary_mr": "सावधान! फोटो खूप काळा किंवा अस्पष्ट आहे. कृपया चांगल्या प्रकाशात ई-कचऱ्याचा फोटो काढा.",
  "vernacularVoiceSummary_en": "Warning: Obscured or dark photo. Please scan genuine electronic scrap in good lighting."

Condition 1.2: HUMAN PERSON, FACE, SELFIE, BODY PART, CLOTHING:
- The image contains any human face, person, portrait, selfie, skin, hand, clothing, room interior.
- If true, return isEWaste: false, detectedObject: "Human Face / Person (Selfie)", name_en: "Human Face / Person (Not E-Waste)", name_hi: "मानव चेहरा / व्यक्ति (ई-कबाड़ नहीं है)", name_mr: "मानवी चेहरा / व्यक्ती (ई-कचरा नाही)", anomalyDetected: true, hazardWarning_hi: "सत्यापन अस्वीकृत: मानव चेहरा या सेल्फी ई-कबाड़ के रूप में जमा नहीं की जा सकती।", vernacularVoiceSummary_hi: "चेतावनी! यह मानव चेहरा है, ई-कबाड़ नहीं।"

Condition 1.3: FOOD, FRUITS, PET BOTTLES, MUNICIPAL ORGANIC/PLASTIC TRASH:
- General food, fruits, pet bottles, plastic wrap, clothes, organic compost waste.
- If true, return isEWaste: false, detectedObject: "Non-Electronic General Trash", anomalyDetected: true.

=========================================
MANDATORY STEP 2: CPCB STANDARD CATEGORY CLASSIFICATION
=========================================
If and only if the image contains genuine, authentic ELECTRONIC HARDWARE / SCRAP:

You MUST inspect and classify the electronic item into EXACTLY ONE of the approved CPCB standard categories:
1. "pcb" - Printed Circuit Boards, Motherboards, Server PCBs, RAM, Green Boards [FIXED CPCB MANDATED RATE: ₹480/kg]
2. "copper" - Copper Wires, Cables, Motor Windings, Yoke Coils, Stripped or Insulated Copper Conductors [FIXED CPCB MANDATED RATE: ₹720/kg]
3. "battery" - Lithium-ion Pouch Packs, Swollen Phone/Laptop Batteries, Lead-Acid Accumulator Cells [FIXED CPCB MANDATED RATE: ₹310/kg]
4. "crt" - Cathode Ray Tubes, CRT Monitors, Television Heavy Leaded Glass Funnels [FIXED CPCB MANDATED RATE: ₹45/kg]
5. "lcd" - LCD Screens, LED Flat Display Panels, Laptop Monitors [FIXED CPCB MANDATED RATE: ₹180/kg]
6. "magnet" - Neodymium Rare-Earth Magnets, Hard Disk Drive Actuators, Speaker Magnets [FIXED CPCB MANDATED RATE: ₹540/kg]
7. "plastic" - Flame-Retardant E-Plastics, Engineering Grade ABS/PC Enclosures & Computer Casings [FIXED CPCB MANDATED RATE: ₹65/kg]
8. "telecom" - Telecom & Cellular BTS Equipment, 5G RRUs, Fiber SFP Switches, Routers [FIXED CPCB MANDATED RATE: ₹650/kg]
9. "solar" - Solar PV Panels, Junction Boxes, Inverters, PV Module Scrap [FIXED CPCB MANDATED RATE: ₹240/kg]
10. "cooling" - Refrigerant Hermetic Compressors, Heat Pump Cores (ODS/CEEW1) [FIXED CPCB MANDATED RATE: ₹160/kg]
11. "medical" - Medical Electronics, ECG/Ultrasound Telemetry Boards (MDW1) [FIXED CPCB MANDATED RATE: ₹410/kg]
12. "lighting" - Fluorescent Tubes, CFLs, Mercury Discharge Lamps (TLGW) [FIXED CPCB MANDATED RATE: ₹35/kg]
13. "mixed" - Mixed Small Dismantled Electronics, Chargers, Adapters [FIXED CPCB MANDATED RATE: ₹120/kg]

CRITICAL STATUTORY PRICING RULE:
All prices are strictly decided by the CPCB Authority and are non-negotiable statutory floor rates.
You CANNOT change or float the price for any standard category.

=========================================
MANDATORY STEP 3: UNRECOGNIZABLE, BLURRED, OR AMBIGUOUS SCRAP (MANUAL SELECTION)
=========================================
If the item appears to be electronic hardware or e-scrap, but the photo is blurry, ambiguous, or you are UNABLE to definitively identify the exact category with high confidence:
CRITICAL: You are STRICTLY FORBIDDEN from guessing or defaulting to "pcb" or Motherboard!
You MUST return:
{
  "isEWaste": true,
  "unableToDetect": true,
  "category": "manual_select",
  "detectedObject": "Unrecognized E-Waste Item (Manual Category Selection Required)",
  "detectedCategory": "Choose Manually (AI Unable to Detect)",
  "name_en": "Unidentified E-Waste (Please Choose Manually)",
  "name_hi": "पहचान में असमर्थ (श्रेणी स्वयं चुनें)",
  "name_mr": "ओळखण्यात अडचण (श्रेणी स्वतः निवडा)",
  "grade": "Manual Selection Needed",
  "suggestedWeightKg": 5.0,
  "suggestedRatePerKg": 0,
  "estimatedRatePerKg": 0,
  "hazardLevel": "safe",
  "hazardWarning_en": "AI is unable to detect scrap in this photo. Please choose manually from the categories.",
  "hazardWarning_hi": "AI इस फोटो में कबाड़ की पहचान करने में असमर्थ है। कृपया नीचे दी गई सूची से श्रेणी स्वयं चुनें।",
  "hazardWarning_mr": "AI या फोटोतील स्क्रॅपची ओळख पटवू शकले नाही. कृपया खालील पर्यायांमधून श्रेणी स्वतः निवडा.",
  "safeAction_en": "Please choose the appropriate scrap category manually from the list below.",
  "safeAction_hi": "कृपया नीचे दी गई 13 श्रेणियों में से सही श्रेणी का चयन करें।",
  "safeAction_mr": "कृपया खालील पर्यायांमधून श्रेणी स्वतः निवडा.",
  "vernacularVoiceSummary_hi": "एआई इस कबाड़ की पहचान नहीं कर पाया। कृपया नीचे दी गई सूची से श्रेणी स्वयं चुनें।",
  "vernacularVoiceSummary_mr": "AI या स्क्रॅपची ओळख पटवू शकले नाही. कृपया खालील पर्यायांमधून श्रेणी स्वतः निवडा.",
  "vernacularVoiceSummary_en": "AI is unable to detect scrap in this photo. Please choose the category manually from the list below."
}

=========================================
MANDATORY STEP 4: OUT-OF-CATEGORY (NEW / UNCLASSIFIED E-WASTE) HANDLING
=========================================
If the item is GENUINE electronic scrap, but does NOT fit into any of the 13 standard categories above:
You MUST set:
- "isEWaste": true
- "isOutOfCategory": true
- "category": "out_of_category"
- "detectedCategory": <Exact Specific Descriptive Name, e.g. "Specialized Industrial Solar Inverter Core">
- "suggestedRatePerKg": 0
- "estimatedRatePerKg": 0
- "marketRateRange": { "min": 0, "max": 0 }

Output MUST be 100% valid JSON matching this schema:
{
  "isEWaste": boolean,
  "isOutOfCategory": boolean,
  "unableToDetect": boolean,
  "category": "pcb" | "copper" | "battery" | "crt" | "lcd" | "magnet" | "plastic" | "telecom" | "solar" | "cooling" | "medical" | "lighting" | "mixed" | "out_of_category" | "manual_select" | "non_ewaste",
  "detectedObject": string,
  "detectedCategory": string,
  "name_en": string,
  "name_hi": string,
  "name_mr": string,
  "grade": string,
  "suggestedWeightKg": number,
  "suggestedRatePerKg": number,
  "estimatedRatePerKg": number,
  "hazardLevel": "safe" | "medium" | "high",
  "hazardWarning_en": string,
  "hazardWarning_hi": string,
  "hazardWarning_mr": string,
  "safeAction_en": string,
  "safeAction_hi": string,
  "safeAction_mr": string,
  "crmYield": {
    "copperPct": number,
    "lithiumPct": number,
    "cobaltPct": number,
    "neodymiumPct": number,
    "goldGramsPerTon": number
  },
  "detectedComponents": string[],
  "anomalyDetected": boolean,
  "anomalyReason": string,
  "confidenceScore": number,
  "recommendedRecycler": string,
  "vernacularVoiceSummary_en": string,
  "vernacularVoiceSummary_hi": string,
  "vernacularVoiceSummary_mr": string
}

Output raw JSON only. Do NOT wrap in markdown \`\`\`json blocks.`;

      const imagePart = {
        inlineData: {
          mimeType: detectedMime,
          data: base64Data,
        },
      };

      try {
        let response;
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          });
        } catch (firstErr) {
          console.warn("Retrying with gemini-flash-latest:", firstErr);
          response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          });
        }

        const responseText = response.text?.trim() || "{}";
        const parsed = JSON.parse(responseText);
        const isEw = parsed.isEWaste !== false;
        const isOut = Boolean(parsed.isOutOfCategory) || parsed.category === "out_of_category";
        const isManualSelect = Boolean(parsed.unableToDetect) || parsed.category === "manual_select";

        const standardCategories = [
          "pcb", "copper", "battery", "crt", "lcd", "magnet", "plastic",
          "telecom", "solar", "cooling", "medical", "lighting", "mixed"
        ];
        let assignedCategory = parsed.category || (isEw ? "manual_select" : "non_ewaste");
        let isOutOfCategory = isOut;

        if (isManualSelect) {
          assignedCategory = "manual_select";
        } else if (isEw && !standardCategories.includes(assignedCategory)) {
          isOutOfCategory = true;
          assignedCategory = "out_of_category";
        }

        const CPCB_STATUTORY_RATES: Record<string, { baseRate: number; name_en: string; name_hi: string; name_mr: string; grade: string }> = {
          pcb: { baseRate: 480, name_en: "High-Grade Server & Telecom Motherboard", name_hi: "हाई-ग्रेड सर्वर / मदरबोर्ड पीसीबी", name_mr: "हाय-ग्रेड सर्व्हर व मदरबोर्ड पीसीबी", grade: "Grade-A (Gold Contacts)" },
          copper: { baseRate: 720, name_en: "Unburnt High-Conductivity Copper Wire", name_hi: "बिना जला तांबे का तार (शुद्ध कॉपर)", name_mr: "न जाळलेली तांब्याची वायर (शुद्ध कॉपर)", grade: "Berry/Barley (99% Cu)" },
          battery: { baseRate: 310, name_en: "Swollen Li-ion Phone & Laptop Battery", name_hi: "फूली हुई लिथियम-आयन बैटरी पैक", name_mr: "फुगलेली लिथियम-आयन बॅटरी पॅक", grade: "Hazardous (NMC / LCO)" },
          crt: { baseRate: 45, name_en: "CRT Displays & Leaded Glass Tubes", name_hi: "सीआरटी डिस्प्ले और पिक्चर ट्यूब ग्लास", name_mr: "सीआरटी डिस्प्ले व पिक्चर ट्यूब ग्लास", grade: "Hazardous (Lead-Silicate)" },
          lcd: { baseRate: 180, name_en: "LCD / LED Display Modules", name_hi: "एलसीडी / एलईडी डिस्प्ले पैनल", name_mr: "एलसीडी / एलईडी डिस्प्ले पॅनेल", grade: "Flat Display Grade" },
          magnet: { baseRate: 540, name_en: "Neodymium Rare-Earth Hard Drive Motors", name_hi: "नियोडिमियम चुंबक और हार्ड ड्राइव असेंबली", name_mr: "निओडिमियम चुंबक व हार्ड ड्राइव्ह असेंब्ली", grade: "Grade NdFeB (Rare Earth)" },
          plastic: { baseRate: 65, name_en: "Flame-Retardant E-Plastics (ABS-FR)", name_hi: "फ्लेम-रिटार्डेंट ई-प्लास्टिक स्क्रैप (ABS-FR)", name_mr: "फ्लेम-रिटार्डंट ई-प्लास्टिक स्क्रॅप (ABS-FR)", grade: "Clean Granulation Base" },
          telecom: { baseRate: 650, name_en: "Telecom & Network Hardware (ITEW1)", name_hi: "दूरसंचार व 5G नेटवर्क गियर (ITEW1)", name_mr: "दूरसंचार व 5G नेटवर्क गियर (ITEW1)", grade: "Carrier-Grade Gold/Silver" },
          solar: { baseRate: 240, name_en: "Solar PV Panels & Inverter Modules", name_hi: "सोलर पैनल व इन्वर्टर मॉड्यूल", name_mr: "सोलर पॅनेल व इन्व्हर्टर मॉड्यूल", grade: "Industrial PV Grade" },
          cooling: { baseRate: 160, name_en: "Cooling & Compressor Units (CEEW1)", name_hi: "रेफ्रिजरेटर व एसी कंप्रेसर (CEEW1)", name_mr: "रेफ्रिजरेटर व एसी कॉम्प्रेसर (CEEW1)", grade: "Heavy Ferrous/Cu Core" },
          medical: { baseRate: 410, name_en: "Medical & Diagnostic Electronics", name_hi: "चिकित्सा व डायग्नोस्टिक उपकरण", name_mr: "वैद्यकीय व डायग्नोस्टिक उपकरणे", grade: "High Precision Sensor Grade" },
          lighting: { baseRate: 35, name_en: "Fluorescent & Discharge Lamps", name_hi: "फ्लोरोसेंट ट्यूब व डिस्चार्ज लैंप", name_mr: "फ्लोरोसेंट ट्यूब व डिस्चार्ज दिवे", grade: "Hazardous Mercury Glass" },
          mixed: { baseRate: 120, name_en: "Dismantled Small Appliances / Mix", name_hi: "मिश्रित छोटे इलेक्ट्रॉनिक उपकरण", name_mr: "मिश्रित लहान उपकरणे", grade: "Secondary Dismantled Lot" },
        };

        // Strictly lock statutory rate decided by CPCB authorities
        const finalStatutoryRate = (isOutOfCategory || isManualSelect)
          ? 0
          : (isEw && assignedCategory in CPCB_STATUTORY_RATES
              ? CPCB_STATUTORY_RATES[assignedCategory].baseRate
              : 0);

        const matchedMeta = !isOutOfCategory && !isManualSelect && assignedCategory in CPCB_STATUTORY_RATES ? CPCB_STATUTORY_RATES[assignedCategory] : null;

        const normalizedData = {
          isEWaste: isEw,
          unableToDetect: isManualSelect,
          isOutOfCategory: isOutOfCategory,
          detectedObject: isManualSelect
            ? (language === "hi" ? "कबाड़ पहचान में असमर्थ (श्रेणी स्वयं चुनें)" : language === "mr" ? "स्क्रॅप ओळखण्यात अडचण (श्रेणी स्वतः निवडा)" : "Unable to Detect Scrap (Choose Manually)")
            : parsed.detectedObject,
          category: isManualSelect ? "manual_select" : assignedCategory,
          detectedCategory: isManualSelect
            ? (language === "hi" ? "पहचान में असमर्थ — कृपया स्वयं श्रेणी चुनें" : language === "mr" ? "ओळखण्यात अडचण — कृपया स्वतः श्रेणी निवडा" : "Unable to Detect — Choose Manually")
            : isEw 
              ? (matchedMeta ? (language === "hi" ? matchedMeta.name_hi : language === "mr" ? matchedMeta.name_mr : matchedMeta.name_en) : (language === "hi" ? parsed.name_hi : language === "mr" ? parsed.name_mr : parsed.name_en) || parsed.name_en || (isOutOfCategory ? "Unclassified E-Waste" : "Electronic Scrap"))
              : (language === "hi" ? parsed.name_hi : language === "mr" ? parsed.name_mr : parsed.name_en) || "Not E-Waste",
          name_en: isManualSelect ? "Unidentified E-Waste (Please Choose Manually)" : (matchedMeta?.name_en || parsed.name_en || (isEw ? (isOutOfCategory ? "Unclassified E-Waste Lot" : "Electronic Scrap") : "Not Electronic Waste")),
          name_hi: isManualSelect ? "पहचान में असमर्थ (कृपया श्रेणी स्वयं चुनें)" : (matchedMeta?.name_hi || parsed.name_hi || (isEw ? (isOutOfCategory ? "अवर्गीकृत ई-कबाड़ (प्राधिकरण स्वीकृति लंबित)" : "इलेक्ट्रॉनिक स्क्रैप") : "यह ई-कबाड़ नहीं है")),
          name_mr: isManualSelect ? "ओळखण्यात अडचण (कृपया श्रेणी स्वतः निवडा)" : (matchedMeta?.name_mr || parsed.name_mr || (isEw ? (isOutOfCategory ? "अवर्गीकृत ई-कचरा (प्राधिकरण मंजुरी प्रलंबित)" : "इलेक्ट्रॉनिक स्क्रॅप") : "हे ई-कचरा नाही")),
          grade: isManualSelect ? "Manual Selection Required" : (matchedMeta?.grade || parsed.grade || (isEw ? (isOutOfCategory ? "Under CPCB Authority Review" : "Standard Grade") : "Invalid Material")),
          suggestedWeightKg: isManualSelect ? 5.0 : (isEw ? (parsed.suggestedWeightKg ?? 2.5) : 0),
          weightRange: isManualSelect ? { min: 1.0, max: 10.0 } : (parsed.weightRange || (isEw ? { min: 1.0, max: 5.0 } : { min: 0, max: 0 })),
          suggestedRatePerKg: finalStatutoryRate,
          estimatedRatePerKg: finalStatutoryRate,
          marketRateRange: { min: finalStatutoryRate, max: finalStatutoryRate },
          priceNotice: isManualSelect 
            ? (language === "hi" ? "कृपया नीचे दी गई सूची से श्रेणी चुनें, सरकारी दर लागू होगी" : "Please choose category below to apply CPCB rate")
            : isOutOfCategory 
            ? "Price will be decided later by CPCB Authority" 
            : "Fixed CPCB Statutory Authority Rate",
          hazardLevel: parsed.hazardLevel || (isEw ? "safe" : "high"),
          hazardWarning: isManualSelect
            ? (language === "hi" ? "AI इस फोटो में कबाड़ की पहचान करने में असमर्थ है। कृपया नीचे दी गई सूची से श्रेणी स्वयं चुनें।" : language === "mr" ? "AI या फोटोतील स्क्रॅपची ओळख पटवू शकले नाही. कृपया खालील पर्यायांमधून श्रेणी स्वतः निवडा." : "AI is unable to detect scrap in this photo. Please choose manually from the categories.")
            : (parsed[`hazardWarning_${language}`] || parsed.hazardWarning_en || parsed.hazardWarning_hi || ""),
          hazardWarning_en: isManualSelect ? "AI is unable to detect scrap in this photo. Please choose manually from the categories." : (parsed.hazardWarning_en || ""),
          hazardWarning_hi: isManualSelect ? "AI इस फोटो में कबाड़ की पहचान करने में असमर्थ है। कृपया नीचे दी गई सूची से श्रेणी स्वयं चुनें।" : (parsed.hazardWarning_hi || ""),
          hazardWarning_mr: isManualSelect ? "AI या फोटोतील स्क्रॅपची ओळख पटवू शकले नाही. कृपया खालील पर्यायांमधून श्रेणी स्वतः निवडा." : (parsed.hazardWarning_mr || ""),
          safeAction: isManualSelect
            ? (language === "hi" ? "कृपया नीचे दी गई 13 श्रेणियों में से सही श्रेणी का चयन करें।" : language === "mr" ? "कृपया खालील पर्यायांमधून श्रेणी स्वतः निवडा." : "Please choose the appropriate scrap category manually from the list below.")
            : (parsed[`safeAction_${language}`] || parsed.safeAction_en || parsed.safeAction_hi || ""),
          safeAction_en: isManualSelect ? "Please choose the appropriate scrap category manually from the list below." : (parsed.safeAction_en || ""),
          safeAction_hi: isManualSelect ? "कृपया नीचे दी गई 13 श्रेणियों में से सही श्रेणी का चयन करें।" : (parsed.safeAction_hi || ""),
          safeAction_mr: isManualSelect ? "कृपया खालील पर्यायांमधून श्रेणी स्वतः निवडा." : (parsed.safeAction_mr || ""),
          crmYield: parsed.crmYield || { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
          criticalMaterials: parsed.detectedComponents || [],
          detectedComponents: parsed.detectedComponents || [],
          anomalyDetected: Boolean(parsed.anomalyDetected),
          anomalyReason: parsed.anomalyReason || "",
          confidenceScore: isManualSelect ? 40.0 : (parsed.confidenceScore || 96.0),
          recommendedRecycler: isManualSelect ? "Select Category" : (parsed.recommendedRecycler || (isEw ? "EcoMetals CPCB Unit #4" : "N/A")),
          vernacularVoiceSummary: isManualSelect
            ? (language === "hi" ? "एआई इस कबाड़ की पहचान नहीं कर पाया। कृपया नीचे दी गई सूची से श्रेणी स्वयं चुनें।" : language === "mr" ? "AI या स्क्रॅपची ओळख पटवू शकले नाही. कृपया खालील पर्यायांमधून श्रेणी स्वतः निवडा." : "AI is unable to detect scrap in this photo. Please choose the category manually from the list below.")
            : isOutOfCategory
            ? (language === "hi" ? "यह ई-कबाड़ 13 मानक श्रेणियों में नहीं है। भाव CPCB प्राधिकरण द्वारा बाद में तय किया जाएगा।" : language === "mr" ? "हे ई-कचरा मानक प्रकारात नाही. CPCB प्राधिकरणाकडून नंतर दर ठरवला जाईल." : "Item is out of standard CPCB categories. Price will be decided later by CPCB Authority.")
            : (parsed[`vernacularVoiceSummary_${language}`] || parsed.vernacularVoiceSummary_hi || parsed.vernacularVoiceSummary_en || ""),
          vernacularVoiceSummary_en: parsed.vernacularVoiceSummary_en || "",
          vernacularVoiceSummary_hi: parsed.vernacularVoiceSummary_hi || "",
          vernacularVoiceSummary_mr: parsed.vernacularVoiceSummary_mr || "",
        };

        return res.json({
          success: true,
          source: "gemini-flash",
          data: normalizedData,
        });
      } catch (geminiErr: any) {
        console.warn("Gemini vision API error, falling back safely:", geminiErr?.message);
      }
    }

    // Fallback: Intelligent rule-based engine when API key is pending or network is offline
    const fallbackResults = getIntelligentFallbackClassification(notes || "", Boolean(isHumanHint), Boolean(isBlackOrBlankHint));
    return res.json({
      success: true,
      source: "edge-model-rule-fallback",
      data: fallbackResults,
    });
  } catch (error: any) {
    console.error("AI Material Classification error:", error);
    return res.status(500).json({
      error: "Failed to classify material",
      details: error?.message || "Internal error",
      fallback: getIntelligentFallbackClassification("", Boolean(req.body?.isHumanHint), Boolean(req.body?.isBlackOrBlankHint)),
    });
  }
});

// 2. AI Mandi Price & Market Trends Insights Endpoint
app.post("/api/ai/price-insights", async (req, res) => {
  try {
    const { materialName, currentRate, location = "Pune", language = "hi" } = req.body;

    if (ai) {
      const prompt = `You are a scrap metal & e-waste commodity analyst for Indian Mandis under CPCB Extended Producer Responsibility (EPR) regulations.
The user is inquiring about current prices for "${materialName}" currently trading at ₹${currentRate}/kg in ${location}.

Explain in simple, vernacular-friendly terms (2-3 sentences max) why this price is prevailing, referencing factors like LME (London Metal Exchange) copper/tin rates, lithium/cobalt battery recycling demand, CPCB quarterly EPR recycling credit deadlines, or festive collection volume.
Provide explanations in Hindi, Marathi, and English, along with a 7-day forecast prediction ("up", "down", or "stable") and expected change percentage.

Respond in JSON format:
{
  "summary_hi": string,
  "summary_mr": string,
  "summary_en": string,
  "trendForecast": "up" | "down" | "stable",
  "expectedChangePct": number,
  "keyDriver": string,
  "recommendedAction_hi": string,
  "recommendedAction_mr": string,
  "recommendedAction_en": string
}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        const parsed = JSON.parse(response.text?.trim() || "{}");
        return res.json({ success: true, data: parsed });
      } catch (priceGeminiErr: any) {
        console.warn("Gemini price insights error, using fallback market trend:", priceGeminiErr?.message);
      }
    }

    // Fallback market insight
    return res.json({
      success: true,
      data: {
        summary_hi: `लंदन मेटल एक्सचेंज (LME) में तांबे और कीमती धातुओं की मांग बढ़ने से भाव मजबूत है। सीपीसीबी ईपीआर कोटा अंतिम तारीख नजदीक होने से अधिकृत रिसाइक्लर ज्यादा भाव दे रहे हैं।`,
        summary_mr: `जागतिक बाजारात तांबे व मौल्यवान धातूंची मागणी वाढल्याने भाव तेजीत आहे. CPCB नियमांमुळे अधिकृत रिसायकलर चांगला दर देत आहेत.`,
        summary_en: `Strong demand driven by LME metal rallies and upcoming CPCB Extended Producer Responsibility compliance deadlines.`,
        trendForecast: "up",
        expectedChangePct: 2.8,
        keyDriver: "CPCB Q3 EPR Target Audits & Global Copper Surge",
        recommendedAction_hi: "बिना जलाए सीधे अधिकृत रिसाइक्लर को बेचें और पूरा वजन प्राप्त करें।",
        recommendedAction_mr: "वायर न जाळता थेट अधिकृत रिसायकलरला द्या आणि पूर्ण भाव मिळवा.",
        recommendedAction_en: "Hand over directly to authorized units without open burning to preserve weight.",
      },
    });
  } catch (error: any) {
    console.error("AI Price Insights error:", error);
    return res.status(500).json({ error: "Failed to generate price insights" });
  }
});

// 3. AI Transaction Anomaly & Fraud Detection Endpoint
app.post("/api/ai/anomaly-check", async (req, res) => {
  try {
    const { category, weightKg, ratePerKg, mandiRate, photoDescription } = req.body;

    const rateDiffPct = Math.round(((ratePerKg - mandiRate) / mandiRate) * 100);
    const isRateSuspicious = rateDiffPct > 35;
    const isBurnDamageSuspected = photoDescription && /soot|burnt|black|charred|smoky/i.test(photoDescription);
    const isWeightExcessive = category === "pcb" && weightKg > 80;

    let isAnomaly = isRateSuspicious || isBurnDamageSuspected || isWeightExcessive;
    let reason = "";

    if (isRateSuspicious) {
      reason = `Rate (₹${ratePerKg}/kg) is ${rateDiffPct}% above daily CPCB mandi ceiling (₹${mandiRate}/kg). Potential price collusion or incorrect grade declaration.`;
    } else if (isBurnDamageSuspected) {
      reason = `Soot and blackening detected. Material may have undergone illegal open-air burning, violating E-Waste Rules 2022.`;
    } else if (isWeightExcessive) {
      reason = `Unusually high single-lot weight (${weightKg} kg) for server PCBs without aggregator provenance documentation.`;
    }

    return res.json({
      success: true,
      anomalyFlag: isAnomaly,
      riskLevel: isAnomaly ? (rateDiffPct > 50 || isBurnDamageSuspected ? "HIGH" : "MEDIUM") : "LOW",
      reason: reason || "Normal transaction parameters within standard variance.",
      recommendation: isAnomaly
        ? "Physical weighbridge inspection & material visual test required before disbursing payout."
        : "Standard automated payout clearance authorized.",
    });
  } catch (error: any) {
    console.error("Anomaly check error:", error);
    return res.status(500).json({ error: "Anomaly check failed" });
  }
});

// Helper for intelligent rule-based classification fallback
function getIntelligentFallbackClassification(notes: string = "", isHumanHint: boolean = false, isBlackOrBlankHint: boolean = false) {
  const lower = notes.toLowerCase();

  // 0. Strict Black / Blank / Solid Color / Obscured Photo Rejection
  if (
    isBlackOrBlankHint ||
    lower.includes("black") ||
    lower.includes("dark") ||
    lower.includes("blank") ||
    lower.includes("solid") ||
    lower.includes("obscured") ||
    lower.includes("काला") ||
    lower.includes("अंधेरा") ||
    lower.includes("खाली") ||
    lower.includes("काळा") ||
    lower.includes("काळा फोटो")
  ) {
    return {
      isEWaste: false,
      isHumanDetected: false,
      detectedObject: "Black / Dark / Solid Color / Obscured Photo",
      category: "non_ewaste",
      detectedCategory: "Non E-Waste (Dark / Blank Photo)",
      name_en: "Obscured / Dark / Blank Frame (Not E-Waste)",
      name_hi: "काला / अस्पष्ट / खाली फोटो (ई-कबाड़ नहीं है)",
      name_mr: "काळा / अस्पष्ट / रिकामा फोटो (ई-कचरा नाही)",
      grade: "Rejected - Invalid Capture",
      suggestedWeightKg: 0,
      weightRange: { min: 0, max: 0 },
      suggestedRatePerKg: 0,
      estimatedRatePerKg: 0,
      marketRateRange: { min: 0, max: 0 },
      hazardLevel: "high",
      hazardWarning: "सत्यापन अस्वीकृत: फोटो बहुत अंधेरा, काला या बिना इलेक्ट्रॉनिक वस्तु का है। कृपया रोशनी में असली इलेक्ट्रॉनिक कचरे का साफ फोटो खींचें।",
      hazardWarning_en: "Verification Blocked: Photo is pitch dark, blank, solid color, or camera lens is obscured.",
      hazardWarning_hi: "सत्यापन अस्वीकृत: फोटो बहुत अंधेरा, काला या बिना इलेक्ट्रॉनिक वस्तु का है। कृपया रोशनी में असली इलेक्ट्रॉनिक कचरे का साफ फोटो खींचें।",
      hazardWarning_mr: "सत्यापन नाकारले: फोटो खूप काळा किंवा अस्पष्ट आहे. कृपया प्रकाशात खऱ्या ई-कचऱ्याचा फोटो काढा.",
      safeAction: "कृपया लाइट चालू करें या अच्छी रोशनी में इलेक्ट्रॉनिक सामान का साफ फोटो लें।",
      safeAction_en: "Turn on flashlight or move to well-lit area and capture clear electronic hardware.",
      safeAction_hi: "कृपया लाइट चालू करें या अच्छी रोशनी में इलेक्ट्रॉनिक सामान का साफ फोटो लें।",
      safeAction_mr: "कृपया चांगल्या प्रकाशात इलेक्ट्रॉनिक वस्तूंचा स्पष्ट फोटो काढा.",
      crmYield: { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: [],
      detectedComponents: [],
      anomalyDetected: true,
      anomalyReason: "Dark, solid-color, blank or obscured frame detected with zero electronic scrap features.",
      confidenceScore: 99.9,
      recommendedRecycler: "N/A - Blocked",
      vernacularVoiceSummary_hi: "चेतावनी! फोटो बहुत अंधेरा या काला है। कृपया अच्छी रोशनी में असली ई-कचरे का साफ फोटो खींचें।",
      vernacularVoiceSummary_mr: "सावधान! फोटो खूप काळा किंवा अस्पष्ट आहे. कृपया चांगल्या प्रकाशात ई-कचऱ्याचा फोटो काढा.",
      vernacularVoiceSummary_en: "Warning: Obscured or dark photo. Please scan genuine electronic scrap in good lighting.",
    };
  }

  // 1. Strict Human / Face / Selfie / Person Rejection
  if (
    isHumanHint ||
    lower.includes("human") ||
    lower.includes("person") ||
    lower.includes("face") ||
    lower.includes("selfie") ||
    lower.includes("man") ||
    lower.includes("woman") ||
    lower.includes("girl") ||
    lower.includes("boy") ||
    lower.includes("portrait") ||
    lower.includes("चेहरा") ||
    lower.includes("मानव") ||
    lower.includes("इंसान") ||
    lower.includes("माणूस")
  ) {
    return {
      isEWaste: false,
      isHumanDetected: true,
      detectedObject: "Human Face / Portrait / Selfie",
      category: "non_ewaste",
      detectedCategory: "Non E-Waste (Human Face / Person)",
      name_en: "Human Face / Person (Non-EWaste)",
      name_hi: "मानव / व्यक्ति की फोटो (ई-कबाड़ नहीं है)",
      name_mr: "मानव / व्यक्तीचा फोटो (ई-कचरा नाही)",
      grade: "Rejected - Non Electronic",
      suggestedWeightKg: 0,
      weightRange: { min: 0, max: 0 },
      suggestedRatePerKg: 0,
      estimatedRatePerKg: 0,
      marketRateRange: { min: 0, max: 0 },
      hazardLevel: "high",
      hazardWarning: "सत्यापन अस्वीकृत: मानव चेहरा या सेल्फी ई-कबाड़ के रूप में जमा नहीं की जा सकती।",
      hazardWarning_en: "Verification Rejected: Human faces, portraits, or selfies cannot be registered as electronic scrap.",
      hazardWarning_hi: "सत्यापन अस्वीकृत: मानव चेहरा या सेल्फी ई-कबाड़ के रूप में जमा नहीं की जा सकती।",
      hazardWarning_mr: "सत्यापन नाकारले: मानवी चेहरा किंवा सेल्फी ई-कचरा म्हणून नोंदवता येत नाही.",
      safeAction: "कृपया केवल वास्तविक इलेक्ट्रॉनिक हार्डवेयर (सर्किट बोर्ड, तार, बैटरी आदि) का फोटो खींचें।",
      safeAction_en: "Please point camera exclusively at real electronic hardware (circuit boards, cables, batteries, motors).",
      safeAction_hi: "कृपया केवल वास्तविक इलेक्ट्रॉनिक हार्डवेयर (सर्किट बोर्ड, तार, बैटरी आदि) का फोटो खींचें।",
      safeAction_mr: "कृपया केवळ प्रत्यक्ष इलेक्ट्रॉनिक उपकरणांचा फोटो काढा.",
      crmYield: { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: [],
      detectedComponents: [],
      anomalyDetected: true,
      anomalyReason: "AI Computer Vision detected a human person/face instead of electronic scrap. Submission blocked.",
      confidenceScore: 99.8,
      recommendedRecycler: "N/A - Blocked",
      vernacularVoiceSummary_hi: "यह ई-कबाड़ नहीं है, मानव चेहरा पहचाना गया है। कृपया वास्तविक ई-वेस्ट का फोटो खींचें।",
      vernacularVoiceSummary_mr: "हे ई-कचरा नाही. मानवी चेहरा ओळखला गेला आहे. कृपया खऱ्या ई-कचऱ्याचा फोटो काढा.",
      vernacularVoiceSummary_en: "Rejected: Human face detected. Please capture genuine electronic hardware.",
    };
  }

  // 2. Strict Food / Fruit / Organic Trash Rejection
  if (
    lower.includes("food") ||
    lower.includes("fruit") ||
    lower.includes("banana") ||
    lower.includes("apple") ||
    lower.includes("vegetable") ||
    lower.includes("खाना") ||
    lower.includes("फल") ||
    lower.includes("अन्न")
  ) {
    return {
      isEWaste: false,
      isHumanDetected: false,
      detectedObject: "Organic Food / Fruit / Non-Scrap",
      category: "non_ewaste",
      detectedCategory: "Non E-Waste (Organic Food / Fruit)",
      name_en: "Organic Food / Fruit (Non-EWaste)",
      name_hi: "जैविक भोजन / फल (ई-कबाड़ नहीं है)",
      name_mr: "अन्न / फळ (ई-कचरा नाही)",
      grade: "Rejected - Organic Trash",
      suggestedWeightKg: 0,
      weightRange: { min: 0, max: 0 },
      suggestedRatePerKg: 0,
      estimatedRatePerKg: 0,
      marketRateRange: { min: 0, max: 0 },
      hazardLevel: "high",
      hazardWarning: "सत्यापन अस्वीकृत: भोजन या जैविक कचरा ई-कबाड़ सेतु पर स्वीकार्य नहीं है।",
      hazardWarning_en: "Verification Rejected: Organic food or fruits are municipal compost waste, not electronic scrap.",
      hazardWarning_hi: "सत्यापन अस्वीकृत: भोजन या जैविक कचरा ई-कबाड़ सेतु पर स्वीकार्य नहीं है।",
      hazardWarning_mr: "सत्यापन नाकारले: अन्न किंवा फळे ई-कचऱ्यात येत नाहीत.",
      safeAction: "कृपया सूखे इलेक्ट्रॉनिक उपकरणों का फोटो लें।",
      safeAction_en: "Please capture valid dry electronic hardware.",
      safeAction_hi: "कृपया सूखे इलेक्ट्रॉनिक उपकरणों का फोटो लें।",
      safeAction_mr: "कृपया कोरड्या इलेक्ट्रॉनिक उपकरणांचा फोटो घ्या.",
      crmYield: { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: [],
      detectedComponents: [],
      anomalyDetected: true,
      anomalyReason: "Organic food/fruit item detected instead of electronic hardware. Lot creation blocked.",
      confidenceScore: 99.5,
      recommendedRecycler: "N/A - Blocked",
      vernacularVoiceSummary_hi: "यह ई-कबाड़ नहीं है, भोजन या फल पहचाना गया है। कृपया वास्तविक ई-वेस्ट का फोटो खींचें।",
      vernacularVoiceSummary_mr: "हे ई-कचरा नाही, अन्न किंवा फळ आहे. कृपया खऱ्या ई-कचऱ्याचा फोटो काढा.",
      vernacularVoiceSummary_en: "Rejected: Food or organic matter detected. Please scan real electronic items.",
    };
  }

  // 3. Strict Plastic Bottle / General Garbage Rejection
  if (
    lower.includes("bottle") ||
    lower.includes("plastic bottle") ||
    lower.includes("garbage") ||
    lower.includes("trash") ||
    lower.includes("कचरा") ||
    lower.includes("बोतल")
  ) {
    return {
      isEWaste: false,
      isHumanDetected: false,
      detectedObject: "Plastic Bottle / General Municipal Solid Waste",
      category: "non_ewaste",
      detectedCategory: "Non E-Waste (General Municipal Garbage)",
      name_en: "Plastic Bottle / General Municipal Waste",
      name_hi: "प्लास्टिक बोतल / सामान्य ठोस कचरा (ई-कबाड़ नहीं)",
      name_mr: "प्लॅस्टिक बाटली / सामान्य कचरा (ई-कचरा नाही)",
      grade: "Rejected - Municipal Trash",
      suggestedWeightKg: 0,
      weightRange: { min: 0, max: 0 },
      suggestedRatePerKg: 0,
      estimatedRatePerKg: 0,
      marketRateRange: { min: 0, max: 0 },
      hazardLevel: "high",
      hazardWarning: "सत्यापन अस्वीकृत: सामान्य प्लास्टिक बोतलें ई-कबाड़ नहीं हैं। यह नगर निगम प्लास्टिक रीसाइक्लिंग के लिए है।",
      hazardWarning_en: "Verification Rejected: PET bottles and general municipal solid waste are not electronic scrap.",
      hazardWarning_hi: "सत्यापन अस्वीकृत: सामान्य प्लास्टिक बोतलें ई-कबाड़ नहीं हैं।",
      hazardWarning_mr: "सत्यापन नाकारले: सामान्य कचरा किंवा बाटल्या ई-कचरा नाहीत.",
      safeAction: "केवल इलेक्ट्रॉनिक गैजेट्स, केबल्स या बोर्ड्स का फोटो खींचें।",
      safeAction_en: "Please only capture electronic components, cables, or circuit boards.",
      safeAction_hi: "केवल इलेक्ट्रॉनिक गैजेट्स, केबल्स या बोर्ड्स का फोटो खींचें।",
      safeAction_mr: "केवळ इलेक्ट्रॉनिक भाग किंवा बोर्ड्सचा फोटो काढा.",
      crmYield: { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: [],
      detectedComponents: [],
      anomalyDetected: true,
      anomalyReason: "General municipal plastic waste detected. Electronic scrap validation failed.",
      confidenceScore: 99.4,
      recommendedRecycler: "N/A - Blocked",
      vernacularVoiceSummary_hi: "यह ई-कबाड़ नहीं है, सामान्य प्लास्टिक या बोतल पहचानी गई है।",
      vernacularVoiceSummary_mr: "हे ई-कचरा नाही, सामान्य प्लास्टिक किंवा बाटली आहे.",
      vernacularVoiceSummary_en: "Rejected: General municipal waste detected.",
    };
  }

  // 4. Lithium Battery Pack
  if (lower.includes("bat") || lower.includes("cell") || lower.includes("swollen") || lower.includes("लिथियम") || lower.includes("बॅटरी")) {
    return {
      isEWaste: true,
      category: "battery",
      detectedCategory: "Swollen Li-ion Phone & Laptop Battery",
      name_en: "Swollen Li-ion Phone & Laptop Battery",
      name_hi: "फूली हुई लिथियम-आयन बैटरी पैक",
      name_mr: "फुगलेली लिथियम-आयन बॅटरी पॅक",
      grade: "Hazardous (NMC / LCO)",
      suggestedWeightKg: 2.8,
      weightRange: { min: 1.5, max: 4.5 },
      suggestedRatePerKg: 310,
      estimatedRatePerKg: 310,
      marketRateRange: { min: 295, max: 325 },
      hazardLevel: "high",
      hazardWarning_en: "DANGER: Swollen battery pouch can undergo sudden thermal runaway fire (>800°C).",
      hazardWarning_hi: "चेतावनी: फूली बैटरी को न खोलें या पंचर न करें। हवा लगते ही भीषण आग लग सकती है!",
      hazardWarning_mr: "सावधान: फुगलेली बॅटरी उघडू नका किंवा छिद्र पाडू नका. स्फोटक आग लागू शकते!",
      safeAction_en: "Tape terminals with electrical tape and isolate in fire-retardant vermiculite pouch.",
      safeAction_hi: "टर्मिनल्स पर टेप लगाएं और वर्मीक्यूलाइट सेफ्टी बैग में रखें।",
      safeAction_mr: "टर्मिनलवर टेप लावा आणि व्हर्मिक्युलाईट सुरक्षेच्या पिशवीत ठेवा.",
      crmYield: { copperPct: 8.5, lithiumPct: 4.8, cobaltPct: 14.2, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: ["Lithium Cobalt Oxide Pouch", "Positive Al collector", "Negative Cu foil"],
      detectedComponents: ["Lithium Cobalt Oxide Pouch", "Positive Al collector", "Negative Cu foil"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 97.4,
      recommendedRecycler: "EcoMetals CPCB Battery Unit #2",
      vernacularVoiceSummary_hi: "फूली हुई लिथियम बैटरी पहचानी गई। भाव 310 रुपये किलो है। इसे सेफ्टी पाउच में रखें!",
      vernacularVoiceSummary_mr: "फुगलेली लिथियम बॅटरी ओळखली. दर 310 रुपये किलो आहे. सुरक्षेच्या पिशवीत ठेवा!",
      vernacularVoiceSummary_en: "Identified swollen Lithium-ion battery. Fair rate is 310 rupees per kg. Use safety pouch.",
    };
  }

  // 5. Copper Wire & Cable
  if (lower.includes("wire") || lower.includes("cable") || lower.includes("तांबा") || lower.includes("तार")) {
    return {
      isEWaste: true,
      category: "copper",
      detectedCategory: "Unburnt High-Conductivity Copper Wire",
      name_en: "Unburnt High-Conductivity Copper Wire",
      name_hi: "बिना जला तांबे का तार (शुद्ध कॉपर)",
      name_mr: "न जाळलेली तांब्याची वायर (शुद्ध कॉपर)",
      grade: "Berry/Barley (99% Pure Cu)",
      suggestedWeightKg: 8.5,
      weightRange: { min: 5.0, max: 15.0 },
      suggestedRatePerKg: 720,
      estimatedRatePerKg: 720,
      marketRateRange: { min: 720, max: 720 },
      hazardLevel: "safe",
      hazardWarning_en: "Never burn wire insulation in open fire. Releases carcinogenic dioxins and reduces weight.",
      hazardWarning_hi: "तार को आग में न जलाएं। इससे जहरीला धुआं निकलता है और तांबे का वजन जलकर कम होता है।",
      hazardWarning_mr: "वायर आगीत जाळू नका. यातून विषारी धूर निघतो आणि तांब्याचे वजन घटते.",
      safeAction_en: "Use mechanical wire stripper. Hand over shiny unburnt copper for highest price.",
      safeAction_hi: "मैकेनिकल कटर या ब्लेड से छीलें। बिना जले तार पर 720 रुपये का पूरा भाव मिलेगा।",
      safeAction_mr: "मशीनने किंवा ब्लेडने सोला. न जाळलेल्या वायरला 720 रुपयांचा पूर्ण भाव मिळेल.",
      crmYield: { copperPct: 98.4, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: ["Pure Electrolytic Copper Core", "PVC Strippable Sheath"],
      detectedComponents: ["Pure Electrolytic Copper Core", "PVC Strippable Sheath"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 96.2,
      recommendedRecycler: "EcoMetals CPCB Smelter #4",
      vernacularVoiceSummary_hi: "शुद्ध तांबे का तार पहचाना गया। भाव 720 रुपये प्रति किलो है। तार को कतई न जलाएं!",
      vernacularVoiceSummary_mr: "शुद्ध तांब्याची वायर ओळखली. दर 720 रुपये प्रति किलो आहे. वायर जाळू नका!",
      vernacularVoiceSummary_en: "Identified pure copper wire. Current rate is 720 rupees per kg. Avoid open burning.",
    };
  }

  // 6. CRT Leaded Display Glass
  if (lower.includes("crt") || lower.includes("picture tube") || lower.includes("मॉनिटर") || lower.includes("कांच")) {
    return {
      isEWaste: true,
      category: "crt",
      detectedCategory: "CRT Displays & Leaded Glass Tubes",
      name_en: "CRT Displays & Leaded Glass Tubes",
      name_hi: "सीआरटी डिस्प्ले और पिक्चर ट्यूब ग्लास",
      name_mr: "सीआरटी डिस्प्ले व पिक्चर ट्यूब ग्लास",
      grade: "Hazardous (Lead-Silicate)",
      suggestedWeightKg: 14.0,
      weightRange: { min: 8.0, max: 25.0 },
      suggestedRatePerKg: 45,
      estimatedRatePerKg: 45,
      marketRateRange: { min: 45, max: 45 },
      hazardLevel: "high",
      hazardWarning_en: "DANGER: High lead oxide content (up to 25%). Never break funnel glass indoors.",
      hazardWarning_hi: "चेतावनी: पिक्चर ट्यूब में भारी सीसा (लेड) होता है। कांच को न तोड़ें!",
      hazardWarning_mr: "सावधान: पिक्चर ट्यूबमध्ये शिसे असते. काच फोडू नका!",
      safeAction_en: "Wrap in bubble foam and deliver intact to hazardous lead-recovery facility.",
      safeAction_hi: "कांच न फोड़ें, सीधे रिसाइक्लिंग सेंटर को सौंपें।",
      safeAction_mr: "काच फोडल्याशिवाय सुरक्षितपणे द्या.",
      crmYield: { copperPct: 4.2, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: ["Leaded Funnel Glass", "Electron Gun Fe-Ni Alloy", "Phosphor Screen"],
      detectedComponents: ["Leaded Funnel Glass", "Electron Gun Fe-Ni Alloy", "Phosphor Screen"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 95.8,
      recommendedRecycler: "Gujarat CRT Glass Recovery Unit #1",
      vernacularVoiceSummary_hi: "सीआरटी पिक्चर ट्यूब पहचानी गई। सरकारी दर 45 रुपये प्रति किलो है।",
      vernacularVoiceSummary_mr: "सीआरटी पिक्चर ट्यूब ओळखली. सरकारी दर 45 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified CRT glass display. CPCB statutory floor rate is 45 rupees per kg.",
    };
  }

  // 7. LCD / LED Screen Modules
  if (lower.includes("lcd") || lower.includes("led") || lower.includes("screen") || lower.includes("display") || lower.includes("पैनल") || lower.includes("स्क्रीन")) {
    return {
      isEWaste: true,
      category: "lcd",
      detectedCategory: "LCD / LED Display Modules",
      name_en: "LCD / LED Display Modules",
      name_hi: "एलसीडी / एलईडी डिस्प्ले पैनल",
      name_mr: "एलसीडी / एलईडी डिस्प्ले पॅनेल",
      grade: "Flat Display Grade",
      suggestedWeightKg: 4.2,
      weightRange: { min: 2.0, max: 10.0 },
      suggestedRatePerKg: 180,
      estimatedRatePerKg: 180,
      marketRateRange: { min: 180, max: 180 },
      hazardLevel: "medium",
      hazardWarning_en: "Handle edge connectors carefully. Indium tin oxide layer on glass substrate.",
      hazardWarning_hi: "सावधानी: डिस्प्ले पैनल को मोड़ने या चटकाने से बचें।",
      hazardWarning_mr: "काळजी घ्या: पॅनेल वाकवू नका.",
      safeAction_en: "Keep flat and dry during transit to prevent mercury backlight breakage in older CCFL units.",
      safeAction_hi: "सपाट व सूखे स्थान पर रखें।",
      safeAction_mr: "सपाट आणि कोरड्या जागी ठेवा.",
      crmYield: { copperPct: 3.5, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 45 },
      criticalMaterials: ["Indium Tin Oxide (ITO)", "Driver COF ICs", "Optical Polarizer Layers"],
      detectedComponents: ["Indium Tin Oxide (ITO)", "Driver COF ICs", "Optical Polarizer Layers"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 96.5,
      recommendedRecycler: "Indium Recovery Tech Unit #2",
      vernacularVoiceSummary_hi: "एलसीडी / एलईडी स्क्रीन पहचानी गई। सरकारी दर 180 रुपये प्रति किलो है।",
      vernacularVoiceSummary_mr: "एलसीडी / एलईडी स्क्रीन ओळखली. सरकारी दर 180 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified LCD/LED display module. CPCB statutory floor rate is 180 rupees per kg.",
    };
  }

  // 8. Neodymium Rare Earth Magnets
  if (lower.includes("magnet") || lower.includes("hdd") || lower.includes("hard drive") || lower.includes("चुंबक")) {
    return {
      isEWaste: true,
      category: "magnet",
      detectedCategory: "Neodymium Rare-Earth Hard Drive Motors",
      name_en: "Neodymium Rare-Earth Hard Drive Motors",
      name_hi: "नियोडिमियम चुंबक और हार्ड ड्राइव असेंबली",
      name_mr: "निओडिमियम चुंबक व हार्ड ड्राइव्ह असेंब्ली",
      grade: "Grade NdFeB (Rare Earth)",
      suggestedWeightKg: 1.8,
      weightRange: { min: 0.8, max: 4.0 },
      suggestedRatePerKg: 540,
      estimatedRatePerKg: 540,
      marketRateRange: { min: 540, max: 540 },
      hazardLevel: "safe",
      hazardWarning_en: "Extremely strong magnetic pinch hazard. Keep away from pacemakers.",
      hazardWarning_hi: "तेज चुंबकीय खिंचाव! पेसमेकर और क्रेडिट कार्ड से दूर रखें।",
      hazardWarning_mr: "तीव्र चुंबकीय आकर्षण! पेसमेकरपासून लांब ठेवा.",
      safeAction_en: "Store with keeper plates to prevent sudden impact shatter.",
      safeAction_hi: "कीपर प्लेट के साथ सुरक्षित रखें।",
      safeAction_mr: "सुरक्षित ठेवा जेणेकरून आपटणार नाही.",
      crmYield: { copperPct: 2.1, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 31.5, goldGramsPerTon: 0 },
      criticalMaterials: ["Neodymium-Iron-Boron (NdFeB)", "Dysprosium doping", "Nickel plating"],
      detectedComponents: ["Neodymium-Iron-Boron (NdFeB)", "Dysprosium doping", "Nickel plating"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 97.8,
      recommendedRecycler: "EcoMetals Critical Mineral Unit #1",
      vernacularVoiceSummary_hi: "नियोडिमियम चुंबक पहचाना गया। सरकारी दर 540 रुपये प्रति किलो है।",
      vernacularVoiceSummary_mr: "निओडिमियम चुंबक ओळखला. सरकारी दर 540 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified Neodymium magnets. CPCB statutory floor rate is 540 rupees per kg.",
    };
  }

  // 9. Flame-Retardant E-Plastics (ABS-FR)
  if (lower.includes("casing") || lower.includes("chassis") || lower.includes("abs") || (lower.includes("plastic") && !lower.includes("bottle"))) {
    return {
      isEWaste: true,
      category: "plastic",
      detectedCategory: "Flame-Retardant E-Plastics (ABS-FR)",
      name_en: "Flame-Retardant E-Plastics (ABS-FR)",
      name_hi: "फ्लेम-रिटार्डेंट ई-प्लास्टिक स्क्रैप (ABS-FR)",
      name_mr: "फ्लेम-रिटार्डंट ई-प्लास्टिक स्क्रॅप (ABS-FR)",
      grade: "Clean Granulation Base",
      suggestedWeightKg: 6.0,
      weightRange: { min: 3.0, max: 12.0 },
      suggestedRatePerKg: 65,
      estimatedRatePerKg: 65,
      marketRateRange: { min: 65, max: 65 },
      hazardLevel: "safe",
      hazardWarning_en: "Never burn or melt manually. Brominated flame retardants emit toxic gases on combustion.",
      hazardWarning_hi: "प्लास्टिक को कभी न जलाएं! इसमें ब्रोमीनयुक्त जहरीले तत्व होते हैं।",
      hazardWarning_mr: "प्लॅस्टिक कधीही जाळू नका!",
      safeAction_en: "Keep free of soil contamination and bundle for mechanical shredding.",
      safeAction_hi: "धूल-मिट्टी से अलग रखें ताकि पूरा भाव मिले।",
      safeAction_mr: "धूळ-मातीपासून वेगळे ठेवा.",
      crmYield: { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: ["Acrylonitrile Butadiene Styrene", "Polycarbonate Blend", "Flame Retardants"],
      detectedComponents: ["Acrylonitrile Butadiene Styrene", "Polycarbonate Blend", "Flame Retardants"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 96.0,
      recommendedRecycler: "E-Polymer CPCB Pelletizing Unit #3",
      vernacularVoiceSummary_hi: "ई-प्लास्टिक केसिंग पहचानी गई। सरकारी दर 65 रुपये प्रति किलो है।",
      vernacularVoiceSummary_mr: "ई-प्लॅस्टिक केसिंग ओळखली. सरकारी दर 65 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified engineering e-plastics. CPCB statutory floor rate is 65 rupees per kg.",
    };
  }

  // 10. Mixed Small Dismantled Scrap
  if (lower.includes("mix") || lower.includes("charger") || lower.includes("adapter") || lower.includes("छोटा") || lower.includes("मिश्रित")) {
    return {
      isEWaste: true,
      category: "mixed",
      detectedCategory: "Dismantled Small Appliances / Mix",
      name_en: "Dismantled Small Appliances / Mix",
      name_hi: "मिश्रित छोटे इलेक्ट्रॉनिक उपकरण",
      name_mr: "मिश्रित लहान उपकरणे",
      grade: "Secondary Dismantled Lot",
      suggestedWeightKg: 5.0,
      weightRange: { min: 2.0, max: 10.0 },
      suggestedRatePerKg: 120,
      estimatedRatePerKg: 120,
      marketRateRange: { min: 120, max: 120 },
      hazardLevel: "safe",
      hazardWarning_en: "Segregate cords and batteries before batch consolidation for maximum recovery.",
      hazardWarning_hi: "तार और बैटरी अलग कर लें ताकि अधिकतम समर्थन मूल्य मिले।",
      hazardWarning_mr: "वायर आणि बॅटरी वेगळी करा.",
      safeAction_en: "Pack into sturdy woven bags for transport.",
      safeAction_hi: "बोरी में भरकर रखें।",
      safeAction_mr: "गोणीत भरून ठेवा.",
      crmYield: { copperPct: 6.2, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 15 },
      criticalMaterials: ["Mixed Ferrous Scrap", "Transformer Copper", "Phenolic Boards"],
      detectedComponents: ["Mixed Ferrous Scrap", "Transformer Copper", "Phenolic Boards"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 95.0,
      recommendedRecycler: "EcoMetals Sorting Unit #1",
      vernacularVoiceSummary_hi: "मिश्रित ई-कबाड़ पहचाना गया। सरकारी दर 120 रुपये प्रति किलो है।",
      vernacularVoiceSummary_mr: "मिश्रित ई-कचरा ओळखला. सरकारी दर 120 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified mixed small electronics. CPCB statutory floor rate is 120 rupees per kg.",
    };
  }

  // 11. Telecom & Network Hardware (ITEW1 - BTS, 5G RRU, SFP, Router)
  if (lower.includes("telecom") || lower.includes("bts") || lower.includes("5g") || lower.includes("4g") || lower.includes("rru") || lower.includes("sfp") || lower.includes("router") || lower.includes("दूरसंचार")) {
    return {
      isEWaste: true,
      category: "telecom",
      detectedCategory: "Telecom & Network Hardware (ITEW1)",
      name_en: "Telecom & 5G Cellular Network Equipment",
      name_hi: "दूरसंचार व 5G नेटवर्क गियर (ITEW1)",
      name_mr: "दूरसंचार व 5G नेटवर्क गियर (ITEW1)",
      grade: "Carrier-Grade Gold/Silver Contacts",
      suggestedWeightKg: 8.0,
      weightRange: { min: 4.0, max: 25.0 },
      suggestedRatePerKg: 650,
      estimatedRatePerKg: 650,
      marketRateRange: { min: 650, max: 650 },
      hazardLevel: "safe",
      hazardWarning_en: "High-yield telecom boards have heavy gold contact fingers; avoid acid stripping.",
      hazardWarning_hi: "दूरसंचार कार्ड्स पर शुद्ध सोने की परत होती है; इसे एसिड में न गलाएं।",
      hazardWarning_mr: "दूरसंचार कार्डवर सोन्याचा थर असतो; ॲसिडमध्ये विरघळवू नका.",
      safeAction_en: "Deliver intact to authorized pyrometallurgical refiner.",
      safeAction_hi: "अधिकृत स्मेल्टर को सीधे सौंपें।",
      safeAction_mr: "थेट अधिकृत स्मेल्टरला द्या.",
      crmYield: { copperPct: 22.0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 1.2, goldGramsPerTon: 380 },
      criticalMaterials: ["Gold Edge Traces", "Tantalum Caps", "BGA ASICs"],
      detectedComponents: ["Gold Edge Traces", "Tantalum Caps", "BGA ASICs"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 94.0,
      recommendedRecycler: "EcoMetals Precious Metals Smelter",
      vernacularVoiceSummary_hi: "दूरसंचार गियर पहचाना गया। सरकारी दर 650 रुपये प्रति किलो है।",
      vernacularVoiceSummary_mr: "दूरसंचार उपकरणे ओळखली. सरकारी दर 650 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified telecom network equipment. Statutory rate is 650 rupees per kg.",
    };
  }

  // 12. Solar PV Panels & Inverter Modules
  if (lower.includes("solar") || lower.includes("pv") || lower.includes("photovoltaic") || lower.includes("सोलर") || lower.includes("इन्वर्टर")) {
    return {
      isEWaste: true,
      category: "solar",
      detectedCategory: "Solar PV Panels & Inverter Modules",
      name_en: "Solar PV Panels & Inverter Modules",
      name_hi: "सोलर पैनल व इन्वर्टर मॉड्यूल",
      name_mr: "सोलर पॅनेल व इन्व्हर्टर मॉड्यूल",
      grade: "Industrial PV Grade (Si/Ag Recovery)",
      suggestedWeightKg: 18.0,
      weightRange: { min: 10.0, max: 35.0 },
      suggestedRatePerKg: 240,
      estimatedRatePerKg: 240,
      marketRateRange: { min: 240, max: 240 },
      hazardLevel: "safe",
      hazardWarning_en: "Handle tempered glass with care to avoid shattering during transit.",
      hazardWarning_hi: "कांच टूटने से बचाएं; एल्युमिनियम फ्रेम सुरक्षित रखें।",
      hazardWarning_mr: "काच फुटण्यापासून वाचवा.",
      safeAction_en: "Store stacked flat on wooden pallets.",
      safeAction_hi: "सपाट पैलेट पर रखें।",
      safeAction_mr: "सपाट ठेवा.",
      crmYield: { copperPct: 4.5, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: ["Silicon Cells", "Silver Paste Busbars", "Aluminium Frame"],
      detectedComponents: ["Silicon Cells", "Silver Paste Busbars", "Aluminium Frame"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 92.0,
      recommendedRecycler: "GreenSolar Certified Recycling Hub",
      vernacularVoiceSummary_hi: "सोलर पैनल पहचाना गया। सरकारी दर 240 रुपये प्रति किलो है।",
      vernacularVoiceSummary_mr: "सोलर पॅनेल ओळखले. सरकारी दर 240 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified solar PV scrap. Statutory rate is 240 rupees per kg.",
    };
  }

  // 13. Cooling & Compressors (CEEW1)
  if (lower.includes("compressor") || lower.includes("fridge") || lower.includes("refrigerator") || lower.includes("ac ") || lower.includes("कंप्रेसर") || lower.includes("फ्रिज")) {
    return {
      isEWaste: true,
      category: "cooling",
      detectedCategory: "Cooling & Compressor Units (CEEW1)",
      name_en: "Cooling Refrigerant Compressors (CEEW1)",
      name_hi: "रेफ्रिजरेटर व एसी हर्मेटिक कंप्रेसर (CEEW1)",
      name_mr: "रेफ्रिजरेटर व एसी कॉम्प्रेसर (CEEW1)",
      grade: "Heavy Ferrous & High-Grade Copper Core",
      suggestedWeightKg: 12.0,
      weightRange: { min: 6.0, max: 20.0 },
      suggestedRatePerKg: 160,
      estimatedRatePerKg: 160,
      marketRateRange: { min: 160, max: 160 },
      hazardLevel: "high",
      hazardWarning_en: "DANGER: ODS refrigerant gas inside! Never vent to open air.",
      hazardWarning_hi: "खतरा: इसमें ओजोन गैस होती है। खुली हवा में न छोड़ें!",
      hazardWarning_mr: "धोका: ओझोन वायू हवेत सोडू नका!",
      safeAction_en: "Deliver intact to degassing recovery facility.",
      safeAction_hi: "सीलबंद कंप्रेसर सीधे प्लांट को सौंपें।",
      safeAction_mr: "थेट डिगॅसिंग प्लांटला द्या.",
      crmYield: { copperPct: 15.0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: ["Heavy Copper Windings", "Cast Iron Casing"],
      detectedComponents: ["Heavy Copper Windings", "Cast Iron Casing"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 93.0,
      recommendedRecycler: "EcoMetals CPCB Compressor Unit",
      vernacularVoiceSummary_hi: "कंप्रेसर पहचाना गया। सरकारी दर 160 रुपये प्रति किलो है।",
      vernacularVoiceSummary_mr: "कॉम्प्रेसर ओळखला. सरकारी दर 160 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified cooling compressor. Statutory rate is 160 rupees per kg.",
    };
  }

  // 14. Medical & Diagnostic Electronics
  if (lower.includes("medical") || lower.includes("ultrasound") || lower.includes("ecg") || lower.includes("चिकित्सा") || lower.includes("वैद्यकीय")) {
    return {
      isEWaste: true,
      category: "medical",
      detectedCategory: "Medical & Diagnostic Electronics",
      name_en: "Medical & Diagnostic Electronics (MDW1)",
      name_hi: "चिकित्सा व डायग्नोस्टिक इलेक्ट्रॉनिक उपकरण",
      name_mr: "वैद्यकीय व डायग्नोस्टिक उपकरणे",
      grade: "High Precision Sensor Grade",
      suggestedWeightKg: 7.5,
      weightRange: { min: 3.0, max: 15.0 },
      suggestedRatePerKg: 410,
      estimatedRatePerKg: 410,
      marketRateRange: { min: 410, max: 410 },
      hazardLevel: "medium",
      hazardWarning_en: "Ensure electronic items are free from biomedical fluids or contaminants.",
      hazardWarning_hi: "बायोमेडिकल संदूषण रहित इलेक्ट्रॉनिक उपकरण ही स्वीकार्य हैं।",
      hazardWarning_mr: "बायोमेडिकल दूषित नसलेले भाग द्या.",
      safeAction_en: "Handle boards with gloves and isolate sensor probes.",
      safeAction_hi: "दस्ताने पहनकर संभालें।",
      safeAction_mr: "हातमोजे घालून हाताळा.",
      crmYield: { copperPct: 12.0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0.8, goldGramsPerTon: 180 },
      criticalMaterials: ["Silver Conductors", "Gold Connectors", "Shielded Copper"],
      detectedComponents: ["Silver Conductors", "Gold Connectors", "Shielded Copper"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 91.0,
      recommendedRecycler: "MedWaste Certified Dismantler",
      vernacularVoiceSummary_hi: "चिकित्सा इलेक्ट्रॉनिक उपकरण पहचाना गया। सरकारी दर 410 रुपये प्रति किलो है।",
      vernacularVoiceSummary_mr: "वैद्यकीय इलेक्ट्रॉनिक उपकरणे ओळखली. सरकारी दर 410 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified medical diagnostic equipment. Statutory rate is 410 rupees per kg.",
    };
  }

  // 15. Fluorescent Lamps & Mercury Tubes (TLGW)
  if (lower.includes("lamp") || lower.includes("cfl") || lower.includes("tube") || lower.includes("fluorescent") || lower.includes("लाइट") || lower.includes("बल्ब")) {
    return {
      isEWaste: true,
      category: "lighting",
      detectedCategory: "Fluorescent & Discharge Lamps",
      name_en: "Fluorescent & Mercury Discharge Lamps",
      name_hi: "फ्लोरोसेंट ट्यूब व डिस्चार्ज लैंप (TLGW)",
      name_mr: "फ्लोरोसेंट ट्यूब व डिस्चार्ज दिवे (TLGW)",
      grade: "Hazardous Mercury Phosphor Glass",
      suggestedWeightKg: 2.0,
      weightRange: { min: 0.5, max: 5.0 },
      suggestedRatePerKg: 35,
      estimatedRatePerKg: 35,
      marketRateRange: { min: 35, max: 35 },
      hazardLevel: "high",
      hazardWarning_en: "DANGER: Toxic mercury vapor inside! NEVER crush with hammer.",
      hazardWarning_hi: "खतरा: इसमें जहरीला पारा (मर्करी) होता है! हथौड़े से कतई न तोड़ें।",
      hazardWarning_mr: "धोका: पाऱ्याची विषारी वाफ! हातोड्याने फोडू नका.",
      safeAction_en: "Store intact in padded cardboard cylinders.",
      safeAction_hi: "साबुत पैड बॉक्स में रखें।",
      safeAction_mr: "अखंड सुरक्षित बॉक्समध्ये ठेवा.",
      crmYield: { copperPct: 1.5, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      criticalMaterials: ["Electronic Ballast", "Copper End Caps", "Phosphor Rare Earths"],
      detectedComponents: ["Electronic Ballast", "Copper End Caps", "Phosphor Rare Earths"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 92.0,
      recommendedRecycler: "EcoLamps Mercury Distillation Unit",
      vernacularVoiceSummary_hi: "फ्लोरोसेंट लैंप पहचाना गया। सरकारी दर 35 रुपये प्रति किलो है। तोड़ें नहीं!",
      vernacularVoiceSummary_mr: "फ्लोरोसेंट दिवे ओळखले. सरकारी दर 35 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified fluorescent lamp. Statutory rate is 35 rupees per kg. Keep intact.",
    };
  }

  // 16. Explicit PCB / Motherboard (Check keywords explicitly)
  if (lower.includes("pcb") || lower.includes("motherboard") || lower.includes("circuit") || lower.includes("मदरबोर्ड") || lower.includes("सर्किट") || lower.includes("green board") || lower.includes("ram ") || lower.includes("chip")) {
    return {
      isEWaste: true,
      category: "pcb",
      detectedCategory: "High-Grade Server & Telecom Motherboard",
      name_en: "High-Grade Server & Telecom Motherboard",
      name_hi: "हाई-ग्रेड सर्वर / मदरबोर्ड पीसीबी",
      name_mr: "हाय-ग्रेड सर्व्हर व मदरबोर्ड पीसीबी",
      grade: "Grade-A (Gold Edge Contacts)",
      suggestedWeightKg: 5.4,
      weightRange: { min: 3.0, max: 8.0 },
      suggestedRatePerKg: 480,
      estimatedRatePerKg: 480,
      marketRateRange: { min: 480, max: 480 },
      hazardLevel: "safe",
      hazardWarning_en: "Do not leach in backyard acid baths (Aqua Regia). Destroys rare earth elements and causes toxic fumes.",
      hazardWarning_hi: "तेजाब में न घोलें! इससे जहरीली गैस बनती है और सोना-तांबा बर्बाद होता है।",
      hazardWarning_mr: "ॲसिडमध्ये विरघळवू नका! विषारी वायू निघतो आणि मौल्यवान धातू वाया जातात.",
      safeAction_en: "Hand over intact boards directly to CPCB authorized pyrometallurgical smelters.",
      safeAction_hi: "साबुत मदरबोर्ड सीधे अधिकृत रिसाइक्लर को दें। पूरा वजन और नगद भुगतान पाएं।",
      safeAction_mr: "अखंड मदरबोर्ड थेट अधिकृत रिसायकलरला द्या आणि पूर्ण पैसे मिळवा.",
      crmYield: { copperPct: 18.5, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0.5, goldGramsPerTon: 240 },
      criticalMaterials: ["Gold-plated edge fingers", "BGA chipset", "Tantalum capacitors", "FR4 substrate"],
      detectedComponents: ["Gold-plated edge fingers", "BGA chipset", "Tantalum capacitors", "FR4 substrate"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 98.1,
      recommendedRecycler: "EcoMetals CPCB Smelter #4",
      vernacularVoiceSummary_hi: "हाई-ग्रेड सर्वर मदरबोर्ड पहचाना गया। सरकारी दर 480 रुपये प्रति किलो है।",
      vernacularVoiceSummary_mr: "हाय-ग्रेड सर्व्हर मदरबोर्ड ओळखला. सरकारी दर 480 रुपये प्रति किलो आहे.",
      vernacularVoiceSummary_en: "Identified high-grade server motherboard. CPCB statutory floor rate is 480 rupees per kg.",
    };
  }

  // 17. Unrecognized or Ambiguous Scrap Item: NEVER DEFAULT TO MOTHERBOARD!
  // Return explicit manual selection needed object
  return {
    isEWaste: true,
    unableToDetect: true,
    detectedObject: "Unrecognized E-Waste Item (Manual Category Selection Required)",
    category: "manual_select",
    detectedCategory: "Choose Manually (AI Unable to Detect)",
    name_en: "Unidentified E-Waste (Please Choose Manually)",
    name_hi: "अस्पष्ट ई-कबाड़ (कृपया श्रेणी स्वयं चुनें)",
    name_mr: "अस्पष्ट ई-कचरा (कृपया श्रेणी स्वतः निवडा)",
    grade: "Manual Selection Needed",
    suggestedWeightKg: 0,
    weightRange: { min: 0, max: 0 },
    suggestedRatePerKg: 0,
    estimatedRatePerKg: 0,
    marketRateRange: { min: 0, max: 0 },
    hazardLevel: "medium",
    hazardWarning_en: "AI is unable to detect scrap in this photo. Please choose manually from the categories.",
    hazardWarning_hi: "AI इस फोटो में कबाड़ की पहचान करने में असमर्थ है। कृपया नीचे दी गई सूची से श्रेणी स्वयं चुनें।",
    hazardWarning_mr: "AI या फोटोतील स्क्रॅपची ओळख पटवू शकले नाही. कृपया खालील पर्यायांमधून श्रेणी स्वतः निवडा.",
    safeAction_en: "Please select the appropriate CPCB category matching your item.",
    safeAction_hi: "कृपया अपनी वस्तु के अनुसार सही CPCB श्रेणी का चयन करें।",
    safeAction_mr: "कृपया आपल्या वस्तूनुसार योग्य CPCB श्रेणी निवडा.",
    crmYield: { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
    criticalMaterials: [],
    detectedComponents: [],
    anomalyDetected: false,
    anomalyReason: "",
    confidenceScore: 35.0,
    recommendedRecycler: "Select Category",
    vernacularVoiceSummary_hi: "AI इस वस्तु की पहचान नहीं कर पाया। कृपया नीचे दिए विकल्पों में से श्रेणी खुद चुनें।",
    vernacularVoiceSummary_mr: "AI या वस्तूची ओळख पटवू शकले नाही. कृपया खालील पर्यायांतून प्रकार स्वतः निवडा.",
    vernacularVoiceSummary_en: "AI was unable to detect this item. Please choose the category manually from the list.",
  };
}

// Integrated Vite middleware for development & static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`E-Kabad Setu server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
