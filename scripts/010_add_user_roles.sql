-- ユーザーロール管理テーブル
-- Supabase Auth の user_metadata と同期
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Supabase Auth の user.id
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('admin', 'dentist', 'hygienist', 'receptionist', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, clinic_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_clinic_id ON user_roles(clinic_id);

-- RLSポリシー
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 自分のロールは読み取り可
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- adminのみ他ユーザーのロールを管理可能
CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );
