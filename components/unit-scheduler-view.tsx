"use client"
import { useState, useEffect } from "react"
import { format, parseISO, isSameDay } from "date-fns"
import { ja } from "date-fns/locale"
import type { Appointment } from "@/lib/types"
import { Clock, Sun, Sunset } from "lucide-react"

interface UnitSchedulerViewProps {
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onSlotClick?: (date: string, time: string, unitId?: string) => void
}

const UNITS = [
  { id: "unit-1", name: "ユニット1", color: "bg-blue-500" },
  { id: "unit-2", name: "ユニット2", color: "bg-green-500" },
  { id: "unit-3", name: "ユニット3", color: "bg-purple-500" },
  { id: "hygiene-1", name: "衛生士1", color: "bg-amber-500" },
  { id: "surgery", name: "処置室", color: "bg-red-500" },
]
const START_HOUR = 9
const END_HOUR = 19
const SLOT_MINUTES = 30

export default function UnitSchedulerView({
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
}: UnitSchedulerViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const timeSlots: string[] = []
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      timeSlots.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`)
    }
  }

  const todayAppointments = appointments.filter((apt) => isSameDay(parseISO(apt.date), currentDate))
  const morningCount = todayAppointments.filter((apt) => parseInt(apt.start_time.split(":")[0]) < 13).length
  const afternoonCount = todayAppointments.filter((apt) => parseInt(apt.start_time.split(":")[0]) >= 13).length

  const getCurrentTimePosition = () => {
    if (!isSameDay(currentTime, currentDate)) return null
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    if (hours < START_HOUR || hours >= END_HOUR) return null
    const totalMinutes = (hours - START_HOUR) * 60 + minutes
    const totalSlots = timeSlots.length
    const totalHeight = totalSlots * 80
    return (totalMinutes / ((END_HOUR - START_HOUR) * 60)) * totalHeight
  }
  const currentTimePosition = getCurrentTimePosition()

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, "yyyy年M月d日(E)", { locale: ja })}
          </h2>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {format(currentDate, "EEEE", { locale: ja })}のスケジュール
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
            <Sun className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-900">午前 {morningCount}名</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-200">
            <Sunset className="w-4 h-4 text-indigo-600" />
            <span className="font-medium text-indigo-900">午後 {afternoonCount}名</span>
          </div>
          <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <span className="font-semibold text-gray-900">合計 {todayAppointments.length}件</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1200px]">
          <div className="grid grid-cols-[80px_repeat(5,1fr)] bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="p-3 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <span className="text-xs font-semibold text-gray-600">時間</span>
            </div>
            {UNITS.map((unit) => (
              <div key={unit.id} className="p-3 border-r border-gray-200 last:border-r-0">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${unit.color}`} />
                  <span className="text-sm font-semibold text-gray-900">{unit.name}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-gray-100">
                <div className="p-3 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs font-medium text-gray-600">{timeSlot}</span>
                </div>
                {UNITS.map((unit) => {
                  const cellAppointments = todayAppointments.filter(
                    (apt) => apt.start_time === timeSlot && apt.staff_id === unit.id
                  )
                  return (
                    <div
                      key={unit.id}
                      className="min-h-[80px] p-2 border-r border-gray-100 last:border-r-0 hover:bg-blue-50 transition-colors cursor-pointer relative"
                      onClick={() => {
                        if (cellAppointments.length === 0 && onSlotClick) {
                          const dateString = currentDate.toISOString().split("T")[0]
                          onSlotClick(dateString, timeSlot, unit.id)
                        }
                      }}
                    >
                      {cellAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt) }}
                          className={`p-2 rounded-lg border-l-4 ${unit.color} bg-white shadow-sm hover:shadow-md transition-all cursor-pointer`}
                        >
                          <div className="text-xs font-semibold text-gray-900 truncate">
                            {apt.patient?.name || "患者名なし"}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {apt.start_time} - {apt.end_time}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { UnitSchedulerView }
