import { StrictScrapCategory, STRICT_SCRAP_CATEGORIES } from '../types/materialDetection';

export interface GeminiVisionResult {
  success: boolean;
  category: StrictScrapCategory;
  confidenceScore: number;
  detectedObject?: string;
  isEWaste: boolean;
  suggestedRatePerKg?: number;
  grade?: string;
  hazardLevel?: 'safe' | 'medium' | 'high';
  hazardWarning_en?: string;
  hazardWarning_hi?: string;
  safeAction_en?: string;
  safeAction_hi?: string;
}

const FALLBACK_KEY =
  typeof atob !== 'undefined'
    ? atob('QVEuQWI4Uk42S2JxQlpZOEdFZTU1YlYyV2tsazQwcHNwZy1PZlc4SFJfY2VRRExzU0R6RXc=')
    : '';

const GEMINI_API_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
  FALLBACK_KEY;

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Direct Client-Side Gemini 2.5 Flash API Service
 * Calls Google Generative Language REST API directly from the browser.
 */
export async function classifyWithGeminiVision(
  imageBase64: string
): Promise<GeminiVisionResult> {
  try {
    let mimeType = 'image/jpeg';
    let base64Data = imageBase64;

    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
      base64Data = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');
    }

    const prompt = `You are a CPCB (Central Pollution Control Board, India) certified E-Waste Auditor and Vision System assisting scrap collectors (Kabadiwalas) under Indian E-Waste Rules 2022.

Analyze the image carefully.

CRITICAL RULE:
You MUST classify the item into STRICTLY ONE of these 8 categories:
1. "PCB / Circuit Board" (Motherboards, green/blue circuit boards, chips, RAM, cards, electronic modules)
2. "Cables / Wires" (Copper wires, electric cables, power cords, telecom cables, wiring coils)
3. "Battery" (Li-ion cells, lead-acid, phone batteries, laptop battery packs, EV cells)
4. "Motor / Magnet Assembly" (Electric motors, neodymium magnets, transformers, stator coils)
5. "Plastic (Mixed)" (Computer/printer plastic body casings, keyboard shells, monitor bodies)
6. "CRT / Monitor" (Old cathode ray tube monitors, bulky glass screens, picture tubes)
7. "LCD / Screen" (Flat LCD/LED panels, laptop screens, smartphone displays)
8. "Other E-waste" (Any other e-waste, chargers, mixed hardware, dismantled devices, or unclear e-waste)

If the image is completely NOT e-waste (e.g. human face selfie with no electronics, food, animal, trees):
Set "isEWaste": false, "category": "Other E-waste", "detectedObject": "<what is shown>".

If the image is e-waste or hardware:
Set "isEWaste": true.
Set "category" to EXACTLY one of the 8 category names listed above.
If confidence is low or does not cleanly match the first 7, select "Other E-waste".

Respond in strictly valid JSON without any markdown code blocks:
{
  "isEWaste": true,
  "category": "PCB / Circuit Board",
  "detectedObject": "<short object description>",
  "confidenceScore": 92,
  "suggestedRatePerKg": 480,
  "grade": "Standard Grade",
  "hazardLevel": "safe",
  "hazardWarning_en": "",
  "hazardWarning_hi": "",
  "safeAction_en": "Segregate components cleanly.",
  "safeAction_hi": "????? ?? ??? ?? ????????"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}`);
      return fallbackOtherEWaste();
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return fallbackOtherEWaste();
    }

    const parsed = JSON.parse(candidateText.trim());
    const isEw = parsed.isEWaste !== false;

    const validatedCategory = normalizeCategory(parsed.category || parsed.detectedObject);

    return {
      success: true,
      category: isEw ? validatedCategory : 'Other E-waste',
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 90,
      detectedObject: parsed.detectedObject,
      isEWaste: isEw,
      suggestedRatePerKg: validatedCategory === 'Other E-waste' ? 0 : parsed.suggestedRatePerKg,
      grade: parsed.grade || 'Standard CPCB Grade',
      hazardLevel: parsed.hazardLevel || 'safe',
      hazardWarning_en: parsed.hazardWarning_en,
      hazardWarning_hi: parsed.hazardWarning_hi,
      safeAction_en: parsed.safeAction_en,
      safeAction_hi: parsed.safeAction_hi
    };
  } catch (error) {
    console.warn('Direct Gemini Vision client call error:', error);
    return fallbackOtherEWaste();
  }
}

function normalizeCategory(rawText: string = ''): StrictScrapCategory {
  if (!rawText) return 'Other E-waste';
  if (STRICT_SCRAP_CATEGORIES.includes(rawText as StrictScrapCategory)) {
    return rawText as StrictScrapCategory;
  }
  const s = rawText.toLowerCase();
  if (s.includes('pcb') || s.includes('circuit') || s.includes('board') || s.includes('motherboard')) {
    return 'PCB / Circuit Board';
  }
  if (s.includes('wire') || s.includes('cable') || s.includes('copper') || s.includes('???') || s.includes('?????')) {
    return 'Cables / Wires';
  }
  if (s.includes('battery') || s.includes('cell') || s.includes('lithium') || s.includes('?????')) {
    return 'Battery';
  }
  if (s.includes('motor') || s.includes('magnet') || s.includes('transformer') || s.includes('????')) {
    return 'Motor / Magnet Assembly';
  }
  if (s.includes('plastic') || s.includes('casing') || s.includes('body') || s.includes('?????????')) {
    return 'Plastic (Mixed)';
  }
  if (s.includes('crt') || s.includes('tube') || s.includes('monitor')) {
    return 'CRT / Monitor';
  }
  if (s.includes('lcd') || s.includes('screen') || s.includes('display')) {
    return 'LCD / Screen';
  }
  return 'Other E-waste';
}

function fallbackOtherEWaste(): GeminiVisionResult {
  return {
    success: false,
    category: 'Other E-waste',
    confidenceScore: 0,
    isEWaste: true,
    suggestedRatePerKg: 0,
    grade: 'Unclassified Scrap'
  };
}
