"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAppointments, getPatients, getStaff, getServices } from "@/lib/db"
import type { Appointment, Patient, Staff, Service } from "@/lib/types"

interface ReportData {
  thisMonth: {
    totalAppointments: number
    newPatients: number
    revenue: number
    cancellationRate: number
    cancelledCount: number
    noShowCount: number
    completedCount: number
  }
  lastMonth: {
    totalAppointments: number
    newPatients: number
    revenue: number
    cancellationRate: number
  }
  staffCapacity: Array<{
    staff: string
    capacity: number
    booked: number
    percentage: number
  }>
  confirmationStats: Array<{
    status: string
    count: number
    percentage: number
    color: string
  }>
  treatmentTypeStats: Array<{
    type: string
    count: number
    percentage: number
  }>
  timeSlotStats: Array<{
    time: string
    count: number
    percentage: number
  }>
}

export function Reports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true)
        setError(null)

        // 並行してデータ取得
        const [appointments, patients, staff, services] = await Promise.all([
          getAppointments(),
          getPatients(),
          getStaff(),
          getServices(),
        ])

        // 今月と先月の範囲を計算
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        // 今月の予約をフィルタ
        const thisMonthAppointments = appointments.filter((apt) => {
          const aptDate = new Date(apt.date)
          return aptDate >= thisMonthStart && aptDate <= thisMonthEnd
        })

        // 先月の予約をフィルタ
        const lastMonthAppointments = appointments.filter((apt) => {
          const aptDate = new Date(apt.date)
          return aptDate >= lastMonthStart && aptDate <= lastMonthEnd
        })

        // 今月の新規患者
        const thisMonthNewPatients = patients.filter((patient) => {
          if (!patient.created_at) return false
          const createdDate = new Date(patient.created_at)
          return createdDate >= thisMonthStart && createdDate <= thisMonthEnd
        })

        // 先月の新規患者
        const lastMonthNewPatients = patients.filter((patient) => {
          if (!patient.created_at) return false
          const createdDate = new Date(patient.created_at)
          return createdDate >= lastMonthStart && createdDate <= lastMonthEnd
        })

        // キャンセル率計算
        const thisMonthCancelled = thisMonthAppointments.filter(
          (apt) => apt.status === "cancelled"
        ).length
        const thisMonthNoShow = thisMonthAppointments.filter(
          (apt) => apt.status === "no_show"
        ).length
        const thisMonthTotal = thisMonthAppointments.length
        const thisMonthCancellationRate =
          thisMonthTotal > 0
            ? ((thisMonthCancelled + thisMonthNoShow) / thisMonthTotal) * 100
            : 0

        const lastMonthCancelled = lastMonthAppointments.filter(
          (apt) => apt.status === "cancelled"
        ).length
        const lastMonthNoShow = lastMonthAppointments.filter(
          (apt) => apt.status === "no_show"
        ).length
        const lastMonthTotal = lastMonthAppointments.length
        const lastMonthCancellationRate =
          lastMonthTotal > 0
            ? ((lastMonthCancelled + lastMonthNoShow) / lastMonthTotal) * 100
            : 0

        // 今月の売上計算
        const thisMonthCompleted = thisMonthAppointments.filter(
          (apt) => apt.status === "completed"
        )
        
        // サービスIDからサービス情報を取得するマップを作成
        const serviceMap = new Map(services.map((s) => [s.id, s]))
        
        let thisMonthRevenue = 0
        thisMonthCompleted.forEach((apt) => {
          const service = serviceMap.get((apt as any).service_id)
          if (service?.price) {
            thisMonthRevenue += service.price
          }
        })

        // 先月の売上計算
        const lastMonthCompleted = lastMonthAppointments.filter(
          (apt) => apt.status === "completed"
        )
        let lastMonthRevenue = 0
        lastMonthCompleted.forEach((apt) => {
          const service = serviceMap.get((apt as any).service_id)
          if (service?.price) {
            lastMonthRevenue += service.price
          }
        })

        // スタッフ別キャパシティ計算
        const staffCapacity = staff.map((s) => {
          const staffAppointments = thisMonthAppointments.filter(
            (apt) => apt.staff_id === s.id
          )
          
          // 今月の営業日数を概算（月の日数 - 日曜日の数 - 祝日の数[概算4日]）
          const daysInMonth = thisMonthEnd.getDate()
          const businessDays = Math.floor(daysInMonth * 5 / 7) - 2 // 週5日稼働と仮定
          
          // 1日9時間営業、1予約平均30分と仮定
          const dailySlots = (9 * 60) / 30
          const capacity = Math.floor(businessDays * dailySlots)
          const booked = staffAppointments.length
          const percentage = capacity > 0 ? (booked / capacity) * 100 : 0

          return {
            staff: s.name,
            capacity,
            booked,
            percentage,
          }
        })

        // 確認状態別の予約
        const confirmed = thisMonthAppointments.filter(
          (apt) => apt.confirmation_status === "confirmed"
        ).length
        const pending = thisMonthAppointments.filter(
          (apt) => apt.confirmation_status === "pending" || !apt.confirmation_status
        ).length
        const expired = thisMonthTotal - confirmed - pending

        const confirmationStats = [
          {
            status: "確認済み",
            count: confirmed,
            percentage: thisMonthTotal > 0 ? (confirmed / thisMonthTotal) * 100 : 0,
            color: "bg-green-600",
          },
          {
            status: "未確認",
            count: pending,
            percentage: thisMonthTotal > 0 ? (pending / thisMonthTotal) * 100 : 0,
            color: "bg-yellow-600",
          },
          {
            status: "期限切れ",
            count: expired,
            percentage: thisMonthTotal > 0 ? (expired / thisMonthTotal) * 100 : 0,
            color: "bg-red-600",
          },
        ]

        // 治療内容別の予約数
        const treatmentTypeCounts = new Map<string, number>()
        thisMonthAppointments.forEach((apt) => {
          const type = apt.treatment_type || "その他"
          treatmentTypeCounts.set(type, (treatmentTypeCounts.get(type) || 0) + 1)
        })

        const treatmentTypeStats = Array.from(treatmentTypeCounts.entries())
          .map(([type, count]) => ({
            type,
            count,
            percentage: thisMonthTotal > 0 ? (count / thisMonthTotal) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count)

        // 予約時間帯別の分布
        const timeSlots = [
          { label: "09:00 - 11:00", start: 9, end: 11 },
          { label: "11:00 - 13:00", start: 11, end: 13 },
          { label: "13:00 - 15:00", start: 13, end: 15 },
          { label: "15:00 - 17:00", start: 15, end: 17 },
          { label: "17:00 - 19:00", start: 17, end: 19 },
        ]

        const timeSlotStats = timeSlots.map((slot) => {
          const count = thisMonthAppointments.filter((apt) => {
            const hour = parseInt(apt.start_time.split(":")[0])
            return hour >= slot.start && hour < slot.end
          }).length

          return {
            time: slot.label,
            count,
            percentage: thisMonthTotal > 0 ? (count / thisMonthTotal) * 100 : 0,
          }
        })

        setData({
          thisMonth: {
            totalAppointments: thisMonthTotal,
            newPatients: thisMonthNewPatients.length,
            revenue: thisMonthRevenue,
            cancellationRate: thisMonthCancellationRate,
            cancelledCount: thisMonthCancelled,
            noShowCount: thisMonthNoShow,
            completedCount: thisMonthCompleted.length,
          },
          lastMonth: {
            totalAppointments: lastMonthTotal,
            newPatients: lastMonthNewPatients.length,
            revenue: lastMonthRevenue,
            cancellationRate: lastMonthCancellationRate,
          },
          staffCapacity,
          confirmationStats,
          treatmentTypeStats,
          timeSlotStats,
        })
      } catch (err) {
        console.error("Error fetching report data:", err)
        setError("データの取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [])

  // ローディング状態
  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">レポート</h1>
          <p className="text-gray-600 mt-1">クリニックの統計と分析</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  // エラー状態
  if (error || !data) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">レポート</h1>
          <p className="text-gray-600 mt-1">クリニックの統計と分析</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{error || "データの取得に失敗しました"}</p>
        </div>
      </div>
    )
  }

  // 前月比の計算と色の決定
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) {
      return { value: 0, color: "text-gray-600", sign: "±" }
    }
    const percentChange = ((current - previous) / previous) * 100
    if (percentChange > 0) {
      return { value: percentChange, color: "text-green-600", sign: "+" }
    } else if (percentChange < 0) {
      return { value: Math.abs(percentChange), color: "text-red-600", sign: "-" }
    }
    return { value: 0, color: "text-gray-600", sign: "±" }
  }

  const appointmentChange = calculateChange(
    data.thisMonth.totalAppointments,
    data.lastMonth.totalAppointments
  )
  const patientChange = calculateChange(
    data.thisMonth.newPatients,
    data.lastMonth.newPatients
  )
  const revenueChange = calculateChange(
    data.thisMonth.revenue,
    data.lastMonth.revenue
  )
  const cancellationChange = {
    value: Math.abs(data.thisMonth.cancellationRate - data.lastMonth.cancellationRate),
    color:
      data.thisMonth.cancellationRate > data.lastMonth.cancellationRate
        ? "text-red-600"
        : "text-green-600",
    sign:
      data.thisMonth.cancellationRate > data.lastMonth.cancellationRate
        ? "+"
        : data.thisMonth.cancellationRate < data.lastMonth.cancellationRate
        ? "-"
        : "±",
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">レポート</h1>
        <p className="text-gray-600 mt-1">クリニックの統計と分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の予約数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.thisMonth.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              <span className={appointmentChange.color}>
                {appointmentChange.sign}
                {appointmentChange.value.toFixed(1)}%
              </span>{" "}
              先月比
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新規患者数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.thisMonth.newPatients}</div>
            <p className="text-xs text-muted-foreground">
              <span className={patientChange.color}>
                {patientChange.sign}
                {patientChange.value.toFixed(1)}%
              </span>{" "}
              先月比
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の売上</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.thisMonth.revenue > 0
                ? `¥${data.thisMonth.revenue.toLocaleString()}`
                : "データなし"}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={revenueChange.color}>
                {revenueChange.sign}
                {revenueChange.value.toFixed(1)}%
              </span>{" "}
              先月比
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">キャンセル率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.thisMonth.cancellationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={cancellationChange.color}>
                {cancellationChange.sign}
                {cancellationChange.value.toFixed(1)}%
              </span>{" "}
              先月比
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>キャパシティ充填率</CardTitle>
            <CardDescription>スタッフ別の予約充填状況</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.staffCapacity.length > 0 ? (
                data.staffCapacity.map((item) => (
                  <div key={item.staff}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.staff}</span>
                      <span className="text-sm text-gray-600">
                        {item.booked}/{item.capacity}枠 ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.percentage > 90
                            ? "bg-green-600"
                            : item.percentage > 70
                            ? "bg-blue-600"
                            : "bg-yellow-600"
                        }`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">データがありません</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>確認状態別の予約</CardTitle>
            <CardDescription>患者確認機能の統計</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.confirmationStats.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.status}</span>
                    <span className="text-sm text-gray-600">
                      {item.count}件 ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>治療内容別の予約数</CardTitle>
            <CardDescription>今月の治療タイプ別統計</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.treatmentTypeStats.length > 0 ? (
                data.treatmentTypeStats.slice(0, 5).map((item) => (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.type}</span>
                      <span className="text-sm text-gray-600">{item.count}件</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">データがありません</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>予約時間帯別の分布</CardTitle>
            <CardDescription>人気の時間帯</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.timeSlotStats.map((item) => (
                <div key={item.time}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.time}</span>
                    <span className="text-sm text-gray-600">{item.count}件</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
