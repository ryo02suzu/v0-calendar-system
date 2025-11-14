-- クリニック管理システムのデータベーススキーマ

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clinics table (クリニック情報)
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff table (スタッフ情報)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table (患者情報)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_number TEXT UNIQUE,
  name TEXT NOT NULL,
  name_kana TEXT,
  birth_date DATE,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  insurance_number TEXT,
  allergies TEXT,
  medical_history TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table (診療メニュー)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- minutes
  price INTEGER,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table (予約情報)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  chair_number INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical records table (カルテ)
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment TEXT,
  prescription TEXT,
  next_visit TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business hours table (診療時間)
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, day_of_week)
);

-- Holidays table (休診日)
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, date)
);

-- Clinic settings table (クリニック設定)
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  chairs_count INTEGER DEFAULT 1,
  booking_advance_days INTEGER DEFAULT 60,
  booking_buffer_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_staff_clinic_id ON staff(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_services_clinic_id ON services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_medical_records_clinic_id ON medical_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_clinic_id ON business_hours(clinic_id);
CREATE INDEX IF NOT EXISTS idx_holidays_clinic_id ON holidays(clinic_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- Insert default clinic
INSERT INTO clinics (id, name, phone, email, address) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'いまいずみクリニック',
  '03-1234-5678',
  'info@imaizumi-clinic.jp',
  '東京都渋谷区渋谷1-1-1'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample staff
INSERT INTO staff (clinic_id, name, role, email, phone) VALUES
  ('00000000-0000-0000-0000-000000000001', '今泉 太郎', 'doctor', 'imaizumi@clinic.jp', '03-1234-5678'),
  ('00000000-0000-0000-0000-000000000001', '山田 花子', 'hygienist', 'yamada@clinic.jp', '03-1234-5679'),
  ('00000000-0000-0000-0000-000000000001', '佐藤 美咲', 'receptionist', 'sato@clinic.jp', '03-1234-5680')
ON CONFLICT DO NOTHING;

-- Insert sample services
INSERT INTO services (clinic_id, name, description, duration, price, category) VALUES
  ('00000000-0000-0000-0000-000000000001', '定期検診', '歯の健康チェックとクリーニング', 30, 5000, '予防'),
  ('00000000-0000-0000-0000-000000000001', '虫歯治療', '虫歯の診断と治療', 60, 8000, '治療'),
  ('00000000-0000-0000-0000-000000000001', 'ホワイトニング', '歯を白く美しく', 90, 15000, '審美'),
  ('00000000-0000-0000-0000-000000000001', '歯石除去', 'プロフェッショナルクリーニング', 45, 6000, '予防'),
  ('00000000-0000-0000-0000-000000000001', '根管治療', '根管の治療', 90, 12000, '治療'),
  ('00000000-0000-0000-0000-000000000001', '抜歯', '歯の抜歯処置', 45, 7000, '外科')
ON CONFLICT DO NOTHING;

-- Insert default business hours (月〜金: 9:00-18:00, 土: 9:00-13:00, 日: 休診)
INSERT INTO business_hours (clinic_id, day_of_week, open_time, close_time, is_closed) VALUES
  ('00000000-0000-0000-0000-000000000001', 0, NULL, NULL, true),  -- 日曜
  ('00000000-0000-0000-0000-000000000001', 1, '09:00', '18:00', false),  -- 月曜
  ('00000000-0000-0000-0000-000000000001', 2, '09:00', '18:00', false),  -- 火曜
  ('00000000-0000-0000-0000-000000000001', 3, '09:00', '18:00', false),  -- 水曜
  ('00000000-0000-0000-0000-000000000001', 4, '09:00', '18:00', false),  -- 木曜
  ('00000000-0000-0000-0000-000000000001', 5, '09:00', '18:00', false),  -- 金曜
  ('00000000-0000-0000-0000-000000000001', 6, '09:00', '13:00', false)   -- 土曜
ON CONFLICT (clinic_id, day_of_week) DO NOTHING;

-- Insert default clinic settings
INSERT INTO clinic_settings (clinic_id, chairs_count, booking_advance_days, booking_buffer_minutes) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  3,
  60,
  15
) ON CONFLICT (clinic_id) DO NOTHING;
