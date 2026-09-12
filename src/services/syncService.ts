import { supabase } from '../lib/supabase';
import { EWasteLot, MaterialItem, CollectorProfile } from '../types';

export interface SyncQueueItem {
  id: string;
  tableName: 'lots' | 'materials' | 'collectors' | 'transactions';
  recordId: string;
  action: 'insert' | 'update' | 'upsert' | 'delete';
  payload: any;
  timestamp: string;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'ekabad_sync_queue_v1';
const LAST_SYNC_KEY = 'ekabad_last_sync_timestamp_v1';

/**
 * Read current pending sync queue from localStorage.
 */
export function getSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error reading sync queue from localStorage:', err);
    return [];
  }
}

/**
 * Save sync queue back to localStorage.
 */
function saveSyncQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Error saving sync queue to localStorage:', err);
  }
}

/**
 * Add a mutation action to the offline sync queue.
 * Ensures the action is persisted locally immediately.
 */
export function enqueueSyncAction(
  tableName: 'lots' | 'materials' | 'collectors' | 'transactions',
  action: 'insert' | 'update' | 'upsert' | 'delete',
  recordId: string,
  payload: any
): void {
  const queue = getSyncQueue();

  // If there's an existing pending action for this exact record, replace with the newest state (last-write-wins)
  const existingIdx = queue.findIndex((item) => item.tableName === tableName && item.recordId === recordId);

  const newItem: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tableName,
    recordId,
    action,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = newItem;
  } else {
    queue.push(newItem);
  }

  saveSyncQueue(queue);

  // If currently online, trigger an immediate drain attempt in the background
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    processSyncQueue().catch((err) => console.warn('Background auto-sync failed:', err));
  }
}

/**
 * Transform camelCase Lot object to snake_case Supabase table columns
 */
function mapLotToSupabase(lot: EWasteLot) {
  return {
    id: lot.id,
    collector_id: lot.collectorId,
    collector_name: lot.collectorName,
    collector_phone: lot.collectorPhone,
    material_id: lot.materialId,
    material_name: lot.materialName,
    category: lot.category,
    weight_kg: lot.weightKg,
    rate_per_kg: lot.ratePerKg,
    total_amount: lot.totalAmount,
    status: lot.status,
    payment_mode: lot.paymentMode || null,
    timestamp: lot.timestamp,
    gps_location: lot.gpsLocation,
    facility_id: lot.facilityId,
    facility_name: lot.facilityName,
    distance_km: lot.distanceKm || 0,
    hazard_flag: Boolean(lot.hazardFlag),
    hazard_note: lot.hazardNote || null,
    photo_url: lot.photoUrl || null,
    photos: lot.photos || {},
    serial_or_imei: lot.serialOrImei || null,
    requires_sticker: Boolean(lot.requiresSticker),
    anomaly_flag: Boolean(lot.anomalyFlag),
    anomaly_reason: lot.anomalyReason || null,
    is_offline_created: Boolean(lot.isOfflineCreated),
    needs_online_ai_categorization: Boolean(lot.needsOnlineAiCategorization),
    weighbridge_weight_kg: lot.weighbridgeWeightKg || null,
    final_payout_amount: lot.finalPayoutAmount || null,
    epr_credit_kg: lot.eprCreditKg || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Transform camelCase Material object to snake_case Supabase table columns
 */
function mapMaterialToSupabase(mat: MaterialItem) {
  return {
    id: mat.id,
    name_en: mat.name_en,
    name_hi: mat.name_hi || null,
    name_mr: mat.name_mr || null,
    grade: mat.grade || null,
    price_per_kg: mat.pricePerKg,
    trend: mat.trend || 0,
    category: mat.category,
    hazard_level: mat.hazardLevel || 'safe',
    hazard_warning_en: mat.hazardWarning_en || null,
    hazard_warning_hi: mat.hazardWarning_hi || null,
    hazard_warning_mr: mat.hazardWarning_mr || null,
    safe_action_en: mat.safeAction_en || null,
    safe_action_hi: mat.safeAction_hi || null,
    safe_action_mr: mat.safeAction_mr || null,
    audio_text_en: mat.audioText_en || null,
    audio_text_hi: mat.audioText_hi || null,
    audio_text_mr: mat.audioText_mr || null,
    crm_yield: mat.crmYield || {},
    updated_at: new Date().toISOString(),
  };
}

/**
 * Transform camelCase Collector object to snake_case Supabase table columns
 */
function mapCollectorToSupabase(col: CollectorProfile) {
  return {
    id: col.id,
    name: col.name,
    phone: col.phone,
    ward: col.ward,
    city: col.city,
    selfie_url: col.selfieUrl || null,
    verified_badge: Boolean(col.verifiedBadge),
    safety_tier: col.safetyTier,
    bags_deposited_kg: col.bagsDepositedKg || 0,
    target_bags_kg: col.targetBagsKg || 50,
    security_refund_amount: col.securityRefundAmount || 0,
    today_earnings: col.todayEarnings || 0,
    today_weight_kg: col.todayWeightKg || 0,
    total_lots_count: col.totalLotsCount || 0,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Drains the offline sync queue and pushes all pending changes to Supabase.
 * Uses Last-Write-Wins via PostgreSQL UPSERT.
 */
export async function processSyncQueue(): Promise<{
  success: boolean;
  syncedCount: number;
  failedCount: number;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, syncedCount: 0, failedCount: 0 };
  }

  const queue = getSyncQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  const remainingQueue: SyncQueueItem[] = [];

  for (const item of queue) {
    try {
      let mappedPayload = item.payload;

      if (item.tableName === 'lots') {
        mappedPayload = mapLotToSupabase(item.payload);
      } else if (item.tableName === 'materials') {
        mappedPayload = mapMaterialToSupabase(item.payload);
      } else if (item.tableName === 'collectors') {
        mappedPayload = mapCollectorToSupabase(item.payload);
      }

      if (item.action === 'delete') {
        const { error } = await supabase.from(item.tableName).delete().eq('id', item.recordId);
        if (error) throw error;
      } else {
        // 'insert', 'update', 'upsert' all use upsert for last-write-wins
        const { error } = await supabase.from(item.tableName).upsert(mappedPayload, {
          onConflict: 'id',
        });
        if (error) throw error;
      }

      syncedCount++;
    } catch (err: any) {
      console.warn(`Sync failed for ${item.tableName} [${item.recordId}]:`, err?.message || err);
      // Keep in queue for retry up to 5 times
      if (item.retryCount < 5) {
        remainingQueue.push({
          ...item,
          retryCount: item.retryCount + 1,
        });
      }
    }
  }

  saveSyncQueue(remainingQueue);
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

  return {
    success: remainingQueue.length === 0,
    syncedCount,
    failedCount: remainingQueue.length,
  };
}

/**
 * Fetch latest lots from Supabase to merge into local state.
 */
export async function pullLotsFromSupabase(): Promise<EWasteLot[] | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('lots')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.warn('Error pulling lots from Supabase:', error.message);
      return null;
    }

    if (!data) return null;

    return data.map(mapSupabaseRowToLot);
  } catch (err) {
    console.warn('Network error while pulling lots from Supabase:', err);
    return null;
  }
}

/**
 * Convert snake_case from Supabase row back to camelCase EWasteLot
 */
export function mapSupabaseRowToLot(row: any): EWasteLot {
  return {
    id: row.id,
    collectorId: row.collector_id,
    collectorName: row.collector_name,
    collectorPhone: row.collector_phone,
    materialId: row.material_id,
    materialName: row.material_name,
    category: row.category,
    weightKg: Number(row.weight_kg),
    ratePerKg: Number(row.rate_per_kg),
    totalAmount: Number(row.total_amount),
    status: row.status,
    paymentMode: row.payment_mode,
    timestamp: row.timestamp,
    gpsLocation: row.gps_location,
    facilityId: row.facility_id,
    facilityName: row.facility_name,
    distanceKm: Number(row.distance_km || 0),
    hazardFlag: Boolean(row.hazard_flag),
    hazardNote: row.hazard_note,
    photoUrl: row.photo_url,
    photos: row.photos,
    serialOrImei: row.serial_or_imei,
    requiresSticker: Boolean(row.requires_sticker),
    anomalyFlag: Boolean(row.anomaly_flag),
    anomalyReason: row.anomaly_reason,
    isOfflineCreated: Boolean(row.is_offline_created),
    needsOnlineAiCategorization: Boolean(row.needs_online_ai_categorization),
    weighbridgeWeightKg: row.weighbridge_weight_kg ? Number(row.weighbridge_weight_kg) : undefined,
    finalPayoutAmount: row.final_payout_amount ? Number(row.final_payout_amount) : undefined,
    eprCreditKg: row.epr_credit_kg ? Number(row.epr_credit_kg) : undefined,
  };
}

/**
 * Fetch latest materials list from Supabase.
 */
export async function pullMaterialsFromSupabase(): Promise<MaterialItem[] | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }

  try {
    const { data, error } = await supabase.from('materials').select('*');
    if (error) {
      console.warn('Error pulling materials from Supabase:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((row: any) => ({
      id: row.id,
      name_en: row.name_en,
      name_hi: row.name_hi || '',
      name_mr: row.name_mr || '',
      grade: row.grade || '',
      pricePerKg: Number(row.price_per_kg),
      trend: Number(row.trend || 0),
      category: row.category,
      hazardLevel: row.hazard_level || 'safe',
      hazardWarning_en: row.hazard_warning_en || '',
      hazardWarning_hi: row.hazard_warning_hi || '',
      hazardWarning_mr: row.hazard_warning_mr || '',
      safeAction_en: row.safe_action_en || '',
      safeAction_hi: row.safe_action_hi || '',
      safeAction_mr: row.safe_action_mr || '',
      audioText_en: row.audio_text_en || '',
      audioText_hi: row.audio_text_hi || '',
      audioText_mr: row.audio_text_mr || '',
      crmYield: row.crm_yield || { copperPct: 0, lithiumPct: 0, cobaltPct: 0, neodymiumPct: 0, goldGramsPerTon: 0 },
    }));
  } catch (err) {
    console.warn('Network error pulling materials from Supabase:', err);
    return null;
  }
}
