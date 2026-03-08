-- Supabase Realtime 用の RLS ポリシー
-- これらのポリシーにより、anon ユーザーが Realtime チャンネルを通じて
-- appointments と notifications テーブルの変更を受信できるようになります。
--
-- ⚠️ セキュリティ注意事項:
-- 以下のポリシーは簡易的なものです。本番環境では clinic_id やユーザー認証に基づいた
-- より厳格なフィルタリングを実装してください。例えば:
--   USING (clinic_id = auth.jwt() ->> 'clinic_id')
--
-- 注意: これらのポリシーは Supabase の Row Level Security (RLS) が
-- 有効になっていることを前提としています。

-- appointments テーブルの SELECT ポリシー（Realtime 用）
DROP POLICY IF EXISTS "allow_realtime_appointments" ON appointments;
CREATE POLICY "allow_realtime_appointments"
  ON appointments
  FOR SELECT
  TO anon
  USING (true);

-- notifications テーブルの SELECT ポリシー（Realtime 用）
DROP POLICY IF EXISTS "allow_realtime_notifications" ON notifications;
CREATE POLICY "allow_realtime_notifications"
  ON notifications
  FOR SELECT
  TO anon
  USING (true);

-- Supabase Realtime の Publication に テーブルを追加
-- （Supabase ダッシュボードで手動設定が必要な場合もあります）
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
