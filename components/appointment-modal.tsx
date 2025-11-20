"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react"
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

/* ================== Utility functions ================== */

/** Convert hiragana characters to katakana for robust search matching */
function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60))
}

/** Normalize search string: strip spaces & hyphens, lowercase, kana normalization */
function normalizeSearchString(str: string): string {
  return hiraganaToKatakana(str.replace(/[\s\-]/g, "").toLowerCase())
}

/** Weekday closing hour logic */
function getClosingHour(dateStr: string): number {
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay() // 0 Sun ... 6 Sat
  if (dayOfWeek >= 1 && dayOfWeek <= 5) return 18     // Mon-Fri
  if (dayOfWeek === 6) return 13                      // Sat
  return 19                                           // Sun fallback
}

/** Calculate end_time = start_time + 1h, clamped to closing hour */
function calculateEndTime(start: string, dateStr: string): string {
  const closingHour = getClosingHour(dateStr)
  const [h, m] = start.split(":").map(Number)
  if (h >= closingHour) return `${String(closingHour).padStart(2, "0")}:00`
  const endH = h + 1
  const endM = m || 0
  if (endH > closingHour || (endH === closingHour && endM > 0)) return `${String(closingHour).padStart(2, "0")}:00`
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
}

/** Validate ordering of HH:MM time strings (lexicographical works) */
function isStartBeforeEnd(start: string, end: string): boolean {
  return start < end
}

/** Normalize phone (basic: remove spaces & hyphens) */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-]/g, "")
}

/** YYYY-MM-DD (local) */
function getCurrentDate(): string {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

/** Build unified search value for CommandItem (internal filtering) */
function buildPatientSearchValue(patient: Patient): string {
  const kana = (patient as any).kana || (patient as any).name_kana || ""
  return [patient.name, kana, patient.phone, patient.patient_number].filter(Boolean).join(" ")
}

/* ================== Types ================== */

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: CalendarAppointment | null
  staff: Staff[]
  onSave: (appointment: CalendarAppointment) => Promise<void>
  onDelete: (id: string) => void
  initialSlotData?: { date: string; time: string; staffId?: string } | null
}

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show"

interface EditableFields {
  date: string
  start_time: string
  end_time: string
  treatment_type: string
  status: AppointmentStatus
  chair_number: number
  notes?: string
  staff_id?: string
  patient_id?: string
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
  /* ================== State ================== */
  const [formData, setFormData] = useState<EditableFields>({
    date: getCurrentDate(),
    start_time: "09:00",
    end_time: "10:00",
    treatment_type: "定期検診",
    status: "confirmed",
    chair_number: 1,
    notes: "",
    staff_id: staff[0]?.id,
    patient_id: undefined,
  })
  const [patients, setPatients] = useState<Patient[]>([])
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [newPatientData, setNewPatientData] = useState({ name: "", phone: "", email: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = useState(false)

  /* ================== Refs ================== */
  const searchInputRef = useRef<HTMLInputElement>(null)
  const newPatientNameRef = useRef<HTMLInputElement>(null)

  /* ================== Derived values ================== */
  const recentPatients = useMemo(() => patients.slice(0, 5), [patients])

  const selectedPatient = useMemo(() => {
    return formData.patient_id ? patients.find((p) => p.id === formData.patient_id) : undefined
  }, [patients, formData.patient_id])

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients
    const normalizedQuery = normalizeSearchString(searchQuery)
    return patients.filter((patient) => {
      const kanaField = (patient as any).kana || (patient as any).name_kana || ""
      const nameNorm = normalizeSearchString(patient.name || "")
      const kanaNorm = normalizeSearchString(kanaField || "")
      const phoneNorm = normalizePhone(patient.phone || "")
      const numberNorm = (patient.patient_number || "").replace(/[\s\-]/g, "")
      return (
        nameNorm.includes(normalizedQuery) ||
        kanaNorm.includes(normalizedQuery) ||
        phoneNorm.includes(normalizedQuery) ||
        numberNorm.includes(normalizedQuery)
      )
    })
  }, [patients, searchQuery])

  /* ================== Data loading ================== */
  const loadPatients = useCallback(async () => {
    try {
      const response = await fetch("/api/patients", { cache: "no-store" })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "患者データの取得に失敗しました")
      setPatients(Array.isArray(json.data) ? json.data : [])
    } catch (err) {
      console.error("[v0] Error loading patients:", err)
      setError("患者データの読み込みに失敗しました")
    }
  }, [])

  /* ================== Initialization helpers ================== */
  const resetNewPatientForm = useCallback(() => {
    setNewPatientData({ name: "", phone: "", email: "" })
  }, [])

  const initializeForSlot = useCallback(
    (dateStr: string, timeStr: string, staffId?: string) => {
      const computedEnd = calculateEndTime(timeStr, dateStr)
      setFormData({
        date: dateStr,
        start_time: timeStr,
        end_time: computedEnd,
        treatment_type: "定期検診",
        status: "confirmed",
        chair_number: 1,
        notes: "",
        staff_id: staffId || staff[0]?.id,
        patient_id: undefined,
      })
      setIsNewPatient(false)
      resetNewPatientForm()
      setSearchQuery("")
    },
    [staff, resetNewPatientForm]
  )

  const initializeDefaults = useCallback(() => {
    const dateStr = getCurrentDate()
    initializeForSlot(dateStr, "09:00", staff[0]?.id)
  }, [initializeForSlot, staff])

  const initializeFromAppointment = useCallback(
    (appt: CalendarAppointment) => {
      setFormData({
        date: appt.date,
        start_time: appt.start_time,
        end_time: appt.end_time,
        treatment_type: appt.treatment_type,
        status: appt.status as AppointmentStatus,
        chair_number: appt.chair_number,
        notes: appt.notes,
        staff_id: appt.staff_id,
        patient_id: appt.patient_id,
      })
      setIsNewPatient(false)
      resetNewPatientForm()
      setSearchQuery("")
    },
    [resetNewPatientForm]
  )

  /* ================== Effects ================== */
  useEffect(() => {
    if (!isOpen) return
    loadPatients()
    setError(null)
  }, [isOpen, loadPatients])

  useEffect(() => {
    if (!isOpen) return
    if (appointment) {
      initializeFromAppointment(appointment)
    } else if (initialSlotData) {
      initializeForSlot(initialSlotData.date, initialSlotData.time || "09:00", initialSlotData.staffId)
    } else {
      initializeDefaults()
    }
  }, [isOpen, appointment, initialSlotData, initializeDefaults, initializeForSlot, initializeFromAppointment])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      if (isNewPatient) {
        newPatientNameRef.current?.focus()
      } else {
        searchInputRef.current?.focus()
      }
    }, 80)
    return () => clearTimeout(timer)
  }, [isOpen, isNewPatient])

  /* ================== Handlers ================== */
  const handleSelectPatient = useCallback(
    (patientId: string) => {
      setFormData((prev) => ({ ...prev, patient_id: patientId }))
      setIsPatientPopoverOpen(false)
    },
    []
  )

  const handleNewPatientFieldChange = useCallback(
    (key: keyof typeof newPatientData, value: string) => {
      setNewPatientData((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const createPatientViaApi = useCallback(async (patient: { name: string; phone: string; email?: string }) => {
    const response = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || "患者の作成に失敗しました")
    return data.data as Patient
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSaving) return
      setError(null)
      setIsSaving(true)
      try {
        const { date, start_time, end_time, staff_id, patient_id } = formData
        if (!date || !start_time || !end_time || !staff_id) throw new Error("必須項目を全て入力してください")
        if (!isStartBeforeEnd(start_time, end_time)) throw new Error("終了時刻は開始時刻より後に設定してください")

        const closingHour = getClosingHour(date)
        const endHour = Number.parseInt(end_time.split(":")[0])
        if (endHour > closingHour) throw new Error(`終了時刻は閉院時刻（${closingHour}:00）を超えることはできません`)

        let resolvedPatientId = patient_id
        if (isNewPatient) {
          if (!newPatientData.name || !newPatientData.phone) throw new Error("患者名と電話番号は必須です")
          const created = await createPatientViaApi({
            name: newPatientData.name.trim(),
            phone: normalizePhone(newPatientData.phone),
            email: newPatientData.email.trim() || undefined,
          })
          setPatients((prev) => [created, ...prev])
          resolvedPatientId = created.id
        } else if (!resolvedPatientId) {
          throw new Error("患者を選択してください")
        }

        const payload: CalendarAppointment = {
          id: appointment?.id || crypto.randomUUID(),
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          treatment_type: formData.treatment_type,
          status: formData.status,
          chair_number: formData.chair_number,
          notes: formData.notes,
          staff_id: formData.staff_id!,
          patient_id: resolvedPatientId!,
        }

        await onSave(payload)
        onClose()
      } catch (err: any) {
        console.error("[v0] Error saving appointment:", err)
        setError(err?.message || "予約の保存に失敗しました")
      } finally {
        setIsSaving(false)
      }
    },
    [formData, isNewPatient, newPatientData, appointment, onSave, onClose, createPatientViaApi, isSaving]
  )

  /* ================== Render ================== */
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
                    {selectedPatient ? (
                      <span className="truncate">
                        {selectedPatient.name}
                        {selectedPatient.patient_number && ` [${selectedPatient.patient_number}]`}
                        {` (${selectedPatient.phone})`}
                      </span>
                    ) : (
                      "患者を選択"
                    )}
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
                              value={buildPatientSearchValue(patient)}
                              onSelect={() => handleSelectPatient(patient.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate">
                                  {patient.name}
                                  {patient.patient_number && ` [${patient.patient_number}]`}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {(patient as any).kana || (patient as any).name_kana
                                    ? `${(patient as any).kana || (patient as any).name_kana} | `
                                    : ""}
                                  {patient.phone}
                                </span>
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
                              value={buildPatientSearchValue(patient)}
                              onSelect={() => handleSelectPatient(patient.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate">
                                  {patient.name}
                                  {patient.patient_number && ` [${patient.patient_number}]`}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {(patient as any).kana || (patient as any).name_kana
                                    ? `${(patient as any).kana || (patient as any).name_kana} | `
                                    : ""}
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
                    ref={newPatientNameRef}
                    id="new-patient-name"
                    placeholder="患者名"
                    value={newPatientData.name}
                    onChange={(e) => handleNewPatientFieldChange("name", e.target.value)}
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
                    onChange={(e) => handleNewPatientFieldChange("phone", e.target.value)}
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
                    onChange={(e) => handleNewPatientFieldChange("email", e.target.value)}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                disabled={isSaving}
                required
              />
            </div>

            <div>
              <Label htmlFor="staff_id">担当者</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, staff_id: value }))}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                disabled={isSaving}
                required
              />
            </div>

            <div>
              <Label htmlFor="chair_number">チェア番号</Label>
              <Select
                value={formData.chair_number.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, chair_number: Number.parseInt(value) }))
                }
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
              onValueChange={(value) => setFormData((prev) => ({ ...prev, treatment_type: value }))}
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
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as AppointmentStatus }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
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
                  disabled={isSaving}
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