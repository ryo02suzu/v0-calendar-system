"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"

/** 通知一覧を取得する */
export async function getNotifications(limit: number = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

/** 通知を既読にする */
export async function markNotificationRead(id: string) {
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({
        is_read: true,
        read_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .eq("clinic_id", CLINIC_ID)
      .select()
      .maybeSingle()

    if (error) {
      console.error("Database error marking notification as read:", error)
      throw error
    }

    if (!data) {
      console.warn("Notification not found:", id)
      return null
    }

    return data
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

/** 全通知を既読にする */
export async function markAllNotificationsRead() {
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({
        is_read: true,
        read_at: now,
        updated_at: now,
      })
      .eq("clinic_id", CLINIC_ID)
      .eq("is_read", false)
      .select()

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

/** 通知を作成する */
export async function createNotification(notification: {
  type: string
  message: string
  payload?: Record<string, any>
  target_url?: string
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        clinic_id: CLINIC_ID,
        type: notification.type,
        message: notification.message,
        payload: notification.payload ?? null,
        target_url: notification.target_url ?? null,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}
