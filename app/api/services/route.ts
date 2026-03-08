import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createService, getServices } from "@/lib/db"
import { getServerAuth, checkServerPermission } from "@/lib/auth/server"

const serviceCreateSchema = z.object({
  name: z.string().min(1, "サービス名は必須です"),
  description: z.string().optional(),
  duration: z.number().min(1, "所要時間は1分以上である必要があります"),
  price: z.number().min(0, "価格は0以上である必要があります"),
  category: z.string().optional(),
  is_active: z.boolean().optional(),
})

export async function GET() {
  try {
    const data = await getServices()
    // Filter to only active services
    const activeServices = data.filter((service) => service.is_active !== false)
    return NextResponse.json({ data: activeServices })
  } catch (error) {
    console.error("Failed to fetch services:", error)
    return NextResponse.json(
      { error: "サービス情報の取得に失敗しました" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await getServerAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  if (!checkServerPermission(auth.user!.role, "settings", "edit")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  try {
    const json = await request.json()
    const payload = serviceCreateSchema.parse(json)

    const service = await createService(payload)

    return NextResponse.json({ data: service }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues.map((issue) => issue.message).join(", "),
        },
        { status: 400 },
      )
    }

    console.error("Failed to create service:", error)
    return NextResponse.json(
      { error: "サービスの登録に失敗しました" },
      { status: 500 },
    )
  }
}
