"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Patient, Staff, Service } from "@/lib/types"
import type { CalendarAppointment } from "@/types/api"

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: CalendarAppointment | null
  staff: Staff[]
  onSave: (appointment: CalendarAppointment) => Promise<void>
  onDelete: (id: string) => void
}

export function AppointmentModal({ isOpen, onClose, appointment, staff, onSave, onDelete }: AppointmentModalProps) {
  const getCurrentDate = () => {
    const now = new Date()
    return now.toISOString().split("T")[0]
  }

  const [formData, setFormData] = useState<Partial<CalendarAppointment>>({
    date: getCurrentDate(),
    start_time: "09:00",
    end_time: "10:00",
    treatment_type: "定期検診",
    status: "confirmed",
    chair_number: 1,
    notes: "",
  })
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [userEndTimeManuallyEdited, setUserEndTimeManuallyEdited] = useState(false)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [newPatientData, setNewPatientData] = useState({ name: "", phone: "", email: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadPatients()
      loadServices()
      setError(null)
    }
  }, [isOpen])

  const loadPatients = async () => {
    try {
      const response = await fetch("/api/patients", { cache: "no-store" })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error || "患者データの取得に失敗しました")
      }

      setPatients(json.data || [])
    } catch (error) {
      console.error("[v0] Error loading patients:", error)
      setError("患者データの読み込みに失敗しました")
    }
  }

  const loadServices = async () => {
    try {
      const response = await fetch("/api/services", { cache: "no-store" })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error || "サービスデータの取得に失敗しました")
      }

      setServices(json.data || [])
    } catch (error) {
      console.error("[v0] Error loading services:", error)
      // Fail gracefully - services list will be empty
      setServices([])
    }
  }

  // Helper function to truncate time format from HH:MM:ss to HH:MM
  const truncateTimeFormat = (time: string | undefined): string => {
    if (!time) return ""
    return time.substring(0, 5) // Get only HH:MM part
  }

  // Helper function to add minutes to a time string (HH:MM format)
  const addMinutesToTime = (timeStr: string, minutes: number): string => {
    const [hours, mins] = timeStr.split(":").map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`
  }

  // Handler for service selection
  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    const service = services.find((s) => s.id === serviceId)
    
    if (service) {
      // Update treatment_type to maintain API contract
      const updatedFormData = { ...formData, treatment_type: service.name }
      
      // Auto-calculate end_time if user hasn't manually edited it
      if (formData.start_time) {
        const newEndTime = addMinutesToTime(truncateTimeFormat(formData.start_time), service.duration)
        updatedFormData.end_time = newEndTime
      }
      
      setFormData(updatedFormData)
      // Reset manual edit flag when a new service is selected
      setUserEndTimeManuallyEdited(false)
    }
  }

  // Handler for start_time changes
  const handleStartTimeChange = (newStartTime: string) => {
    const updatedFormData = { ...formData, start_time: newStartTime }
    
    // Auto-recalculate end_time if a service is selected and user hasn't manually edited end_time
    if (selectedServiceId && !userEndTimeManuallyEdited) {
      const service = services.find((s) => s.id === selectedServiceId)
      if (service) {
        updatedFormData.end_time = addMinutesToTime(truncateTimeFormat(newStartTime), service.duration)
      }
    }
    
    setFormData(updatedFormData)
  }

  // Handler for end_time changes (marks as manually edited)
  const handleEndTimeChange = (newEndTime: string) => {
    setFormData({ ...formData, end_time: newEndTime })
    setUserEndTimeManuallyEdited(true)
  }

  useEffect(() => {
    if (appointment) {
      // Truncate time formats to HH:MM
      const normalizedAppointment = {
        ...appointment,
        start_time: truncateTimeFormat(appointment.start_time),
        end_time: truncateTimeFormat(appointment.end_time),
      }
      setFormData(normalizedAppointment)
      setIsNewPatient(false)
      
      // Initialize selected service by matching treatment_type to service name
      const matchingService = services.find((s) => s.name === appointment.treatment_type)
      if (matchingService) {
        setSelectedServiceId(matchingService.id)
      } else {
        setSelectedServiceId(null)
      }
      
      // Don't reset manual edit flag - preserve existing end_time
      setUserEndTimeManuallyEdited(false)
    } else {
      setFormData({
        date: getCurrentDate(),
        start_time: "09:00",
        end_time: "10:00",
        treatment_type: "定期検診",
        status: "confirmed",
        chair_number: 1,
        notes: "",
        staff_id: staff[0]?.id,
      })
      setIsNewPatient(false)
      setNewPatientData({ name: "", phone: "", email: "" })
      setSelectedServiceId(null)
      setUserEndTimeManuallyEdited(false)
    }
    setError(null)
  }, [appointment, staff, services])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      if (!formData.date || !formData.start_time || !formData.end_time || !formData.staff_id) {
        setError("必須項目を全て入力してください")
        setIsSaving(false)
        return
      }

      if (formData.start_time >= formData.end_time) {
        setError("終了時刻は開始時刻より後に設定してください")
        setIsSaving(false)
        return
      }

      let patientId = formData.patient_id

      if (isNewPatient) {
        if (!newPatientData.name || !newPatientData.phone) {
          setError("患者名と電話番号は必須です")
          setIsSaving(false)
          return
        }

        const newPatient = await createPatientViaApi(newPatientData)
        setPatients((prev) => [newPatient, ...prev])
        patientId = newPatient.id
      } else {
        if (!patientId) {
          setError("患者を選択してください")
          setIsSaving(false)
          return
        }
      }

      const { patient, staff, ...appointmentData } = formData as any

      await onSave({
        ...appointmentData,
        id: appointment?.id || crypto.randomUUID(),
        patient_id: patientId!,
        staff_id: formData.staff_id!,
      } as CalendarAppointment)

      onClose()
    } catch (error: any) {
      console.error("[v0] Error saving appointment:", error)
      setError(error?.message || "予約の保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{appointment ? "予約を編集" : "新規予約"}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>患者</Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={!isNewPatient ? "default" : "outline"}
                size="sm"
                onClick={() => setIsNewPatient(false)}
              >
                既存患者
              </Button>
              <Button
                type="button"
                variant={isNewPatient ? "default" : "outline"}
                size="sm"
                onClick={() => setIsNewPatient(true)}
              >
                新規患者
              </Button>
            </div>

            {!isNewPatient ? (
              <Select
                value={formData.patient_id}
                onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="患者を選択" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id || ""}>
                      {patient.name} ({patient.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="患者名"
                  value={newPatientData.name}
                  onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="電話番号"
                  value={newPatientData.phone}
                  onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                  required
                />
                <Input
                  placeholder="メールアドレス（任意）"
                  type="email"
                  value={newPatientData.email}
                  onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="staff_id">担当者</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="担当者を選択" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_time">開始時間</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_time">終了時間</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="chair_number">チェア番号</Label>
              <Select
                value={formData.chair_number?.toString()}
                onValueChange={(value) => setFormData({ ...formData, chair_number: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      チェア {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="treatment_type">診療メニュー</Label>
            <Select
              value={selectedServiceId || undefined}
              onValueChange={handleServiceSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="診療メニューを選択" />
              </SelectTrigger>
              <SelectContent>
                {services.length > 0 ? (
                  services.filter((s) => s.is_active).map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration}分)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-services" disabled>
                    サービスが見つかりません
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">ステータス</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as "pending" | "confirmed" | "cancelled" | "completed" | "no_show",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">確定</SelectItem>
                <SelectItem value="pending">保留</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="no_show">無断キャンセル</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">メモ</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="特記事項があれば記入してください"
            />
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {appointment && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("この予約を削除してもよろしいですか？")) {
                      onDelete(appointment.id)
                    }
                  }}
                >
                  削除
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

async function createPatientViaApi(patient: { name: string; phone: string; email?: string }) {
  const response = await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || "患者の作成に失敗しました")
  }

  return data.data as Patient
}
