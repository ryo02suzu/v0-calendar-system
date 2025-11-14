"use client"

import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import type { Appointment, Staff } from "@/lib/types"

interface WeekViewProps {
  currentDate: Date
  appointments: Appointment[]
  staff: Staff[]
  onAppointmentClick: (appointment: Appointment) => void
}

export function WeekView({ currentDate, appointments, staff, onAppointmentClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: ja })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: 11 }, (_, i) => i + 9) // 9:00 - 19:00

  const getAppointmentsForCell = (date: Date, staffId: string, hour: number) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.date)
      const aptHour = Number.parseInt(apt.start_time.split(":")[0])
      return isSameDay(aptDate, date) && apt.staff_id === staffId && aptHour === hour
    })
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
            {weekDays.map((day, i) => (
              <div key={i} className="p-2 text-center border-r border-gray-200 bg-gray-50">
                <div className="text-sm font-medium">{format(day, "E", { locale: ja })}</div>
                <div className="text-lg font-bold">{format(day, "d", { locale: ja })}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff rows */}
        {staff.map((staffMember) => (
          <div key={staffMember.id}>
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-4 border-r border-gray-200 bg-gray-50 sticky left-0 z-10">
                <div className="font-medium">{staffMember.name}</div>
                <div className="text-xs text-gray-600">{staffMember.role === "doctor" ? "歯科医師" : "歯科衛生士"}</div>
              </div>
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="border-r border-gray-200">
                  {hours.map((hour) => {
                    const cellAppointments = getAppointmentsForCell(day, staffMember.id, hour)
                    return (
                      <div key={hour} className="h-16 border-b border-gray-100 p-1 hover:bg-gray-50">
                        {cellAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => onAppointmentClick(apt)}
                            className={`p-2 rounded border cursor-pointer text-xs ${getTreatmentColor(apt.treatment_type)}`}
                          >
                            <div className="font-medium truncate">{apt.patient?.name}</div>
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
        ))}
      </div>
    </div>
  )
}
