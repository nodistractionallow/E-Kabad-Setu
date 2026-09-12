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
  paidAt?: string;
  paidTimestamp?: string;
  settlementUtr?: string;
  reopened?: boolean;
  reopenedAt?: string;
  reopenedBy?: string;
  anomalyCleared?: boolean;
  anomalyResolution?: string;
  anomalyResolvedBy?: string;
  crmYield?: {
    copperPct: number;
    lithiumPct: number;
    cobaltPct: number;
    neodymiumPct: number;
    goldGramsPerTon: number;
  };
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
  city?: string;
  monthlyQuotaTons: number;
  processedThisMonthTons: number;
  activeCollectors: number;
  eprCreditsGeneratedTons: number;
  authorityId?: string;
  complianceRating?: number | string;
}

export interface RegulatoryAuthority {
  id: string;
  name: string;
  code: string;
  state: string;
  zone: string;
  headquarters: string;
  authorizedOfficer: string;
  designation: string;
  contactEmail: string;
  phone: string;
  activeRecyclersMonitored: number;
  registeredInformalCollectors: number;
  eprCertificatesApprovedTons: number;
  openGrievancesCount: number;
}

export interface TransactionRecord {
  id: string;
  lotId: string;
  transactionRef: string;
  type: 'PAYOUT' | 'EPR_TRANSFER' | 'SECURITY_REFUND' | 'GOV_INCENTIVE';
  collectorId?: string;
  collectorName?: string;
  facilityId?: string;
  facilityName?: string;
  authorityCode?: string;
  authorityId?: string;
  vendorId?: string;
  vendorName?: string;
  statePcb?: string;
  paymentStatus?: string;
  category?: string;
  materialCategory: string;
  materialName: string;
  weightKg: number;
  ratePerKg: number;
  grossAmount: number;
  statutoryDeduction: number;
  netDisbursed: number;
  paymentMode: 'UPI' | 'NEFT' | 'CASH' | 'ESCROW';
  utrNumber: string;
  settlementUtr?: string;
  status: 'SETTLED' | 'PROCESSING' | 'FLAGGED';
  timestamp: string;
  date?: string;
  gpsCoordinates?: string;
}

export interface MaterialPriceTrend {
  categoryId: string;
  categoryName: string;
  code: string;
  currentFloorRate: number;
  mandiAverageRate: number;
  priceDelta24h: number;
  high7d: number;
  low7d: number;
  lmeBenchmarkUsdPerTon: number;
  lastRevisionDate: string;
  materialId?: string;
  materialName?: string;
  materialName_hi?: string;
  history7d?: any[];
  history30d?: any[];
  history90d?: any[];
  history1y?: any[];
  trend30dPct?: number;
  category?: string;
}

export interface LotPricePoint {
  date: string;
  pcbHigh?: number;
  copperWire?: number;
  battery?: number;
  magnet?: number;
  plastic?: number;
  cpcbRate?: number;
  marketSpotRate?: number;
  [key: string]: any;
}

export interface AuthSession {
  isLoggedIn: boolean;
  role: UserRole;
  user?: {
    id?: string;
    name?: string;
    phone?: string;
    cpcbId?: string;
    [key: string]: any;
  };
  loginTime?: number;
}

export interface RecycledRecord {
  id: string;
  lotId?: string;
  transactionData: TransactionRecord;
  deletedAt: number; // timestamp in ms
  retentionDays: number; // mandatory 12 days
  expiresAt: number; // deletedAt + 12 * 86400000
  deletedByKey: string;
  originalLotData?: EWasteLot;
}

export interface CategoryApprovalRequest {
  id: string;
  proposedCategoryName: string;
  vernacularNameHi: string;
  vernacularNameMr: string;
  scrapCode: string;
  suggestedFloorRate: number;
  suggestedCeilingRate: number;
  hazardClassification: 'safe' | 'medium' | 'high';
  crmYieldEstimated: {
    copperPct: number;
    lithiumPct: number;
    cobaltPct: number;
    neodymiumPct: number;
    goldGramsPerTon: number;
  };
  samplePhotoUrl: string;
  submittedBy: string;
  submittedByName: string;
  submissionDate: string;
  status: 'PENDING_AUDIT' | 'APPROVED' | 'REJECTED';
  reviewOfficer?: string;
  reviewNotes?: string;
  approvalCertificateNo?: string;
}

export interface PartnerRegistration {
  id: string;
  facilityName: string;
  cpcbRegistrationNo: string;
  spcbLicenseNo: string;
  state: string;
  district: string;
  gpsLocation: string;
  capacityMetricTonsPerMonth: number;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  registrationStatus: 'ACTIVE_CERTIFIED' | 'UNDER_INSPECTION' | 'REVOKED';
  registrationDate: string;
  lastInspectionDate: string;
  complianceScore: number;
}

export interface SqliteEngineStatus {
  isInitialized: boolean;
  totalRecordsLoaded: number;
  lastSyncTimestamp: string;
  mode: 'IN_MEMORY' | 'PERSISTENT';
}

export interface HelpDeskMessage {
  id: string;
  senderRole: UserRole | 'system' | 'cpcb_officer';
  senderName: string;
  timestamp: string;
  text: string;
}

export interface HelpDeskTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: 'EPR_TRANSFER' | 'WEIGHBRIDGE' | 'PAYMENT' | 'CATEGORY_REGISTRATION' | 'ANOMALY_DISPUTE';
  userId: string;
  userName: string;
  userRole: UserRole;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  assignedAgentName: string;
  messages: HelpDeskMessage[];
}

export * from './types/materialDetection';
