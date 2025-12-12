import { NextRequest, NextResponse } from "next/server"
import { markNotificationRead } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    if (!id || !id.trim()) {
      return NextResponse.json({ error: "通知IDが必要です" }, { status: 400 })
    }
    
    const data = await markNotificationRead(id)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return NextResponse.json({ error: "通知を既読にできませんでした" }, { status: 500 })
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return PATCH(request, { params })
}
