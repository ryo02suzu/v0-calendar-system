import { NextRequest, NextResponse } from "next/server"
import { markNotificationRead } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validate params
    const resolvedParams = await params
    
    if (!resolvedParams || !resolvedParams.id) {
      console.error("Missing notification id parameter")
      return NextResponse.json(
        { error: "通知IDが指定されていません" },
        { status: 400 }
      )
    }

    const { id } = resolvedParams

    // Validate id format (non-empty string)
    if (typeof id !== "string" || id.trim() === "") {
      console.error("Invalid notification id format:", id)
      return NextResponse.json(
        { error: "無効な通知IDです" },
        { status: 400 }
      )
    }

    // Attempt to mark notification as read
    const data = await markNotificationRead(id)
    
    // Check if notification was found and updated
    if (!data) {
      console.warn("Notification not found or already updated:", id)
      return NextResponse.json(
        { error: "通知が見つかりませんでした" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error("Failed to mark notification as read:", {
      error: error?.message || error,
      stack: error?.stack,
      code: error?.code,
    })

    // Generic error response
    return NextResponse.json(
      { error: "通知を既読にできませんでした" },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(request, { params })
}
