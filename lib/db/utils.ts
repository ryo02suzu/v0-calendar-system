/**
 * lib/db/utils.ts
 *
 * DB ↔ APP 変換ユーティリティ。
 * このファイルは "use server" を持たず、同期ヘルパー関数をエクスポートします。
 */

import type { Patient } from "@/lib/types"

/** UI → DB のキー変換マップ */
const PATIENT_APP_TO_DB_FIELD_MAP: Record<string, string> = {
  date_of_birth: "birth_date",
  medical_notes: "notes",
}

/** DB → UI のキー変換マップ */
const PATIENT_DB_TO_APP_FIELD_MAP: Record<string, string> = {
  birth_date: "date_of_birth",
  notes: "medical_notes",
}

/** APP → DB 変換 */
export function mapPatientPayloadToDb(patient: Partial<Patient> = {}) {
  const payload: Record<string, any> = {}

  for (const [key, value] of Object.entries(patient)) {
    if (value === undefined) continue
    const dbKey = PATIENT_APP_TO_DB_FIELD_MAP[key] ?? key
    payload[dbKey] = value === "" ? null : value
  }

  return payload
}

/** DB → APP 変換 */
export function mapPatientFromDb(record: Record<string, any>): Patient {
  const mapped: Record<string, any> = { ...record }

  for (const [dbKey, appKey] of Object.entries(PATIENT_DB_TO_APP_FIELD_MAP)) {
    if (dbKey in mapped) {
      mapped[appKey] = mapped[dbKey] ?? undefined
      delete mapped[dbKey]
    }
  }

  return mapped as Patient
}
