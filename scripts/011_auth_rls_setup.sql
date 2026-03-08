-- Supabase Auth RLS ポリシー設定
-- 認証済みユーザーのみがダッシュボード関連テーブルにアクセス可能

-- appointments テーブルの RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view appointments" ON appointments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert appointments" ON appointments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update appointments" ON appointments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete appointments" ON appointments
  FOR DELETE USING (auth.role() = 'authenticated');

-- patients テーブルの RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view patients" ON patients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert patients" ON patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patients" ON patients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete patients" ON patients
  FOR DELETE USING (auth.role() = 'authenticated');

-- staff テーブルの RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view staff" ON staff
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert staff" ON staff
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "Admins can update staff" ON staff
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "Admins can delete staff" ON staff
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'receptionist')
    )
  );

-- services テーブルの RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 未認証ユーザーも予約フォームから参照できるようパブリック SELECT を許可
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert services" ON services
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can update services" ON services
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete services" ON services
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- clinics テーブルの RLS（パブリック参照可）
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clinic info" ON clinics
  FOR SELECT USING (true);

CREATE POLICY "Admins can update clinic info" ON clinics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- notifications テーブルの RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notifications" ON notifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update notifications" ON notifications
  FOR UPDATE USING (auth.role() = 'authenticated');

-- reminder_settings テーブルの RLS
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reminder settings" ON reminder_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update reminder settings" ON reminder_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- reminder_logs テーブルの RLS
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reminder logs" ON reminder_logs
  FOR SELECT USING (auth.role() = 'authenticated');
