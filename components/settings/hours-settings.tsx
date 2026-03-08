"use client"

import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import type { BusinessHours } from "./types"

interface HoursSettingsTabProps {
  businessHours: BusinessHours[]
  updateDay: (index: number, patch: Partial<BusinessHours>) => void
  handleSaveBusinessHours: () => void
  isSavingHours: boolean
}

export function HoursSettingsTab({
  businessHours,
  updateDay,
  handleSaveBusinessHours,
  isSavingHours,
}: HoursSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <CardTitle>診療時間</CardTitle>
        </div>
        <CardDescription>曜日ごとの診療時間設定</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">患者予約ページに表示される診療時間</p>
        <div className="space-y-2">
          {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => {
            const hours = businessHours.find((h) => Number(h.day_of_week) === index)
            return (
              <div key={index} className="flex items-center gap-4 p-3 border rounded">
                <p className="w-8 font-medium">{day}</p>
                <Input
                  type="time"
                  className="w-32"
                  value={hours?.open_time || "09:00"}
                  disabled={hours?.is_closed}
                  onChange={(e) => updateDay(index, { open_time: e.target.value })}
                />
                <span>〜</span>
                <Input
                  type="time"
                  className="w-32"
                  value={hours?.close_time || "18:00"}
                  disabled={hours?.is_closed}
                  onChange={(e) => updateDay(index, { close_time: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!hours?.is_closed}
                    onCheckedChange={(checked) => updateDay(index, { is_closed: !checked })}
                  />
                  <Label>営業</Label>
                </div>
              </div>
            )
          })}
        </div>
        <Button className="mt-4" onClick={handleSaveBusinessHours} disabled={isSavingHours}>
          保存
        </Button>
      </CardContent>
    </Card>
  )
}
