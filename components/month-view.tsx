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
import type { CalendarAppointment } from "@/types/api"

interface MonthViewProps {
  currentDate: Date
  appointments: CalendarAppointment[]
  onAppointmentClick: (appointment: CalendarAppointment) => void
}

export function MonthView({ currentDate, appointments, onAppointmentClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: ja })
  const calendarEnd = endOfWeek(monthEnd, { locale: ja })

  const formatHm = (t: string) => (t?.length >= 5 ? t.slice(0, 5) : t)

  const days = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => isSameDay(parseISO(apt.date), date))
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
          const isCurrentMonth = isSameMonth(day, currentDate)
          return (
            <div key={i} className={`bg-white p-2 min-h-[120px] ${!isCurrentMonth ? "text-gray-400" : ""}`}>
              <div className="font-medium mb-1">{format(day, "d")}</div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => onAppointmentClick(apt)}
                    className="text-xs p-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200 truncate"
                  >
                    {formatHm(apt.start_time)} {apt.patient?.name}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-600">他 {dayAppointments.length - 3} 件</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
