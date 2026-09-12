import { createClient } from '@supabase/supabase-js';
import { EWasteLot } from '../types';

export const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) ||
  'https://wnrzuuscipslizlzrsvg.supabase.co';

export const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inducnp1dXNjaXBzbGl6bHpyc3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMTAwMjYsImV4cCI6MjEwNDc4NjAyNn0.NI7DlhDwY-HBurKfu3l_5R9U1qpPRIctXoyuVRU2_Vw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * Converts camelCase EWasteLot application object into a Supabase snake_case record
 */
export function lotToSupabaseRecord(lot: Partial<EWasteLot>) {
  const photo = lot.photoUrl || lot.photos?.topView || '';

  const record: Record<string, any> = {
    id: lot.id,
    collector_id: lot.collectorId || 'KBD-MH-4402',
    collector_name: lot.collectorName || 'Ram Sevak (रामसेवक कांबळे)',
    collector_phone: lot.collectorPhone || '+91 98234 56789',
    material_id: lot.materialId || 'mat_pcb_high',
    material_name: lot.materialName || 'E-Waste Scrap',
    category: lot.category || 'pcb',
    weight_kg: Number(lot.weightKg ?? 5.0),
    rate_per_kg: Number(lot.ratePerKg ?? 0),
    total_amount: Number(lot.totalAmount ?? 0),
    status: lot.status || 'pending',
    timestamp: lot.timestamp || new Date().toISOString(),
    gps_location: lot.gpsLocation || '18.5204° N, 73.8567° E (Ward 12, Pune)',
    facility_id: lot.facilityId || 'REC-MH-PN-004',
    facility_name: lot.facilityName || 'EcoMetals CPCB Dismantling Unit #4',
    distance_km: Number(lot.distanceKm ?? 3.8),
    hazard_flag: Boolean(lot.hazardFlag),
    photo_url: photo,
    photos: lot.photos || (photo ? { topView: photo } : {}),
    serial_or_imei: lot.serialOrImei || null,
    requires_sticker: Boolean(lot.requiresSticker),
    anomaly_flag: Boolean(lot.anomalyFlag),
    anomaly_reason: lot.anomalyReason || null,
    is_offline_created: Boolean(lot.isOfflineCreated),
    needs_online_ai_categorization: Boolean(lot.needsOnlineAiCategorization)
  };

  if (lot.hazardNote !== undefined) record.hazard_note = lot.hazardNote;
  if (lot.weighbridgeWeightKg !== undefined) record.weighbridge_weight_kg = Number(lot.weighbridgeWeightKg);
  if (lot.finalPayoutAmount !== undefined) record.final_payout_amount = Number(lot.finalPayoutAmount);
  if (lot.paymentMode !== undefined) record.payment_mode = lot.paymentMode;
  if (lot.eprCreditKg !== undefined) record.epr_credit_kg = Number(lot.eprCreditKg);
  if (lot.isOutOfCategory !== undefined) record.is_out_of_category = Boolean(lot.isOutOfCategory);
  if (lot.isPendingCategoryApproval !== undefined) record.is_pending_category_approval = Boolean(lot.isPendingCategoryApproval);
  if (lot.requestedCategoryName !== undefined) record.requested_category_name = lot.requestedCategoryName;
  if (lot.paidAt !== undefined) record.paid_at = lot.paidAt;
  if (lot.paidTimestamp !== undefined) record.paid_timestamp = Number(lot.paidTimestamp);
  if (lot.settlementUtr !== undefined) record.settlement_utr = lot.settlementUtr;

  return record;
}

/**
 * Converts Supabase snake_case record into camelCase EWasteLot application object
 */
export function supabaseRecordToLot(record: any): EWasteLot {
  const photos = typeof record.photos === 'string' ? JSON.parse(record.photos) : record.photos || {};
  const photoUrl = record.photo_url || photos.topView || '';

  return {
    id: record.id,
    collectorId: record.collector_id || 'KBD-MH-4402',
    collectorName: record.collector_name || 'Ram Sevak',
    collectorPhone: record.collector_phone || '+91 98234 56789',
    materialId: record.material_id || 'mat_pcb_high',
    materialName: record.material_name || 'E-Waste Scrap',
    category: record.category || 'pcb',
    weightKg: Number(record.weight_kg ?? 0),
    ratePerKg: Number(record.rate_per_kg ?? 0),
    totalAmount: Number(record.total_amount ?? 0),
    status: record.status || 'pending',
    paymentMode: record.payment_mode || undefined,
    timestamp: record.timestamp || record.created_at || new Date().toISOString(),
    gpsLocation: record.gps_location || '18.5204° N, 73.8567° E (Ward 12, Pune)',
    facilityId: record.facility_id || 'REC-MH-PN-004',
    facilityName: record.facility_name || 'EcoMetals CPCB Dismantling Unit #4',
    distanceKm: Number(record.distance_km ?? 3.8),
    hazardFlag: Boolean(record.hazard_flag),
    hazardNote: record.hazard_note || undefined,
    photoUrl,
    photos: Object.keys(photos).length > 0 ? photos : (photoUrl ? { topView: photoUrl } : undefined),
    serialOrImei: record.serial_or_imei || undefined,
    requiresSticker: Boolean(record.requires_sticker),
    anomalyFlag: Boolean(record.anomaly_flag),
    anomalyReason: record.anomaly_reason || undefined,
    isOfflineCreated: Boolean(record.is_offline_created),
    needsOnlineAiCategorization: Boolean(record.needs_online_ai_categorization),
    isOutOfCategory: Boolean(record.is_out_of_category),
    isPendingCategoryApproval: Boolean(record.is_pending_category_approval),
    requestedCategoryName: record.requested_category_name || undefined,
    weighbridgeWeightKg: record.weighbridge_weight_kg !== null && record.weighbridge_weight_kg !== undefined ? Number(record.weighbridge_weight_kg) : undefined,
    finalPayoutAmount: record.final_payout_amount !== null && record.final_payout_amount !== undefined ? Number(record.final_payout_amount) : undefined,
    eprCreditKg: record.epr_credit_kg !== null && record.epr_credit_kg !== undefined ? Number(record.epr_credit_kg) : undefined,
    paidAt: record.paid_at || undefined,
    paidTimestamp: record.paid_timestamp !== null && record.paid_timestamp !== undefined ? Number(record.paid_timestamp) : undefined,
    settlementUtr: record.settlement_utr || undefined
  };
}

export default supabase;
