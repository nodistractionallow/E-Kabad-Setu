import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { INITIAL_MATERIALS, INITIAL_LOTS, MOCK_COLLECTOR, INITIAL_CATEGORY_REQUESTS, INITIAL_PARTNER_REGISTRATIONS } from "../data/mockData";
import type { EWasteLot, MaterialItem, CategoryApprovalRequest, PartnerRegistration, CollectorProfile } from "../types";

let sqlInstance: any = null;
let db: any = null;

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "ekabadsetu.sqlite");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function getSqliteDb() {
  if (db) return db;

  if (!sqlInstance) {
    sqlInstance = await initSqlJs();
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new sqlInstance.Database(fileBuffer);
      // Run quick schema check / migration
      initTables(db);
      console.log(`[SQLite] Loaded existing database from ${DB_FILE}`);
      return db;
    } catch (err) {
      console.warn(`[SQLite] Error reading existing DB file, reinitializing:`, err);
    }
  }

  // Create new database
  db = new sqlInstance.Database();
  initTables(db);
  seedInitialData(db);
  persistDb(db);
  console.log(`[SQLite] Initialized new SQLite database at ${DB_FILE}`);
  return db;
}

function persistDb(database: any) {
  try {
    const data = database.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error(`[SQLite] Error persisting database to disk:`, err);
  }
}

function safeBind(stmt: any, params: any[]) {
  const sanitized = params.map(p => (p === undefined ? null : p));
  stmt.bind(sanitized);
}

function initTables(database: any) {
  database.run(`
    CREATE TABLE IF NOT EXISTS lots (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      collector_id TEXT,
      collector_name TEXT,
      collector_phone TEXT,
      material_id TEXT,
      material_name TEXT,
      category TEXT,
      weight_kg REAL,
      rate_per_kg REAL,
      total_amount REAL,
      weighbridge_weight_kg REAL,
      final_payout_amount REAL,
      payment_mode TEXT,
      epr_credit_kg REAL,
      timestamp TEXT,
      paid_at TEXT,
      paid_timestamp INTEGER,
      settlement_utr TEXT,
      gps_location TEXT,
      facility_id TEXT,
      facility_name TEXT,
      distance_km REAL,
      hazard_flag INTEGER DEFAULT 0,
      photo_url TEXT,
      anomaly_cleared INTEGER DEFAULT 0,
      anomaly_resolution TEXT,
      anomaly_resolved_by TEXT,
      reopened INTEGER DEFAULT 0,
      reopened_at TEXT,
      reopened_by TEXT,
      crm_copper_pct REAL DEFAULT 0,
      crm_lithium_pct REAL DEFAULT 0,
      crm_cobalt_pct REAL DEFAULT 0,
      crm_neodymium_pct REAL DEFAULT 0,
      crm_gold_grams_ton REAL DEFAULT 0,
      raw_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
    CREATE INDEX IF NOT EXISTS idx_lots_category ON lots(category);
    CREATE INDEX IF NOT EXISTS idx_lots_collector ON lots(collector_id);
    CREATE INDEX IF NOT EXISTS idx_lots_paid_ts ON lots(paid_timestamp);

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      name_en TEXT,
      name_hi TEXT,
      name_mr TEXT,
      grade TEXT,
      price_per_kg REAL,
      trend REAL,
      category TEXT,
      hazard_level TEXT,
      raw_json TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);

    CREATE TABLE IF NOT EXISTS category_requests (
      id TEXT PRIMARY KEY,
      collector_id TEXT,
      collector_name TEXT,
      material_name TEXT,
      category TEXT,
      estimated_weight_kg REAL,
      status TEXT,
      approved_rate_per_kg REAL,
      assigned_standard_category TEXT,
      timestamp TEXT,
      raw_json TEXT
    );

    CREATE TABLE IF NOT EXISTS partner_registrations (
      id TEXT PRIMARY KEY,
      entity_type TEXT,
      organization_name TEXT,
      contact_person TEXT,
      phone TEXT,
      status TEXT,
      state TEXT,
      applied_date TEXT,
      raw_json TEXT
    );

    CREATE TABLE IF NOT EXISTS collector_profile (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      wallet_balance REAL,
      total_kg_collected REAL,
      rating REAL,
      raw_json TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      performed_by TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedInitialData(database: any) {
  // 1. Seed materials
  const matStmt = database.prepare(`
    INSERT OR REPLACE INTO materials (id, name_en, name_hi, name_mr, grade, price_per_kg, trend, category, hazard_level, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const m of INITIAL_MATERIALS) {
    safeBind(matStmt, [
      m.id,
      m.name_en,
      m.name_hi,
      m.name_mr,
      m.grade || '',
      m.pricePerKg,
      m.trend || 0,
      m.category,
      m.hazardLevel || 'safe',
      JSON.stringify(m)
    ]);
    matStmt.step();
    matStmt.reset();
  }
  matStmt.free();

  // 2. Seed lots
  const lotStmt = database.prepare(`
    INSERT OR REPLACE INTO lots (
      id, status, collector_id, collector_name, collector_phone, material_id, material_name, category,
      weight_kg, rate_per_kg, total_amount, weighbridge_weight_kg, final_payout_amount, payment_mode,
      epr_credit_kg, timestamp, paid_at, paid_timestamp, settlement_utr, gps_location, facility_id,
      facility_name, distance_km, hazard_flag, photo_url, anomaly_cleared, crm_copper_pct,
      crm_lithium_pct, crm_cobalt_pct, crm_neodymium_pct, crm_gold_grams_ton, raw_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  for (const l of INITIAL_LOTS) {
    const isPaid = l.status === 'paid';
    const paidAtVal = l.paidAt || (isPaid ? l.timestamp : null);
    const paidTsVal = l.paidTimestamp || (isPaid ? Date.parse(l.timestamp) || null : null);
    const utrVal = l.settlementUtr || (isPaid ? `UTR-CPCB-${l.id.replace('LOT-', '')}` : null);
    const gpsVal = typeof l.gpsLocation === 'string' ? l.gpsLocation : (l.gpsLocation ? `${(l.gpsLocation as any).lat},${(l.gpsLocation as any).lng}` : '');

    safeBind(lotStmt, [
      l.id,
      l.status,
      l.collectorId,
      l.collectorName,
      l.collectorPhone || '',
      l.materialId,
      l.materialName,
      l.category,
      l.weightKg,
      l.ratePerKg,
      l.totalAmount,
      l.weighbridgeWeightKg ?? null,
      l.finalPayoutAmount ?? null,
      l.paymentMode ?? null,
      l.eprCreditKg ?? null,
      l.timestamp,
      paidAtVal,
      paidTsVal,
      utrVal,
      gpsVal,
      l.facilityId ?? null,
      l.facilityName ?? null,
      l.distanceKm ?? null,
      l.hazardFlag ? 1 : 0,
      l.photoUrl || '',
      l.anomalyCleared ? 1 : 0,
      l.crmYield?.copperPct || 0,
      l.crmYield?.lithiumPct || 0,
      l.crmYield?.cobaltPct || 0,
      l.crmYield?.neodymiumPct || 0,
      l.crmYield?.goldGramsPerTon || 0,
      JSON.stringify(l)
    ]);
    lotStmt.step();
    lotStmt.reset();
  }
  lotStmt.free();

  // 3. Seed Category Requests
  const catStmt = database.prepare(`
    INSERT OR REPLACE INTO category_requests (
      id, collector_id, collector_name, material_name, category, estimated_weight_kg, status,
      approved_rate_per_kg, assigned_standard_category, timestamp, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of INITIAL_CATEGORY_REQUESTS) {
    const item = c as any;
    safeBind(catStmt, [
      item.id,
      item.collectorId,
      item.collectorName,
      item.materialName || item.categoryName || '',
      item.category || item.assignedStandardCategory || '',
      item.estimatedWeightKg || item.weightKg || 0,
      item.status,
      item.approvedRatePerKg ?? null,
      item.assignedStandardCategory ?? null,
      item.timestamp,
      JSON.stringify(c)
    ]);
    catStmt.step();
    catStmt.reset();
  }
  catStmt.free();

  // 4. Seed Partners
  const partStmt = database.prepare(`
    INSERT OR REPLACE INTO partner_registrations (
      id, entity_type, organization_name, contact_person, phone, status, state, applied_date, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of INITIAL_PARTNER_REGISTRATIONS) {
    const item = p as any;
    safeBind(partStmt, [
      item.id,
      item.entityType || item.partnerType || 'RECYCLER',
      item.organizationName || item.companyName || item.facilityName || '',
      item.contactPerson || item.name || '',
      item.phone,
      item.status,
      item.state,
      item.appliedDate,
      JSON.stringify(p)
    ]);
    partStmt.step();
    partStmt.reset();
  }
  partStmt.free();

  // 5. Seed Collector Profile
  const colStmt = database.prepare(`
    INSERT OR REPLACE INTO collector_profile (
      id, name, phone, wallet_balance, total_kg_collected, rating, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const colData = MOCK_COLLECTOR as any;
  safeBind(colStmt, [
    colData.id,
    colData.name,
    colData.phone,
    colData.walletBalance || colData.todayEarnings || 0,
    colData.totalKgCollected || colData.bagsDepositedKg || 0,
    colData.rating || 4.9,
    JSON.stringify(MOCK_COLLECTOR)
  ]);
  colStmt.step();
  colStmt.free();

  // Seed initial audit log
  database.run(`
    INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, details)
    VALUES ('SYSTEM_INIT', 'DATABASE', 'SQLITE_INIT', 'CPCB_SYSTEM', 'SQLite database initialized with CPCB verified baseline lots and statutory rates.')
  `);
}

// ==================== CRUD API EXPORTS ====================

export async function sqliteGetLots(): Promise<EWasteLot[]> {
  const database = await getSqliteDb();
  const stmt = database.prepare(`SELECT raw_json, status, weighbridge_weight_kg, final_payout_amount, payment_mode, paid_at, paid_timestamp, settlement_utr, reopened, anomaly_cleared FROM lots ORDER BY created_at DESC`);
  const lots: EWasteLot[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    try {
      const parsed = JSON.parse(row.raw_json as string) as EWasteLot;
      // Merge live columns
      if (row.status) parsed.status = row.status as any;
      if (row.weighbridge_weight_kg !== null && row.weighbridge_weight_kg !== undefined) parsed.weighbridgeWeightKg = Number(row.weighbridge_weight_kg);
      if (row.final_payout_amount !== null && row.final_payout_amount !== undefined) parsed.finalPayoutAmount = Number(row.final_payout_amount);
      if (row.payment_mode) parsed.paymentMode = row.payment_mode as any;
      if (row.paid_at) parsed.paidAt = row.paid_at as string;
      if (row.paid_timestamp) parsed.paidTimestamp = Number(row.paid_timestamp);
      if (row.settlement_utr) parsed.settlementUtr = row.settlement_utr as string;
      if (row.reopened !== undefined) parsed.reopened = Boolean(row.reopened);
      if (row.anomaly_cleared !== undefined) parsed.anomalyCleared = Boolean(row.anomaly_cleared);
      lots.push(parsed);
    } catch (e) {
      console.error("[SQLite] Error parsing lot raw_json:", e);
    }
  }
  stmt.free();
  return lots;
}

export async function sqliteGetLotById(id: string): Promise<EWasteLot | null> {
  const database = await getSqliteDb();
  const stmt = database.prepare(`SELECT raw_json, status, weighbridge_weight_kg, final_payout_amount, payment_mode, paid_at, paid_timestamp, settlement_utr, reopened, anomaly_cleared FROM lots WHERE UPPER(id) = ?`);
  safeBind(stmt, [id.toUpperCase()]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    const parsed = JSON.parse(row.raw_json as string) as EWasteLot;
    if (row.status) parsed.status = row.status as any;
    if (row.weighbridge_weight_kg !== null && row.weighbridge_weight_kg !== undefined) parsed.weighbridgeWeightKg = Number(row.weighbridge_weight_kg);
    if (row.final_payout_amount !== null && row.final_payout_amount !== undefined) parsed.finalPayoutAmount = Number(row.final_payout_amount);
    if (row.payment_mode) parsed.paymentMode = row.payment_mode as any;
    if (row.paid_at) parsed.paidAt = row.paid_at as string;
    if (row.paid_timestamp) parsed.paidTimestamp = Number(row.paid_timestamp);
    if (row.settlement_utr) parsed.settlementUtr = row.settlement_utr as string;
    if (row.reopened !== undefined) parsed.reopened = Boolean(row.reopened);
    if (row.anomaly_cleared !== undefined) parsed.anomalyCleared = Boolean(row.anomaly_cleared);
    return parsed;
  }
  stmt.free();
  return null;
}

export async function sqliteUpsertLot(lot: EWasteLot): Promise<void> {
  const database = await getSqliteDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO lots (
      id, status, collector_id, collector_name, collector_phone, material_id, material_name, category,
      weight_kg, rate_per_kg, total_amount, weighbridge_weight_kg, final_payout_amount, payment_mode,
      epr_credit_kg, timestamp, paid_at, paid_timestamp, settlement_utr, gps_location, facility_id,
      facility_name, distance_km, hazard_flag, photo_url, anomaly_cleared, anomaly_resolution,
      anomaly_resolved_by, reopened, reopened_at, reopened_by, crm_copper_pct, crm_lithium_pct,
      crm_cobalt_pct, crm_neodymium_pct, crm_gold_grams_ton, raw_json, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, CURRENT_TIMESTAMP
    )
  `);

  safeBind(stmt, [
    lot.id,
    lot.status,
    lot.collectorId,
    lot.collectorName,
    lot.collectorPhone || '',
    lot.materialId,
    lot.materialName,
    lot.category,
    lot.weightKg,
    lot.ratePerKg,
    lot.totalAmount,
    lot.weighbridgeWeightKg ?? null,
    lot.finalPayoutAmount ?? null,
    lot.paymentMode ?? null,
    lot.eprCreditKg ?? null,
    lot.timestamp,
    lot.paidAt ?? null,
    lot.paidTimestamp ?? null,
    lot.settlementUtr ?? null,
    typeof lot.gpsLocation === 'string' ? lot.gpsLocation : (lot.gpsLocation ? `${(lot.gpsLocation as any).lat},${(lot.gpsLocation as any).lng}` : ''),
    lot.facilityId ?? null,
    lot.facilityName ?? null,
    lot.distanceKm ?? null,
    lot.hazardFlag ? 1 : 0,
    lot.photoUrl || '',
    lot.anomalyCleared ? 1 : 0,
    lot.anomalyResolution ?? null,
    lot.anomalyResolvedBy ?? null,
    lot.reopened ? 1 : 0,
    lot.reopenedAt ?? null,
    lot.reopenedBy ?? null,
    lot.crmYield?.copperPct || 0,
    lot.crmYield?.lithiumPct || 0,
    lot.crmYield?.cobaltPct || 0,
    lot.crmYield?.neodymiumPct || 0,
    lot.crmYield?.goldGramsPerTon || 0,
    JSON.stringify(lot)
  ]);
  stmt.step();
  stmt.free();

  database.run(`
    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES ('LOT_UPSERT', 'LOT', ?, ?)
  `, [lot.id, `Lot ${lot.id} status: ${lot.status}, weight: ${lot.weighbridgeWeightKg || lot.weightKg}kg`]);

  persistDb(database);
}

export async function sqliteDeleteLot(id: string): Promise<boolean> {
  const database = await getSqliteDb();
  database.run(`DELETE FROM lots WHERE UPPER(id) = ?`, [id.toUpperCase()]);
  database.run(`
    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES ('LOT_DELETE', 'LOT', ?, 'Lot deleted by admin authorization key')
  `, [id]);
  persistDb(database);
  return true;
}

export async function sqliteGetMaterials(): Promise<MaterialItem[]> {
  const database = await getSqliteDb();
  const stmt = database.prepare(`SELECT raw_json, price_per_kg FROM materials`);
  const materials: MaterialItem[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    try {
      const parsed = JSON.parse(row.raw_json as string) as MaterialItem;
      if (row.price_per_kg) parsed.pricePerKg = Number(row.price_per_kg);
      materials.push(parsed);
    } catch (e) {
      console.error("[SQLite] Error parsing material json:", e);
    }
  }
  stmt.free();
  return materials;
}

export async function sqliteUpdateMaterialPrice(id: string, newRate: number): Promise<void> {
  const database = await getSqliteDb();
  database.run(`UPDATE materials SET price_per_kg = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newRate, id]);
  // Also update raw_json
  const stmt = database.prepare(`SELECT raw_json FROM materials WHERE id = ?`);
  safeBind(stmt, [id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    try {
      const parsed = JSON.parse(row.raw_json as string) as MaterialItem;
      parsed.pricePerKg = newRate;
      database.run(`UPDATE materials SET raw_json = ? WHERE id = ?`, [JSON.stringify(parsed), id]);
    } catch (e) {
      console.error(e);
    }
  }
  stmt.free();

  database.run(`
    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES ('MATERIAL_PRICE_UPDATE', 'MATERIAL', ?, ?)
  `, [id, `CPCB Floor rate updated to ₹${newRate}/kg`]);

  persistDb(database);
}

export async function sqliteGetCategoryRequests(): Promise<CategoryApprovalRequest[]> {
  const database = await getSqliteDb();
  const stmt = database.prepare(`SELECT raw_json FROM category_requests ORDER BY timestamp DESC`);
  const list: CategoryApprovalRequest[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    try {
      list.push(JSON.parse(row.raw_json as string));
    } catch (e) {
      console.error(e);
    }
  }
  stmt.free();
  return list;
}

export async function sqliteUpsertCategoryRequest(req: CategoryApprovalRequest): Promise<void> {
  const database = await getSqliteDb();
  const item = req as any;
  database.run(`
    INSERT OR REPLACE INTO category_requests (
      id, collector_id, collector_name, material_name, category, estimated_weight_kg, status,
      approved_rate_per_kg, assigned_standard_category, timestamp, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    item.id,
    item.collectorId,
    item.collectorName,
    item.materialName || item.categoryName || '',
    item.category || item.assignedStandardCategory || '',
    item.estimatedWeightKg || item.weightKg || 0,
    item.status,
    item.approvedRatePerKg ?? null,
    item.assignedStandardCategory ?? null,
    item.timestamp,
    JSON.stringify(req)
  ]);
  persistDb(database);
}

export async function sqliteGetPartners(): Promise<PartnerRegistration[]> {
  const database = await getSqliteDb();
  const stmt = database.prepare(`SELECT raw_json FROM partner_registrations ORDER BY applied_date DESC`);
  const list: PartnerRegistration[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    try {
      list.push(JSON.parse(row.raw_json as string));
    } catch (e) {
      console.error(e);
    }
  }
  stmt.free();
  return list;
}

export async function sqliteUpsertPartner(partner: PartnerRegistration): Promise<void> {
  const database = await getSqliteDb();
  const item = partner as any;
  database.run(`
    INSERT OR REPLACE INTO partner_registrations (
      id, entity_type, organization_name, contact_person, phone, status, state, applied_date, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    item.id,
    item.entityType || item.partnerType || 'RECYCLER',
    item.organizationName || item.companyName || item.facilityName || '',
    item.contactPerson || item.name || '',
    item.phone,
    item.status,
    item.state,
    item.appliedDate,
    JSON.stringify(partner)
  ]);
  persistDb(database);
}

export async function sqliteGetCollector(): Promise<CollectorProfile | null> {
  const database = await getSqliteDb();
  const stmt = database.prepare(`SELECT raw_json FROM collector_profile LIMIT 1`);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    try {
      return JSON.parse(row.raw_json as string);
    } catch (e) {
      console.error(e);
    }
  }
  stmt.free();
  return null;
}

export async function sqliteUpsertCollector(profile: CollectorProfile): Promise<void> {
  const database = await getSqliteDb();
  const colData = profile as any;
  database.run(`
    INSERT OR REPLACE INTO collector_profile (
      id, name, phone, wallet_balance, total_kg_collected, rating, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    colData.id,
    colData.name,
    colData.phone,
    colData.walletBalance || colData.todayEarnings || 0,
    colData.totalKgCollected || colData.bagsDepositedKg || 0,
    colData.rating || 4.9,
    JSON.stringify(profile)
  ]);
  persistDb(database);
}

export async function sqliteExecuteQuery(sqlQuery: string): Promise<{ columns: string[]; rows: any[][] }> {
  const database = await getSqliteDb();
  const trimmed = sqlQuery.trim();
  const results = database.exec(trimmed);
  if (!results || results.length === 0) {
    return { columns: [], rows: [] };
  }
  return {
    columns: results[0].columns || [],
    rows: results[0].values || []
  };
}

export async function sqliteGetStatus(): Promise<any> {
  const database = await getSqliteDb();
  let fileSize = 0;
  if (fs.existsSync(DB_FILE)) {
    fileSize = fs.statSync(DB_FILE).size;
  }

  const lotsCountRes = database.exec(`SELECT COUNT(*) as count, SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count FROM lots`);
  const lotsCounts = lotsCountRes[0]?.values[0] || [0, 0, 0];

  const matCountRes = database.exec(`SELECT COUNT(*) as count FROM materials`);
  const matCount = matCountRes[0]?.values[0]?.[0] || 0;

  const reqCountRes = database.exec(`SELECT COUNT(*) as count FROM category_requests`);
  const reqCount = reqCountRes[0]?.values[0]?.[0] || 0;

  const partnerCountRes = database.exec(`SELECT COUNT(*) as count FROM partner_registrations`);
  const partnerCount = partnerCountRes[0]?.values[0]?.[0] || 0;

  const versionRes = database.exec(`SELECT sqlite_version()`);
  const version = versionRes[0]?.values[0]?.[0] || "3.x";

  const integrityRes = database.exec(`PRAGMA integrity_check`);
  const integrity = integrityRes[0]?.values[0]?.[0] || "ok";

  const tablesRes = database.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
  const tables = tablesRes[0]?.values.map((v: any) => v[0]) || [];

  return {
    engine: "SQLite (Relational Wasm Embedded with ACID persistence)",
    version,
    dbFilePath: DB_FILE,
    fileSizeBytes: fileSize,
    fileSizeKb: (fileSize / 1024).toFixed(2),
    integrity,
    tables,
    totalLots: lotsCounts[0],
    paidLots: lotsCounts[1],
    pendingLots: lotsCounts[2],
    materialsCount: matCount,
    categoryRequestsCount: reqCount,
    partnersCount: partnerCount,
    lastSyncedAt: new Date().toISOString()
  };
}

export async function sqliteResetDatabase(): Promise<void> {
  if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
  }
  db = null;
  await getSqliteDb();
}
