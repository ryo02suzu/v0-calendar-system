-- レセコン連携設定テーブルを作成
CREATE TABLE IF NOT EXISTS resecon_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  resecon_type TEXT NOT NULL DEFAULT 'ORCA',
  api_endpoint TEXT,
  api_key TEXT,
  csv_format TEXT DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clinic_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_resecon_settings_clinic_id ON resecon_settings(clinic_id);

-- コメント追加
COMMENT ON TABLE resecon_settings IS 'レセコン（レセプトコンピュータ）連携設定';
COMMENT ON COLUMN resecon_settings.enabled IS '連携の有効/無効';
COMMENT ON COLUMN resecon_settings.resecon_type IS 'レセコンの種類（ORCA, デンタルX, etc）';
COMMENT ON COLUMN resecon_settings.api_endpoint IS 'API連携用エンドポイント';
COMMENT ON COLUMN resecon_settings.api_key IS 'API認証キー';
COMMENT ON COLUMN resecon_settings.csv_format IS 'CSV連携時のフォーマット';
