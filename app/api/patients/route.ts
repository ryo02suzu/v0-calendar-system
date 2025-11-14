import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createPatient, getPatients } from "@/lib/db"
import { generatePatientNumber } from "@/lib/utils/patient-number"

const patientSchema = z.object({
  name: z.string().min(1, "患者名は必須です"),
  phone: z.string().min(1, "電話番号は必須です"),
  email: z.string().email().optional(),
})

export async function GET() {
  try {
    const data = await getPatients()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Failed to fetch patients:", error)
    return NextResponse.json({ error: "患者情報の取得に失敗しました" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const payload = patientSchema.parse(json)

    const patient = await createPatient({
      ...payload,
      patient_number: generatePatientNumber(),
    })

    return NextResponse.json({ data: patient }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(", ") }, { status: 400 })
    }

    console.error("[v0] Failed to create patient:", error)
    return NextResponse.json({ error: "患者の登録に失敗しました" }, { status: 500 })
  }
}
