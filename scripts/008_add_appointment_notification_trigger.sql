-- 予約作成時に管理画面に通知を作成するトリガー
-- このトリガーは appointments テーブルへの INSERT 後に実行され、
-- notifications テーブルに新規予約通知を自動挿入します。

CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (clinic_id, type, message, payload, is_read)
  VALUES (
    NEW.clinic_id,
    'new_reservation',
    '新しい予約が入りました',
    jsonb_build_object(
      'reservation_id', NEW.id,
      'date', NEW.date,
      'start_time', NEW.start_time,
      'patient_id', NEW.patient_id
    ),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_appointment ON appointments;
CREATE TRIGGER trigger_notify_new_appointment
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_appointment();
