"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { AlertCircle, Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Patient, Staff } from "@/lib/types"
import type { CalendarAppointment } from "@/types/api"

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: CalendarAppointment | null
  staff: Staff[]
  onSave: (appointment: CalendarAppointment) => Promise<void>
  onDelete: (id: string) => void
  initialSlotData?: { date: string; time: string; staffId?: string } | null
}

export function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  staff,
  onSave,
  onDelete,
  initialSlotData,
}: AppointmentModalProps) {
  const CLOSING_HOUR = 19 // Clinic closes at 19:00

  const getCurrentDate = () => {
    const now = new Date()
    return now.toISOString().split("T")[0]
  }

  // Calculate end_time = start_time + 1h, but clamp to closing hour (19:00)
  // If start >= 18:00, ensure end does not exceed 19:00
  // If start >= 19:00, set end = start (edge case)
  const calculateEndTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    if (hours >= CLOSING_HOUR) {
      // If starting at or after closing, end time = start time (edge case)
      return timeStr
    }
    const endHours = hours + 1
    if (endHours > CLOSING_HOUR) {
      // Clamp to closing hour
      return `${String(CLOSING_HOUR).padStart(2, "0")}:00`
    }
    return `${String(endHours).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}`
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
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [newPatientData, setNewPatientData] = useState({ name: "", phone: "", email: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Memoized patient lists for performance
  const recentPatients = useMemo(() => {
    // Return last 5 patients (most recent based on order in array)
    return patients.slice(0, 5)
  }, [patients])

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === formData.patient_id)
  }, [patients, formData.patient_id])

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients
    const query = searchQuery.toLowerCase()
    return patients.filter(
      (patient) =>
        patient.name?.toLowerCase().includes(query) ||
        patient.kana?.toLowerCase().includes(query) ||
        patient.phone?.includes(query)
    )
  }, [patients, searchQuery])

  useEffect(() => {
    if (isOpen) {
      loadPatients()
      setError(null)
      // Auto-focus search input when modal opens after a short delay
      setTimeout(() => {
        if (!appointment && searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    }
  }, [isOpen, appointment])

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

  useEffect(() => {
    // Initialize form based on appointment (edit mode) or initialSlotData (empty cell click) or defaults
    if (appointment) {
      // Edit existing appointment
      setFormData(appointment)
      setIsNewPatient(false)
    } else if (initialSlotData) {
      // Creating appointment from empty cell click - prefill date, time, and staff
      const startTime = initialSlotData.time || "09:00"
      const endTime = calculateEndTime(startTime)
      const staffId = initialSlotData.staffId || staff[0]?.id

      setFormData({
        date: initialSlotData.date,
        start_time: startTime,
        end_time: endTime,
        treatment_type: "定期検診",
        status: "confirmed",
        chair_number: 1,
        notes: "",
        staff_id: staffId,
      })
      setIsNewPatient(false)
      setNewPatientData({ name: "", phone: "", email: "" })
    } else {
      // Creating appointment from toolbar - use current defaults
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
    }
    setError(null)
    setSearchQuery("")
  }, [appointment, staff, initialSlotData])

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

      // Validate end_time > start_time
      if (formData.start_time >= formData.end_time) {
        setError("終了時刻は開始時刻より後に設定してください")
        setIsSaving(false)
        return
      }

      // Validate end_time does not exceed closing hour
      const endHour = Number.parseInt(formData.end_time.split(":")[0])
      if (endHour > CLOSING_HOUR) {
        setError(`終了時刻は閉院時刻（${CLOSING_HOUR}:00）を超えることはできません`)
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
            <Label htmlFor="patient-select">患者</Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={!isNewPatient ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsNewPatient(false)
                  setSearchQuery("")
                }}
                disabled={isSaving}
              >
                既存患者
              </Button>
              <Button
                type="button"
                variant={isNewPatient ? "default" : "outline"}
                size="sm"
                onClick={() => setIsNewPatient(true)}
                disabled={isSaving}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                新規患者
              </Button>
            </div>

            {!isNewPatient ? (
              <Popover open={isPatientPopoverOpen} onOpenChange={setIsPatientPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="patient-select"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={isPatientPopoverOpen}
                    aria-label="患者を選択"
                    className={cn("w-full justify-between", !selectedPatient && "text-muted-foreground")}
                    disabled={isSaving}
                  >
                    {selectedPatient ? `${selectedPatient.name} (${selectedPatient.phone})` : "患者を選択"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      ref={searchInputRef}
                      placeholder="患者名、カナ、電話番号で検索..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>該当する患者が見つかりません</CommandEmpty>
                      {recentPatients.length > 0 && !searchQuery && (
                        <CommandGroup heading="最近の患者">
                          {recentPatients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={patient.id}
                              onSelect={() => {
                                setFormData({ ...formData, patient_id: patient.id })
                                setIsPatientPopoverOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{patient.name}</span>
                                <span className="text-xs text-muted-foreground">{patient.phone}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {searchQuery && filteredPatients.length > 0 && (
                        <CommandGroup heading="検索結果">
                          {filteredPatients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={patient.id}
                              onSelect={() => {
                                setFormData({ ...formData, patient_id: patient.id })
                                setIsPatientPopoverOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{patient.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {patient.kana && `${patient.kana} | `}
                                  {patient.phone}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="new-patient-name">患者名 *</Label>
                  <Input
                    id="new-patient-name"
                    placeholder="患者名"
                    value={newPatientData.name}
                    onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                    disabled={isSaving}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-patient-phone">電話番号 *</Label>
                  <Input
                    id="new-patient-phone"
                    placeholder="電話番号"
                    value={newPatientData.phone}
                    onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                    disabled={isSaving}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-patient-email">メールアドレス（任意）</Label>
                  <Input
                    id="new-patient-email"
                    placeholder="メールアドレス"
                    type="email"
                    value={newPatientData.email}
                    onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
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
                disabled={isSaving}
                required
              />
            </div>

            <div>
              <Label htmlFor="staff_id">担当者</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                disabled={isSaving}
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
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                disabled={isSaving}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_time">終了時間</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                disabled={isSaving}
                required
              />
            </div>

            <div>
              <Label htmlFor="chair_number">チェア番号</Label>
              <Select
                value={formData.chair_number?.toString()}
                onValueChange={(value) => setFormData({ ...formData, chair_number: Number.parseInt(value) })}
                disabled={isSaving}
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
            <Label htmlFor="treatment_type">治療内容</Label>
            <Select
              value={formData.treatment_type}
              onValueChange={(value) => setFormData({ ...formData, treatment_type: value })}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="定期検診">定期検診</SelectItem>
                <SelectItem value="虫歯治療">虫歯治療</SelectItem>
                <SelectItem value="クリーニング">クリーニング</SelectItem>
                <SelectItem value="矯正">矯正</SelectItem>
                <SelectItem value="インプラント">インプラント</SelectItem>
                <SelectItem value="抜歯">抜歯</SelectItem>
                <SelectItem value="根管治療">根管治療</SelectItem>
                <SelectItem value="ホワイトニング">ホワイトニング</SelectItem>
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
              disabled={isSaving}
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
              disabled={isSaving}
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
