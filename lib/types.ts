export interface Staff {
  id: string
  clinic_id?: string
  name: string
  role: string
  email?: string
  phone?: string
  specialization?: string
  created_at: string
  updated_at?: string
}

export interface Patient {
  id?: string
  clinic_id?: string
  patient_number?: string
  name: string
  kana?: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  address?: string
  insurance_info?: any
  allergies?: string[]
  medical_notes?: string
  medical_history?: string
  created_at?: string
  updated_at?: string
}

export interface Appointment {
  id: string
  clinic_id?: string
  patient_id: string
  staff_id: string
  service_id?: string
  date: string
  start_time: string
  end_time: string
  treatment_type?: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "pending" | "no_show"
  chair_number?: number
  notes?: string
  created_at: string
  updated_at?: string
  patient?: Patient
  staff?: Staff
  service?: Service
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
  day_of_week: string | number
  is_open: boolean
  open_time?: string
  close_time?: string
  is_closed?: boolean
  morning_start: string | null
  morning_end: string | null
  afternoon_start: string | null
  afternoon_end: string | null
  morning_closed: boolean
  afternoon_closed: boolean
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
  chairs_count: number
  booking_advance_days: number
  booking_buffer_minutes: number
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
