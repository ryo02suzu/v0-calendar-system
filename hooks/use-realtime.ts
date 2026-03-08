"use client"

import { useEffect, useRef } from "react"
import { supabaseClient } from "@/lib/supabase/client"

/**
 * appointments テーブルの INSERT/UPDATE/DELETE を監視し、
 * 変更があるたびに onUpdate コールバックを呼び出すフック。
 *
 * NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定の場合は何もしません。
 */
export function useRealtimeAppointments(onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return

    const channel = supabaseClient
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          onUpdateRef.current()
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [])
}

/**
 * notifications テーブルの INSERT/UPDATE/DELETE を監視し、
 * 変更があるたびに onUpdate コールバックを呼び出すフック。
 *
 * NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定の場合は何もしません。
 */
export function useRealtimeNotifications(onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return

    const channel = supabaseClient
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          onUpdateRef.current()
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [])
}
