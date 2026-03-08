-- リマインダー送信ログテーブルの作成
-- このテーブルは既存の reminder_settings テーブル (003_add_reminder_settings.sql) とは別に
-- 個々の送信ログを記録します。

CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  method TEXT NOT NULL CHECK (method IN ('sms', 'email', 'line')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_clinic ON reminder_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_appointment ON reminder_logs(appointment_id);
