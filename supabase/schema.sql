-- =================================================================================
-- E-Kabad Setu Database Schema (Supabase PostgreSQL)
-- Target: https://wnrzuuscipsilzlzrsvg.supabase.co
-- Compliance: CPCB E-Waste Rules 2022 & SIH26229 Data Governance
-- =================================================================================

-- 1. Collectors Table
CREATE TABLE IF NOT EXISTS public.collectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  ward TEXT,
  city TEXT,
  selfie_url TEXT,
  verified_badge BOOLEAN DEFAULT true,
  safety_tier TEXT DEFAULT 'Bronze',
  bags_deposited_kg NUMERIC DEFAULT 0,
  target_bags_kg NUMERIC DEFAULT 50,
  security_refund_amount NUMERIC DEFAULT 0,
  today_earnings NUMERIC DEFAULT 0,
  today_weight_kg NUMERIC DEFAULT 0,
  total_lots_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Recycler Facilities Table
CREATE TABLE IF NOT EXISTS public.recyclers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cpcb_id TEXT NOT NULL,
  state_pcb TEXT,
  location TEXT,
  monthly_quota_tons NUMERIC DEFAULT 50.0,
  processed_this_month_tons NUMERIC DEFAULT 0.0,
  active_collectors INTEGER DEFAULT 0,
  epr_credits_generated_tons NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Materials & Scrap Categories Table
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT,
  name_mr TEXT,
  grade TEXT,
  price_per_kg NUMERIC NOT NULL,
  trend NUMERIC DEFAULT 0.0,
  category TEXT NOT NULL,
  hazard_level TEXT DEFAULT 'safe',
  hazard_warning_en TEXT,
  hazard_warning_hi TEXT,
  hazard_warning_mr TEXT,
  safe_action_en TEXT,
  safe_action_hi TEXT,
  safe_action_mr TEXT,
  audio_text_en TEXT,
  audio_text_hi TEXT,
  audio_text_mr TEXT,
  crm_yield JSONB DEFAULT '{"copperPct": 0, "lithiumPct": 0, "cobaltPct": 0, "neodymiumPct": 0, "goldGramsPerTon": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. E-Waste Lots Table
CREATE TABLE IF NOT EXISTS public.lots (
  id TEXT PRIMARY KEY,
  collector_id TEXT,
  collector_name TEXT NOT NULL,
  collector_phone TEXT NOT NULL,
  material_id TEXT,
  material_name TEXT NOT NULL,
  category TEXT NOT NULL,
  weight_kg NUMERIC NOT NULL,
  rate_per_kg NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_mode TEXT,
  timestamp TEXT,
  gps_location TEXT,
  facility_id TEXT,
  facility_name TEXT,
  distance_km NUMERIC DEFAULT 0.0,
  hazard_flag BOOLEAN DEFAULT false,
  hazard_note TEXT,
  photo_url TEXT,
  photos JSONB DEFAULT '{}'::jsonb,
  serial_or_imei TEXT,
  requires_sticker BOOLEAN DEFAULT false,
  anomaly_flag BOOLEAN DEFAULT false,
  anomaly_reason TEXT,
  is_offline_created BOOLEAN DEFAULT false,
  needs_online_ai_categorization BOOLEAN DEFAULT false,
  weighbridge_weight_kg NUMERIC,
  final_payout_amount NUMERIC,
  epr_credit_kg NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Transactions / Payouts Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  lot_id TEXT,
  collector_id TEXT,
  weighbridge_weight_kg NUMERIC,
  rate_per_kg NUMERIC,
  payout_amount NUMERIC NOT NULL,
  payment_mode TEXT DEFAULT 'UPI',
  payment_status TEXT DEFAULT 'completed',
  epr_credit_generated_kg NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Mandi Market Prices Table
CREATE TABLE IF NOT EXISTS public.prices (
  id TEXT PRIMARY KEY,
  material_id TEXT,
  material_name TEXT NOT NULL,
  location TEXT NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  trend_pct NUMERIC DEFAULT 0.0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Sync Audit Log / Offline Queue Mirror Table
CREATE TABLE IF NOT EXISTS public.sync_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB,
  client_timestamp TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================================
-- Enable Row Level Security (RLS) & Public Policies for Anon Access
-- =================================================================================
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recyclers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they already exist so re-running is safe
DROP POLICY IF EXISTS "Allow public all for collectors" ON public.collectors;
DROP POLICY IF EXISTS "Allow public all for recyclers" ON public.recyclers;
DROP POLICY IF EXISTS "Allow public all for materials" ON public.materials;
DROP POLICY IF EXISTS "Allow public all for lots" ON public.lots;
DROP POLICY IF EXISTS "Allow public all for transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public all for prices" ON public.prices;
DROP POLICY IF EXISTS "Allow public all for sync_audit_log" ON public.sync_audit_log;

-- Allow anonymous read & write for app operations & offline-first sync
CREATE POLICY "Allow public all for collectors" ON public.collectors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for recyclers" ON public.recyclers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for lots" ON public.lots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for prices" ON public.prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all for sync_audit_log" ON public.sync_audit_log FOR ALL USING (true) WITH CHECK (true);

-- =================================================================================
-- Enable Realtime Broadcast for Instant Multi-Device Sync
-- =================================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lots;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.collectors;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
