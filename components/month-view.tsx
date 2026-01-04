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
import type { Appointment, Holiday, BusinessHours } from "@/lib/types"
import { Sunrise, Sunset, XCircle } from "lucide-react"

interface MonthViewProps {
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onDayClick?: (date: Date) => void
  holidays?: Holiday[]
  businessHours?: BusinessHours[]
}

export function MonthView({
  currentDate,
  appointments,
  onAppointmentClick,
  onDayClick,
  holidays = [],
  businessHours = [],
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: ja })
  const calendarEnd = endOfWeek(monthEnd, { locale: ja })

  const days = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => isSameDay(parseISO(apt.date), date))
  }

  const getTimeSlotCounts = (dayAppointments: Appointment[]) => {
    const morning = dayAppointments.filter((apt) => {
      const hour = Number.parseInt(apt.start_time.split(":")[0])
      return hour < 13
    }).length

    const afternoon = dayAppointments.filter((apt) => {
      const hour = Number.parseInt(apt.start_time.split(":")[0])
      return hour >= 13
    }).length

    return { morning, afternoon }
  }

  const getStatusColor = (count: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return "bg-gray-50/50"
    if (count === 0) return "bg-card"
    if (count <= 5) return "bg-green-50"
    if (count <= 15) return "bg-blue-50"
    return "bg-orange-50"
  }

  const isHoliday = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return holidays.some((h) => h.date === dateStr)
  }

  const isBusinessDay = (date: Date) => {
    const dayOfWeek = date.getDay()
    const hours = businessHours.find((h) => h.day_of_week === dayOfWeek)
    return hours ? !hours.is_closed : true
  }

  const isMorningClosed = (date: Date) => {
    const dayOfWeek = date.getDay()
    const hours = businessHours.find((h) => h.day_of_week === dayOfWeek)
    return hours?.morning_closed || false
  }

  const isAfternoonClosed = (date: Date) => {
    const dayOfWeek = date.getDay()
    const hours = businessHours.find((h) => h.day_of_week === dayOfWeek)
    return hours?.afternoon_closed || false
  }

  return (
    <div className="p-4 md:p-6">
      <div className="bg-muted/30 p-2 md:p-3 rounded-xl shadow-sm">
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {["日", "月", "火", "水", "木", "金", "土"].map((dayName, i) => (
            <div
              key={i}
              className="bg-card p-1.5 md:p-3 text-center text-xs md:text-sm font-bold rounded-lg shadow-sm border border-border/50"
            >
              {dayName}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {days.map((day, i) => {
            const dayAppointments = getAppointmentsForDay(day)
            const { morning, afternoon } = getTimeSlotCounts(dayAppointments)
            const total = morning + afternoon
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const isClosedDay = isHoliday(day) || !isBusinessDay(day)
            const morningClosed = isMorningClosed(day)
            const afternoonClosed = isAfternoonClosed(day)

            return (
              <div
                key={i}
                onClick={() => onDayClick?.(day)}
                className={`
                  ${isClosedDay && isCurrentMonth ? "bg-gray-100 border-gray-300" : getStatusColor(total, isCurrentMonth)} 
                  p-1.5 md:p-3 min-h-[80px] md:min-h-[110px] rounded-lg shadow-sm
                  border-2 ${isToday ? "border-primary ring-2 ring-primary/20" : "border-border/30"}
                  ${!isCurrentMonth ? "opacity-40" : ""}
                  transition-all duration-200 hover:shadow-md hover:scale-[1.01]
                  cursor-pointer
                `}
              >
                <div
                  className={`text-xs md:text-sm font-bold mb-1 md:mb-2 ${isToday ? "text-primary" : "text-foreground"}`}
                >
                  {format(day, "d")}
                </div>

                {isCurrentMonth &&
                  (isClosedDay ? (
                    <div className="flex flex-col items-center justify-center py-2 md:py-4">
                      <XCircle className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mb-1" />
                      <span className="text-[9px] md:text-xs font-bold text-gray-600">休診</span>
                    </div>
                  ) : (
                    <div className="space-y-1 md:space-y-1.5">
                      {morningClosed ? (
                        <div className="flex items-center gap-1 px-1 md:px-2 py-0.5 md:py-1 rounded-md bg-gray-100 border border-gray-300">
                          <Sunrise className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
                          <XCircle className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
                          <span className="text-[8px] md:text-[9px] text-gray-600 font-bold">休診</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-1 md:px-2 py-0.5 md:py-1 rounded-md bg-amber-50/80 border border-amber-200/50">
                          <Sunrise className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-600" />
                          <span className="text-xs md:text-sm font-bold text-amber-900">{morning}</span>
                          <span className="text-[8px] md:text-[9px] text-amber-700 font-medium">名</span>
                        </div>
                      )}

                      {afternoonClosed ? (
                        <div className="flex items-center gap-1 px-1 md:px-2 py-0.5 md:py-1 rounded-md bg-gray-100 border border-gray-300">
                          <Sunset className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
                          <XCircle className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
                          <span className="text-[8px] md:text-[9px] text-gray-600 font-bold">休診</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-1 md:px-2 py-0.5 md:py-1 rounded-md bg-indigo-50/80 border border-indigo-200/50">
                          <Sunset className="w-2.5 h-2.5 md:w-3 md:h-3 text-indigo-600" />
                          <span className="text-xs md:text-sm font-bold text-indigo-900">{afternoon}</span>
                          <span className="text-[8px] md:text-[9px] text-indigo-700 font-medium">名</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
