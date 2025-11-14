"use server"

import { CLINIC_ID } from "./constants"
import { supabaseAdmin } from "./supabase/admin"

// 患者関連
export async function getPatients() {
  try {
    const { data, error } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Error fetching patients:", error)
    return []
  }
}

export async function createPatient(patient: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("patients")
      .insert({
        ...patient,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("[v0] Error creating patient:", error)
    throw error
  }
}

export async function updatePatient(id: string, patient: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("patients")
      .update({
        ...patient,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("[v0] Error updating patient:", error)
    throw error
  }
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
    console.error("[v0] Error fetching staff:", error)
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
    console.error("[v0] Error creating staff:", error)
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
    console.error("[v0] Error updating staff:", error)
    throw error
  }
}

export async function deleteStaff(id: string) {
  try {
    const { error } = await supabaseAdmin.from("staff").delete().eq("id", id).eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("[v0] Error deleting staff:", error)
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
      console.error("[v0] Error fetching medical records:", error)
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
    console.error("[v0] Error fetching medical records:", error)
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
    console.error("[v0] Error creating medical record:", error)
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
    console.error("[v0] Error fetching services:", error)
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
    console.error("[v0] Error creating service:", error)
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
    console.error("[v0] Error updating service:", error)
    throw error
  }
}

export async function deleteService(id: string) {
  try {
    const { error } = await supabaseAdmin.from("services").delete().eq("id", id).eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("[v0] Error deleting service:", error)
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
    console.error("[v0] Error fetching business hours:", error)
    return []
  }
}

export async function updateBusinessHours(hours: any[]) {
  try {
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
    console.error("[v0] Error updating business hours:", error)
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
    console.error("[v0] Error fetching holidays:", error)
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
    console.error("[v0] Error creating holiday:", error)
    throw error
  }
}

export async function deleteHoliday(id: string) {
  try {
    const { error } = await supabaseAdmin.from("holidays").delete().eq("id", id).eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("[v0] Error deleting holiday:", error)
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
    console.error("[v0] Error fetching clinic settings:", error)
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
    console.error("[v0] Error updating clinic settings:", error)
    throw error
  }
}

// クリニック情報
export async function getClinic() {
  try {
    const { data, error } = await supabaseAdmin.from("clinics").select("*").eq("id", CLINIC_ID).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("[v0] Error fetching clinic:", error)
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
    console.error("[v0] Error updating clinic:", error)
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

    if (checkError && checkError.message.includes("does not exist")) {
      throw new Error("データベーステーブルが存在しません。scripts/001_create_tables.sql を実行してください。")
    }

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    if (existingClinic) {
      console.log("[v0] Clinic already initialized")
      return existingClinic
    }

    console.log("[v0] Initializing clinic data...")

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

    await supabaseAdmin.from("services").insert([
      {
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
    ])

    await supabaseAdmin.from("clinic_settings").insert({
      clinic_id: CLINIC_ID,
      chairs_count: 3,
      booking_advance_days: 60,
      booking_buffer_minutes: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    console.log("[v0] Clinic initialized successfully")
    return clinic
  } catch (error) {
    console.error("[v0] Error initializing clinic:", error)
    throw error
  }
}

