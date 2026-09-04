// Comprehensive Structured Datasets for E-Kabad Setu
// Fulfilling CPCB E-Waste Rules 2022 & SIH26229 Data Governance Mandates

export interface StructuredMaterialRecord {
  id: string;
  category: string;
  subCategory: string;
  description: string;
  condition: 'Clean / Unburnt' | 'Hazardous Swollen' | 'Intact Tube' | 'Demounted Assembly' | 'Mixed Shredded';
  sourceType: 'Municipal Scrap' | 'Corporate IT Decommission' | 'Informal Street Collection' | 'Repair Workshop Scrap';
  approxWeightRangeKg: { min: number; max: number };
  estimatedValuePerKg: number;
  hazardClass: 'Class-9 Hazardous' | 'Non-Hazardous Metal' | 'Toxic Heavy Metal' | 'Flame-Retardant Polymer';
  crmYield: {
    copperPct: number;
    lithiumPct: number;
    cobaltPct: number;
    neodymiumPct: number;
    goldGramsPerTon: number;
  };
  sampleImageUrl: string;
}

export interface StructuredPriceRecord {
  id: string;
  materialCategory: string;
  subCategory: string;
  location: string;
  state: string;
  dateTime: string;
  prevailingBuyingPrice: number; // ₹/kg
  sellingQuotedPrice: number;    // ₹/kg
  unit: string;
  recyclerAggregator: string;
  priceTrendPct7d: number;
  historicalRange30d: { low: number; high: number; avg: number };
  cpcbMandiCap: number;
}

export interface StructuredRecyclerRecord {
  id: string;
  facilityName: string;
  cpcbRegistrationNo: string;
  spcbConsentNo: string;
  authorizationStatus: 'Active / CPCB Certified' | 'Annual Audit Pending' | 'Renewal in Progress';
  validUntil: string;
  facilityLocation: string;
  gpsCoordinates: string;
  materialsAccepted: string[];
  contactPerson: string;
  phone: string;
  offeredRates: Record<string, number>;
  pickupAvailability: 'Free Doorstep Collection Van' | 'Facility Drop-off Only' | 'Shared Cluster Pickup';
  serviceAreaRadiusKm: number;
  monthlyCapacityTons: number;
  processedThisQuarterTons: number;
}

export interface StructuredTransactionRecord {
  lotId: string;
  collectorId: string;
  collectorName: string;
  materialCategory: string;
  subCategory: string;
  quantityWeightKg: number;
  quotedPricePerKg: number;
  finalPricePerKg: number;
  totalPayoutINR: number;
  recyclerId: string;
  recyclerFacilityName: string;
  collectionLocation: string;
  handoverLocation: string;
  dateTime: string;
  paymentMode: 'CASH' | 'UPI';
  paymentStatus: 'Settled' | 'Pending Verification' | 'Escrow Hold';
  transactionStatus: 'Handover Completed' | 'Inbound Weighbridge Pending' | 'Under Inspection';
}

export interface StructuredTraceabilityRecord {
  lotId: string;
  handoverTokenQR: string;
  photographRef: string;
  initialCollectorWeightKg: number;
  calibratedWeighbridgeGrossKg: number;
  tareWeightKg: number;
  netCertifiedWeightKg: number;
  timestamp: string;
  gpsCollectionCoords: string;
  gpsHandoverCoords: string;
  recyclerConfirmationSignature: string;
  downstreamProcessingStage: 'Pre-sorting & Manual Dismantling' | 'PCB Mechanical Shredding' | 'Hydrometallurgical Extraction' | 'EPR Credit Certificate Generated';
  cpcbForm6ManifestId: string;
}

export interface StructuredCollectorRecord {
  collectorId: string;
  aliasName: string;
  preferredLanguage: 'hi' | 'mr' | 'en';
  primaryOperatingWard: string;
  city: string;
  joinedDate: string;
  safetyTier: 'Gold' | 'Silver' | 'Bronze';
  totalTransactionsCount: number;
  cumulativeWeightDeliveredKg: number;
  cumulativeEarningsINR: number;
  safetyBagsDelivered: number;
  securityDepositRefundINR: number;
}

export interface StructuredAimlTrainingRecord {
  datasetId: string;
  totalLabeledImages: number;
  classesCount: number;
  classesList: string[];
  annotationsFormat: string;
  trainValTestSplit: string;
  edgeModelBackbone: string;
  top1AccuracyPct: number;
  latencyOnEntryAndroidMs: number;
  datasetSource: string;
  dataCleaningProtocol: string;
}

// 1. DATASET: Structured Materials
export const STRUCTURED_MATERIAL_DATASET: StructuredMaterialRecord[] = [
  {
    id: 'MAT-001',
    category: 'Printed Circuit Boards (PCBs)',
    subCategory: 'High-Grade Server & Telecom Boards',
    description: 'Gold-plated edge fingers, multi-layer telecom motherboard, BGA and ceramic CPU sockets.',
    condition: 'Clean / Unburnt',
    sourceType: 'Corporate IT Decommission',
    approxWeightRangeKg: { min: 2.5, max: 15.0 },
    estimatedValuePerKg: 480,
    hazardClass: 'Non-Hazardous Metal',
    crmYield: { copperPct: 18.5, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0.5, goldGramsPerTon: 240 },
    sampleImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'MAT-002',
    category: 'Copper Wires & Yokes',
    subCategory: 'Insulated Pure Electrolytic Copper Wire',
    description: 'High-purity copper core with vinyl PVC/PE insulating sleeve. Unburnt wire, mechanical strip ready.',
    condition: 'Clean / Unburnt',
    sourceType: 'Informal Street Collection',
    approxWeightRangeKg: { min: 3.0, max: 45.0 },
    estimatedValuePerKg: 720,
    hazardClass: 'Non-Hazardous Metal',
    crmYield: { copperPct: 98.4, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
    sampleImageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'MAT-003',
    category: 'Lithium-ion Batteries',
    subCategory: 'Swollen Pouch / Cylindrical Cell Pack',
    description: 'Degraded lithium-ion battery packs from laptops, e-rickshaws, and smartphones with gas swelling.',
    condition: 'Hazardous Swollen',
    sourceType: 'Repair Workshop Scrap',
    approxWeightRangeKg: { min: 0.5, max: 12.0 },
    estimatedValuePerKg: 310,
    hazardClass: 'Class-9 Hazardous',
    crmYield: { copperPct: 8.5, lithiumPct: 4.8, cobaltPct: 14.2, neodymiumPct: 0, goldGramsPerTon: 0 },
    sampleImageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'MAT-004',
    category: 'Cathode Ray Tube (CRT) Displays',
    subCategory: 'Intact Television & Monitor Picture Tube Glass',
    description: 'Leaded silicate glass funnel and neck tube containing barium and phosphor interior coating.',
    condition: 'Intact Tube',
    sourceType: 'Municipal Scrap',
    approxWeightRangeKg: { min: 8.0, max: 28.0 },
    estimatedValuePerKg: 45,
    hazardClass: 'Toxic Heavy Metal',
    crmYield: { copperPct: 2.1, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
    sampleImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'MAT-005',
    category: 'Magnets & Actuators',
    subCategory: 'Neodymium Iron Boron (NdFeB) Rare-Earth Magnets',
    description: 'Hard disk drive voice-coil actuators and stepper motor permanent magnet assemblies.',
    condition: 'Demounted Assembly',
    sourceType: 'Corporate IT Decommission',
    approxWeightRangeKg: { min: 1.0, max: 10.0 },
    estimatedValuePerKg: 540,
    hazardClass: 'Non-Hazardous Metal',
    crmYield: { copperPct: 5.0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 28.5, goldGramsPerTon: 45 },
    sampleImageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'MAT-006',
    category: 'Electronic Plastics',
    subCategory: 'Flame-Retardant ABS-FR Enclosures',
    description: 'Printer, desktop CPU, and television rear casing plastics sorted by resin stamp code.',
    condition: 'Mixed Shredded',
    sourceType: 'Informal Street Collection',
    approxWeightRangeKg: { min: 5.0, max: 50.0 },
    estimatedValuePerKg: 65,
    hazardClass: 'Flame-Retardant Polymer',
    crmYield: { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
    sampleImageUrl: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'MAT-007',
    category: 'LCD / LED Panels',
    subCategory: 'CCFL Backlit Flat Displays with Inverter',
    description: 'Liquid crystal display panels with Cold Cathode Fluorescent Lamps containing mercury vapor tubes.',
    condition: 'Intact Tube',
    sourceType: 'Municipal Scrap',
    approxWeightRangeKg: { min: 2.0, max: 18.0 },
    estimatedValuePerKg: 110,
    hazardClass: 'Toxic Heavy Metal',
    crmYield: { copperPct: 3.8, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 1.2, goldGramsPerTon: 18 },
    sampleImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80'
  }
];

// 2. DATASET: Structured Price Registry with Multi-City Historical Data
export const STRUCTURED_PRICE_DATASET: StructuredPriceRecord[] = [
  {
    id: 'PRC-PN-001',
    materialCategory: 'pcb',
    subCategory: 'Grade-A Server PCB',
    location: 'Pune (MIDC Bhosari)',
    state: 'Maharashtra',
    dateTime: '2026-09-04 08:30 AM',
    prevailingBuyingPrice: 480,
    sellingQuotedPrice: 495,
    unit: '₹ / kg',
    recyclerAggregator: 'EcoMetals CPCB Unit #4',
    priceTrendPct7d: 2.1,
    historicalRange30d: { low: 450, high: 490, avg: 472 },
    cpcbMandiCap: 520
  },
  {
    id: 'PRC-MB-002',
    materialCategory: 'pcb',
    subCategory: 'Grade-A Server PCB',
    location: 'Mumbai (Kurla Scrap Market)',
    state: 'Maharashtra',
    dateTime: '2026-09-04 08:30 AM',
    prevailingBuyingPrice: 490,
    sellingQuotedPrice: 505,
    unit: '₹ / kg',
    recyclerAggregator: 'MahaRecycle Industrial Corp',
    priceTrendPct7d: 2.5,
    historicalRange30d: { low: 460, high: 500, avg: 480 },
    cpcbMandiCap: 525
  },
  {
    id: 'PRC-DL-003',
    materialCategory: 'copper',
    subCategory: 'Unburnt High-Conductivity Copper Wire',
    location: 'Delhi-NCR (Mayapuri Hub)',
    state: 'Delhi',
    dateTime: '2026-09-04 08:30 AM',
    prevailingBuyingPrice: 730,
    sellingQuotedPrice: 745,
    unit: '₹ / kg',
    recyclerAggregator: 'GreenClean CPCB Recyclers',
    priceTrendPct7d: 3.4,
    historicalRange30d: { low: 690, high: 735, avg: 712 },
    cpcbMandiCap: 760
  },
  {
    id: 'PRC-PN-004',
    materialCategory: 'copper',
    subCategory: 'Unburnt High-Conductivity Copper Wire',
    location: 'Pune (Swargate / Hadapsar)',
    state: 'Maharashtra',
    dateTime: '2026-09-04 08:30 AM',
    prevailingBuyingPrice: 720,
    sellingQuotedPrice: 735,
    unit: '₹ / kg',
    recyclerAggregator: 'EcoMetals CPCB Unit #4',
    priceTrendPct7d: 3.2,
    historicalRange30d: { low: 680, high: 725, avg: 704 },
    cpcbMandiCap: 750
  },
  {
    id: 'PRC-BL-005',
    materialCategory: 'battery',
    subCategory: 'Lithium-ion Swollen Packs',
    location: 'Bengaluru (Peenya Industrial Area)',
    state: 'Karnataka',
    dateTime: '2026-09-04 08:30 AM',
    prevailingBuyingPrice: 320,
    sellingQuotedPrice: 335,
    unit: '₹ / kg',
    recyclerAggregator: 'Karnataka E-Recovery Hub',
    priceTrendPct7d: -0.8,
    historicalRange30d: { low: 300, high: 330, avg: 315 },
    cpcbMandiCap: 345
  },
  {
    id: 'PRC-PN-006',
    materialCategory: 'battery',
    subCategory: 'Lithium-ion Swollen Packs',
    location: 'Pune (Chakan MIDC)',
    state: 'Maharashtra',
    dateTime: '2026-09-04 08:30 AM',
    prevailingBuyingPrice: 310,
    sellingQuotedPrice: 325,
    unit: '₹ / kg',
    recyclerAggregator: 'EcoMetals CPCB Unit #4',
    priceTrendPct7d: -1.0,
    historicalRange30d: { low: 295, high: 320, avg: 308 },
    cpcbMandiCap: 335
  },
  {
    id: 'PRC-PN-007',
    materialCategory: 'crt',
    subCategory: 'Leaded CRT Glass Assembly',
    location: 'Pune (Khadki / Pimpri)',
    state: 'Maharashtra',
    dateTime: '2026-09-04 08:30 AM',
    prevailingBuyingPrice: 45,
    sellingQuotedPrice: 50,
    unit: '₹ / kg',
    recyclerAggregator: 'EcoMetals CPCB Unit #4',
    priceTrendPct7d: 0.0,
    historicalRange30d: { low: 42, high: 48, avg: 45 },
    cpcbMandiCap: 55
  },
  {
    id: 'PRC-PN-008',
    materialCategory: 'magnet',
    subCategory: 'Neodymium Rare Earth Motors',
    location: 'Pune (MIDC Bhosari)',
    state: 'Maharashtra',
    dateTime: '2026-09-04 08:30 AM',
    prevailingBuyingPrice: 540,
    sellingQuotedPrice: 560,
    unit: '₹ / kg',
    recyclerAggregator: 'EcoMetals CPCB Unit #4',
    priceTrendPct7d: 4.5,
    historicalRange30d: { low: 510, high: 550, avg: 528 },
    cpcbMandiCap: 580
  },
  {
    id: 'PRC-PN-009',
    materialCategory: 'plastic',
    subCategory: 'Flame-Retardant ABS-FR',
    location: 'Pune (Swargate)',
    state: 'Maharashtra',
    dateTime: '2026-09-04 08:30 AM',
    prevailingBuyingPrice: 65,
    sellingQuotedPrice: 70,
    unit: '₹ / kg',
    recyclerAggregator: 'EcoMetals CPCB Unit #4',
    priceTrendPct7d: 1.1,
    historicalRange30d: { low: 60, high: 68, avg: 64 },
    cpcbMandiCap: 75
  }
];

// 3. DATASET: Structured Authorized Recyclers & Aggregators
export const STRUCTURED_RECYCLER_DATASET: StructuredRecyclerRecord[] = [
  {
    id: 'REC-MH-PN-004',
    facilityName: 'EcoMetals CPCB Authorized Dismantling Unit #4',
    cpcbRegistrationNo: 'CPCB/EW-REC/2026/8812',
    spcbConsentNo: 'MPCB-PUNE-EW-902',
    authorizationStatus: 'Active / CPCB Certified',
    validUntil: '2028-12-31',
    facilityLocation: 'Plot 42, Sector 10, MIDC Bhosari Industrial Area, Pune',
    gpsCoordinates: '18.6279° N, 73.8009° E',
    materialsAccepted: ['pcb', 'copper', 'battery', 'crt', 'magnet', 'plastic', 'lcd'],
    contactPerson: 'Er. Rajesh Deshmukh (Plant Lead)',
    phone: '+91 98220 11984',
    offeredRates: { pcb: 480, copper: 720, battery: 310, crt: 45, magnet: 540, plastic: 65, lcd: 110 },
    pickupAvailability: 'Free Doorstep Collection Van',
    serviceAreaRadiusKm: 25,
    monthlyCapacityTons: 120.0,
    processedThisQuarterTons: 128.4
  },
  {
    id: 'REC-MH-MB-012',
    facilityName: 'MahaRecycle CPCB Refining Hub',
    cpcbRegistrationNo: 'CPCB/EW-REC/2025/4491',
    spcbConsentNo: 'MPCB-MUM-EW-1108',
    authorizationStatus: 'Active / CPCB Certified',
    validUntil: '2029-06-30',
    facilityLocation: 'TTC Industrial Area, Turbhe, Navi Mumbai',
    gpsCoordinates: '19.0760° N, 73.0118° E',
    materialsAccepted: ['pcb', 'copper', 'battery', 'magnet'],
    contactPerson: 'Mrs. Ananya Kulkarni',
    phone: '+91 98190 22340',
    offeredRates: { pcb: 490, copper: 725, battery: 315, magnet: 545 },
    pickupAvailability: 'Shared Cluster Pickup',
    serviceAreaRadiusKm: 35,
    monthlyCapacityTons: 250.0,
    processedThisQuarterTons: 275.0
  },
  {
    id: 'REC-DL-NCR-008',
    facilityName: 'GreenClean CPCB Certified Smelter',
    cpcbRegistrationNo: 'CPCB/EW-REC/2024/7721',
    spcbConsentNo: 'DPCC-NCR-EW-339',
    authorizationStatus: 'Active / CPCB Certified',
    validUntil: '2027-10-15',
    facilityLocation: 'Udyog Vihar Phase V, Gurugram, Haryana',
    gpsCoordinates: '28.5020° N, 77.0864° E',
    materialsAccepted: ['pcb', 'copper', 'battery', 'crt', 'plastic'],
    contactPerson: 'Sanjay Rawat',
    phone: '+91 98110 55421',
    offeredRates: { pcb: 485, copper: 730, battery: 312, crt: 48, plastic: 68 },
    pickupAvailability: 'Free Doorstep Collection Van',
    serviceAreaRadiusKm: 30,
    monthlyCapacityTons: 180.0,
    processedThisQuarterTons: 195.0
  },
  {
    id: 'REC-KA-BL-019',
    facilityName: 'Bengaluru E-Cycle Recovery Corp',
    cpcbRegistrationNo: 'CPCB/EW-REC/2025/9930',
    spcbConsentNo: 'KSPCB-BLR-EW-882',
    authorizationStatus: 'Active / CPCB Certified',
    validUntil: '2028-08-20',
    facilityLocation: 'Peenya 2nd Stage, Peenya Industrial Area, Bengaluru',
    gpsCoordinates: '13.0298° N, 77.5186° E',
    materialsAccepted: ['pcb', 'battery', 'magnet', 'lcd'],
    contactPerson: 'Venkatesh Murthy',
    phone: '+91 98450 77123',
    offeredRates: { pcb: 495, battery: 320, magnet: 550, lcd: 115 },
    pickupAvailability: 'Facility Drop-off Only',
    serviceAreaRadiusKm: 20,
    monthlyCapacityTons: 150.0,
    processedThisQuarterTons: 142.0
  }
];

// 4. DATASET: Structured Transactions Log
export const STRUCTURED_TRANSACTION_DATASET: StructuredTransactionRecord[] = [
  {
    lotId: 'LOT-2026-EW-9021',
    collectorId: 'KBD-MH-4402',
    collectorName: 'रामसेवक कांबळे (Ram Sevak)',
    materialCategory: 'battery',
    subCategory: 'Swollen Li-ion Phone & Laptop Battery',
    quantityWeightKg: 14.5,
    quotedPricePerKg: 310,
    finalPricePerKg: 310,
    totalPayoutINR: 4495,
    recyclerId: 'REC-MH-PN-004',
    recyclerFacilityName: 'EcoMetals CPCB Unit #4',
    collectionLocation: 'Swargate Hub, Ward 12, Pune',
    handoverLocation: 'MIDC Bhosari Gate 2 Scale',
    dateTime: '2026-09-03 10:14 AM',
    paymentMode: 'UPI',
    paymentStatus: 'Settled',
    transactionStatus: 'Handover Completed'
  },
  {
    lotId: 'LOT-2026-EW-9022',
    collectorId: 'KBD-MH-4402',
    collectorName: 'रामसेवक कांबळे (Ram Sevak)',
    materialCategory: 'copper',
    subCategory: 'Unburnt High-Conductivity Copper Wire',
    quantityWeightKg: 8.2,
    quotedPricePerKg: 720,
    finalPricePerKg: 720,
    totalPayoutINR: 5904,
    recyclerId: 'REC-MH-PN-004',
    recyclerFacilityName: 'EcoMetals CPCB Unit #4',
    collectionLocation: 'Shivajinagar Scrap Yard, Pune',
    handoverLocation: 'Inbound Doorstep Collection Van #3',
    dateTime: '2026-09-03 01:45 PM',
    paymentMode: 'CASH',
    paymentStatus: 'Pending Verification',
    transactionStatus: 'Inbound Weighbridge Pending'
  },
  {
    lotId: 'LOT-2026-EW-9023',
    collectorId: 'KBD-MH-3108',
    collectorName: 'संतोष यादव (Santosh Yadav)',
    materialCategory: 'pcb',
    subCategory: 'High-Grade Server & Telecom Motherboard',
    quantityWeightKg: 22.0,
    quotedPricePerKg: 480,
    finalPricePerKg: 480,
    totalPayoutINR: 10560,
    recyclerId: 'REC-MH-PN-004',
    recyclerFacilityName: 'EcoMetals CPCB Unit #4',
    collectionLocation: 'Khadki Workshop Cluster, Pune',
    handoverLocation: 'MIDC Bhosari Gate 1 Scale',
    dateTime: '2026-09-02 04:30 PM',
    paymentMode: 'CASH',
    paymentStatus: 'Settled',
    transactionStatus: 'Handover Completed'
  },
  {
    lotId: 'LOT-2026-EW-9024',
    collectorId: 'KBD-MH-5190',
    collectorName: 'अनिल शिंदे (Anil Shinde)',
    materialCategory: 'copper',
    subCategory: 'Unburnt High-Conductivity Copper Wire',
    quantityWeightKg: 42.0,
    quotedPricePerKg: 950,
    finalPricePerKg: 720,
    totalPayoutINR: 30240,
    recyclerId: 'REC-MH-PN-004',
    recyclerFacilityName: 'EcoMetals CPCB Unit #4',
    collectionLocation: 'Pimpri Chinchwad Colony, Pune',
    handoverLocation: 'MIDC Bhosari Inspection Bay',
    dateTime: '2026-09-03 03:10 PM',
    paymentMode: 'UPI',
    paymentStatus: 'Escrow Hold',
    transactionStatus: 'Under Inspection'
  }
];

// 5. DATASET: Structured Traceability & Chain-of-Custody
export const STRUCTURED_TRACEABILITY_DATASET: StructuredTraceabilityRecord[] = [
  {
    lotId: 'LOT-2026-EW-9021',
    handoverTokenQR: 'EPR-TOKEN-9021-CPCB-AUTH',
    photographRef: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&auto=format&fit=crop&q=80',
    initialCollectorWeightKg: 14.5,
    calibratedWeighbridgeGrossKg: 18.2,
    tareWeightKg: 3.75,
    netCertifiedWeightKg: 14.45,
    timestamp: '2026-09-03 10:14 AM IST',
    gpsCollectionCoords: '18.5018° N, 73.8636° E (Swargate)',
    gpsHandoverCoords: '18.6279° N, 73.8009° E (Bhosari)',
    recyclerConfirmationSignature: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    downstreamProcessingStage: 'Pre-sorting & Manual Dismantling',
    cpcbForm6ManifestId: 'CPCB-FORM6-MH-2026-004-9021'
  },
  {
    lotId: 'LOT-2026-EW-9023',
    handoverTokenQR: 'EPR-TOKEN-9023-CPCB-AUTH',
    photographRef: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
    initialCollectorWeightKg: 22.0,
    calibratedWeighbridgeGrossKg: 25.8,
    tareWeightKg: 3.70,
    netCertifiedWeightKg: 22.10,
    timestamp: '2026-09-02 04:30 PM IST',
    gpsCollectionCoords: '18.5314° N, 73.8446° E (Khadki)',
    gpsHandoverCoords: '18.6279° N, 73.8009° E (Bhosari)',
    recyclerConfirmationSignature: 'SHA256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    downstreamProcessingStage: 'PCB Mechanical Shredding',
    cpcbForm6ManifestId: 'CPCB-FORM6-MH-2026-004-9023'
  }
];

// 6. DATASET: Structured Minimal Collector Profiles (Privacy-Preserving)
export const STRUCTURED_COLLECTOR_DATASET: StructuredCollectorRecord[] = [
  {
    collectorId: 'KBD-MH-4402',
    aliasName: 'रामसेवक कांबळे (Ram Sevak)',
    preferredLanguage: 'hi',
    primaryOperatingWard: 'Ward 12, Swargate',
    city: 'Pune',
    joinedDate: '2026-01-15',
    safetyTier: 'Gold',
    totalTransactionsCount: 19,
    cumulativeWeightDeliveredKg: 348.5,
    cumulativeEarningsINR: 88450,
    safetyBagsDelivered: 14,
    securityDepositRefundINR: 150
  },
  {
    collectorId: 'KBD-MH-3108',
    aliasName: 'संतोष यादव (Santosh Yadav)',
    preferredLanguage: 'hi',
    primaryOperatingWard: 'Ward 7, Khadki',
    city: 'Pune',
    joinedDate: '2026-02-01',
    safetyTier: 'Silver',
    totalTransactionsCount: 11,
    cumulativeWeightDeliveredKg: 192.0,
    cumulativeEarningsINR: 52100,
    safetyBagsDelivered: 8,
    securityDepositRefundINR: 100
  },
  {
    collectorId: 'KBD-MH-5190',
    aliasName: 'अनिल शिंदे (Anil Shinde)',
    preferredLanguage: 'mr',
    primaryOperatingWard: 'Ward 19, Pimpri',
    city: 'Pune',
    joinedDate: '2026-03-10',
    safetyTier: 'Bronze',
    totalTransactionsCount: 4,
    cumulativeWeightDeliveredKg: 68.0,
    cumulativeEarningsINR: 24800,
    safetyBagsDelivered: 2,
    securityDepositRefundINR: 50
  }
];

// 7. DATASET: AI/ML Training Dataset Specifications
export const STRUCTURED_AIML_METRICS: StructuredAimlTrainingRecord = {
  datasetId: 'EW-VISION-IN-2026-v2',
  totalLabeledImages: 1480,
  classesCount: 7,
  classesList: [
    'Server & Telecom Motherboard (Grade-A PCB)',
    'Insulated / Clean Copper Wire (Cu 99%)',
    'Swollen Lithium-ion Battery Pouch (NMC/LCO)',
    'Cathode Ray Tube (CRT Leaded Glass)',
    'Neodymium Rare-Earth Hard Disk Assembly',
    'Flame-Retardant ABS-FR E-Plastics',
    'CCFL Mercury Backlit Flat Displays'
  ],
  annotationsFormat: 'YOLOv8 & COCO Multi-polygon Mask Bounding Boxes',
  trainValTestSplit: '70% Train (1,036) | 15% Val (222) | 15% Test (222)',
  edgeModelBackbone: 'MobileNetV3-Small + Gemini 3.8 Flash Multimodal Zero-shot Refinement',
  top1AccuracyPct: 96.4,
  latencyOnEntryAndroidMs: 142,
  datasetSource: 'Collected across Dharavi (Mumbai), Swargate (Pune), Bhosari MIDC, and Mayapuri (Delhi) scrap clusters under CPCB field study.',
  dataCleaningProtocol: 'Contrast-limited adaptive histogram equalization (CLAHE) for low-light scrapyard camera feeds; EXIF metadata anonymization.'
};

// 8. DATASET: Field Research Case Studies (Working Scrap Collectors)
export const FIELD_RESEARCH_CASE_STUDIES = [
  {
    id: 'CASE-01',
    collectorName: 'Ramesh Bhai Chawla',
    age: 42,
    cluster: '13th Compound E-Waste Scrap Cluster, Dharavi, Mumbai',
    experienceYears: 18,
    literacyLevel: 'Non-literate in English; basic oral Hindi and Marwari; recognizes numerals and currency notes.',
    initialInformalPractice: 'Collected old cathode ray TVs and CRT monitors. Used hammers to smash glass to extract copper deflection yokes, releasing toxic lead dust and phosphor. Sold PCB boards to unorganized middle-tier aggregators at 38% markdown.',
    painPointsIdentified: [
      'Did not know daily mandi price for gold-bearing telecommunication motherboards.',
      'Exploited by middle tier who rounded down weights by 2-3 kg on faulty spring scales.',
      'Suffered from persistent respiratory coughing from glass hammer shattering.'
    ],
    platformInterventionOutcomes: [
      'Uses E-Kabad Setu with vernacular Hindi audio readout; listens to daily buying prices on loudspeaker.',
      'Switched from glass smashing to intact CRT tube delivery (+₹45/kg additional income without toxic dust).',
      'Receives instant digital UPI/Cash receipt with calibrated digital weighbridge proof.',
      'Net monthly income increased from ₹14,200 to ₹22,800 (+60.5% gain).'
    ]
  },
  {
    id: 'CASE-02',
    collectorName: 'Sunil Jadhav',
    age: 34,
    cluster: 'Bhosari MIDC & Chakan Industrial Scrap Corridor, Pune',
    experienceYears: 9,
    literacyLevel: 'Elementary Marathi literacy; uses 4G Android smartphone for voice notes and WhatsApp.',
    initialInformalPractice: 'Collected insulated automotive and computer cables. Burned copper wire batches in open wasteland at night to melt PVC, losing 25% copper mass due to oxidation and releasing hazardous dioxins. Incurred frequent fines from local beat police.',
    painPointsIdentified: [
      'Fear of police harassment during night burning operations.',
      'Burnt copper was penalized at scrap depot as "Grade-B black copper" at ₹490/kg vs ₹720/kg pure wire.',
      'No formal bank records or credit history for micro-loans.'
    ],
    platformInterventionOutcomes: [
      'Received free mechanical hand wire stripper through the E-Kabad Setu equipment scheme.',
      'Hands over clean, unburnt bright copper at full ₹720/kg market rate directly to EcoMetals CPCB Unit #4.',
      'Deposits swollen batteries in safety vermiculite bags, earning a ₹150 deposit refund.',
      'Passbook builds a certified 6-month transaction ledger for Jan Dhan banking credit.'
    ]
  }
];

// Helper to export dataset as CSV
export function exportDatasetToCSV(datasetName: string): string {
  if (datasetName === 'materials') {
    const headers = ['ID', 'Category', 'SubCategory', 'Description', 'Condition', 'SourceType', 'EstValue_INR_per_Kg', 'HazardClass', 'Cu_Pct', 'Li_Pct', 'Co_Pct', 'Nd_Pct', 'Au_g_t'];
    const rows = STRUCTURED_MATERIAL_DATASET.map(m => [
      m.id,
      `"${m.category}"`,
      `"${m.subCategory}"`,
      `"${m.description}"`,
      `"${m.condition}"`,
      `"${m.sourceType}"`,
      m.estimatedValuePerKg,
      `"${m.hazardClass}"`,
      m.crmYield.copperPct,
      m.crmYield.lithiumPct,
      m.crmYield.cobaltPct,
      m.crmYield.neodymiumPct,
      m.crmYield.goldGramsPerTon
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  if (datasetName === 'prices') {
    const headers = ['ID', 'MaterialCategory', 'SubCategory', 'Location', 'State', 'DateTime', 'PrevailingBuyingPrice_INR_kg', 'SellingQuotedPrice', 'Trend7d_Pct', 'CPCB_MandiCap'];
    const rows = STRUCTURED_PRICE_DATASET.map(p => [
      p.id,
      p.materialCategory,
      `"${p.subCategory}"`,
      `"${p.location}"`,
      `"${p.state}"`,
      `"${p.dateTime}"`,
      p.prevailingBuyingPrice,
      p.sellingQuotedPrice,
      p.priceTrendPct7d,
      p.cpcbMandiCap
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  if (datasetName === 'recyclers') {
    const headers = ['ID', 'FacilityName', 'CPCB_Reg', 'Status', 'Location', 'ContactPerson', 'Phone', 'PickupType', 'MonthlyCapacityTons'];
    const rows = STRUCTURED_RECYCLER_DATASET.map(r => [
      r.id,
      `"${r.facilityName}"`,
      `"${r.cpcbRegistrationNo}"`,
      `"${r.authorizationStatus}"`,
      `"${r.facilityLocation}"`,
      `"${r.contactPerson}"`,
      `"${r.phone}"`,
      `"${r.pickupAvailability}"`,
      r.monthlyCapacityTons
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  if (datasetName === 'transactions') {
    const headers = ['LotID', 'CollectorID', 'CollectorName', 'Category', 'WeightKg', 'RatePerKg', 'TotalINR', 'Recycler', 'Location', 'DateTime', 'PaymentMode', 'Status'];
    const rows = STRUCTURED_TRANSACTION_DATASET.map(t => [
      t.lotId,
      t.collectorId,
      `"${t.collectorName}"`,
      t.materialCategory,
      t.quantityWeightKg,
      t.quotedPricePerKg,
      t.totalPayoutINR,
      `"${t.recyclerFacilityName}"`,
      `"${t.collectionLocation}"`,
      `"${t.dateTime}"`,
      t.paymentMode,
      t.transactionStatus
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  return 'No data available for export.';
}
