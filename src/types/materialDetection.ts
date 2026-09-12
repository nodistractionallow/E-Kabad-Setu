export type StrictScrapCategory =
  | 'PCB / Circuit Board'
  | 'Cables / Wires'
  | 'Battery'
  | 'Motor / Magnet Assembly'
  | 'Plastic (Mixed)'
  | 'CRT / Monitor'
  | 'LCD / Screen'
  | 'Other E-waste';

export const STRICT_SCRAP_CATEGORIES: StrictScrapCategory[] = [
  'PCB / Circuit Board',
  'Cables / Wires',
  'Battery',
  'Motor / Magnet Assembly',
  'Plastic (Mixed)',
  'CRT / Monitor',
  'LCD / Screen',
  'Other E-waste'
];

export type QualityRejectionReason =
  | 'TOO_DARK'
  | 'BLURRY'
  | 'FACE_DETECTED'
  | 'NO_OBJECT';

export interface QualityMetrics {
  brightness: number; // 0 to 255
  blurScore: number; // Laplacian edge variance
  faceConfidence: number; // 0 to 1
  objectDensity: number; // 0 to 1
}

export interface QualityGateResult {
  passed: boolean;
  rejectionReason?: QualityRejectionReason;
  rejectionMessageEn?: string;
  rejectionMessageHi?: string;
  rejectionMessageMr?: string;
  metrics: QualityMetrics;
}

export interface CategoryConfidenceScore {
  category: StrictScrapCategory;
  confidence: number; // 0.0 to 1.0
  percentage: number; // 0 to 100
}

export interface MaterialDetectionResult {
  success: boolean;
  status: 'valid_material' | 'rejected_quality' | 'rejected_low_confidence';
  predictedCategory?: StrictScrapCategory;
  confidenceScore?: number; // 0 to 100
  allPredictions?: CategoryConfidenceScore[];
  
  // Set to true when low confidence caused auto-classification to "Other E-waste"
  isAutoClassifiedOther?: boolean;

  // Rejection details (if status !== 'valid_material')
  rejectionCode?: QualityRejectionReason | 'LOW_CONFIDENCE';
  userMessageEn: string;
  userMessageHi: string;
  userMessageMr: string;
  
  // Quality diagnosis
  qualityMetrics?: QualityMetrics;
  
  // Commercial & safety metadata (if accepted)
  suggestedRatePerKg?: number;
  grade?: string;
  hazardLevel?: 'safe' | 'medium' | 'high';
  hazardWarningEn?: string;
  hazardWarningHi?: string;
  safeActionEn?: string;
  safeActionHi?: string;
  crmYield?: {
    copperPct: number;
    lithiumPct: number;
    cobaltPct: number;
    neodymiumPct: number;
    goldGramsPerTon: number;
  };
  
  // Execution metadata
  source: 'on-device-tflite' | 'cloud-gemini-fallback';
  inferenceTimeMs: number;
  isOffline: boolean;
}
