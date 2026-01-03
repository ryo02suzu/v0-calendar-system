"use client"

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns"
import { ja } from "date-fns/locale"
import { Sun, Sunset } from "lucide-react"
import type { CalendarAppointment } from "@/types/api"

interface MonthViewProps {
  currentDate: Date
  appointments: CalendarAppointment[]
  onAppointmentClick: (appointment: CalendarAppointment) => void
  onDateClick?: (date: Date) => void
}

export function MonthView({ currentDate, appointments, onAppointmentClick, onDateClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: ja })
  const calendarEnd = endOfWeek(monthEnd, { locale: ja })

  const formatHm = (t: string) => {
    if (!t) return ""
    const [h, m] = t.split(":")
    return `${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}`
  }

  const days = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => isSameDay(parseISO(apt.date), date))
  }

  const getMorningCount = (date: Date) => {
    const dayAppts = getAppointmentsForDay(date)
    return dayAppts.filter((apt) => parseInt(apt.start_time.split(":")[0]) < 13).length
  }

  const getAfternoonCount = (date: Date) => {
    const dayAppts = getAppointmentsForDay(date)
    return dayAppts.filter((apt) => parseInt(apt.start_time.split(":")[0]) >= 13).length
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
        {["日", "月", "火", "水", "木", "金", "土"].map((dayName, i) => (
          <div key={i} className="bg-gray-50 p-2 text-center text-sm font-medium">
            {dayName}
          </div>
        ))}
        {days.map((day, i) => {
          const dayAppointments = getAppointmentsForDay(day)
          const morningCount = getMorningCount(day)
          const afternoonCount = getAfternoonCount(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          return (
            <div 
              key={i} 
              className={`bg-white p-2 min-h-[120px] cursor-pointer hover:bg-gray-50 transition-colors ${!isCurrentMonth ? "text-gray-400" : ""}`}
              onClick={() => onDateClick?.(day)}
            >
              <div className="font-medium mb-1">{format(day, "d")}</div>
              <div className="flex items-center gap-2 mb-2 text-xs">
                <div className="flex items-center gap-1 text-amber-600">
                  <Sun className="w-3 h-3" />
                  <span>{morningCount}</span>
                </div>
                <div className="flex items-center gap-1 text-indigo-600">
                  <Sunset className="w-3 h-3" />
                  <span>{afternoonCount}</span>
                </div>
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 2).map((apt) => (
                  <div
                    key={apt.id}
                    onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt) }}
                    className="text-xs p-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200 truncate"
                  >
                    {formatHm(apt.start_time)} {apt.patient?.name}
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div className="text-xs text-gray-600">他 {dayAppointments.length - 2} 件</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
