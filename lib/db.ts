"use server"

import { CLINIC_ID } from "./constants"
import { supabaseAdmin } from "./supabase/admin"
import type { Patient, WaitlistEntry } from "./types"

// 患者関連
export async function getPatients(): Promise<Patient[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("created_at", { ascending: false })

    if (error) throw error

    // DB → APP 変換
    return (data || []).map(mapPatientFromDb)
  } catch (error) {
    console.error("Error fetching patients:", error)
    return []
  }
}

export async function createPatient(patient: Partial<Patient>) {
  try {
    // APP → DB 変換
    const payload = mapPatientPayloadToDb(patient)

    const { data, error } = await supabaseAdmin
      .from("patients")
      .insert({
        ...payload,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // DB → APP 変換して返す
    return mapPatientFromDb(data)
  } catch (error) {
    console.error("Error creating patient:", error)
    throw error
  }
}

export async function updatePatient(id: string, patient: Partial<Patient>) {
  try {
    // APP → DB 変換
    const payload = mapPatientPayloadToDb(patient)

    const { data, error } = await supabaseAdmin
      .from("patients")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error

    // DB → APP
    return mapPatientFromDb(data)
  } catch (error) {
    console.error("Error updating patient:", error)
    throw error
  }
}

export async function deletePatient(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("patients")
      .delete()
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting patient:", error)
    throw error
  }
}

/*
 * UI → DB のキー変換
 */
const PATIENT_APP_TO_DB_FIELD_MAP: Record<string, string> = {
  kana: "name_kana",
  date_of_birth: "birth_date",
  medical_notes: "notes",
}

/*
 * DB → UI のキー変換
 */
const PATIENT_DB_TO_APP_FIELD_MAP: Record<string, string> = {
  name_kana: "kana",
  birth_date: "date_of_birth",
  notes: "medical_notes",
}

/*
 * APP → DB 変換
 */
function mapPatientPayloadToDb(patient: Partial<Patient> = {}) {
  const payload: Record<string, any> = {}

  for (const [key, value] of Object.entries(patient)) {
    if (value === undefined) continue

    const dbKey = PATIENT_APP_TO_DB_FIELD_MAP[key] ?? key

    // 空欄は null にして Supabase エラーを防ぐ
    payload[dbKey] = value === "" ? null : value
  }

  return payload
}

/*
 * DB → APP 変換
 */
function mapPatientFromDb(record: Record<string, any>): Patient {
  const mapped: Record<string, any> = { ...record }

  for (const [dbKey, appKey] of Object.entries(PATIENT_DB_TO_APP_FIELD_MAP)) {
    if (dbKey in mapped) {
      mapped[appKey] = mapped[dbKey] ?? undefined
      delete mapped[dbKey]
    }
  }

  return mapped as Patient
}
// スタッフ関連
export async function getStaff() {
  try {
    const { data, error } = await supabaseAdmin
      .from("staff")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching staff:", error)
    return []
  }
}

export async function createStaff(staff: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("staff")
      .insert({
        ...staff,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating staff:", error)
    throw error
  }
}

export async function updateStaff(id: string, staff: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("staff")
      .update({
        ...staff,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating staff:", error)
    throw error
  }
}

export async function deleteStaff(id: string) {
  try {
    const { error } = await supabaseAdmin.from("staff").delete().eq("id", id).eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting staff:", error)
    throw error
  }
}

// カルテ関連
export async function getMedicalRecords(patientId?: string) {
  try {
    let query = supabaseAdmin
      .from("medical_records")
      .select(`
        *,
        staff:staff(*),
        patients:patients(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .order("date", { ascending: false })

    if (patientId) {
      query = query.eq("patient_id", patientId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching medical records:", error)
      throw error
    }

    const formattedData =
      data?.map((record) => ({
        ...record,
        staff: record.staff,
        patient: record.patients,
      })) || []

    return formattedData
  } catch (error) {
    console.error("Error fetching medical records:", error)
    return []
  }
}

export async function createMedicalRecord(record: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("medical_records")
      .insert({
        ...record,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating medical record:", error)
    throw error
  }
}

export async function getServices() {
  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("category", { ascending: true })
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching services:", error)
    return []
  }
}

export async function createService(service: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .insert({
        ...service,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating service:", error)
    throw error
  }
}

export async function updateService(id: string, service: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .update({
        ...service,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating service:", error)
    throw error
  }
}

export async function deleteService(id: string) {
  try {
    const { error } = await supabaseAdmin.from("services").delete().eq("id", id).eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting service:", error)
    throw error
  }
}

// 診療時間管理
export async function getBusinessHours() {
  try {
    const { data, error } = await supabaseAdmin
      .from("business_hours")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("day_of_week", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching business hours:", error)
    return []
  }
}

export async function updateBusinessHours(hoursOrId: any[] | string, singleHour?: any) {
  try {
    // If first parameter is a string (id), update a single record
    if (typeof hoursOrId === "string" && singleHour) {
      const id = hoursOrId
      const { data, error } = await supabaseAdmin
        .from("business_hours")
        .update({
          ...singleHour,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("clinic_id", CLINIC_ID)
        .select()
        .single()

      if (error) throw error
      return data
    }

    // Otherwise, treat as array (existing behavior)
    const hours = hoursOrId as any[]
    
    // 既存のデータを削除
    await supabaseAdmin.from("business_hours").delete().eq("clinic_id", CLINIC_ID)

    // 新しいデータを挿入
    const hoursWithClinic = hours.map((h) => ({
      ...h,
      clinic_id: CLINIC_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabaseAdmin.from("business_hours").insert(hoursWithClinic).select()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating business hours:", error)
    throw error
  }
}

// 休診日管理
export async function getHolidays() {
  try {
    const { data, error } = await supabaseAdmin
      .from("holidays")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("date", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching holidays:", error)
    return []
  }
}

export async function createHoliday(holiday: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("holidays")
      .insert({
        ...holiday,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating holiday:", error)
    throw error
  }
}

export async function deleteHoliday(id: string) {
  try {
    const { error } = await supabaseAdmin.from("holidays").delete().eq("id", id).eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting holiday:", error)
    throw error
  }
}

// 予約関連
export async function getAppointments() {
  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        patient:patients(*),
        staff:staff(*),
        service:services(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) throw error

    // Format the data to match the Appointment interface
    const formattedData = (data || []).map((apt) => ({
      ...apt,
      patient: apt.patient ? mapPatientFromDb(apt.patient) : undefined,
    }))

    return formattedData
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return []
  }
}

export async function createAppointment(appointment: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        ...appointment,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        patient:patients(*),
        staff:staff(*),
        service:services(*)
      `)
      .single()

    if (error) throw error

    // Format the data to match the Appointment interface
    const formattedData = {
      ...data,
      patient: data.patient ? mapPatientFromDb(data.patient) : undefined,
    }

    return formattedData
  } catch (error) {
    console.error("Error creating appointment:", error)
    throw error
  }
}

export async function updateAppointment(id: string, appointment: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({
        ...appointment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select(`
        *,
        patient:patients(*),
        staff:staff(*),
        service:services(*)
      `)
      .single()

    if (error) throw error

    // Format the data to match the Appointment interface
    const formattedData = {
      ...data,
      patient: data.patient ? mapPatientFromDb(data.patient) : undefined,
    }

    return formattedData
  } catch (error) {
    console.error("Error updating appointment:", error)
    throw error
  }
}

export async function deleteAppointment(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting appointment:", error)
    throw error
  }
}

// クリニック設定
export async function getClinicSettings() {
  try {
    const { data, error } = await supabaseAdmin.from("clinic_settings").select("*").eq("clinic_id", CLINIC_ID).single()

    if (error) {
      // 設定が存在しない場合、デフォルト値を作成
      if (error.code === "PGRST116") {
        const { data: newData, error: createError } = await supabaseAdmin
          .from("clinic_settings")
          .insert({
            clinic_id: CLINIC_ID,
            chairs_count: 3,
            booking_advance_days: 60,
            booking_buffer_minutes: 15,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) throw createError
        return newData
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("Error fetching clinic settings:", error)
    return null
  }
}

export async function updateClinicSettings(settings: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("clinic_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating clinic settings:", error)
    throw error
  }
}

// レセコン連携設定
export async function getReseconSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from("resecon_settings")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .maybeSingle()

    if (error && error.code !== "PGRST116") throw error

    // デフォルト値を返す
    if (!data) {
      return {
        enabled: false,
        resecon_type: "ORCA",
        api_endpoint: "",
        api_key: "",
        csv_format: "standard",
      }
    }

    return data
  } catch (error) {
    console.error("Error fetching resecon settings:", error)
    return {
      enabled: false,
      resecon_type: "ORCA",
      api_endpoint: "",
      api_key: "",
      csv_format: "standard",
    }
  }
}

export async function updateReseconSettings(settings: any) {
  try {
    // 既存の設定を確認
    const existing = await supabaseAdmin
      .from("resecon_settings")
      .select("id")
      .eq("clinic_id", CLINIC_ID)
      .maybeSingle()

    if (existing.data) {
      // 更新
      const { data, error } = await supabaseAdmin
        .from("resecon_settings")
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq("clinic_id", CLINIC_ID)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // 新規作成
      const { data, error } = await supabaseAdmin
        .from("resecon_settings")
        .insert({
          ...settings,
          clinic_id: CLINIC_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error updating resecon settings:", error)
    throw error
  }
}

export async function testReseconConnection(apiEndpoint: string, apiKey: string) {
  try {
    // 実際のAPI接続テストを行う
    // これはモック実装です
    const response = await fetch(apiEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`接続エラー: ${response.status} ${response.statusText}`)
    }

    return { success: true, message: "接続に成功しました" }
  } catch (error: any) {
    console.error("Error testing resecon connection:", error)
    return { success: false, message: error.message || "接続に失敗しました" }
  }
}

// クリニック情報
export async function getClinic() {
  try {
    const { data, error } = await supabaseAdmin.from("clinics").select("*").eq("id", CLINIC_ID).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching clinic:", error)
    return null
  }
}

export async function updateClinic(clinic: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("clinics")
      .update({
        ...clinic,
        updated_at: new Date().toISOString(),
      })
      .eq("id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating clinic:", error)
    throw error
  }
}

export async function initializeClinic() {
  try {
    const { data: existingClinic, error: checkError } = await supabaseAdmin
      .from("clinics")
      .select("*")
      .eq("id", CLINIC_ID)
      .maybeSingle()

    // Handle database table not existing
    if (checkError && checkError.message.includes("does not exist")) {
      throw new Error(
        "データベーステーブルが存在しません。Supabase SQLエディタまたはCLIで scripts/001_create_tables.sql を実行してください。"
      )
    }

    // Handle authentication/connection errors
    if (checkError && (
      checkError.message.includes("Invalid API key") ||
      checkError.message.includes("authentication") ||
      checkError.message.includes("JWT")
    )) {
      throw new Error(
        "Supabaseへの接続に失敗しました。NEXT_PUBLIC_SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYの環境変数を確認してください。"
      )
    }

    // Only throw on actual errors, not "no rows" results
    if (checkError && checkError.code !== "PGRST116") {
      throw new Error(`データベースエラー: ${checkError.message}`)
    }

    if (existingClinic) {
      console.log("Clinic already initialized")
      return existingClinic
    }

    console.log("Initializing clinic data...")

    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .insert({
        id: CLINIC_ID,
        name: "今泉歯科医院",
        phone: "03-1234-5678",
        email: "info@imaizumi-dental.jp",
        address: "東京都渋谷区今泉1-2-3",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (clinicError) throw clinicError

    await supabaseAdmin.from("staff").insert([
      {
        id: "00000000-0000-0000-0000-000000000011",
        clinic_id: CLINIC_ID,
        name: "今泉 太郎",
        role: "院長",
        email: "taro@imaizumi-dental.jp",
        phone: "03-1234-5678",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "00000000-0000-0000-0000-000000000012",
        clinic_id: CLINIC_ID,
        name: "山田 花子",
        role: "歯科医師",
        email: "hanako@imaizumi-dental.jp",
        phone: "03-1234-5679",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "00000000-0000-0000-0000-000000000013",
        clinic_id: CLINIC_ID,
        name: "佐藤 次郎",
        role: "歯科衛生士",
        email: "jiro@imaizumi-dental.jp",
        phone: "03-1234-5680",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    await supabaseAdmin.from("business_hours").insert([
      {
        clinic_id: CLINIC_ID,
        day_of_week: 1,
        open_time: "09:00",
        close_time: "18:00",
        is_closed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        clinic_id: CLINIC_ID,
        day_of_week: 2,
        open_time: "09:00",
        close_time: "18:00",
        is_closed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        clinic_id: CLINIC_ID,
        day_of_week: 3,
        open_time: "09:00",
        close_time: "18:00",
        is_closed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        clinic_id: CLINIC_ID,
        day_of_week: 4,
        open_time: "09:00",
        close_time: "18:00",
        is_closed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        clinic_id: CLINIC_ID,
        day_of_week: 5,
        open_time: "09:00",
        close_time: "18:00",
        is_closed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        clinic_id: CLINIC_ID,
        day_of_week: 6,
        open_time: "09:00",
        close_time: "13:00",
        is_closed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        clinic_id: CLINIC_ID,
        day_of_week: 0,
        open_time: "09:00",
        close_time: "18:00",
        is_closed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    const { data: servicesData } = await supabaseAdmin
      .from("services")
      .insert([
        {
          id: "00000000-0000-0000-0000-000000000021",
          clinic_id: CLINIC_ID,
          name: "初診・検診",
          description: "初回の診察と口腔内検査",
          duration: 30,
          price: 3000,
          category: "検診",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "00000000-0000-0000-0000-000000000022",
          clinic_id: CLINIC_ID,
          name: "虫歯治療",
          description: "虫歯の治療（1本）",
          duration: 45,
          price: 5000,
          category: "一般歯科",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "00000000-0000-0000-0000-000000000023",
          clinic_id: CLINIC_ID,
          name: "クリーニング",
          description: "歯のクリーニングと歯石除去",
          duration: 30,
          price: 4000,
          category: "予防歯科",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "00000000-0000-0000-0000-000000000024",
          clinic_id: CLINIC_ID,
          name: "ホワイトニング",
          description: "歯のホワイトニング",
          duration: 60,
          price: 20000,
          category: "審美歯科",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "00000000-0000-0000-0000-000000000025",
          clinic_id: CLINIC_ID,
          name: "矯正相談",
          description: "歯列矯正の相談",
          duration: 30,
          price: 0,
          category: "矯正歯科",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "00000000-0000-0000-0000-000000000026",
          clinic_id: CLINIC_ID,
          name: "抜歯",
          description: "歯の抜歯",
          duration: 45,
          price: 8000,
          category: "一般歯科",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    const patientNames = [
      { name: "鈴木 一郎", kana: "スズキ イチロウ", gender: "male" },
      { name: "田中 美咲", kana: "タナカ ミサキ", gender: "female" },
      { name: "佐藤 健太", kana: "サトウ ケンタ", gender: "male" },
      { name: "高橋 さくら", kana: "タカハシ サクラ", gender: "female" },
      { name: "伊藤 直樹", kana: "イトウ ナオキ", gender: "male" },
      { name: "渡辺 陽子", kana: "ワタナベ ヨウコ", gender: "female" },
      { name: "山本 大輔", kana: "ヤマモト ダイスケ", gender: "male" },
      { name: "中村 麻衣", kana: "ナカムラ マイ", gender: "female" },
      { name: "小林 拓海", kana: "コバヤシ タクミ", gender: "male" },
      { name: "加藤 結衣", kana: "カトウ ユイ", gender: "female" },
      { name: "吉田 隆", kana: "ヨシダ タカシ", gender: "male" },
      { name: "山田 愛", kana: "ヤマダ アイ", gender: "female" },
      { name: "佐々木 翔", kana: "ササキ ショウ", gender: "male" },
      { name: "松本 優奈", kana: "マツモト ユウナ", gender: "female" },
      { name: "井上 航", kana: "イノウエ ワタル", gender: "male" },
      { name: "木村 彩香", kana: "キムラ アヤカ", gender: "female" },
      { name: "林 悠斗", kana: "ハヤシ ユウト", gender: "male" },
      { name: "清水 莉子", kana: "シミズ リコ", gender: "female" },
      { name: "山崎 誠", kana: "ヤマザキ マコト", gender: "male" },
      { name: "森 千尋", kana: "モリ チヒロ", gender: "female" },
      { name: "池田 剛", kana: "イケダ ツヨシ", gender: "male" },
      { name: "橋本 梨花", kana: "ハシモト リカ", gender: "female" },
      { name: "阿部 健", kana: "アベ ケン", gender: "male" },
      { name: "石川 沙織", kana: "イシカワ サオリ", gender: "female" },
      { name: "前田 亮", kana: "マエダ リョウ", gender: "male" },
      { name: "藤田 七海", kana: "フジタ ナナミ", gender: "female" },
      { name: "岡田 雄大", kana: "オカダ ユウダイ", gender: "male" },
      { name: "長谷川 美穂", kana: "ハセガワ ミホ", gender: "female" },
      { name: "村上 浩二", kana: "ムラカミ コウジ", gender: "male" },
      { name: "近藤 真由", kana: "コンドウ マユ", gender: "female" },
      { name: "坂本 和也", kana: "サカモト カズヤ", gender: "male" },
      { name: "遠藤 舞", kana: "エンドウ マイ", gender: "female" },
      { name: "青木 勇気", kana: "アオキ ユウキ", gender: "male" },
      { name: "西村 亜美", kana: "ニシムラ アミ", gender: "female" },
      { name: "三浦 俊介", kana: "ミウラ シュンスケ", gender: "male" },
      { name: "福田 桃子", kana: "フクダ モモコ", gender: "female" },
      { name: "太田 光", kana: "オオタ ヒカル", gender: "male" },
      { name: "岡本 香織", kana: "オカモト カオリ", gender: "female" },
      { name: "藤井 将", kana: "フジイ マサシ", gender: "male" },
      { name: "上田 さやか", kana: "ウエダ サヤカ", gender: "female" },
      { name: "金子 幸太", kana: "カネコ コウタ", gender: "male" },
      { name: "中島 瑞希", kana: "ナカジマ ミズキ", gender: "female" },
      { name: "原 大樹", kana: "ハラ ダイキ", gender: "male" },
      { name: "竹内 由美", kana: "タケウチ ユミ", gender: "female" },
      { name: "小川 勝", kana: "オガワ マサル", gender: "male" },
      { name: "平野 恵", kana: "ヒラノ メグミ", gender: "female" },
      { name: "谷口 優", kana: "タニグチ ユウ", gender: "male" },
      { name: "斉藤 理恵", kana: "サイトウ リエ", gender: "female" },
      { name: "田村 淳", kana: "タムラ アツシ", gender: "male" },
      { name: "今井 春奈", kana: "イマイ ハルナ", gender: "female" },
    ]

    const patientsToInsert = patientNames.map((p, i) => {
      const patientNum = (i + 1).toString().padStart(3, "0")
      return {
        id: `00000000-0000-0000-0000-0000000000${(31 + i).toString().padStart(2, "0")}`,
        clinic_id: CLINIC_ID,
        patient_number: `P${patientNum}`,
        name: p.name,
        name_kana: p.kana,
        date_of_birth: `19${70 + (i % 30)}-${(i % 12) + 1}-${(i % 28) + 1}`,
        gender: p.gender,
        phone: `090-${1000 + i}-${5678 + i}`,
        email: `${p.kana.split(" ")[0].toLowerCase()}@example.com`,
        address: `東京都渋谷区渋谷${i + 1}-${i + 1}-${i + 1}`,
        emergency_contact: `緊急連絡先 090-${2000 + i}-${6789 + i}`,
        insurance_type: i % 2 === 0 ? "社会保険" : "国民健康保険",
        insurance_number: `${10000000 + i}`,
        medical_history: i % 5 === 0 ? "高血圧" : "特になし",
        allergies: i % 7 === 0 ? "ペニシリン" : "なし",
        notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    await supabaseAdmin.from("patients").insert(patientsToInsert)

    const staffIds = [
      "00000000-0000-0000-0000-000000000011",
      "00000000-0000-0000-0000-000000000012",
      "00000000-0000-0000-0000-000000000013",
    ]

    const serviceIds = [
      "00000000-0000-0000-0000-000000000021", // 初診・検診 30分
      "00000000-0000-0000-0000-000000000022", // 虫歯治療 45分
      "00000000-0000-0000-0000-000000000023", // クリーニング 30分
      "00000000-0000-0000-0000-000000000024", // ホワイトニング 60分
      "00000000-0000-0000-0000-000000000025", // 矯正相談 30分
      "00000000-0000-0000-0000-000000000026", // 抜歯 45分
    ]

    const serviceDurations = [30, 45, 30, 60, 30, 45]

    const today = new Date()
    const appointmentsToInsert = []

    // 月曜日から金曜日まで（5日間）
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const currentDay = new Date(today)
      currentDay.setDate(today.getDate() - today.getDay() + 1 + dayOffset)
      const dateStr = currentDay.toISOString().split("T")[0]

      // 1日20件の予約を生成
      let appointmentCount = 0
      const timeSlots = [
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
        "17:30",
      ]

      for (let staffIdx = 0; staffIdx < staffIds.length; staffIdx++) {
        for (let slotIdx = 0; slotIdx < timeSlots.length && appointmentCount < 20; slotIdx++) {
          const serviceIdx = (appointmentCount + slotIdx) % serviceIds.length
          const duration = serviceDurations[serviceIdx]
          const startTime = timeSlots[slotIdx]
          const [hours, minutes] = startTime.split(":").map(Number)
          const endMinutes = minutes + duration
          const endHours = hours + Math.floor(endMinutes / 60)
          const endTime = `${endHours.toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`

          // 土曜日は13:00まで
          if (currentDay.getDay() === 6 && endHours >= 13) {
            continue
          }

          const patientIdx = (dayOffset * 20 + appointmentCount) % 50
          const patientId = `00000000-0000-0000-0000-0000000000${(31 + patientIdx).toString().padStart(2, "0")}`

          appointmentsToInsert.push({
            clinic_id: CLINIC_ID,
            patient_id: patientId,
            staff_id: staffIds[staffIdx],
            service_id: serviceIds[serviceIdx],
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
            status: "confirmed",
            notes: "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          appointmentCount++
          if (appointmentCount >= 20) break
        }
        if (appointmentCount >= 20) break
      }
    }

    // 土曜日は午前中のみ10件
    const saturday = new Date(today)
    saturday.setDate(today.getDate() - today.getDay() + 6)
    const saturdayStr = saturday.toISOString().split("T")[0]

    const saturdayTimeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30"]

    for (let i = 0; i < 10; i++) {
      const serviceIdx = i % serviceIds.length
      const duration = serviceDurations[serviceIdx]
      const startTime = saturdayTimeSlots[i % saturdayTimeSlots.length]
      const [hours, minutes] = startTime.split(":").map(Number)
      const endMinutes = minutes + duration
      const endHours = hours + Math.floor(endMinutes / 60)
      const endTime = `${endHours.toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`

      if (endHours >= 13) continue

      const patientIdx = (100 + i) % 50
      const patientId = `00000000-0000-0000-0000-0000000000${(31 + patientIdx).toString().padStart(2, "0")}`

      appointmentsToInsert.push({
        clinic_id: CLINIC_ID,
        patient_id: patientId,
        staff_id: staffIds[i % staffIds.length],
        service_id: serviceIds[serviceIdx],
        date: saturdayStr,
        start_time: startTime,
        end_time: endTime,
        status: "confirmed",
        notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    await supabaseAdmin.from("appointments").insert(appointmentsToInsert)

    await supabaseAdmin.from("clinic_settings").insert({
      clinic_id: CLINIC_ID,
      chairs_count: 3,
      booking_advance_days: 60,
      booking_buffer_minutes: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    await supabaseAdmin.from("resecon_settings").insert({
      clinic_id: CLINIC_ID,
      enabled: false,
      resecon_type: "ORCA",
      api_endpoint: "",
      api_key: "",
      csv_format: "standard",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    console.log("Clinic initialized successfully with 100+ appointments")
    return clinic
  } catch (error) {
    console.error("Error initializing clinic:", error)
    // Re-throw with a clear message if the error isn't already user-friendly
    if (error instanceof Error) {
      throw error
    }
    throw new Error("クリニックの初期化中に予期しないエラーが発生しました")
  }
}

// 通知関連
export async function getNotifications(limit: number = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

export async function markNotificationRead(id: string) {
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({
        is_read: true,
        read_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

export async function markAllNotificationsRead() {
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({
        is_read: true,
        read_at: now,
        updated_at: now,
      })
      .eq("clinic_id", CLINIC_ID)
      .eq("is_read", false)
      .select()

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

// 🆕 フェーズ1: スタッフ別キャパシティに対応したダブルブッキングチェック
export async function checkAppointmentConflict(
  date: string,
  startTime: string,
  endTime: string,
  staffId: string,
  chairNumber?: number,
  excludeId?: string,
) {
  try {
    const settings = await getClinicSettings()

    const { data: staffData } = await supabaseAdmin
      .from("staff")
      .select("max_concurrent_appointments")
      .eq("id", staffId)
      .single()

    const staffCapacity = staffData?.max_concurrent_appointments ?? settings?.max_concurrent_appointments ?? 1

    let staffQuery = supabaseAdmin
      .from("appointments")
      .select("id, start_time, end_time, chair_number")
      .eq("clinic_id", CLINIC_ID)
      .eq("date", date)
      .eq("staff_id", staffId)
      .neq("status", "cancelled")

    if (excludeId) {
      staffQuery = staffQuery.neq("id", excludeId)
    }

    const { data: staffAppointments, error: staffError } = await staffQuery
    if (staffError) throw staffError

    const staffOverlapCount =
      staffAppointments?.filter((apt) => {
        return startTime < apt.end_time && endTime > apt.start_time
      }).length || 0

    let chairOverlapCount = 0
    if (chairNumber) {
      const chairConflicts =
        staffAppointments?.filter((apt) => {
          return apt.chair_number === chairNumber && startTime < apt.end_time && endTime > apt.start_time
        }) || []
      chairOverlapCount = chairConflicts.length
    }

    const canBook = chairOverlapCount === 0 && staffOverlapCount < staffCapacity

    return {
      canBook,
      staffOverlapCount,
      chairOverlapCount,
      staffCapacity,
      remainingCapacity: Math.max(0, staffCapacity - staffOverlapCount),
      message: !canBook
        ? chairOverlapCount > 0
          ? `チェア${chairNumber}は既に使用中です。別のチェアを選択してください。`
          : `この時間帯はスタッフの上限（${staffCapacity}件）に達しています。`
        : undefined,
    }
  } catch (error) {
    console.error("[v0] checkAppointmentConflict error:", error)
    return {
      canBook: false,
      staffOverlapCount: 0,
      chairOverlapCount: 0,
      staffCapacity: 1,
      remainingCapacity: 0,
      message: "予約の確認中にエラーが発生しました",
    }
  }
}

// 🆕 フェーズ1: 患者のリスクスコアを計算
export async function getPatientRiskScore(patientId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("status")
      .eq("clinic_id", CLINIC_ID)
      .eq("patient_id", patientId)

    if (error) throw error

    const cancellationCount = data?.filter((apt) => apt.status === "cancelled").length || 0
    const noShowCount = data?.filter((apt) => apt.status === "no_show").length || 0
    const totalAppointments = data?.length || 0

    let riskScore = 0
    if (totalAppointments > 0) {
      const cancellationRate = cancellationCount / totalAppointments
      const noShowRate = noShowCount / totalAppointments
      riskScore = Math.round((cancellationRate * 50 + noShowRate * 100) * 100)
    }

    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel: riskScore < 30 ? "low" : riskScore < 60 ? "medium" : "high",
      cancellationCount,
      noShowCount,
      totalAppointments,
    }
  } catch (error) {
    console.error("[v0] Error calculating risk score:", error)
    return { 
      riskScore: 0, 
      riskLevel: "low" as const,
      cancellationCount: 0, 
      noShowCount: 0, 
      totalAppointments: 0 
    }
  }
}

// 🆕 フェーズ3: キャンセル待ちリスト取得
export async function getWaitlist() {
  try {
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .select(`
        *,
        patient:patients(*),
        staff:staff(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .eq("status", "active")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Error getting waitlist:", error)
    return []
  }
}

// 🆕 フェーズ3: キャンセル待ちに追加
export async function addToWaitlist(entry: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .insert({
        ...entry,
        clinic_id: CLINIC_ID,
        status: "active",
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error adding to waitlist:", error)
    return { success: false, error }
  }
}

// 🆕 フェーズ3: キャンセル待ちから削除
export async function removeFromWaitlist(id: string) {
  try {
    const { error } = await supabaseAdmin.from("waitlist").delete().eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[v0] Error removing from waitlist:", error)
    return { success: false, error }
  }
}

// 🆕 フェーズ3: 今日の予約を取得
export async function getTodayAppointments() {
  try {
    const today = new Date().toISOString().split("T")[0]
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        patient:patients(*),
        staff:staff(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .eq("date", today)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Error getting today's appointments:", error)
    return []
  }
}

// 🆕 フェーズ3: 日付範囲で予約を取得
export async function getAppointmentsByDateRange(startDate: string, endDate: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        patient:patients(*),
        staff:staff(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Error getting appointments by date range:", error)
    return []
  }
}

