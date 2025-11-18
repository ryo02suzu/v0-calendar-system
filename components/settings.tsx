"use client"

import { useState, useEffect } from "react"
import { Building2, Users, Bell, Clock, Calendar, DollarSign, SettingsIcon, Database } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getClinic,
  updateClinic,
  getServices,
  createService,
  updateService,
  deleteService,
  getBusinessHours,
  getHolidays,
  createHoliday,
  deleteHoliday,
  getClinicSettings,
  updateClinicSettings,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "@/lib/db"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReseconSettings } from "@/components/resecon-settings"
import { ReminderSettings } from "@/components/reminder-settings"

export function Settings() {
  const [activeTab, setActiveTab] = useState("clinic")
  const [clinicInfo, setClinicInfo] = useState({
    name: "今泉歯科クリニック",
    phone: "03-1234-5678",
    email: "info@imaizumi-dental.jp",
    address: "東京都渋谷区xxx",
    description: "患者様に寄り添った診療を心がけています。",
  })

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  })

  const [services, setServices] = useState<any[]>([])
  const [businessHours, setBusinessHours] = useState<any[]>([])
  const [holidays, setHolidays] = useState<any[]>([])
  const [clinicSettings, setClinicSettings] = useState<any>(null)
  const [staff, setStaff] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // サービス編集用
  const [editingService, setEditingService] = useState<any>(null)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [isSavingService, setIsSavingService] = useState(false)

  // スタッフ編集用
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)

  // 休診日追加用
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false)
  const [newHoliday, setNewHoliday] = useState({ date: "", reason: "" })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const [clinicData, servicesData, hoursData, holidaysData, settingsData, staffData] = await Promise.all([
        getClinic(),
        getServices(),
        getBusinessHours(),
        getHolidays(),
        getClinicSettings(),
        getStaff(),
      ])

      if (clinicData) {
        setClinicInfo({
          name: clinicData.name || "",
          phone: clinicData.phone || "",
          email: clinicData.email || "",
          address: clinicData.address || "",
          description: "",
        })
      }

      setServices(servicesData)
      setBusinessHours(hoursData)
      setHolidays(holidaysData)
      setClinicSettings(settingsData)
      setStaff(staffData)
    } catch (error) {
      console.error("[v0] Error loading settings data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveClinic() {
    try {
      await updateClinic(clinicInfo)
      alert("クリニック情報を保存しました")
    } catch (error) {
      alert("保存に失敗しました")
    }
  }

  async function handleSaveService() {
    if (isSavingService) return
    setIsSavingService(true)
    try {
      if (editingService?.id) {
        await updateService(editingService.id, editingService)
      } else {
        await createService(editingService)
      }
      await loadData()
      setIsServiceDialogOpen(false)
      setEditingService(null)
    } catch (error) {
      alert("保存に失敗しました")
    } finally {
      setIsSavingService(false)
    }
  }

  async function handleDeleteService(id: string) {
    if (!confirm("このサービスを削除しますか？")) return
    try {
      await deleteService(id)
      await loadData()
    } catch (error) {
      alert("削除に失敗しました")
    }
  }

  async function handleSaveStaff() {
    try {
      if (editingStaff?.id) {
        await updateStaff(editingStaff.id, editingStaff)
      } else {
        await createStaff(editingStaff)
      }
      await loadData()
      setIsStaffDialogOpen(false)
      setEditingStaff(null)
    } catch (error) {
      alert("保存に失敗しました")
    }
  }

  async function handleDeleteStaff(id: string) {
    if (!confirm("このスタッフを削除しますか？")) return
    try {
      await deleteStaff(id)
      await loadData()
    } catch (error) {
      alert("削除に失敗しました")
    }
  }

  async function handleAddHoliday() {
    try {
      await createHoliday(newHoliday)
      await loadData()
      setIsHolidayDialogOpen(false)
      setNewHoliday({ date: "", reason: "" })
    } catch (error) {
      alert("追加に失敗しました")
    }
  }

  async function handleDeleteHoliday(id: string) {
    try {
      await deleteHoliday(id)
      await loadData()
    } catch (error) {
      alert("削除に失敗しました")
    }
  }

  async function handleSaveSettings() {
    try {
      await updateClinicSettings(clinicSettings)
      alert("設定を保存しました")
    } catch (error) {
      alert("保存に失敗しました")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-gray-600 mt-1">クリニックの各種設定</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="clinic">クリニック情報</TabsTrigger>
          <TabsTrigger value="services">診療メニュー</TabsTrigger>
          <TabsTrigger value="staff">スタッフ</TabsTrigger>
          <TabsTrigger value="hours">診療時間</TabsTrigger>
          <TabsTrigger value="system">システム設定</TabsTrigger>
          <TabsTrigger value="reminders">リマインダー</TabsTrigger>
          <TabsTrigger value="resecon">レセコン連携</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <CardTitle>診療メニュー・料金プラン</CardTitle>
                </div>
                <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingService({
                          name: "",
                          description: "",
                          duration: 30,
                          price: 0,
                          category: "一般歯科",
                          is_active: true,
                        })
                      }}
                    >
                      メニュー追加
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingService?.id ? "メニュー編集" : "メニュー追加"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>メニュー名</Label>
                        <Input
                          value={editingService?.name || ""}
                          onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>説明</Label>
                        <Textarea
                          value={editingService?.description || ""}
                          onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>所要時間（分）</Label>
                          <Input
                            type="number"
                            value={editingService?.duration || 30}
                            onChange={(e) =>
                              setEditingService({ ...editingService, duration: Number.parseInt(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <Label>料金（円）</Label>
                          <Input
                            type="number"
                            value={editingService?.price || 0}
                            onChange={(e) =>
                              setEditingService({ ...editingService, price: Number.parseInt(e.target.value) })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>カテゴリー</Label>
                        <Select
                          value={editingService?.category || "一般歯科"}
                          onValueChange={(value) => setEditingService({ ...editingService, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="一般歯科">一般歯科</SelectItem>
                            <SelectItem value="審美歯科">審美歯科</SelectItem>
                            <SelectItem value="矯正歯科">矯正歯科</SelectItem>
                            <SelectItem value="小児歯科">小児歯科</SelectItem>
                            <SelectItem value="予防歯科">予防歯科</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editingService?.is_active ?? true}
                          onCheckedChange={(checked) => setEditingService({ ...editingService, is_active: checked })}
                        />
                        <Label>有効</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveService} disabled={isSavingService}>
                        {isSavingService ? "保存中..." : "保存"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>患者予約ページに表示されるメニュー</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{service.name}</p>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{service.category}</span>
                        {!service.is_active && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">非表示</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {service.duration}分 / ¥{service.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingService(service)
                          setIsServiceDialogOpen(true)
                        }}
                      >
                        編集
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteService(service.id)}>
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
                {services.length === 0 && <p className="text-gray-500 text-center py-8">メニューがありません</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <CardTitle>スタッフ管理</CardTitle>
                </div>
                <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingStaff({
                          name: "",
                          role: "歯科医師",
                          email: "",
                          phone: "",
                        })
                      }}
                    >
                      スタッフ追加
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingStaff?.id ? "スタッフ編集" : "スタッフ追加"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>名前</Label>
                        <Input
                          value={editingStaff?.name || ""}
                          onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>役職</Label>
                        <Select
                          value={editingStaff?.role || "歯科医師"}
                          onValueChange={(value) => setEditingStaff({ ...editingStaff, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="歯科医師">歯科医師</SelectItem>
                            <SelectItem value="歯科衛生士">歯科衛生士</SelectItem>
                            <SelectItem value="歯科助手">歯科助手</SelectItem>
                            <SelectItem value="受付">受付</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>メールアドレス</Label>
                        <Input
                          type="email"
                          value={editingStaff?.email || ""}
                          onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>電話番号</Label>
                        <Input
                          value={editingStaff?.phone || ""}
                          onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveStaff}>保存</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>予約を担当するスタッフの管理</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">{member.role}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{member.email}</p>
                      <p className="text-sm text-gray-600">{member.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingStaff(member)
                          setIsStaffDialogOpen(true)
                        }}
                      >
                        編集
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteStaff(member.id)}>
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
                {staff.length === 0 && <p className="text-gray-500 text-center py-8">スタッフがいません</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
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
                  const hours = businessHours.find((h) => h.day_of_week === index)
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded">
                      <p className="w-8 font-medium">{day}</p>
                      <Input
                        type="time"
                        className="w-32"
                        value={hours?.open_time || "09:00"}
                        disabled={hours?.is_closed}
                      />
                      <span>〜</span>
                      <Input
                        type="time"
                        className="w-32"
                        value={hours?.close_time || "18:00"}
                        disabled={hours?.is_closed}
                      />
                      <div className="flex items-center gap-2">
                        <Switch checked={!hours?.is_closed} />
                        <Label>営業</Label>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button className="mt-4">保存</Button>
            </CardContent>
          </Card>

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
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
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
                <Input
                  type="number"
                  value={clinicSettings?.chairs_count || 3}
                  onChange={(e) =>
                    setClinicSettings({ ...clinicSettings, chairs_count: Number.parseInt(e.target.value) })
                  }
                />
                <p className="text-sm text-gray-600 mt-1">同時に対応できる患者数</p>
              </div>
              <div>
                <Label>予約可能期間（日数）</Label>
                <Input
                  type="number"
                  value={clinicSettings?.booking_advance_days || 60}
                  onChange={(e) =>
                    setClinicSettings({ ...clinicSettings, booking_advance_days: Number.parseInt(e.target.value) })
                  }
                />
                <p className="text-sm text-gray-600 mt-1">何日先まで予約を受け付けるか</p>
              </div>
              <div>
                <Label>予約間隔（分）</Label>
                <Input
                  type="number"
                  value={clinicSettings?.booking_buffer_minutes || 15}
                  onChange={(e) =>
                    setClinicSettings({ ...clinicSettings, booking_buffer_minutes: Number.parseInt(e.target.value) })
                  }
                />
                <p className="text-sm text-gray-600 mt-1">予約と予約の間の時間</p>
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
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <ReminderSettings />
        </TabsContent>

        <TabsContent value="resecon" className="space-y-6">
          <ReseconSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
