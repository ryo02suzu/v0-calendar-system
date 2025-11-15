-- リマインダー設定テーブル
CREATE TABLE IF NOT EXISTS reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  remind_hours_before INTEGER DEFAULT 24,
  send_sms BOOLEAN DEFAULT true,
  send_email BOOLEAN DEFAULT true,
  sms_template TEXT DEFAULT '【{{clinic_name}}】\nご予約のリマインダーです。\n\n日時：{{date}} {{time}}\n担当：{{staff_name}}\n\nご不明な点がございましたら、お電話ください。',
  email_template TEXT DEFAULT '件名：予約のリマインダー\n\nこんにちは、{{patient_name}}様\n\n{{clinic_name}}です。\n以下の予約のリマインダーをお送りします。\n\n日時：{{date}} {{time}}\n担当：{{staff_name}}\nメニュー：{{service_name}}\n\nご不明な点がございましたら、お気軽にお問い合わせください。',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- リマインダー送信ログテーブル
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method TEXT NOT NULL, -- 'sms' or 'email'
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_reminder_logs_appointment ON reminder_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_patient ON reminder_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON reminder_logs(sent_at);

-- 初期データ
INSERT INTO reminder_settings (clinic_id, enabled, remind_hours_before, send_sms, send_email)
VALUES ('00000000-0000-0000-0000-000000000001', true, 24, true, true)
ON CONFLICT DO NOTHING;
