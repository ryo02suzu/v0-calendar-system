import { NextResponse } from "next/server"
import { getPatientRiskScore } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const riskScore = await getPatientRiskScore(id)
    return NextResponse.json(riskScore)
  } catch (error) {
    console.error("Error getting patient risk score:", error)
    return NextResponse.json({ error: "Failed to get risk score" }, { status: 500 })
  }
}
