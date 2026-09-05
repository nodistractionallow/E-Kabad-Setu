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
  category: 'pcb' | 'copper' | 'battery' | 'crt' | 'lcd' | 'magnet' | 'plastic' | 'mixed' | string;
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

export interface CategoryApprovalRequest {
  id: string;
  categoryName: string;
  categoryName_hi?: string;
  categoryName_mr?: string;
  requestedByCollectorId?: string;
  requestedByCollectorName?: string;
  collectorId?: string;
  collectorName?: string;
  collectorPhone?: string;
  location?: string;
  timestamp: string;
  photoUrl?: string;
  samplePhotoUrl?: string;
  estimatedWeightKg?: number;
  weightKg?: number;
  suggestedRatePerKg?: number;
  description?: string;
  notes?: string;
  lotId?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
  approvedRatePerKg?: number;
  assignedStandardCategory?: string;
  rejectionReason?: string;
  reviewDate?: string;
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
  isOutOfCategory?: boolean;
  isPendingCategoryApproval?: boolean;
  requestedCategoryName?: string;
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
  authorityId?: string;
  location: string;
  city?: string;
  state?: string;
  monthlyQuotaTons: number;
  processedThisMonthTons: number;
  activeCollectors: number;
  eprCreditsGeneratedTons: number;
  contactEmail?: string;
  contactPhone?: string;
  complianceRating?: 'A+' | 'A' | 'B' | 'Non-Compliant';
}

export interface RegulatoryAuthority {
  id: string;
  code: string;
  name: string;
  fullName: string;
  state: string;
  zone: 'North' | 'West' | 'South' | 'East' | 'Central' | 'National';
  headquarters: string;
  nodalOfficer: string;
  activeVendorsCount: number;
  activeCollectorsCount: number;
  totalTradedTons: number;
  totalDisbursedCrores: number;
  complianceScore: number;
  status: 'Operational' | 'Audit Underway' | 'High Vigilance';
}

export interface TransactionRecord {
  id: string;
  lotId: string;
  settlementUtr: string;
  date: string;
  timestamp: string;
  vendorId: string;
  vendorName: string;
  vendorCpcbId: string;
  authorityId: string;
  statePcb: string;
  collectorId: string;
  collectorName: string;
  collectorPhone: string;
  collectorWard: string;
  collectorTier: 'Gold' | 'Silver' | 'Bronze';
  materialId: string;
  materialName: string;
  category: string;
  declaredWeightKg: number;
  weighbridgeWeightKg: number;
  ratePerKg: number;
  totalAmount: number;
  paymentMode: 'UPI' | 'NEFT' | 'CASH' | 'ESCROW';
  paymentStatus: 'settled' | 'processing' | 'flagged' | 'rejected';
  anomalyFlag?: boolean;
  anomalyReason?: string;
  eprCreditGeneratedKg: number;
  eprCertificateNo?: string;
  gpsCoordinates: string;
  photoUrl?: string;
}

export interface LotPricePoint {
  date: string;
  cpcbRate: number;
  marketSpotRate: number;
  lmeEquivRate: number;
  volumeKg: number;
  high: number;
  low: number;
  changePct: number;
}

export interface MaterialPriceTrend {
  materialId: string;
  materialName: string;
  materialName_hi?: string;
  category: string;
  currentRate: number;
  cpcbFloorRate: number;
  trend30dPct: number;
  high30d: number;
  low30d: number;
  volatilityIndex: number;
  forecastNextMonth: string;
  forecastChangePct: number;
  crmComposition: {
    copperPct: number;
    lithiumPct: number;
    cobaltPct: number;
    neodymiumPct: number;
    goldGramsPerTon: number;
  };
  history7d: LotPricePoint[];
  history30d: LotPricePoint[];
  history90d: LotPricePoint[];
  history1y: LotPricePoint[];
}
