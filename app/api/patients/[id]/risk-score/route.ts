import { NextResponse } from "next/server"
import { getPatientRiskScore } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing required environment variables")
      return NextResponse.json(
        { 
          error: "Service configuration error",
          details: "Required environment variables are not configured properly"
        }, 
        { status: 503 }
      )
    }

    // Validate URL format
    try {
      new URL(supabaseUrl)
    } catch {
      console.error("Invalid NEXT_PUBLIC_SUPABASE_URL format:", supabaseUrl)
      return NextResponse.json(
        { 
          error: "Service configuration error",
          details: "Invalid Supabase URL configuration"
        }, 
        { status: 503 }
      )
    }

    const { id } = await params
    const riskScore = await getPatientRiskScore(id)
    return NextResponse.json(riskScore)
  } catch (error) {
    console.error("Error getting patient risk score:", error)
    
    // Check if error is related to environment configuration
    if (error instanceof Error && (
      error.message.includes("NEXT_PUBLIC_SUPABASE_URL") ||
      error.message.includes("SUPABASE_SERVICE_ROLE_KEY")
    )) {
      return NextResponse.json(
        { 
          error: "Service configuration error",
          details: "Database connection not properly configured"
        }, 
        { status: 503 }
      )
    }
    
    return NextResponse.json({ error: "Failed to get risk score" }, { status: 500 })
  }
}
