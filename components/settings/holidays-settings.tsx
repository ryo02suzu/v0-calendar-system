"use client"

import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Holiday } from "./types"

interface HolidaysSettingsTabProps {
  holidays: Holiday[]
  isHolidayDialogOpen: boolean
  setIsHolidayDialogOpen: (open: boolean) => void
  newHoliday: { date: string; reason: string }
  setNewHoliday: (holiday: { date: string; reason: string }) => void
  handleAddHoliday: () => void
  handleDeleteHoliday: (id: string) => void
}

export function HolidaysSettingsTab({
  holidays,
  isHolidayDialogOpen,
  setIsHolidayDialogOpen,
  newHoliday,
  setNewHoliday,
  handleAddHoliday,
  handleDeleteHoliday,
}: HolidaysSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <CardTitle>休診日</CardTitle>
          </div>
          <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
            <DialogTrigger asChild>
              <Button>休診日追加</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>休診日追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>日付</Label>
                  <Input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>理由</Label>
                  <Input
                    value={newHoliday.reason}
                    onChange={(e) => setNewHoliday({ ...newHoliday, reason: e.target.value })}
                    placeholder="例：年末年始休暇"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddHoliday}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>臨時休診日の設定</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {holidays.map((holiday) => (
            <div key={holiday.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{new Date(holiday.date).toLocaleDateString("ja-JP")}</p>
                <p className="text-sm text-gray-600">{holiday.reason}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDeleteHoliday(holiday.id)}>
                削除
              </Button>
            </div>
          ))}
          {holidays.length === 0 && <p className="text-gray-500 text-center py-8">休診日が設定されていません</p>}
        </div>
      </CardContent>
    </Card>
  )
}
