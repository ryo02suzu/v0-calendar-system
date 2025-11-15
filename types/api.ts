import type { Appointment } from "@/lib/types"

export type ReservationPatientPayload = {
  name: string
  phone: string
  email?: string
}

export type ReservationResponse = Pick<
  Appointment,
  | "id"
  | "patient_id"
  | "staff_id"
  | "date"
  | "start_time"
  | "end_time"
  | "treatment_type"
  | "status"
  | "chair_number"
  | "notes"
> & {
  patient?: Appointment["patient"]
  staff?: Appointment["staff"]
}

export type ReservationCreatePayload = {
  patient_id?: string
  patient?: ReservationPatientPayload
  staff_id: string
  date: string
  start_time: string
  end_time: string
  treatment_type: string
  status?: Appointment["status"]
  chair_number?: number | null
  notes?: string | null
}

export type ReservationUpdatePayload = Partial<
  Omit<ReservationCreatePayload, "patient">
> & {
  patient?: ReservationPatientPayload
}

export type CalendarAppointment = ReservationResponse
