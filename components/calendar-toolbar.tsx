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
    <div className="border-b border-border bg-gradient-to-r from-card to-card/80 backdrop-blur-sm shadow-sm">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
              <Button variant="ghost" size="icon" onClick={handlePrevious} className="hover:bg-background">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleToday}
                className="px-4 font-semibold hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
              >
                今日
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNext} className="hover:bg-background">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {getDateLabel()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex border-2 border-border rounded-lg overflow-hidden shadow-sm bg-muted/30">
              <Button
                variant={viewMode === "day" ? "default" : "ghost"}
                size="sm"
                className={`rounded-none px-4 font-bold transition-all ${
                  viewMode === "day" ? "shadow-sm" : "hover:bg-background"
                }`}
                onClick={() => onViewModeChange("day")}
              >
                日
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                size="sm"
                className={`rounded-none border-l-2 border-border px-4 font-bold transition-all ${
                  viewMode === "week" ? "shadow-sm" : "hover:bg-background"
                }`}
                onClick={() => onViewModeChange("week")}
              >
                週
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                className={`rounded-none border-l-2 border-border px-4 font-bold transition-all ${
                  viewMode === "month" ? "shadow-sm" : "hover:bg-background"
                }`}
                onClick={() => onViewModeChange("month")}
              >
                月
              </Button>
            </div>

            <Button onClick={onCreateAppointment} className="shadow-md hover:shadow-lg transition-all font-bold px-5">
              <Plus className="w-4 h-4 mr-2" />
              新規予約
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
