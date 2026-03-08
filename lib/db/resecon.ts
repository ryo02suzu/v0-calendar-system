"use server"

import { supabaseAdmin, CLINIC_ID } from "./client"

/** レセコン連携設定を取得する */
export async function getReseconSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from("resecon_settings")
      .select("*")
      .eq("clinic_id", CLINIC_ID)
      .maybeSingle()

    if (error && error.code !== "PGRST116") throw error

    if (!data) {
      return {
        enabled: false,
        resecon_type: "ORCA",
        api_endpoint: "",
        api_key: "",
        csv_format: "standard",
      }
    }

    return data
  } catch (error) {
    console.error("Error fetching resecon settings:", error)
    return {
      enabled: false,
      resecon_type: "ORCA",
      api_endpoint: "",
      api_key: "",
      csv_format: "standard",
    }
  }
}

/** レセコン連携設定を更新する */
export async function updateReseconSettings(settings: any) {
  try {
    const existing = await supabaseAdmin
      .from("resecon_settings")
      .select("id")
      .eq("clinic_id", CLINIC_ID)
      .maybeSingle()

    if (existing.data) {
      const { data, error } = await supabaseAdmin
        .from("resecon_settings")
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq("clinic_id", CLINIC_ID)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabaseAdmin
        .from("resecon_settings")
        .insert({
          ...settings,
          clinic_id: CLINIC_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error updating resecon settings:", error)
    throw error
  }
}

/**
 * レセコンAPIへの接続テストを行う。
 * タイムアウト（10秒）付きのHTTP GETリクエストを送信して接続可否を返す。
 */
export async function testReseconConnection(apiEndpoint: string, apiKey: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)

    let response: Response
    try {
      response = await fetch(apiEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      throw new Error(`接続エラー: ${response.status} ${response.statusText}`)
    }

    return { success: true, message: "接続に成功しました" }
  } catch (error: any) {
    const isTimeout = error?.name === "AbortError"
    const message = isTimeout
      ? "接続タイムアウト: サーバーが応答しません"
      : error.message || "接続に失敗しました"
    console.error("Error testing resecon connection:", error)
    return { success: false, message }
  }
}
