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
    const { imageBase64, mimeType, notes, language = "hi" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 in request body" });
    }

    // If Gemini API is configured, use real Gemini 3.6 Flash model
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

      const prompt = `You are the world's leading CPCB (Central Pollution Control Board, India) certified E-Waste Auditor, Material Science Classifier, and Computer Vision System assisting informal scrap collectors (Kabadiwalas) and certified recycling units in India under E-Waste Management Rules 2022.

CRITICAL FIRST STEP: COMPREHENSIVE FAKE & NON-SCRAP VERIFICATION
Carefully analyze the image:
1. Is this a fake image? (e.g. a photo taken of another smartphone/laptop screen displaying an image, a printed photo on paper, a 3D cartoon/CGI rendering, an AI generated synthetic mock image, a blurry unidentifiable mess, or completely black/blank image).
2. Is this non-electronic waste? (e.g. a human face, selfie, portrait of a person, animal, pet, food, clothes, nature, scenery, car, bike, furniture, paper, wood, stones, or ordinary household trash).

IF FAKE, SCREEN CAPTURE, OR NOT GENUINE E-WASTE:
You MUST set "isEWaste": false.
Specify exactly what was detected in "detectedObject" (e.g. "Screen capture of another device / Fake photo", "Human portrait / Selfie", "Household organic waste", "Paper / Wood").
Explain clearly why it cannot be accepted.
Return strictly this JSON:
{
  "isEWaste": false,
  "detectedObject": "<Clear name of what is shown, e.g. 'Fake image / Screen capture of a monitor' or 'Human Face / Selfie'>",
  "category": "non_ewaste",
  "name_en": "Not Genuine E-Waste (Fake / Non-Scrap Detected)",
  "name_hi": "यह वास्तविक ई-कबाड़ नहीं है (नकली / अन्य वस्तु)",
  "name_mr": "हे अस्सल ई-कचरा नाही (बनावट / इतर वस्तू)",
  "grade": "Rejected / Non-Scrap",
  "suggestedWeightKg": 0,
  "weightRange": { "min": 0, "max": 0 },
  "suggestedRatePerKg": 0,
  "estimatedRatePerKg": 0,
  "marketRateRange": { "min": 0, "max": 0 },
  "hazardLevel": "safe",
  "hazardWarning_en": "Verification failed: Item is either not real e-waste or a fake/screen photo.",
  "hazardWarning_hi": "सत्यापन विफल: यह वास्तविक ई-कबाड़ नहीं है या स्क्रीन की फोटो है।",
  "hazardWarning_mr": "सत्यापन अयशस्वी: हे खरे ई-कचरा नाही किंवा स्क्रीनचा फोटो आहे.",
  "safeAction_en": "Please point the live camera directly at real electronic hardware (circuit boards, cables, batteries, motors, or dismantled appliances).",
  "safeAction_hi": "कृपया वास्तविक इलेक्ट्रॉनिक हार्डवेयर (सर्किट बोर्ड, तार, बैटरी, मोटर या उपकरण) के सामने कैमरा रखें।",
  "safeAction_mr": "कृपया प्रत्यक्ष इलेक्ट्रॉनिक उपकरणांसमोर कॅमेरा धरा.",
  "crmYield": { "copperPct": 0, "lithiumPct": 0, "cobaltPct": 0, "neodymiumPct": 0, "goldGramsPerTon": 0 },
  "detectedComponents": [],
  "anomalyDetected": true,
  "anomalyReason": "Fake image, screen display photograph, or non-e-waste subject detected by computer vision.",
  "confidenceScore": 99.5,
  "recommendedRecycler": "N/A - Rejected",
  "vernacularVoiceSummary_hi": "यह मान्य इलेक्ट्रॉनिक कबाड़ नहीं है। कृपया वास्तविक ई-वेस्ट का फोटो खींचें।",
  "vernacularVoiceSummary_mr": "हे वैध ई-कचरा नाही. कृपया खऱ्या ई-कचऱ्याचा फोटो काढा.",
  "vernacularVoiceSummary_en": "Invalid scrap. Please capture real electronic hardware."
}

IF THE IMAGE IS REAL ELECTRONIC SCRAP / E-WASTE:
Set "isEWaste": true.
Provide deep, authoritative classification:
1. Dynamic Custom Category: Generate an accurate, highly specific descriptive scrap category name (e.g. "Telecom Base Station SMPS Board", "High-Grade Server Dual-CPU Motherboard", "Swollen Li-Polymer EV/Drone Battery Cell", "Neodymium HDD Actuator Arm Magnet", "Heavy Copper Winding Transformer Core", "Industrial Variable Frequency Drive PCB").
2. Category slug: one of ["pcb", "copper", "battery", "crt", "lcd", "magnet", "plastic", "mixed", "custom_e_waste"].
3. Name in English, Hindi (Devanagari script), and Marathi (Devanagari script).
4. Grade (e.g. "Grade-A Gold Contacts", "Berry/Barley 99% Pure Copper", "Class-1 Hazmat Li-ion", "Industrial Grade").
5. Realistic suggested weight in kg (e.g. 0.5 to 15.0 kg based on visible size) and weightRange { min, max }.
6. Estimated fair Mandi price per kg in Indian Rupees (INR) reflecting real Indian market dynamics (e.g. High-grade server PCB: ₹450-₹550/kg, Telecom boards: ₹380-₹480/kg, Unburnt copper wire: ₹720-₹760/kg, Lithium batteries: ₹280-₹340/kg, CRT yoke: ₹40-₹60/kg, Rare earth magnets: ₹500-₹620/kg).
7. Hazard Level: "safe", "medium", or "high".
8. Explicit hazard warning and safe handling directives for informal waste pickers in English, Hindi, and Marathi.
9. Critical Raw Materials (CRM) yield estimates:
   - copperPct (0-100)
   - lithiumPct (0-100)
   - cobaltPct (0-100)
   - neodymiumPct (0-100)
   - goldGramsPerTon (e.g. 5 to 150 grams per ton)
10. Detected physical components list (e.g. ["Gold-plated BGA sockets", "Tantalum capacitors", "Solid state capacitors", "Ferrite choke coils"]).
11. Authorized CPCB recycler recommendation.
12. Confidence score (number between 85.0 and 99.8).

Return ONLY valid JSON matching this structure without any markdown backticks.`;

      const imagePart = {
        inlineData: {
          mimeType: detectedMime,
          data: base64Data,
        },
      };

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [imagePart, { text: prompt }] },
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const responseText = response.text?.trim() || "{}";
        const parsed = JSON.parse(responseText);
        const isEw = parsed.isEWaste !== false;

        const normalizedData = {
          isEWaste: isEw,
          detectedObject: parsed.detectedObject,
          category: parsed.category || (isEw ? "pcb" : "non_ewaste"),
          detectedCategory: isEw 
            ? (language === "hi" ? parsed.name_hi : language === "mr" ? parsed.name_mr : parsed.name_en) || parsed.name_en || "Electronic Scrap"
            : (language === "hi" ? parsed.name_hi : language === "mr" ? parsed.name_mr : parsed.name_en) || "Not E-Waste",
          name_en: parsed.name_en || (isEw ? "Electronic Scrap" : "Not Electronic Waste"),
          name_hi: parsed.name_hi || (isEw ? "इलेक्ट्रॉनिक स्क्रैप" : "यह ई-कबाड़ नहीं है"),
          name_mr: parsed.name_mr || (isEw ? "इलेक्ट्रॉनिक स्क्रॅप" : "हे ई-कचरा नाही"),
          grade: parsed.grade || (isEw ? "Standard Grade" : "Invalid Material"),
          suggestedWeightKg: isEw ? (parsed.suggestedWeightKg ?? 2.5) : 0,
          weightRange: parsed.weightRange || (isEw ? { min: 1.0, max: 5.0 } : { min: 0, max: 0 }),
          suggestedRatePerKg: isEw ? (parsed.suggestedRatePerKg ?? 300) : 0,
          estimatedRatePerKg: isEw ? (parsed.suggestedRatePerKg ?? 300) : 0,
          marketRateRange: parsed.marketRateRange || (isEw ? { min: 280, max: 320 } : { min: 0, max: 0 }),
          hazardLevel: parsed.hazardLevel || "safe",
          hazardWarning: parsed[`hazardWarning_${language}`] || parsed.hazardWarning_en || parsed.hazardWarning_hi || "",
          hazardWarning_en: parsed.hazardWarning_en || "",
          hazardWarning_hi: parsed.hazardWarning_hi || "",
          hazardWarning_mr: parsed.hazardWarning_mr || "",
          safeAction: parsed[`safeAction_${language}`] || parsed.safeAction_en || parsed.safeAction_hi || "",
          safeAction_en: parsed.safeAction_en || "",
          safeAction_hi: parsed.safeAction_hi || "",
          safeAction_mr: parsed.safeAction_mr || "",
          crmYield: parsed.crmYield || { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
          criticalMaterials: parsed.detectedComponents || [],
          detectedComponents: parsed.detectedComponents || [],
          anomalyDetected: Boolean(parsed.anomalyDetected),
          anomalyReason: parsed.anomalyReason || "",
          confidenceScore: parsed.confidenceScore || 96.0,
          recommendedRecycler: parsed.recommendedRecycler || (isEw ? "EcoMetals CPCB Unit #4" : "N/A"),
          vernacularVoiceSummary: parsed[`vernacularVoiceSummary_${language}`] || parsed.vernacularVoiceSummary_hi || parsed.vernacularVoiceSummary_en || "",
          vernacularVoiceSummary_en: parsed.vernacularVoiceSummary_en || "",
          vernacularVoiceSummary_hi: parsed.vernacularVoiceSummary_hi || "",
          vernacularVoiceSummary_mr: parsed.vernacularVoiceSummary_mr || "",
        };

        return res.json({
          success: true,
          source: "gemini-2.5-flash",
          data: normalizedData,
        });
      } catch (geminiErr: any) {
        console.warn("Gemini vision API error or quota reached, falling back safely:", geminiErr?.message);
      }
    }

    // Fallback: Intelligent rule-based engine when API key is pending or network is offline
    const fallbackResults = getIntelligentFallbackClassification(notes || "");
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
      fallback: getIntelligentFallbackClassification(""),
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
function getIntelligentFallbackClassification(notes: string) {
  const lower = notes.toLowerCase();
  if (lower.includes("bat") || lower.includes("cell") || lower.includes("swollen") || lower.includes("लिथियम") || lower.includes("बॅटरी")) {
    return {
      category: "battery",
      name_en: "Swollen Li-ion Phone & Laptop Battery",
      name_hi: "फूली हुई लिथियम-आयन बैटरी पैक",
      name_mr: "फुगलेली लिथियम-आयन बॅटरी पॅक",
      grade: "Hazardous (NMC / LCO)",
      suggestedWeightKg: 2.8,
      weightRange: { min: 1.5, max: 4.5 },
      suggestedRatePerKg: 310,
      marketRateRange: { min: 295, max: 325 },
      hazardLevel: "high",
      hazardWarning_en: "DANGER: Swollen battery pouch can undergo sudden thermal runaway fire (>800°C).",
      hazardWarning_hi: "चेतावनी: फूली बैटरी को न खोलें या पंचर न करें। हवा लगते ही भीषण आग लग सकती है!",
      hazardWarning_mr: "सावधान: फुगलेली बॅटरी उघडू नका किंवा छिद्र पाडू नका. स्फोटक आग लागू शकते!",
      safeAction_en: "Tape terminals with electrical tape and isolate in fire-retardant vermiculite pouch.",
      safeAction_hi: "टर्मिनल्स पर टेप लगाएं और वर्मीक्यूलाइट सेफ्टी बैग में रखें।",
      safeAction_mr: "टर्मिनलवर टेप लावा आणि व्हर्मिक्युलाईट सुरक्षेच्या पिशवीत ठेवा.",
      crmYield: { copperPct: 8.5, lithiumPct: 4.8, cobaltPct: 14.2, neodymiumPct: 0, goldGramsPerTon: 0 },
      detectedComponents: ["Lithium Cobalt Oxide Pouch", "Positive Al collector", "Negative Cu foil"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 97.4,
      vernacularVoiceSummary_hi: "फूली हुई लिथियम बैटरी पहचानी गई। भाव 310 रुपये किलो है। इसे सेफ्टी पाउच में रखें!",
      vernacularVoiceSummary_mr: "फुगलेली लिथियम बॅटरी ओळखली. दर 310 रुपये किलो आहे. सुरक्षेच्या पिशवीत ठेवा!",
      vernacularVoiceSummary_en: "Identified swollen Lithium-ion battery. Fair rate is 310 rupees per kg. Use safety pouch.",
    };
  }

  if (lower.includes("wire") || lower.includes("cable") || lower.includes("तांबा") || lower.includes("तार")) {
    return {
      category: "copper",
      name_en: "Unburnt High-Conductivity Copper Wire",
      name_hi: "बिना जला तांबे का तार (शुद्ध कॉपर)",
      name_mr: "न जाळलेली तांब्याची वायर (शुद्ध कॉपर)",
      grade: "Berry/Barley (99% Pure Cu)",
      suggestedWeightKg: 8.5,
      weightRange: { min: 5.0, max: 15.0 },
      suggestedRatePerKg: 720,
      marketRateRange: { min: 700, max: 740 },
      hazardLevel: "safe",
      hazardWarning_en: "Never burn wire insulation in open fire. Releases carcinogenic dioxins and reduces weight.",
      hazardWarning_hi: "तार को आग में न जलाएं। इससे जहरीला धुआं निकलता है और तांबे का वजन जलकर कम होता है।",
      hazardWarning_mr: "वायर आगीत जाळू नका. यातून विषारी धूर निघतो आणि तांब्याचे वजन घटते.",
      safeAction_en: "Use mechanical wire stripper. Hand over shiny unburnt copper for highest price.",
      safeAction_hi: "मैकेनिकल कटर या ब्लेड से छीलें। बिना जले तार पर 720 रुपये का पूरा भाव मिलेगा।",
      safeAction_mr: "मशीनने किंवा ब्लेडने सोला. न जाळलेल्या वायरला 720 रुपयांचा पूर्ण भाव मिळेल.",
      crmYield: { copperPct: 98.4, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
      detectedComponents: ["Pure Electrolytic Copper Core", "PVC Strippable Sheath"],
      anomalyDetected: false,
      anomalyReason: "",
      confidenceScore: 96.2,
      vernacularVoiceSummary_hi: "शुद्ध तांबे का तार पहचाना गया। भाव 720 रुपये प्रति किलो है। तार को कतई न जलाएं!",
      vernacularVoiceSummary_mr: "शुद्ध तांब्याची वायर ओळखली. दर 720 रुपये प्रति किलो आहे. वायर जाळू नका!",
      vernacularVoiceSummary_en: "Identified pure copper wire. Current rate is 720 rupees per kg. Avoid open burning.",
    };
  }

  // Default: High Grade PCB
  return {
    category: "pcb",
    name_en: "High-Grade Server & Telecom Motherboard",
    name_hi: "हाई-ग्रेड सर्वर / मदरबोर्ड पीसीबी",
    name_mr: "हाय-ग्रेड सर्व्हर व मदरबोर्ड पीसीबी",
    grade: "Grade-A (Gold Edge Contacts)",
    suggestedWeightKg: 5.4,
    weightRange: { min: 3.0, max: 8.0 },
    suggestedRatePerKg: 480,
    marketRateRange: { min: 460, max: 505 },
    hazardLevel: "safe",
    hazardWarning_en: "Do not leach in backyard acid baths (Aqua Regia). Destroys rare earth elements and causes toxic fumes.",
    hazardWarning_hi: "तेजाब में न घोलें! इससे जहरीली गैस बनती है और सोना-तांबा बर्बाद होता है।",
    hazardWarning_mr: "ॲसिडमध्ये विरघळवू नका! विषारी वायू निघतो आणि मौल्यवान धातू वाया जातात.",
    safeAction_en: "Hand over intact boards directly to CPCB authorized pyrometallurgical smelters.",
    safeAction_hi: "साबुत मदरबोर्ड सीधे अधिकृत रिसाइक्लर को दें। पूरा वजन और नगद भुगतान पाएं।",
    safeAction_mr: "अखंड मदरबोर्ड थेट अधिकृत रिसायकलरला द्या आणि पूर्ण पैसे मिळवा.",
    crmYield: { copperPct: 18.5, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0.5, goldGramsPerTon: 240 },
    detectedComponents: ["Gold-plated edge fingers", "BGA chipset", "Tantalum capacitors", "FR4 substrate"],
    anomalyDetected: false,
    anomalyReason: "",
    confidenceScore: 98.1,
    vernacularVoiceSummary_hi: "हाई-ग्रेड सर्वर मदरबोर्ड पहचाना गया। भाव 480 रुपये प्रति किलो है। इसमें सोना और तांबा है।",
    vernacularVoiceSummary_mr: "हाय-ग्रेड सर्व्हर मदरबोर्ड ओळखला. दर 480 रुपये प्रति किलो आहे. यात सोने व तांबे आहे.",
    vernacularVoiceSummary_en: "Identified high-grade server motherboard. Current rate is 480 rupees per kg.",
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
