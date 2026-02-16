export interface Staff {
  id: string
  clinic_id: string
  name: string
  role: string
  email: string
  phone: string
  max_concurrent_appointments?: number // 🆕 スタッフ別の同時対応人数
  created_at: string
  updated_at: string
}

export interface Patient {
  id?: string
  clinic_id?: string
  patient_number?: string // 🆕 患者番号
  name: string
  name_kana?: string // 🆕 カナ
  date_of_birth?: string // 🆕 生年月日
  age?: number // 🆕 年齢（自動計算）
  gender?: string
  phone: string
  email?: string
  address?: string
  insurance_info?: any
  allergies?: string[]
  medical_notes?: string
  cancellation_count?: number // 🆕 キャンセル回数
  no_show_count?: number // 🆕 無断キャンセル回数
  last_visit_date?: string
  created_at?: string
  updated_at?: string
}

export interface Appointment {
  id: string
  clinic_id: string
  patient_id: string
  staff_id: string
  date: string
  start_time: string
  end_time: string
  treatment_type: string
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
  chair_number?: number
  notes?: string
  confirmation_status?: "pending" | "confirmed" // 🆕 患者確認ステータス
  confirmed_at?: string | null // 🆕 確認日時
  created_at: string
  updated_at: string
  patient?: Patient
  staff?: Staff
}

export interface MedicalRecord {
  id: string
  clinic_id: string
  patient_id: string
  appointment_id?: string
  staff_id: string
  date: string
  diagnosis: string
  treatment: string
  treatment_details?: string
  tooth_number?: string
  cost?: number
  images?: string[]
  created_at: string
  updated_at: string
  staff?: Staff
  patient?: Patient
}

export interface Service {
  id: string
  clinic_id?: string
  name: string
  description?: string
  duration: number
  price: number
  category?: string
  is_active?: boolean
  created_at: string
  updated_at?: string
}

export interface BusinessHours {
  id?: string
  clinic_id?: string
  day_of_week: number
  open_time?: string
  close_time?: string
  is_closed?: boolean
  created_at?: string
  updated_at?: string
}

export interface Holiday {
  id: string
  clinic_id?: string
  date: string
  name?: string
  reason?: string
  created_at: string
}

export interface ClinicSettings {
  id?: string
  clinic_id: string
  clinic_name?: string // 🆕 クリニック名
  chairs_count: number
  booking_advance_days: number
  booking_buffer_minutes: number
  allow_double_booking: boolean // 🆕 ダブルブッキング許可
  max_concurrent_appointments?: number // 🆕 デフォルトの同時予約上限
  enable_patient_confirmation: boolean // 🆕 患者確認機能
  confirmation_deadline_hours: number // 🆕 確認期限（時間）
  enable_qr_checkin: boolean // 🆕 QRチェックイン機能
  created_at?: string
  updated_at?: string
}

export interface Clinic {
  id: string
  name: string
  phone: string
  email: string
  address?: string
  created_at: string
  updated_at: string
}

export interface WaitlistEntry {
  id: string
  clinic_id: string
  patient_id: string
  preferred_date_start: string
  preferred_date_end: string
  preferred_time_slot?: "morning" | "afternoon" | "evening" | "any"
  treatment_type: string
  staff_id?: string
  priority: number
  notes?: string
  status: "active" | "notified" | "scheduled" | "expired"
  created_at: string
  updated_at?: string
  patient?: Patient
  staff?: Staff
}

export type ViewType = "calendar" | "patients" | "records" | "reports" | "settings" | "dashboard"
