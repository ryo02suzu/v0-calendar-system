"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { CalendarView } from "@/components/calendar-view"
import { PatientList } from "@/components/patient-list"
import { MedicalRecords } from "@/components/medical-records"
import { Reports } from "@/components/reports"
import { Settings } from "@/components/settings"
import { initializeClinic } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<"calendar" | "patients" | "records" | "reports" | "settings">("calendar")
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeClinic()
        setIsInitialized(true)
        setError(null)
      } catch (error: any) {
        console.error("[v0] Failed to initialize clinic:", error)
        setError(error?.message || "初期化に失敗しました")
        setIsInitialized(false)
      }
    }
    initialize()
  }, [])

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">データベース初期化エラー</h2>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <div className="rounded-md bg-gray-50 p-4 text-sm">
                <p className="font-medium text-gray-900 mb-2">解決方法：</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>画面右側のファイルリストから「scripts」フォルダを開く</li>
                  <li>「001_create_tables.sql」ファイルを見つける</li>
                  <li>ファイル名の横にある「▶」（実行ボタン）をクリック</li>
                  <li>スクリプト実行後、このページをリロード</li>
                </ol>
              </div>
              <Button onClick={() => window.location.reload()} className="mt-4 w-full">
                リロード
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">初期化中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto">
          {activeView === "calendar" && <CalendarView />}
          {activeView === "patients" && <PatientList />}
          {activeView === "records" && <MedicalRecords />}
          {activeView === "reports" && <Reports />}
          {activeView === "settings" && <Settings />}
        </main>
      </div>
    </div>
  )
}
