import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { updatePatient } from "@/lib/db"
import { patientUpdateSchema } from "@/lib/validations/patient"

type RouteContext = {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const json = await request.json()
    const payload = patientUpdateSchema.parse(json)

    const patient = await updatePatient(params.id, payload)
    return NextResponse.json({ data: patient })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(", ") }, { status: 400 })
    }

    console.error("[v0] Failed to update patient:", error)
    return NextResponse.json({ error: "患者情報の更新に失敗しました" }, { status: 500 })
  }
}
