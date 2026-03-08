"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Calendar, Clock, User, Phone, ChevronLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AppointmentDetail {
  id: string
  date: string
  start_time: string
  end_time: string
  treatment_type: string
  status: string
  notes?: string
  patient?: {
    name: string
    phone: string
    email?: string
  }
  staff?: {
    name: string
  }
}

export default function ReservationConfirmPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAppointment()
  }, [params.id])

  async function loadAppointment() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/reservations/public/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("予約が見つかりませんでした")
        } else {
          setError("予約情報の取得に失敗しました")
        }
        return
      }
      const data = await response.json()
      setAppointment(data.appointment)
    } catch {
      setError("予約情報の取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCancel() {
    if (!appointment) return
    if (!window.confirm("予約をキャンセルしますか？")) return

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/reservations/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (!response.ok) {
        throw new Error("キャンセルに失敗しました")
      }
      setAppointment((prev) => prev ? { ...prev, status: "cancelled" } : null)
    } catch {
      alert("キャンセルに失敗しました。お手数ですが、医院へご連絡ください。")
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-lg font-medium text-gray-900">{error || "予約が見つかりませんでした"}</p>
              <Button variant="outline" onClick={() => router.push("/reserve")}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                予約ページへ戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCancelled = appointment.status === "cancelled"
  const dateLabel = new Date(appointment.date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {isCancelled ? (
                <X className="w-6 h-6 text-red-500" />
              ) : (
                <Check className="w-6 h-6 text-green-500" />
              )}
              <CardTitle>
                {isCancelled ? "予約はキャンセル済みです" : "予約確認"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">日時</p>
                  <p className="font-medium">{dateLabel}</p>
                  <p className="text-sm text-gray-700">{appointment.start_time} 〜 {appointment.end_time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">メニュー</p>
                  <p className="font-medium">{appointment.treatment_type}</p>
                </div>
              </div>

              {appointment.staff && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">担当</p>
                    <p className="font-medium">{appointment.staff.name}</p>
                  </div>
                </div>
              )}

              {appointment.patient && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">お名前・電話番号</p>
                    <p className="font-medium">{appointment.patient.name}</p>
                    <p className="text-sm text-gray-700">{appointment.patient.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {!isCancelled && (
              <div className="pt-4 border-t space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/reserve")}
                >
                  予約を変更する
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? "キャンセル中..." : "予約をキャンセルする"}
                </Button>
              </div>
            )}

            {isCancelled && (
              <div className="pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => router.push("/reserve")}
                >
                  新しい予約をする
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
