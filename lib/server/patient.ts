import { createPatient } from "@/lib/db"
import { generatePatientNumber } from "@/lib/utils/patient-number"
import type { ReservationPatientPayload } from "@/types/api"

export async function ensurePatientId(
  patientId?: string,
  patientPayload?: ReservationPatientPayload,
): Promise<string> {
  if (patientId) {
    return patientId
  }

  if (!patientPayload) {
    throw new Error("患者情報が不足しています")
  }

  const patient = await createPatient({
    ...patientPayload,
    patient_number: generatePatientNumber(),
  })

  return patient.id
}
