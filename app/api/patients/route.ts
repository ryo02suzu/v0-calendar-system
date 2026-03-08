import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createPatient, getPatients } from "@/lib/db"
import { generatePatientNumber } from "@/lib/utils/patient-number"
import { patientCreateSchema } from "@/lib/validations/patient"
import { getServerAuth, checkServerPermission } from "@/lib/auth/server"

export async function GET() {
  const auth = await getServerAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  if (!checkServerPermission(auth.user!.role, "patients", "view")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  try {
    const data = await getPatients()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Failed to fetch patients:", error)
    return NextResponse.json(
      { error: "患者情報の取得に失敗しました" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await getServerAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  if (!checkServerPermission(auth.user!.role, "patients", "create")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  try {
    const json = await request.json()

    // ✅ ここを追加：フォームの空文字を undefined に変換
    const normalized = Object.fromEntries(
      Object.entries(json).map(([key, value]) => {
        if (typeof value === "string" && value.trim() === "") {
          return [key, undefined]
        }
        return [key, value]
      }),
    )

    // 元は json を直接 parse していたのを、normalized に変更
    const payload = patientCreateSchema.parse(normalized)

    const patient = await createPatient({
      ...payload,
      patient_number: generatePatientNumber(),
    })

    return NextResponse.json({ data: patient }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues.map((issue) => issue.message).join(", "),
        },
        { status: 400 },
      )
    }

    console.error("Failed to create patient:", error)
    return NextResponse.json(
      { error: "患者の登録に失敗しました" },
      { status: 500 },
    )
  }
}