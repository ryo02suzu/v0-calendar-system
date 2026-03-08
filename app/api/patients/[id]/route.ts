import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { updatePatient, deletePatient } from "@/lib/db"
import { patientUpdateSchema } from "@/lib/validations/patient"
import { getServerAuth, checkServerPermission } from "@/lib/auth/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await getServerAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  if (!checkServerPermission(auth.user!.role, "patients", "edit")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  try {
    const json = await request.json()
    const payload = patientUpdateSchema.parse(json)

    const { id } = await params
    const patient = await updatePatient(id, payload)
    return NextResponse.json({ data: patient })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(", ") }, { status: 400 })
    }

    console.error("Failed to update patient:", error)
    return NextResponse.json({ error: "患者情報の更新に失敗しました" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await getServerAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  if (!checkServerPermission(auth.user!.role, "patients", "delete")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  try {
    const { id } = await params
    await deletePatient(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete patient:", error)
    return NextResponse.json({ error: "患者の削除に失敗しました" }, { status: 500 })
  }
}
