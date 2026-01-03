"use client"

import { useState, useEffect } from "react"
import { CalendarToolbar } from "@/components/calendar-toolbar"
import { UnitSchedulerView } from "@/components/unit-scheduler-view"
import { MonthView } from "@/components/month-view"
import { AppointmentModal } from "@/components/appointment-modal"
import { WeekView } from "@/components/week-view"
import type { Appointment, Staff, Holiday, BusinessHours } from "@/lib/types"
import {
  getAppointments,
  getStaff,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getHolidays,
  getBusinessHours,
} from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

export function CalendarView() {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [initialSlotData, setInitialSlotData] = useState<{ date: string; time: string; staffId?: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [currentDate])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [appointmentsData, staffData, holidaysData, businessHoursData] = await Promise.all([
        getAppointments(),
        getStaff(),
        getHolidays(),
        getBusinessHours(),
      ])
      setAppointments(appointmentsData)
      setStaff(staffData)
      setHolidays(holidaysData)
      setBusinessHours(businessHoursData)
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

  const handleCreateAppointment = () => {
    setSelectedAppointment(null)
    setInitialSlotData(null)
    setIsModalOpen(true)
  }

  const handleSlotClick = (date: string, time: string, unitId?: string) => {
    setSelectedAppointment(null)
    const chairNumber = unitId?.includes("unit-") ? unitId.split("-")[1] : undefined
    setInitialSlotData({ date, time, staffId: chairNumber })
    setIsModalOpen(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setInitialSlotData(null)
    setIsModalOpen(true)
  }

  const handleSaveAppointment = async (appointment: Appointment) => {
    try {
      if (selectedAppointment) {
        await updateAppointment(appointment.id, appointment)
        toast({
          title: "保存完了",
          description: "予約を更新しました",
        })
      } else {
        await createAppointment(appointment)
        toast({
          title: "保存完了",
          description: "予約を作成しました",
        })
      }
      await loadData()
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
      await deleteAppointment(id)
      toast({
        title: "削除完了",
        description: "予約を削除しました",
      })
      await loadData()
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

  const handleDayClick = (date: Date) => {
    setCurrentDate(date)
    setViewMode("day")
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <CalendarToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onCreateAppointment={handleCreateAppointment}
      />

      <div className="flex-1 overflow-auto">
        {viewMode === "day" && (
          <UnitSchedulerView
            currentDate={currentDate}
            appointments={appointments}
            onAppointmentClick={handleEditAppointment}
            onSlotClick={handleSlotClick}
          />
        )}
        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            appointments={appointments}
            onAppointmentClick={handleEditAppointment}
            onDayClick={handleDayClick}
            holidays={holidays}
            businessHours={businessHours}
          />
        )}
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            appointments={appointments}
            onAppointmentClick={handleEditAppointment}
            onDayClick={handleDayClick}
            holidays={holidays}
            businessHours={businessHours}
          />
        )}
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        staff={staff}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        initialSlotData={initialSlotData}
      />
    </div>
  )
}
