"use client"

import { Bell, SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ClinicSettings, NotificationSettings } from "./types"

interface GeneralSettingsTabProps {
  clinicSettings: ClinicSettings | null
  setClinicSettings: (settings: ClinicSettings) => void
  notifications: NotificationSettings
  setNotifications: (notifications: NotificationSettings) => void
  handleSaveSettings: () => void
}

export function GeneralSettingsTab({
  clinicSettings,
  setClinicSettings,
  notifications,
  setNotifications,
  handleSaveSettings,
}: GeneralSettingsTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            <CardTitle>システム設定</CardTitle>
          </div>
          <CardDescription>予約システムの基本設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>チェア数</Label>
            <Select
              value={String(clinicSettings?.chairs_count || 3)}
              onValueChange={(v) =>
                setClinicSettings({ ...clinicSettings, chairs_count: Number(v) } as ClinicSettings)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="7">7</SelectItem>
                <SelectItem value="8">8</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-1">同時に対応できる患者数</p>
          </div>
          <div>
            <Label>予約可能期間（日数）</Label>
            <Select
              value={String(clinicSettings?.booking_advance_days || 60)}
              onValueChange={(v) =>
                setClinicSettings({ ...clinicSettings, booking_advance_days: Number(v) } as ClinicSettings)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="60">60</SelectItem>
                <SelectItem value="90">90</SelectItem>
                <SelectItem value="180">180</SelectItem>
                <SelectItem value="365">365</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-1">何日先まで予約を受け付けるか</p>
          </div>
          <div>
            <Label>予約間隔（分）</Label>
            <Select
              value={String(clinicSettings?.booking_buffer_minutes || 15)}
              onValueChange={(v) =>
                setClinicSettings({ ...clinicSettings, booking_buffer_minutes: Number(v) } as ClinicSettings)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-1">予約と予約の間の時間</p>
          </div>
          <div>
            <Label>デフォルトの同時予約上限</Label>
            <Select
              value={String(clinicSettings?.max_concurrent_appointments || 1)}
              onValueChange={(v) =>
                setClinicSettings({ ...clinicSettings, max_concurrent_appointments: Number(v) } as ClinicSettings)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-1">スタッフが同時に対応できる予約数</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>ダブルブッキング許可</Label>
              <p className="text-sm text-gray-600">スタッフの上限内でダブルブッキングを許可</p>
            </div>
            <Switch
              checked={clinicSettings?.allow_double_booking || false}
              onCheckedChange={(checked) =>
                setClinicSettings({ ...clinicSettings, allow_double_booking: checked } as ClinicSettings)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>患者確認機能</Label>
              <p className="text-sm text-gray-600">予約前日に患者確認を実施</p>
            </div>
            <Switch
              checked={clinicSettings?.enable_patient_confirmation || false}
              onCheckedChange={(checked) =>
                setClinicSettings({ ...clinicSettings, enable_patient_confirmation: checked } as ClinicSettings)
              }
            />
          </div>
          {clinicSettings?.enable_patient_confirmation && (
            <div>
              <Label>確認期限（時間）</Label>
              <Select
                value={String(clinicSettings?.confirmation_deadline_hours || 24)}
                onValueChange={(v) =>
                  setClinicSettings({ ...clinicSettings, confirmation_deadline_hours: Number(v) } as ClinicSettings)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12時間前</SelectItem>
                  <SelectItem value="24">24時間前</SelectItem>
                  <SelectItem value="48">48時間前</SelectItem>
                  <SelectItem value="72">72時間前</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">予約の何時間前までに確認が必要か</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>QRチェックイン機能</Label>
              <p className="text-sm text-gray-600">QRコードでの来院確認を有効化</p>
            </div>
            <Switch
              checked={clinicSettings?.enable_qr_checkin || false}
              onCheckedChange={(checked) =>
                setClinicSettings({ ...clinicSettings, enable_qr_checkin: checked } as ClinicSettings)
              }
            />
          </div>
          <Button onClick={handleSaveSettings}>保存</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>通知設定</CardTitle>
          </div>
          <CardDescription>通知の受け取り方法</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">メール通知</p>
              <p className="text-sm text-gray-600">新規予約や変更をメールで受け取る</p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS通知</p>
              <p className="text-sm text-gray-600">緊急の通知をSMSで受け取る</p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">プッシュ通知</p>
              <p className="text-sm text-gray-600">アプリ内でリアルタイム通知を受け取る</p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
