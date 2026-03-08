"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getClinic,
  updateClinic,
  getServices,
  createService,
  updateService,
  deleteService,
  getBusinessHours,
  updateBusinessHours,
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
import { useToast } from "@/hooks/use-toast"
import { ReseconSettings } from "@/components/resecon-settings"
import { ReminderSettings } from "@/components/reminder-settings"
import { ClinicSettingsTab } from "./clinic-settings"
import { ServicesSettingsTab } from "./services-settings"
import { StaffSettingsTab } from "./staff-settings"
import { HoursSettingsTab } from "./hours-settings"
import { HolidaysSettingsTab } from "./holidays-settings"
import { GeneralSettingsTab } from "./general-settings"
import type { Service, BusinessHours, Holiday, ClinicSettings, Staff, ClinicInfo, NotificationSettings } from "./types"

export function Settings() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("clinic")
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
    name: "今泉歯科クリニック",
    phone: "03-1234-5678",
    email: "info@imaizumi-dental.jp",
    address: "東京都渋谷区xxx",
    description: "患者様に寄り添った診療を心がけています。",
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
  })

  const [services, setServices] = useState<Service[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // サービス編集用
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [isSavingService, setIsSavingService] = useState(false)

  // 診療時間保存用
  const [isSavingHours, setIsSavingHours] = useState(false)

  // スタッフ編集用
  const [editingStaff, setEditingStaff] = useState<Partial<Staff> | null>(null)
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)

  // 休診日追加用
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false)
  const [newHoliday, setNewHoliday] = useState({ date: "", reason: "" })

  useEffect(() => {
    loadData()
  }, [])

  // 全ての曜日（0-6）のエントリを保証するヘルパー
  function ensureAllDays(hoursFromDB: BusinessHours[]): BusinessHours[] {
    const result: BusinessHours[] = []
    for (let day = 0; day <= 6; day++) {
      const existing = hoursFromDB.find((h) => Number(h.day_of_week) === day)
      if (existing) {
        result.push(existing)
      } else {
        // デフォルト値: 日曜日(0)はis_closed=true、それ以外はfalse
        result.push({
          day_of_week: day,
          open_time: "09:00",
          close_time: "18:00",
          is_closed: day === 0,
        })
      }
    }
    return result
  }

  // 診療時間の更新ヘルパー
  function updateDay(index: number, patch: Partial<BusinessHours>) {
    setBusinessHours((prev) => {
      const updated = [...prev]
      const target = updated.find((h) => Number(h.day_of_week) === index)
      if (target) {
        Object.assign(target, patch)
      }
      return updated
    })
  }

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
      setBusinessHours(ensureAllDays(hoursData))
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
      toast({
        title: "保存完了",
        description: "クリニック情報を保存しました",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  async function handleSaveService() {
    if (isSavingService || !editingService) return
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
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      })
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
      toast({
        title: "エラー",
        description: "削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  async function handleSaveStaff() {
    if (!editingStaff) return
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
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteStaff(id: string) {
    if (!confirm("このスタッフを削除しますか？")) return
    try {
      await deleteStaff(id)
      await loadData()
    } catch (error) {
      toast({
        title: "エラー",
        description: "削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  async function handleAddHoliday() {
    try {
      await createHoliday(newHoliday)
      await loadData()
      setIsHolidayDialogOpen(false)
      setNewHoliday({ date: "", reason: "" })
    } catch (error) {
      toast({
        title: "エラー",
        description: "追加に失敗しました",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteHoliday(id: string) {
    try {
      await deleteHoliday(id)
      await loadData()
    } catch (error) {
      toast({
        title: "エラー",
        description: "削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  async function handleSaveSettings() {
    try {
      await updateClinicSettings(clinicSettings)
      toast({
        title: "保存完了",
        description: "設定を保存しました",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  async function handleSaveBusinessHours() {
    if (isSavingHours) return
    setIsSavingHours(true)
    try {
      // 診療時間データを構築（idは不要、updateBusinessHoursが削除+挿入を行う）
      const payload = businessHours.map((h) => ({
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
        is_closed: h.is_closed,
      }))
      await updateBusinessHours(payload)
      await loadData()
      toast({
        title: "保存完了",
        description: "診療時間を保存しました",
      })
    } catch (error) {
      console.error("[v0] Error saving business hours:", error)
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSavingHours(false)
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
          <ClinicSettingsTab
            clinicInfo={clinicInfo}
            setClinicInfo={setClinicInfo}
            handleSaveClinic={handleSaveClinic}
          />
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <ServicesSettingsTab
            services={services}
            editingService={editingService}
            setEditingService={setEditingService}
            isServiceDialogOpen={isServiceDialogOpen}
            setIsServiceDialogOpen={setIsServiceDialogOpen}
            isSavingService={isSavingService}
            handleSaveService={handleSaveService}
            handleDeleteService={handleDeleteService}
          />
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <StaffSettingsTab
            staff={staff}
            editingStaff={editingStaff}
            setEditingStaff={setEditingStaff}
            isStaffDialogOpen={isStaffDialogOpen}
            setIsStaffDialogOpen={setIsStaffDialogOpen}
            handleSaveStaff={handleSaveStaff}
            handleDeleteStaff={handleDeleteStaff}
          />
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <HoursSettingsTab
            businessHours={businessHours}
            updateDay={updateDay}
            handleSaveBusinessHours={handleSaveBusinessHours}
            isSavingHours={isSavingHours}
          />
          <HolidaysSettingsTab
            holidays={holidays}
            isHolidayDialogOpen={isHolidayDialogOpen}
            setIsHolidayDialogOpen={setIsHolidayDialogOpen}
            newHoliday={newHoliday}
            setNewHoliday={setNewHoliday}
            handleAddHoliday={handleAddHoliday}
            handleDeleteHoliday={handleDeleteHoliday}
          />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <GeneralSettingsTab
            clinicSettings={clinicSettings}
            setClinicSettings={setClinicSettings}
            notifications={notifications}
            setNotifications={setNotifications}
            handleSaveSettings={handleSaveSettings}
          />
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
