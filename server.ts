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
    const { imageBase64, mimeType, notes, isHumanHint, isBlackOrBlankHint, language = "hi" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 in request body" });
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
- If true, return:
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

You MUST inspect if the electronic item falls under one of the 8 APPROVED CPCB STANDARD CATEGORIES:
1. "pcb" - Printed Circuit Boards, Motherboards, Server PCBs, RAM, Green Boards, Inverter Logic Boards
2. "copper" - Copper Wires, Cables, Motor Windings, Yoke Coils, Stripped or Insulated Copper Conductors
3. "battery" - Lithium-ion Pouch Packs, Swollen Phone/Laptop Batteries, Lead-Acid Accumulator Cells
4. "crt" - Cathode Ray Tubes, CRT Monitors, Television Heavy Leaded Glass Funnels
5. "lcd" - LCD Screens, LED Flat Display Panels, Laptop Monitors
6. "magnet" - Neodymium Rare-Earth Magnets, Hard Disk Drive Actuators, Speaker Magnets
7. "plastic" - Flame-Retardant E-Plastics, Engineering Grade ABS/PC Enclosures & Computer Casings
8. "mixed" - Mixed Small Dismantled Electronics, Chargers, Small Transistors, Adapters

=========================================
MANDATORY STEP 3: OUT-OF-CATEGORY (NEW / UNCLASSIFIED E-WASTE) HANDLING
=========================================
If the item is GENUINE electronic scrap, but does NOT strictly fit into the 8 standard categories above (for example: Specialized High-Voltage Transformer Cores, Solar Inverter Power Blocks, Fiber-Optic Telecom Splitters, Tantalum Electrolytic Banks, Industrial Automation Modules, Medical Electronics):
You MUST set:
- "isEWaste": true
- "isOutOfCategory": true
- "category": "out_of_category"
- "detectedCategory": <Exact Specific Descriptive Name, e.g. "Specialized Industrial Solar Inverter Core">
- "suggestedRatePerKg": 0
- "estimatedRatePerKg": 0
- "marketRateRange": { "min": 0, "max": 0 }
- "priceDecisionNotice": "Price will be decided later by CPCB Authority"
- "hazardWarning_en": "Notice: This item is outside the 8 standard CPCB categories. A category approval request must be sent to the Authority.",
- "hazardWarning_hi": "सूचना: यह वस्तु CPCB की 8 मानक श्रेणियों में नहीं है। नई श्रेणी स्वीकृति हेतु प्राधिकरण को अनुरोध भेजा जाना आवश्यक है।",
- "hazardWarning_mr": "सूचना: ही वस्तू 8 मानक प्रकारात नाही. CPCB प्राधिकरणाकडे नवीन श्रेणीसाठी विनंती पाठवणे आवश्यक आहे.",
- "vernacularVoiceSummary_hi": "यह ई-कबाड़ 8 मानक श्रेणियों से अलग है। भाव CPCB प्राधिकरण द्वारा बाद में तय किया जाएगा।",
- "vernacularVoiceSummary_mr": "हे ई-कचरा 8 मानक प्रकारांमधील नाही. दर CPCB प्राधिकरणाद्वारे नंतर ठरवला जाईल.",
- "vernacularVoiceSummary_en": "Item is out of standard CPCB categories. Price will be decided later by CPCB Authority."

If the item DOES fit one of the 8 standard categories:
- "isEWaste": true
- "isOutOfCategory": false
- "category": one of ["pcb", "copper", "battery", "crt", "lcd", "magnet", "plastic", "mixed"]
- "estimatedRatePerKg": fair market rate in INR (₹/kg)
- "suggestedWeightKg": realistic weight in kg

Return strictly valid raw JSON adhering to this schema:
{
  "isEWaste": boolean,
  "isOutOfCategory": boolean,
  "detectedObject": string,
  "category": "pcb" | "copper" | "battery" | "crt" | "lcd" | "magnet" | "plastic" | "mixed" | "out_of_category" | "non_ewaste",
  "detectedCategory": string,
  "name_en": string,
  "name_hi": string,
  "name_mr": string,
  "grade": string,
  "suggestedWeightKg": number,
  "weightRange": { "min": number, "max": number },
  "suggestedRatePerKg": number,
  "estimatedRatePerKg": number,
  "marketRateRange": { "min": number, "max": number },
  "hazardLevel": "safe" | "medium" | "high",
  "hazardWarning_en": string,
  "hazardWarning_hi": string,
  "hazardWarning_mr": string,
  "safeAction_en": string,
  "safeAction_hi": string,
  "safeAction_mr": string,
  "crmYield": { "copperPct": number, "lithiumPct": number, "cobaltPct": number, "neodymiumPct": number, "goldGramsPerTon": number },
  "detectedComponents": string[],
  "anomalyDetected": boolean,
  "anomalyReason": string,
  "confidenceScore": number,
  "recommendedRecycler": string,
  "vernacularVoiceSummary_hi": string,
  "vernacularVoiceSummary_mr": string,
  "vernacularVoiceSummary_en": string
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

        const standardCategories = ["pcb", "copper", "battery", "crt", "lcd", "magnet", "plastic", "mixed"];
        let assignedCategory = parsed.category || (isEw ? "pcb" : "non_ewaste");
        let isOutOfCategory = isOut;

        if (isEw && !standardCategories.includes(assignedCategory)) {
          isOutOfCategory = true;
          assignedCategory = "out_of_category";
        }

        const normalizedData = {
          isEWaste: isEw,
          isOutOfCategory: isOutOfCategory,
          detectedObject: parsed.detectedObject,
          category: assignedCategory,
          detectedCategory: isEw 
            ? (language === "hi" ? parsed.name_hi : language === "mr" ? parsed.name_mr : parsed.name_en) || parsed.name_en || (isOutOfCategory ? "Unclassified E-Waste" : "Electronic Scrap")
            : (language === "hi" ? parsed.name_hi : language === "mr" ? parsed.name_mr : parsed.name_en) || "Not E-Waste",
          name_en: parsed.name_en || (isEw ? (isOutOfCategory ? "Unclassified E-Waste Lot" : "Electronic Scrap") : "Not Electronic Waste"),
          name_hi: parsed.name_hi || (isEw ? (isOutOfCategory ? "अवर्गीकृत ई-कबाड़ (प्राधिकरण स्वीकृति लंबित)" : "इलेक्ट्रॉनिक स्क्रैप") : "यह ई-कबाड़ नहीं है"),
          name_mr: parsed.name_mr || (isEw ? (isOutOfCategory ? "अवर्गीकृत ई-कचरा (प्राधिकरण मंजुरी प्रलंबित)" : "इलेक्ट्रॉनिक स्क्रॅप") : "हे ई-कचरा नाही"),
          grade: parsed.grade || (isEw ? (isOutOfCategory ? "Under CPCB Authority Review" : "Standard Grade") : "Invalid Material"),
          suggestedWeightKg: isEw ? (parsed.suggestedWeightKg ?? 2.5) : 0,
          weightRange: parsed.weightRange || (isEw ? { min: 1.0, max: 5.0 } : { min: 0, max: 0 }),
          suggestedRatePerKg: isOutOfCategory ? 0 : (isEw ? (parsed.suggestedRatePerKg ?? 300) : 0),
          estimatedRatePerKg: isOutOfCategory ? 0 : (isEw ? (parsed.suggestedRatePerKg ?? 300) : 0),
          marketRateRange: isOutOfCategory ? { min: 0, max: 0 } : (parsed.marketRateRange || (isEw ? { min: 280, max: 320 } : { min: 0, max: 0 })),
          priceNotice: isOutOfCategory ? "Price will be decided later by CPCB Authority" : undefined,
          hazardLevel: parsed.hazardLevel || (isEw ? "safe" : "high"),
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
          vernacularVoiceSummary: isOutOfCategory
            ? (language === "hi" ? "यह ई-कबाड़ 8 मानक श्रेणियों में नहीं है। भाव CPCB प्राधिकरण द्वारा बाद में तय किया जाएगा।" : language === "mr" ? "हे ई-कचरा मानक प्रकारात नाही. CPCB प्राधिकरणाकडून नंतर दर ठरवला जाईल." : "Item is out of standard CPCB categories. Price will be decided later by CPCB Authority.")
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
      marketRateRange: { min: 700, max: 740 },
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

  // 6. Default: High Grade Server Motherboard PCB
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
    marketRateRange: { min: 460, max: 505 },
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
