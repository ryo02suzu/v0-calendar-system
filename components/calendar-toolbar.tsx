"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react"
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns"
import { ja } from "date-fns/locale"

interface CalendarToolbarProps {
  viewMode: "month" | "week" | "day"
  onViewModeChange: (mode: "month" | "week" | "day") => void
  currentDate: Date
  onDateChange: (date: Date) => void
  onNewAppointment: () => void
}

export default function CalendarToolbar({
  viewMode,
  onViewModeChange,
  currentDate,
  onDateChange,
  onNewAppointment,
}: CalendarToolbarProps) {
  const handlePrev = () => {
    if (viewMode === "month") {
      onDateChange(subMonths(currentDate, 1))
    } else if (viewMode === "week") {
      onDateChange(subWeeks(currentDate, 1))
    } else {
      onDateChange(subDays(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === "month") {
      onDateChange(addMonths(currentDate, 1))
    } else if (viewMode === "week") {
      onDateChange(addWeeks(currentDate, 1))
    } else {
      onDateChange(addDays(currentDate, 1))
    }
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const getDateLabel = () => {
    if (viewMode === "month") {
      return format(currentDate, "yyyy年M月", { locale: ja })
    } else if (viewMode === "week") {
      return format(currentDate, "yyyy年M月 第w週", { locale: ja })
    } else {
      return format(currentDate, "yyyy年M月d日(E)", { locale: ja })
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={handleToday} variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            今日
          </Button>
          
          <div className="flex items-center gap-2">
            <Button onClick={handlePrev} variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-[200px] text-center">
              <span className="text-lg font-semibold text-gray-900">{getDateLabel()}</span>
            </div>
            <Button onClick={handleNext} variant="ghost" size="icon">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <Button
              onClick={() => onViewModeChange("month")}
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="text-xs"
            >
              月
            </Button>
            <Button
              onClick={() => onViewModeChange("week")}
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="text-xs"
            >
              週
            </Button>
            <Button
              onClick={() => onViewModeChange("day")}
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="text-xs"
            >
              日
            </Button>
          </div>

          <Button onClick={onNewAppointment} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            新規予約
          </Button>
        </div>
      </div>
    </div>
  )
}
