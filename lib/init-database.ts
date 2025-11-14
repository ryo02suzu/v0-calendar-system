"use server"

import { supabaseAdmin } from "./supabase/admin"

export async function initializeDatabase() {
  try {
    console.log("[v0] Checking database schema...")

    // テーブルが存在するかチェック
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc("pg_tables").select("tablename")

    // テーブルが存在しない場合、作成する
    const tablesToCreate = [
      `
      CREATE TABLE IF NOT EXISTS clinics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS staff (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        name_kana TEXT,
        birth_date DATE,
        gender TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        postal_code TEXT,
        emergency_contact TEXT,
        emergency_phone TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL,
        price INTEGER,
        category TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        service_id UUID REFERENCES services(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS medical_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        diagnosis TEXT,
        treatment TEXT,
        notes TEXT,
        attachments JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS business_hours (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL,
        open_time TIME,
        close_time TIME,
        is_closed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS holidays (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS clinic_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        chairs_count INTEGER DEFAULT 1,
        booking_advance_days INTEGER DEFAULT 30,
        booking_buffer_minutes INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(clinic_id)
      );
      `,
    ]

    // インデックスを作成
    const indexesToCreate = [
      `CREATE INDEX IF NOT EXISTS idx_staff_clinic ON staff(clinic_id);`,
      `CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);`,
      `CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinic_id);`,
      `CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);`,
      `CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(staff_id);`,
      `CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);`,
      `CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);`,
      `CREATE INDEX IF NOT EXISTS idx_business_hours_clinic ON business_hours(clinic_id);`,
      `CREATE INDEX IF NOT EXISTS idx_holidays_clinic ON holidays(clinic_id);`,
    ]

    console.log("[v0] Creating database tables...")

    // テーブルを作成
    for (const sql of tablesToCreate) {
      const { error } = await supabaseAdmin.rpc("exec_sql", { sql })
      if (error && !error.message.includes("already exists")) {
        console.error("[v0] Error creating table:", error)
      }
    }

    // インデックスを作成
    for (const sql of indexesToCreate) {
      const { error } = await supabaseAdmin.rpc("exec_sql", { sql })
      if (error && !error.message.includes("already exists")) {
        console.error("[v0] Error creating index:", error)
      }
    }

    console.log("[v0] Database schema initialized successfully")
    return true
  } catch (error) {
    console.error("[v0] Error initializing database:", error)
    // RPC関数が存在しない場合は、直接SQLを実行する方法を試す
    return false
  }
}
