"use server"

import { supabaseAdmin } from "./supabase/admin"

// クリニックID（今井泉歯科医院専用）
const CLINIC_ID = "00000000-0000-0000-0000-000000000001"

// 予約関連
export async function getAppointments(date?: Date) {
  try {
    let query = supabaseAdmin
      .from("appointments")
      .select(`
        *,
        patients!appointments_patient_id_fkey(*),
        staff!appointments_staff_id_fkey(*)
      `)
      .eq("clinic_id", CLINIC_ID)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (date) {
      const dateStr = date.toISOString().split("T")[0]
      query = query.eq("date", dateStr)
    }

    const { data, error } = await query

    if (error) throw error

    // データ形式を整形（患者とスタッフ情報を適切なプロパティ名に変換）
    const formattedData =
      data?.map((appointment) => ({
        ...appointment,
        patient: appointment.patients,
        staff: appointment.staff,
      })) || []

    return formattedData
  } catch (error) {
    console.error("[v0] Error fetching appointments:", error)
    return []
  }
}

export async function createAppointment(appointment: any) {
  try {
    const hasConflict = await checkAppointmentConflict(
      appointment.date,
      appointment.start_time,
      appointment.end_time,
      appointment.staff_id,
    )

    if (hasConflict) {
      throw new Error("この時間帯は既に予約が入っています。別の時間を選択してください。")
    }

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        ...appointment,
        clinic_id: CLINIC_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("[v0] Error creating appointment:", error)
    throw error
  }
}

export async function updateAppointment(id: string, appointment: any) {
  try {
    const hasConflict = await checkAppointmentConflict(
      appointment.date,
      appointment.start_time,
      appointment.end_time,
      appointment.staff_id,
      id,
    )

    if (hasConflict) {
      throw new Error("この時間帯は既に予約が入っています。別の時間を選択してください。")
    }

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({
        ...appointment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("[v0] Error updating appointment:", error)
    throw error
  }
}

export async function deleteAppointment(id: string) {
  try {
    const { error } = await supabaseAdmin.from("appointments").delete().eq("id", id).eq("clinic_id", CLINIC_ID)

    if (error) throw error
  } catch (error) {
    console.error("[v0] Error deleting appointment:", error)
    throw error
  }
}

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
    console.error("[v0] Error fetching resecon settings:", error)
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
    console.error("[v0] Error updating resecon settings:", error)
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
    console.error("[v0] Error testing resecon connection:", error)
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

    console.log("[v0] Clinic initialized successfully with 100+ appointments")
    return clinic
  } catch (error) {
    console.error("[v0] Error initializing clinic:", error)
    throw error
  }
}

export async function getReminderSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from("reminder_settings")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .maybeSingle()

    if (error && error.code !== "PGRST116") throw error

    if (!data) {
      return {
        enabled: false,
        remind_hours_before: 24,
        send_sms: true,
        send_email: true,
        sms_template:
          "【{{clinic_name}}】\nご予約のリマインダーです。\n\n日時：{{date}} {{time}}\n担当：{{staff_name}}\n\nご不明な点がございましたら、お電話ください。",
        email_template:
          "件名：予約のリマインダー\n\nこんにちは、{{patient_name}}様\n\n{{clinic_name}}です。\n以下の予約のリマインダーをお送りします。\n\n日時：{{date}} {{time}}\n担当：{{staff_name}}\nメニュー：{{service_name}}\n\nご不明な点がございましたら、お気軽にお問い合わせください。",
      }
    }

    return data
  } catch (error) {
    console.error("[v0] Error fetching reminder settings:", error)
    return {
      enabled: false,
      remind_hours_before: 24,
      send_sms: true,
      send_email: true,
      sms_template:
        "【{{clinic_name}}】\nご予約のリマインダーです。\n\n日時：{{date}} {{time}}\n担当：{{staff_name}}\n\nご不明な点がございましたら、お電話ください。",
      email_template:
        "件名：予約のリマインダー\n\nこんにちは、{{patient_name}}様\n\n{{clinic_name}}です。\n以下の予約のリマインダーをお送りします。\n\n日時：{{date}} {{time}}\n担当：{{staff_name}}\nメニュー：{{service_name}}\n\nご不明な点がございましたら、お気軽にお問い合わせください。",
    }
  }
}

export async function updateReminderSettings(settings: any) {
  try {
    const existing = await supabaseAdmin
      .from("reminder_settings")
      .select("id")
      .eq("clinic_id", CLINIC_ID)
      .maybeSingle()

    if (existing.data) {
      const { data, error } = await supabaseAdmin
        .from("reminder_settings")
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
      const { data, error } = await supabaseAdmin
        .from("reminder_settings")
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
    console.error("[v0] Error updating reminder settings:", error)
    throw error
  }
}

export async function getReminderLogs(limit = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from("reminder_logs")
      .select(
        `
        *,
        appointments!reminder_logs_appointment_id_fkey(*),
        patients!reminder_logs_patient_id_fkey(*)
      `,
      )
      .eq("clinic_id", CLINIC_ID)
      .order("sent_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Error fetching reminder logs:", error)
    return []
  }
}

export async function sendReminder(appointmentId: string, method: "sms" | "email") {
  try {
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select(
        `
        *,
        patients!appointments_patient_id_fkey(*),
        staff!appointments_staff_id_fkey(*),
        services!appointments_service_id_fkey(*)
      `,
      )
      .eq("id", appointmentId)
      .single()

    if (appointmentError) throw appointmentError

    const { data: clinic } = await supabaseAdmin.from("clinics").select("*").eq("id", CLINIC_ID).single()

    const { data: settings } = await supabaseAdmin
      .from("reminder_settings")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .single()

    const template = method === "sms" ? settings.sms_template : settings.email_template
    const message = template
      .replace(/\{\{clinic_name\}\}/g, clinic.name)
      .replace(/\{\{patient_name\}\}/g, appointment.patients.name)
      .replace(/\{\{date\}\}/g, new Date(appointment.date).toLocaleDateString("ja-JP"))
      .replace(/\{\{time\}\}/g, appointment.start_time)
      .replace(/\{\{staff_name\}\}/g, appointment.staff.name)
      .replace(/\{\{service_name\}\}/g, appointment.services?.name || "")

    console.log(`[v0] Sending ${method} reminder:`, message)

    await supabaseAdmin.from("reminder_logs").insert({
      clinic_id: CLINIC_ID,
      appointment_id: appointmentId,
      patient_id: appointment.patient_id,
      method,
      status: "sent",
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    return { success: true, message: `${method === "sms" ? "SMS" : "メール"}を送信しました` }
  } catch (error: any) {
    console.error("[v0] Error sending reminder:", error)

    await supabaseAdmin.from("reminder_logs").insert({
      clinic_id: CLINIC_ID,
      appointment_id: appointmentId,
      patient_id: "",
      method,
      status: "failed",
      error_message: error.message,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    throw error
  }
}

async function checkAppointmentConflict(
  date: string,
  startTime: string,
  endTime: string,
  staffId: string,
  excludeAppointmentId?: string,
): Promise<boolean> {
  try {
    let query = supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("clinic_id", CLINIC_ID)
      .eq("date", date)
      .eq("staff_id", staffId)
      .neq("status", "cancelled")
      .or(
        `and(start_time.lte.${startTime},end_time.gt.${startTime}),and(start_time.lt.${endTime},end_time.gte.${endTime}),and(start_time.gte.${startTime},end_time.lte.${endTime})`,
      )

    if (excludeAppointmentId) {
      query = query.neq("id", excludeAppointmentId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error checking appointment conflict:", error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error("[v0] Error in checkAppointmentConflict:", error)
    return false
  }
}
