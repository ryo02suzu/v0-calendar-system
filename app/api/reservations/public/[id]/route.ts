import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { CLINIC_ID } from "@/lib/db/client"
import { applySecurityChecks } from "@/lib/security/api-security"

/**
 * GET /api/reservations/public/[id]
 * 患者向け予約取得 API（認証不要）。
 * 予約 ID を指定して予約詳細を返します。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const securityCheck = applySecurityChecks(request, {
    rateLimit: { maxRequests: 60, windowMs: 60 * 1000 },
  })
  if (!securityCheck.success) {
    return securityCheck.response!
  }

  const { id } = params

  if (!id) {
    return NextResponse.json({ error: "予約IDが必要です" }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        date,
        start_time,
        end_time,
        treatment_type,
        status,
        notes,
        patient:patients(name, phone, email),
        staff:staff(name)
      `)
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "予約が見つかりませんでした" }, { status: 404 })
    }

    return NextResponse.json({ appointment: data })
  } catch (error) {
    console.error("[public] Error fetching reservation:", error)
    return NextResponse.json(
      { error: "予約情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}
