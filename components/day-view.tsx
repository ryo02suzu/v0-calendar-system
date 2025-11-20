"use client"

import { isSameDay, parseISO } from "date-fns"
import type { Staff } from "@/lib/types"
import type { CalendarAppointment } from "@/types/api"

interface DayViewProps {
  currentDate: Date
  appointments: CalendarAppointment[]
  staff: Staff[]
  onAppointmentClick: (appointment: CalendarAppointment) => void
  onEmptyCellClick?: (args: { date: Date; hour: number; staffId: string }) => void
}

export function DayView({ currentDate, appointments, staff, onAppointmentClick, onEmptyCellClick }: DayViewProps) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 9) // 9:00 - 19:00

  const getAppointmentsForCell = (staffId: string, hour: number) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.date)
      const aptHour = Number.parseInt(apt.start_time.split(":")[0])
      return isSameDay(aptDate, currentDate) && apt.staff_id === staffId && aptHour === hour
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
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="grid" style={{ gridTemplateColumns: "80px repeat(" + staff.length + ", 1fr)" }}>
            <div className="p-2 border-r border-gray-200 bg-gray-50 text-center">
              <div className="text-sm font-medium">時間</div>
            </div>
            {staff.map((staffMember) => (
              <div key={staffMember.id} className="p-2 text-center border-r border-gray-200 bg-gray-50">
                <div className="font-medium">{staffMember.name}</div>
                <div className="text-xs text-gray-600">{staffMember.role === "doctor" ? "歯科医師" : "歯科衛生士"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Time slots */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid border-b border-gray-200"
            style={{ gridTemplateColumns: "80px repeat(" + staff.length + ", 1fr)" }}
          >
            <div className="p-2 border-r border-gray-200 bg-gray-50 text-center text-sm">{hour}:00</div>
            {staff.map((staffMember) => {
              const cellAppointments = getAppointmentsForCell(staffMember.id, hour)
              return (
                <div 
                  key={staffMember.id} 
                  className="h-20 border-r border-gray-200 p-1 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEmptyCellClick?.({ date: currentDate, hour, staffId: staffMember.id })}
                >
                  {cellAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick(apt)
                      }}
                      className={`p-2 rounded border cursor-pointer text-xs h-full ${getTreatmentColor(apt.treatment_type)}`}
                    >
                      <div className="font-medium">{apt.patient?.name}</div>
                      <div>
                        {apt.start_time} - {apt.end_time}
                      </div>
                      <div>{apt.treatment_type}</div>
                      {apt.chair_number && <div>チェア{apt.chair_number}</div>}
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
