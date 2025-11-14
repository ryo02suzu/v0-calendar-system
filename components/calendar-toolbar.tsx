"use client"

import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns"
import { ja } from "date-fns/locale"

interface CalendarToolbarProps {
  viewMode: "day" | "week" | "month"
  onViewModeChange: (mode: "day" | "week" | "month") => void
  currentDate: Date
  onDateChange: (date: Date) => void
  onCreateAppointment: () => void
}

export function CalendarToolbar({
  viewMode,
  onViewModeChange,
  currentDate,
  onDateChange,
  onCreateAppointment,
}: CalendarToolbarProps) {
  const handlePrevious = () => {
    if (viewMode === "day") onDateChange(subDays(currentDate, 1))
    if (viewMode === "week") onDateChange(subWeeks(currentDate, 1))
    if (viewMode === "month") onDateChange(subMonths(currentDate, 1))
  }

  const handleNext = () => {
    if (viewMode === "day") onDateChange(addDays(currentDate, 1))
    if (viewMode === "week") onDateChange(addWeeks(currentDate, 1))
    if (viewMode === "month") onDateChange(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const getDateLabel = () => {
    if (viewMode === "day") return format(currentDate, "yyyy年M月d日(E)", { locale: ja })
    if (viewMode === "week") return format(currentDate, "yyyy年M月", { locale: ja })
    return format(currentDate, "yyyy年M月", { locale: ja })
  }

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleToday}>
              今日
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <h2 className="text-xl font-semibold">{getDateLabel()}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => onViewModeChange("day")}
            >
              日
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-none border-l border-gray-300"
              onClick={() => onViewModeChange("week")}
            >
              週
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="rounded-none border-l border-gray-300"
              onClick={() => onViewModeChange("month")}
            >
              月
            </Button>
          </div>

          <Button onClick={onCreateAppointment}>
            <Plus className="w-4 h-4 mr-2" />
            新規予約
          </Button>
        </div>
      </div>
    </div>
  )
}
