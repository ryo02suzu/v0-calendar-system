"use client"

import { useState, useEffect } from "react"
import { CalendarToolbar } from "@/components/calendar-toolbar"
import { WeekView } from "@/components/week-view"
import { DayView } from "@/components/day-view"
import { MonthView } from "@/components/month-view"
import UnitSchedulerView from "@/components/unit-scheduler-view"
import { AppointmentModal } from "@/components/appointment-modal"
import type { Staff, Appointment } from "@/lib/types"
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
  const [initialSlotData, setInitialSlotData] = useState<{ date: string; time: string; staffId?: string } | null>(null)
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
    // Toolbar "新規予約" - clear initial slot data to ensure clean default modal
    setSelectedAppointment(null)
    setInitialSlotData(null)
    setIsModalOpen(true)
  }

  const handleEditAppointment = (appointment: CalendarAppointment) => {
    // Edit existing appointment - no slot prefill
    setSelectedAppointment(appointment)
    setInitialSlotData(null)
    setIsModalOpen(true)
  }

  const handleEmptyCellClick = ({ date, hour, staffId }: { date: Date; hour: number; staffId: string }) => {
    // Empty cell click - prefill date, time, and staff
    const dateString = date.toISOString().split("T")[0] // Convert Date to string
    const timeString = `${String(hour).padStart(2, "0")}:00`
    setSelectedAppointment(null)
    setInitialSlotData({ date: dateString, time: timeString, staffId })
    setIsModalOpen(true)
  }

  const handleEmptySlotClick = (date: Date, time: string, staffId: string) => {
    // Empty slot click from UnitSchedulerView - prefill date, time, and staff
    const dateString = date.toISOString().split("T")[0]
    setSelectedAppointment(null)
    setInitialSlotData({ date: dateString, time, staffId })
    setIsModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    // When date is clicked in week or month view, switch to day view
    setCurrentDate(date)
    setViewMode("day")
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
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "予約の削除に失敗しました")
      }

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
            onEmptyCellClick={handleEmptyCellClick}
            onDateClick={handleDateClick}
          />
        )}
        {viewMode === "day" && (
          <UnitSchedulerView
            currentDate={currentDate}
            appointments={appointments as Appointment[]}
            onAppointmentClick={handleEditAppointment}
            onEmptySlotClick={handleEmptySlotClick}
          />
        )}
        {viewMode === "month" && (
          <MonthView 
            currentDate={currentDate} 
            appointments={appointments} 
            onAppointmentClick={handleEditAppointment}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          // Reset initial slot data on modal close
          setInitialSlotData(null)
        }}
        appointment={selectedAppointment}
        staff={staff}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        initialSlotData={initialSlotData}
      />
    </div>
  )
}

async function mutateReservation(
  url: string,
  method: "POST" | "PATCH",
  payload: ReservationCreatePayload | ReservationUpdatePayload,
) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || "予約の保存に失敗しました")
  }
}
