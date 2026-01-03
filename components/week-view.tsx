"use client"

import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { Sun, Sunset } from "lucide-react"
import type { Appointment, Holiday, BusinessHours } from "@/lib/types"

interface WeekViewProps {
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onDayClick: (date: Date) => void
  holidays: Holiday[]
  businessHours: BusinessHours[]
}

export function WeekView({ currentDate, appointments, onAppointmentClick, onDayClick, holidays, businessHours }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: ja })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: 11 }, (_, i) => i + 9) // 9:00 - 19:00

  const formatHm = (t: string) => {
    if (!t) return ""
    const [h, m] = t.split(":")
    return `${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}`
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

  const getTreatmentColor = (type: string) => {
    const colors: Record<string, string> = {
      定期検診: "bg-blue-100 border-blue-300 text-blue-900",
      虫歯治療: "bg-red-100 border-red-300 text-red-900",
      クリーニング: "bg-green-100 border-green-300 text-green-900",
      矯正: "bg-purple-100 border-purple-300 text-purple-900",
      インプラント: "bg-orange-100 border-orange-300 text-orange-900",
    }
    return colors[type] || "bg-gray-100 border-gray-300 text-gray-900"
  }

  return (
    <div className="overflow-auto">
      <div className="min-w-[1200px]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="grid grid-cols-8">
            <div className="p-2 border-r border-gray-200 bg-gray-50" />
            {weekDays.map((day, i) => {
              const morningCount = getMorningCount(day)
              const afternoonCount = getAfternoonCount(day)
              return (
                <div 
                  key={i} 
                  className="p-2 text-center border-r border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => onDayClick(day)}
                >
                  <div className="text-sm font-medium">{format(day, "E", { locale: ja })}</div>
                  <div className="text-lg font-bold">{format(day, "d", { locale: ja })}</div>
                  <div className="flex items-center justify-center gap-2 mt-1 text-xs">
                    <div className="flex items-center gap-1 text-amber-600">
                      <Sun className="w-3 h-3" />
                      <span>{morningCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-600">
                      <Sunset className="w-3 h-3" />
                      <span>{afternoonCount}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Time rows */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-4 border-r border-gray-200 bg-gray-50 sticky left-0 z-10">
              <div className="font-medium">{hour}:00</div>
            </div>
            {weekDays.map((day, dayIndex) => {
              const hourAppointments = appointments.filter((apt) => {
                const aptDate = parseISO(apt.date)
                const aptHour = Number.parseInt(apt.start_time.split(":")[0])
                return isSameDay(aptDate, day) && aptHour === hour
              })
              return (
                <div key={dayIndex} className="border-r border-gray-200 p-1 min-h-[60px]">
                  {hourAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className={`p-2 rounded border cursor-pointer text-xs mb-1 ${getTreatmentColor(apt.treatment_type || "")}`}
                    >
                      <div className="font-medium truncate">{apt.patient?.name}</div>
                      <div className="truncate font-mono text-xs">
                        {formatHm(apt.start_time)} - {formatHm(apt.end_time)}
                      </div>
                      <div className="truncate">{apt.treatment_type}</div>
                      {apt.chair_number && <div className="text-xs">チェア{apt.chair_number}</div>}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
