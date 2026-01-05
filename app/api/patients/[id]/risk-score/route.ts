import { NextResponse } from "next/server"
import { getPatientRiskScore } from "@/lib/db"
import { validateSupabaseEnv, EnvConfigError } from "@/lib/env-validation"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate environment variables are set
    const validation = validateSupabaseEnv()
    
    if (!validation.isValid) {
      console.error("Environment validation failed:", validation.error?.details)
      return NextResponse.json(
        { 
          error: validation.error?.message || "Service configuration error",
          details: validation.error?.details || "Required environment variables are not configured properly"
        }, 
        { status: 503 }
      )
    }

    const { id } = await params
    const riskScore = await getPatientRiskScore(id)
    return NextResponse.json(riskScore)
  } catch (error) {
    console.error("Error getting patient risk score:", error)
    
    // Check if error is related to environment configuration using custom error type
    if (error instanceof EnvConfigError) {
      return NextResponse.json(
        { 
          error: "Service configuration error",
          details: error.details || "Database connection not properly configured"
        }, 
        { status: 503 }
      )
    }
    
    return NextResponse.json({ error: "Failed to get risk score" }, { status: 500 })
  }
}
