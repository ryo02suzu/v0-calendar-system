"use client"

import { useState, useEffect } from "react"
import { CalendarToolbar } from "@/components/calendar-toolbar"
import { WeekView } from "@/components/week-view"
import { DayView } from "@/components/day-view"
import { MonthView } from "@/components/month-view"
import { AppointmentModal } from "@/components/appointment-modal"
import type { Staff } from "@/lib/types"
import type { CalendarAppointment, ReservationCreatePayload, ReservationUpdatePayload } from "@/types/api"
import { useToast } from "@/hooks/use-toast"

export function CalendarView() {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadData = async (date: Date) => {
    setIsLoading(true)
    try {
      const dateString = date.toISOString().split("T")[0]
      const [appointmentsResponse, staffResponse] = await Promise.all([
        fetch(`/api/reservations?date=${dateString}`, { cache: "no-store" }),
        fetch("/api/staff", { cache: "no-store" }),
      ])

      const appointmentsJson: { data?: CalendarAppointment[]; error?: string } = await appointmentsResponse.json()
      const staffJson = await staffResponse.json()

      if (!appointmentsResponse.ok) {
        throw new Error(appointmentsJson.error || "予約データの取得に失敗しました")
      }
      if (!staffResponse.ok) {
        throw new Error(staffJson.error || "スタッフ情報の取得に失敗しました")
      }

      setAppointments(appointmentsJson.data || [])
      setStaff(staffJson.data || [])
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast({
        title: "エラー",
        description: "データの読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData(currentDate)
  }, [currentDate])

  const handleCreateAppointment = () => {
    setSelectedAppointment(null)
    setIsModalOpen(true)
  }

  const handleEditAppointment = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment)
    setIsModalOpen(true)
  }

  const handleSaveAppointment = async (appointment: CalendarAppointment) => {
    try {
      if (!appointment.patient_id || !appointment.staff_id) {
        throw new Error("患者と担当者を選択してください")
      }

      const basePayload = {
        patient_id: appointment.patient_id,
        staff_id: appointment.staff_id,
        date: appointment.date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        treatment_type: appointment.treatment_type,
        status: appointment.status,
        chair_number: appointment.chair_number,
        notes: appointment.notes,
      }

      if (selectedAppointment) {
        await mutateReservation(`/api/reservations/${appointment.id}`, "PATCH", basePayload)
        toast({
          title: "保存完了",
          description: "予約を更新しました",
        })
      } else {
        await mutateReservation(`/api/reservations`, "POST", basePayload as ReservationCreatePayload)
        toast({
          title: "保存完了",
          description: "予約を作成しました",
        })
      }
      await loadData(currentDate)
      setIsModalOpen(false)
    } catch (error: any) {
      console.error("[v0] Error saving appointment:", error)
      toast({
        title: "エラー",
        description: error?.message || "予約の保存に失敗しました",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteAppointment = async (id: string) => {
    console.log("[DEBUG] handleDeleteAppointment - id:", id)
    
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[DEBUG] DELETE failed - status:", response.status, "error:", errorData)
        throw new Error(errorData.error || "予約の削除に失敗しました")
      }

      const result = await response.json()
      console.log("[DEBUG] DELETE success - result:", result)

      toast({
        title: "削除完了",
        description: "予約を削除しました",
      })
      await loadData(currentDate)
      setIsModalOpen(false)
    } catch (error) {
      console.error("[v0] Error deleting appointment:", error)
      toast({
        title: "エラー",
        description: "予約の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <CalendarToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onCreateAppointment={handleCreateAppointment}
      />

      <div className="flex-1 overflow-auto">
        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            appointments={appointments}
            staff={staff}
            onAppointmentClick={handleEditAppointment}
          />
        )}
        {viewMode === "day" && (
          <DayView
            currentDate={currentDate}
            appointments={appointments}
            staff={staff}
            onAppointmentClick={handleEditAppointment}
          />
        )}
        {viewMode === "month" && (
          <MonthView currentDate={currentDate} appointments={appointments} onAppointmentClick={handleEditAppointment} />
        )}
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        staff={staff}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
      />
    </div>
  )
}

async function mutateReservation(
  url: string,
  method: "POST" | "PATCH",
  payload: ReservationCreatePayload | ReservationUpdatePayload,
) {
  console.log("[DEBUG] mutateReservation - method:", method, "url:", url, "payload:", payload)
  
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error("[DEBUG] mutateReservation failed - status:", response.status, "error:", errorData)
    throw new Error(errorData.error || "予約の保存に失敗しました")
  }
  
  const result = await response.json()
  console.log("[DEBUG] mutateReservation success - result:", result)
  return result
}
