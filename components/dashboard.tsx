"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Users, AlertTriangle, TrendingUp, Clock, CheckCircle2 } from "lucide-react"
import { getTodayAppointments, getPatientRiskScore } from "@/lib/db"

export function Dashboard() {
  const [todayStats, setTodayStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
  })
  const [highRiskPatients, setHighRiskPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const appointments = await getTodayAppointments()
      
      // Calculate stats
      const stats = {
        total: appointments.length,
        confirmed: appointments.filter(apt => apt.confirmation_status === "confirmed").length,
        pending: appointments.filter(apt => apt.confirmation_status === "pending" || !apt.confirmation_status).length,
        completed: appointments.filter(apt => apt.status === "completed").length,
      }
      setTodayStats(stats)

      // Find high-risk patients in today's appointments
      const risks = []
      for (const apt of appointments) {
        if (apt.patient_id) {
          const risk = await getPatientRiskScore(apt.patient_id)
          if (risk.riskLevel === "high") {
            risks.push({
              ...apt,
              riskScore: risk,
            })
          }
        }
      }
      setHighRiskPatients(risks)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-gray-600 mt-1">今日の予約状況と重要な情報</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日の予約総数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              本日の予約
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">確認済み</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{todayStats.confirmed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              患者確認完了
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未確認</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{todayStats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              確認待ち
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayStats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              診療完了
            </p>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Patients Alert */}
      {highRiskPatients.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              高リスク患者の予約
            </CardTitle>
            <CardDescription>
              今日の予約に高リスク患者が含まれています
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRiskPatients.map((apt) => (
                <Alert key={apt.id} variant="destructive">
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{apt.patient?.name || "患者名不明"}</span>
                        <span className="text-sm ml-2">
                          {apt.start_time} - {apt.end_time}
                        </span>
                      </div>
                      <div className="text-sm">
                        リスクスコア: {apt.riskScore.riskScore}/100
                        <span className="ml-2 text-xs">
                          (キャンセル: {apt.riskScore.cancellationCount}回 / 無断: {apt.riskScore.noShowCount}回)
                        </span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle>今日のスケジュール概要</CardTitle>
          <CardDescription>本日の予約状況</CardDescription>
        </CardHeader>
        <CardContent>
          {todayStats.total === 0 ? (
            <p className="text-gray-500 text-center py-8">本日の予約はありません</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">総予約数</span>
                <span className="text-lg font-bold">{todayStats.total}件</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">確認済み</span>
                <span className="text-lg font-bold text-green-600">
                  {todayStats.confirmed}件 ({Math.round((todayStats.confirmed / todayStats.total) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium text-amber-900">未確認</span>
                <span className="text-lg font-bold text-amber-600">
                  {todayStats.pending}件 ({Math.round((todayStats.pending / todayStats.total) * 100)}%)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
