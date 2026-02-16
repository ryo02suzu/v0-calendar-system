-- 午前/午後の個別時間設定カラムを追加
-- このマイグレーションは将来の機能追加用として作成されています
-- 現在は使用されていませんが、午前/午後の個別休診設定が必要になった場合に備えています

-- 午前/午後の個別時間設定カラムを追加（オプショナル）
ALTER TABLE business_hours
ADD COLUMN IF NOT EXISTS morning_start TIME,
ADD COLUMN IF NOT EXISTS morning_end TIME,
ADD COLUMN IF NOT EXISTS afternoon_start TIME,
ADD COLUMN IF NOT EXISTS afternoon_end TIME,
ADD COLUMN IF NOT EXISTS morning_closed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS afternoon_closed BOOLEAN DEFAULT false;

-- 既存データの移行: open_time/close_time から午前/午後を推定
-- 営業日の場合のみ、午前を開店〜12時、午後を13時〜閉店として設定
UPDATE business_hours
SET
  morning_start = open_time,
  morning_end = '12:00',
  afternoon_start = '13:00',
  afternoon_end = close_time,
  morning_closed = is_closed,
  afternoon_closed = is_closed
WHERE morning_start IS NULL AND is_closed = false;

-- 休診日の場合は両方とも休診に設定
UPDATE business_hours
SET
  morning_closed = true,
  afternoon_closed = true
WHERE is_closed = true AND morning_start IS NULL;

-- インデックスの追加（検索パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_business_hours_morning_closed ON business_hours(morning_closed) WHERE NOT morning_closed;
CREATE INDEX IF NOT EXISTS idx_business_hours_afternoon_closed ON business_hours(afternoon_closed) WHERE NOT afternoon_closed;
