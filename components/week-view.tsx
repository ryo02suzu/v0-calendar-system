"use client"

import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import type { Appointment, Holiday, BusinessHours } from "@/lib/types"
import { Users, Sun, Sunset, XCircle } from "lucide-react"

interface WeekViewProps {
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onDayClick?: (date: Date) => void
  holidays?: Holiday[]
  businessHours?: BusinessHours[]
}

export function WeekView({
  currentDate,
  appointments,
  onAppointmentClick,
  onDayClick,
  holidays = [],
  businessHours = [],
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: ja, weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => isSameDay(parseISO(apt.date), date))
  }

  const splitByTime = (dayAppointments: Appointment[]) => {
    const morning = dayAppointments.filter((apt) => {
      const hour = Number.parseInt(apt.start_time.split(":")[0])
      return hour < 13
    })
    const afternoon = dayAppointments.filter((apt) => {
      const hour = Number.parseInt(apt.start_time.split(":")[0])
      return hour >= 13
    })
    return { morning, afternoon }
  }

  const getStatusColor = (count: number) => {
    if (count === 0) return "bg-gray-50 border-gray-200"
    if (count <= 5) return "bg-green-50 border-green-200"
    if (count <= 15) return "bg-blue-50 border-blue-200"
    return "bg-orange-50 border-orange-200"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">
        {weekDays.map((day, i) => {
          const dayAppointments = getAppointmentsForDay(day)
          const { morning, afternoon } = splitByTime(dayAppointments)
          const count = dayAppointments.length
          const isToday = isSameDay(day, new Date())
          const isClosedDay = isHoliday(day) || !isBusinessDay(day)
          const morningClosed = isMorningClosed(day)
          const afternoonClosed = isAfternoonClosed(day)

          return (
            <div
              key={i}
              onClick={() => onDayClick?.(day)}
              className={`
                ${isClosedDay ? "bg-gray-100 border-gray-300" : getStatusColor(count)} 
                border-2 rounded-xl p-3 md:p-4 transition-all duration-200
                hover:shadow-lg hover:scale-[1.02] cursor-pointer
                ${isToday ? "ring-2 ring-primary ring-offset-2 shadow-md" : "shadow-sm"}
              `}
            >
              <div className="text-center mb-2 md:mb-3 pb-2 border-b border-border/50">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {format(day, "E", { locale: ja })}
                </div>
                <div className={`text-xl md:text-2xl font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                  {format(day, "d")}
                </div>
              </div>

              {isClosedDay ? (
                <div className="flex flex-col items-center justify-center py-4 md:py-6">
                  <XCircle className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mb-2" />
                  <span className="text-sm md:text-base font-bold text-gray-600">休診</span>
                </div>
              ) : (
                <div className="space-y-1.5 md:space-y-2">
                  {morningClosed ? (
                    <div className="flex flex-col items-center justify-center gap-1 p-1.5 md:p-2 rounded-lg bg-gray-100 border border-gray-300">
                      <div className="flex items-center gap-1">
                        <Sun className="w-3 h-3 text-gray-500" />
                        <span className="text-[9px] md:text-[10px] font-semibold text-gray-600">午前</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <XCircle className="w-3 h-3 text-gray-500" />
                        <span className="text-xs font-bold text-gray-600">休診</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 p-1.5 md:p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-600" />
                        <span className="text-[9px] md:text-[10px] font-semibold text-amber-900">午前</span>
                      </div>
                      <span className="text-base md:text-lg font-bold text-amber-900">
                        {morning.length}
                        <span className="text-[9px] md:text-[10px] font-normal ml-0.5">名</span>
                      </span>
                    </div>
                  )}

                  {afternoonClosed ? (
                    <div className="flex flex-col items-center justify-center gap-1 p-1.5 md:p-2 rounded-lg bg-gray-100 border border-gray-300">
                      <div className="flex items-center gap-1">
                        <Sunset className="w-3 h-3 text-gray-500" />
                        <span className="text-[9px] md:text-[10px] font-semibold text-gray-600">午後</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <XCircle className="w-3 h-3 text-gray-500" />
                        <span className="text-xs font-bold text-gray-600">休診</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 p-1.5 md:p-2 rounded-lg bg-indigo-50 border border-indigo-200">
                      <div className="flex items-center gap-1">
                        <Sunset className="w-3 h-3 text-indigo-600" />
                        <span className="text-[9px] md:text-[10px] font-semibold text-indigo-900">午後</span>
                      </div>
                      <span className="text-base md:text-lg font-bold text-indigo-900">
                        {afternoon.length}
                        <span className="text-[9px] md:text-[10px] font-normal ml-0.5">名</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1 md:gap-1.5 mt-1 md:mt-2 pt-1 md:pt-2 border-t border-border/50">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                    <span className="text-lg md:text-xl font-bold text-foreground">{count}</span>
                    <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium">名</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
