export type Language = 'hi' | 'mr' | 'en';

export type UserRole = 'gateway' | 'collector' | 'recycler' | 'government';

export interface MaterialItem {
  id: string;
  name_hi: string;
  name_mr: string;
  name_en: string;
  grade: string;
  pricePerKg: number;
  trend: number; // percentage change e.g. +2.1
  category: 'pcb' | 'copper' | 'battery' | 'crt' | 'magnet' | 'plastic' | string;
  hazardLevel: 'safe' | 'medium' | 'high';
  hazardWarning_hi?: string;
  hazardWarning_mr?: string;
  hazardWarning_en?: string;
  safeAction_hi?: string;
  safeAction_mr?: string;
  safeAction_en?: string;
  audioText_hi: string;
  audioText_mr: string;
  audioText_en: string;
  crmYield: {
    copperPct: number;
    lithiumPct: number;
    cobaltPct: number;
    neodymiumPct: number;
    goldGramsPerTon: number;
  };
}

export interface EWasteLot {
  id: string;
  collectorId: string;
  collectorName: string;
  collectorPhone: string;
  materialId: string;
  materialName: string;
  category: string;
  weightKg: number;
  ratePerKg: number;
  totalAmount: number;
  status: 'pending' | 'verified' | 'paid' | 'rejected';
  paymentMode?: 'UPI' | 'CASH';
  timestamp: string;
  gpsLocation: string;
  facilityId: string;
  facilityName: string;
  distanceKm: number;
  hazardFlag: boolean;
  hazardNote?: string;
  photoUrl: string;
  photos?: {
    topView?: string;
    undersideView?: string;
    stickerView?: string;
  };
  serialOrImei?: string;
  requiresSticker?: boolean;
  anomalyFlag?: boolean;
  anomalyReason?: string;
  isOfflineCreated?: boolean;
  needsOnlineAiCategorization?: boolean;
  weighbridgeWeightKg?: number;
  finalPayoutAmount?: number;
  eprCreditKg?: number;
}

export interface CollectorProfile {
  id: string;
  name: string;
  phone: string;
  ward: string;
  city: string;
  selfieUrl: string;
  verifiedBadge: boolean;
  safetyTier: 'Gold' | 'Silver' | 'Bronze';
  bagsDepositedKg: number;
  targetBagsKg: number;
  securityRefundAmount: number;
  todayEarnings: number;
  todayWeightKg: number;
  totalLotsCount: number;
}

export interface RecyclerFacility {
  id: string;
  name: string;
  cpcbId: string;
  statePcb: string;
  location: string;
  monthlyQuotaTons: number;
  processedThisMonthTons: number;
  activeCollectors: number;
  eprCreditsGeneratedTons: number;
}
