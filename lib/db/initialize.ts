"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"

// クリニック初期化フラグ（モジュールレベル）
// 注意: この変数はNext.jsのサーバーサイドで動作し、開発時のホットリロード時にリセットされます。
// 本番環境では各サーバーインスタンスごとに独立して管理されます。
// 複数インスタンスでの並行初期化は、データベース側の制約（clinic_id の UNIQUE 制約）により
// 自動的に処理されるため、レースコンディションが発生しても問題ありません。
let clinicInitialized = false

/** クリニックデータを初期化する（初回のみ実行） */
export async function initializeClinic() {
  if (clinicInitialized) {
    return
  }

  try {
    const { data: existingClinic, error: checkError } = await supabaseAdmin
      .from("clinics")
      .select("*")
      .eq("id", CLINIC_ID)
      .maybeSingle()

    if (checkError && checkError.message.includes("does not exist")) {
      throw new Error(
        "データベーステーブルが存在しません。Supabase SQLエディタまたはCLIで scripts/001_create_tables.sql を実行してください。"
      )
    }

    if (
      checkError &&
      (checkError.message.includes("Invalid API key") ||
        checkError.message.includes("authentication") ||
        checkError.message.includes("JWT"))
    ) {
      throw new Error(
        "Supabaseへの接続に失敗しました。NEXT_PUBLIC_SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYの環境変数を確認してください。"
      )
    }

    if (checkError && checkError.code !== "PGRST116") {
      throw new Error(`データベースエラー: ${checkError.message}`)
    }

    if (existingClinic) {
      console.log("Clinic already initialized")
      clinicInitialized = true
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

    await supabaseAdmin
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
      { name: "鈴木 一郎", name_kana: "スズキ イチロウ", gender: "male" },
      { name: "田中 美咲", name_kana: "タナカ ミサキ", gender: "female" },
      { name: "佐藤 健太", name_kana: "サトウ ケンタ", gender: "male" },
      { name: "高橋 さくら", name_kana: "タカハシ サクラ", gender: "female" },
      { name: "伊藤 直樹", name_kana: "イトウ ナオキ", gender: "male" },
      { name: "渡辺 陽子", name_kana: "ワタナベ ヨウコ", gender: "female" },
      { name: "山本 大輔", name_kana: "ヤマモト ダイスケ", gender: "male" },
      { name: "中村 麻衣", name_kana: "ナカムラ マイ", gender: "female" },
      { name: "小林 拓海", name_kana: "コバヤシ タクミ", gender: "male" },
      { name: "加藤 結衣", name_kana: "カトウ ユイ", gender: "female" },
      { name: "吉田 隆", name_kana: "ヨシダ タカシ", gender: "male" },
      { name: "山田 愛", name_kana: "ヤマダ アイ", gender: "female" },
      { name: "佐々木 翔", name_kana: "ササキ ショウ", gender: "male" },
      { name: "松本 優奈", name_kana: "マツモト ユウナ", gender: "female" },
      { name: "井上 航", name_kana: "イノウエ ワタル", gender: "male" },
      { name: "木村 彩香", name_kana: "キムラ アヤカ", gender: "female" },
      { name: "林 悠斗", name_kana: "ハヤシ ユウト", gender: "male" },
      { name: "清水 莉子", name_kana: "シミズ リコ", gender: "female" },
      { name: "山崎 誠", name_kana: "ヤマザキ マコト", gender: "male" },
      { name: "森 千尋", name_kana: "モリ チヒロ", gender: "female" },
      { name: "池田 剛", name_kana: "イケダ ツヨシ", gender: "male" },
      { name: "橋本 梨花", name_kana: "ハシモト リカ", gender: "female" },
      { name: "阿部 健", name_kana: "アベ ケン", gender: "male" },
      { name: "石川 沙織", name_kana: "イシカワ サオリ", gender: "female" },
      { name: "前田 亮", name_kana: "マエダ リョウ", gender: "male" },
      { name: "藤田 七海", name_kana: "フジタ ナナミ", gender: "female" },
      { name: "岡田 雄大", name_kana: "オカダ ユウダイ", gender: "male" },
      { name: "長谷川 美穂", name_kana: "ハセガワ ミホ", gender: "female" },
      { name: "村上 浩二", name_kana: "ムラカミ コウジ", gender: "male" },
      { name: "近藤 真由", name_kana: "コンドウ マユ", gender: "female" },
      { name: "坂本 和也", name_kana: "サカモト カズヤ", gender: "male" },
      { name: "遠藤 舞", name_kana: "エンドウ マイ", gender: "female" },
      { name: "青木 勇気", name_kana: "アオキ ユウキ", gender: "male" },
      { name: "西村 亜美", name_kana: "ニシムラ アミ", gender: "female" },
      { name: "三浦 俊介", name_kana: "ミウラ シュンスケ", gender: "male" },
      { name: "福田 桃子", name_kana: "フクダ モモコ", gender: "female" },
      { name: "太田 光", name_kana: "オオタ ヒカル", gender: "male" },
      { name: "岡本 香織", name_kana: "オカモト カオリ", gender: "female" },
      { name: "藤井 将", name_kana: "フジイ マサシ", gender: "male" },
      { name: "上田 さやか", name_kana: "ウエダ サヤカ", gender: "female" },
      { name: "金子 幸太", name_kana: "カネコ コウタ", gender: "male" },
      { name: "中島 瑞希", name_kana: "ナカジマ ミズキ", gender: "female" },
      { name: "原 大樹", name_kana: "ハラ ダイキ", gender: "male" },
      { name: "竹内 由美", name_kana: "タケウチ ユミ", gender: "female" },
      { name: "小川 勝", name_kana: "オガワ マサル", gender: "male" },
      { name: "平野 恵", name_kana: "ヒラノ メグミ", gender: "female" },
      { name: "谷口 優", name_kana: "タニグチ ユウ", gender: "male" },
      { name: "斉藤 理恵", name_kana: "サイトウ リエ", gender: "female" },
      { name: "田村 淳", name_kana: "タムラ アツシ", gender: "male" },
      { name: "今井 春奈", name_kana: "イマイ ハルナ", gender: "female" },
    ]

    const patientsToInsert = patientNames.map((p, i) => {
      const patientNum = (i + 1).toString().padStart(3, "0")
      return {
        id: `00000000-0000-0000-0000-${(31 + i).toString().padStart(12, "0")}`,
        clinic_id: CLINIC_ID,
        patient_number: `P${patientNum}`,
        name: p.name,
        name_kana: p.name_kana,
        date_of_birth: `19${70 + (i % 30)}-${(i % 12) + 1}-${(i % 28) + 1}`,
        gender: p.gender,
        phone: `090-${1000 + i}-${5678 + i}`,
        email: `${p.name_kana.split(" ")[0].toLowerCase()}@example.com`,
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
      "00000000-0000-0000-0000-000000000021",
      "00000000-0000-0000-0000-000000000022",
      "00000000-0000-0000-0000-000000000023",
      "00000000-0000-0000-0000-000000000024",
      "00000000-0000-0000-0000-000000000025",
      "00000000-0000-0000-0000-000000000026",
    ]

    const serviceNames = ["初診・検診", "虫歯治療", "クリーニング", "ホワイトニング", "矯正相談", "抜歯"]
    const serviceDurations = [30, 45, 30, 60, 30, 45]

    const today = new Date()
    const appointmentsToInsert: any[] = []

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const currentDay = new Date(today)
      currentDay.setDate(today.getDate() - today.getDay() + 1 + dayOffset)
      const dateStr = currentDay.toISOString().split("T")[0]

      let appointmentCount = 0
      const timeSlots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
        "16:00", "16:30", "17:00", "17:30",
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

          if (currentDay.getDay() === 6 && endHours >= 13) continue

          const patientIdx = (dayOffset * 20 + appointmentCount) % 50
          const patientId = `00000000-0000-0000-0000-${(31 + patientIdx).toString().padStart(12, "0")}`

          appointmentsToInsert.push({
            clinic_id: CLINIC_ID,
            patient_id: patientId,
            staff_id: staffIds[staffIdx],
            service_id: serviceIds[serviceIdx],
            treatment_type: serviceNames[serviceIdx],
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
      const patientId = `00000000-0000-0000-0000-${(31 + patientIdx).toString().padStart(12, "0")}`

      appointmentsToInsert.push({
        clinic_id: CLINIC_ID,
        patient_id: patientId,
        staff_id: staffIds[i % staffIds.length],
        service_id: serviceIds[serviceIdx],
        treatment_type: serviceNames[serviceIdx],
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
    clinicInitialized = true
    return clinic
  } catch (error) {
    console.error("Error initializing clinic:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("クリニックの初期化中に予期しないエラーが発生しました")
  }
}
