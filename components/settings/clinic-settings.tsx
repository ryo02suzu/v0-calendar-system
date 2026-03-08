"use client"

import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ClinicInfo } from "./types"

interface ClinicSettingsTabProps {
  clinicInfo: ClinicInfo
  setClinicInfo: (info: ClinicInfo) => void
  handleSaveClinic: () => void
}

export function ClinicSettingsTab({ clinicInfo, setClinicInfo, handleSaveClinic }: ClinicSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <CardTitle>クリニック情報</CardTitle>
        </div>
        <CardDescription>基本情報の管理</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="clinic_name">クリニック名</Label>
          <Input
            id="clinic_name"
            value={clinicInfo.name}
            onChange={(e) => setClinicInfo({ ...clinicInfo, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clinic_phone">電話番号</Label>
            <Input
              id="clinic_phone"
              value={clinicInfo.phone}
              onChange={(e) => setClinicInfo({ ...clinicInfo, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="clinic_email">メールアドレス</Label>
            <Input
              id="clinic_email"
              type="email"
              value={clinicInfo.email}
              onChange={(e) => setClinicInfo({ ...clinicInfo, email: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="clinic_address">住所</Label>
          <Input
            id="clinic_address"
            value={clinicInfo.address}
            onChange={(e) => setClinicInfo({ ...clinicInfo, address: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="clinic_description">クリニック紹介</Label>
          <Textarea
            id="clinic_description"
            value={clinicInfo.description}
            onChange={(e) => setClinicInfo({ ...clinicInfo, description: e.target.value })}
            rows={4}
          />
        </div>
        <Button onClick={handleSaveClinic}>保存</Button>
      </CardContent>
    </Card>
  )
}
