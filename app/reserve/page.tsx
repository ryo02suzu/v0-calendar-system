"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Check, Clock, DollarSign, User, Phone, Mail, Calendar, FileText, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Service, Staff } from "@/lib/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClinicInfo {
  name: string
  phone: string
  address: string
  bookingAdvanceDays: number
}

interface AvailabilityData {
  date: string
  isHoliday: boolean
  businessHours: {
    open_time: string
    close_time: string
    is_closed: boolean
  }
  existingAppointments: { staff_id: string; start_time: string; end_time: string }[]
  staff: { id: string; name: string }[]
}

interface PatientInfo {
  name: string
  name_kana: string
  phone: string
  email: string
  date_of_birth: string
  notes: string
}

interface ReservationResult {
  id: string
  date: string
  start_time: string
  end_time: string
  treatment_type: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function generateTimeSlots(
  openTime: string,
  closeTime: string,
  durationMinutes: number,
  existingAppointments: { staff_id: string; start_time: string; end_time: string }[],
  selectedStaffId: string | null,
): string[] {
  const slots: string[] = []
  const open = toMinutes(openTime)
  const close = toMinutes(closeTime)

  for (let t = open; t + durationMinutes <= close; t += durationMinutes) {
    const slotStart = t
    const slotEnd = t + durationMinutes
    const slotStartStr = fromMinutes(slotStart)
    const slotEndStr = fromMinutes(slotEnd)

    // Check conflicts: if staff is selected, only check that staff's bookings
    const hasConflict = existingAppointments.some((appt) => {
      if (selectedStaffId && appt.staff_id !== selectedStaffId) return false
      const aStart = toMinutes(appt.start_time)
      const aEnd = toMinutes(appt.end_time)
      return slotStart < aEnd && slotEnd > aStart
    })

    if (!hasConflict) {
      slots.push(slotStartStr)
    }
  }

  return slots
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    doctor: "歯科医師",
    hygienist: "歯科衛生士",
    assistant: "歯科助手",
    receptionist: "受付",
  }
  return map[role] ?? role
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = ["治療内容", "担当スタッフ", "日時", "患者情報", "確認", "完了"]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < currentStep
                  ? "bg-teal-600 text-white"
                  : i === currentStep
                    ? "bg-teal-600 text-white ring-2 ring-teal-300"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`mt-1 text-xs whitespace-nowrap ${i === currentStep ? "text-teal-700 font-medium" : "text-gray-500"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-8 mx-1 mb-4 ${i < currentStep ? "bg-teal-600" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Calendar component
// ---------------------------------------------------------------------------

interface CalendarPickerProps {
  selectedDate: string | null
  onSelect: (date: string) => void
  maxDays: number
  availabilityCache: Record<string, AvailabilityData>
  onFetchAvailability: (date: string) => Promise<AvailabilityData | null>
}

function CalendarPicker({ selectedDate, onSelect, maxDays, availabilityCache, onFetchAvailability }: CalendarPickerProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = addDays(today, maxDays)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [loadingDates, setLoadingDates] = useState<Set<string>>(new Set())

  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  const startDow = firstDay.getDay()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(viewYear, viewMonth, d))

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const isDateDisabled = (date: Date): boolean => {
    if (date < today || date > maxDate) return true
    const ds = formatDate(date)
    const av = availabilityCache[ds]
    if (!av) return false
    return av.isHoliday || av.businessHours.is_closed
  }

  const handleDateClick = async (date: Date) => {
    if (isDateDisabled(date)) return
    const ds = formatDate(date)
    onSelect(ds)
    if (!availabilityCache[ds] && !loadingDates.has(ds)) {
      setLoadingDates(prev => new Set(prev).add(ds))
      await onFetchAvailability(ds)
      setLoadingDates(prev => { const s = new Set(prev); s.delete(ds); return s })
    }
  }

  // Prefetch current month
  useEffect(() => {
    const toFetch: string[] = []
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(viewYear, viewMonth, d)
      if (date >= today && date <= maxDate) {
        const ds = formatDate(date)
        if (!availabilityCache[ds] && !loadingDates.has(ds)) {
          toFetch.push(ds)
        }
      }
    }
    if (toFetch.length > 0) {
      toFetch.forEach(ds => {
        setLoadingDates(prev => new Set(prev).add(ds))
        onFetchAvailability(ds).finally(() => {
          setLoadingDates(prev => { const s = new Set(prev); s.delete(ds); return s })
        })
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth])

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded" aria-label="前月">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-medium">{viewYear}年{viewMonth + 1}月</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded" aria-label="翌月">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((w, i) => (
          <div key={w} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-600"}`}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />
          const ds = formatDate(date)
          const disabled = isDateDisabled(date)
          const isSelected = ds === selectedDate
          const isToday = formatDate(date) === formatDate(today)
          const isLoading = loadingDates.has(ds)
          const av = availabilityCache[ds]
          const isClosed = av && (av.isHoliday || av.businessHours.is_closed)
          const dow = date.getDay()

          return (
            <button
              key={ds}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={`aspect-square rounded text-sm flex items-center justify-center transition-colors
                ${isSelected ? "bg-teal-600 text-white font-medium" : ""}
                ${!isSelected && isToday ? "border border-teal-400 font-medium" : ""}
                ${!disabled && !isSelected ? "hover:bg-teal-50" : ""}
                ${disabled || isClosed ? "text-gray-300 cursor-not-allowed line-through" : ""}
                ${!disabled && !isSelected && dow === 0 ? "text-red-500" : ""}
                ${!disabled && !isSelected && dow === 6 ? "text-blue-500" : ""}
                ${isLoading ? "opacity-50" : ""}
              `}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReservePage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null | "any">(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availabilityCache, setAvailabilityCache] = useState<Record<string, AvailabilityData>>({})
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: "",
    name_kana: "",
    phone: "",
    email: "",
    date_of_birth: "",
    notes: "",
  })

  // Result
  const [reservationResult, setReservationResult] = useState<ReservationResult | null>(null)

  // Load initial data
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [clinicRes, servicesRes] = await Promise.all([
          fetch("/api/clinic"),
          fetch("/api/services"),
        ])
        const clinicData = await clinicRes.json()
        const servicesData = await servicesRes.json()
        setClinicInfo(clinicData.data)
        setServices(servicesData.data ?? [])
      } catch {
        setError("データの読み込みに失敗しました。ページを再読み込みしてください。")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load staff when moving to step 1
  useEffect(() => {
    if (step === 1 && staffList.length === 0) {
      fetch("/api/staff")
        .then(r => r.json())
        .then(d => setStaffList(d.data ?? []))
        .catch(() => setError("スタッフ情報の取得に失敗しました"))
    }
  }, [step, staffList.length])

  const fetchAvailability = useCallback(async (date: string): Promise<AvailabilityData | null> => {
    try {
      const res = await fetch(`/api/availability?date=${date}`)
      const json = await res.json()
      const av: AvailabilityData = json.data
      setAvailabilityCache(prev => ({ ...prev, [date]: av }))
      return av
    } catch {
      return null
    }
  }, [])

  const timeSlots = (() => {
    if (!selectedDate || !selectedService) return []
    const av = availabilityCache[selectedDate]
    if (!av || av.isHoliday || av.businessHours.is_closed) return []
    const staffId = selectedStaff && selectedStaff !== "any" ? selectedStaff.id : null
    return generateTimeSlots(
      av.businessHours.open_time,
      av.businessHours.close_time,
      selectedService.duration,
      av.existingAppointments,
      staffId,
    )
  })()

  const handleNext = () => {
    setError(null)
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setError(null)
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return
    setLoading(true)
    setError(null)

    const staffId = selectedStaff && selectedStaff !== "any" ? selectedStaff.id : null
    const endTime = fromMinutes(toMinutes(selectedTime) + selectedService.duration)

    // We need a valid staff_id. If "any", pick the first available staff or use a placeholder.
    const effectiveStaffId = staffId ?? (staffList[0]?.id ?? "")

    const body = {
      patient: {
        name: patientInfo.name,
        phone: patientInfo.phone,
        ...(patientInfo.email ? { email: patientInfo.email } : {}),
      },
      staff_id: effectiveStaffId,
      date: selectedDate,
      start_time: selectedTime,
      end_time: endTime,
      treatment_type: selectedService.name,
      status: "confirmed" as const,
      ...(patientInfo.notes ? { notes: patientInfo.notes } : {}),
    }

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "予約の作成に失敗しました")
        return
      }
      setReservationResult({
        id: json.data.id,
        date: json.data.date,
        start_time: json.data.start_time,
        end_time: json.data.end_time,
        treatment_type: json.data.treatment_type,
      })
      setStep(5)
    } catch {
      setError("予約の作成中にエラーが発生しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  if (loading && step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-teal-700">{clinicInfo?.name ?? "クリニック"}</h1>
          <p className="text-sm text-gray-500">オンライン予約</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {step < 5 && <StepIndicator currentStep={step} />}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 0: Service Selection */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">治療内容を選択してください</h2>
            {services.length === 0 ? (
              <p className="text-gray-500 text-center py-8">サービス情報を読み込み中...</p>
            ) : (
              <div className="grid gap-3">
                {services.map(service => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? "border-teal-500 ring-2 ring-teal-300 bg-teal-50"
                        : "hover:border-teal-300 hover:shadow"
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                          )}
                          <div className="flex gap-4 mt-2">
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {service.duration}分
                            </span>
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              {service.price.toLocaleString()}円
                            </span>
                          </div>
                        </div>
                        {selectedService?.id === service.id && (
                          <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center shrink-0 mt-1">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleNext}
                disabled={!selectedService}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8"
              >
                次へ <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Staff Selection */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">担当スタッフを選択してください</h2>
            <div className="grid gap-3">
              {/* Any staff option */}
              <Card
                className={`cursor-pointer transition-all ${
                  selectedStaff === "any"
                    ? "border-teal-500 ring-2 ring-teal-300 bg-teal-50"
                    : "hover:border-teal-300 hover:shadow"
                }`}
                onClick={() => setSelectedStaff("any")}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">指名なし（おまかせ）</p>
                      <p className="text-sm text-gray-500">空きのあるスタッフが担当します</p>
                    </div>
                  </div>
                  {selectedStaff === "any" && (
                    <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {staffList.map(staff => (
                <Card
                  key={staff.id}
                  className={`cursor-pointer transition-all ${
                    selectedStaff !== "any" && (selectedStaff as Staff)?.id === staff.id
                      ? "border-teal-500 ring-2 ring-teal-300 bg-teal-50"
                      : "hover:border-teal-300 hover:shadow"
                  }`}
                  onClick={() => setSelectedStaff(staff)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        <p className="text-sm text-gray-500">{getRoleLabel(staff.role)}</p>
                      </div>
                    </div>
                    {selectedStaff !== "any" && (selectedStaff as Staff)?.id === staff.id && (
                      <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
              </Button>
              <Button
                onClick={handleNext}
                disabled={selectedStaff === null}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8"
              >
                次へ <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">日付と時間を選択してください</h2>
            <CalendarPicker
              selectedDate={selectedDate}
              onSelect={(date) => { setSelectedDate(date); setSelectedTime(null) }}
              maxDays={clinicInfo?.bookingAdvanceDays ?? 60}
              availabilityCache={availabilityCache}
              onFetchAvailability={fetchAvailability}
            />

            {selectedDate && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-700 mb-3">
                  {formatDateDisplay(selectedDate)} の空き時間
                </h3>
                {(() => {
                  const av = availabilityCache[selectedDate]
                  if (!av) return <p className="text-gray-500 text-sm">読み込み中...</p>
                  if (av.isHoliday) return <p className="text-red-500 text-sm">この日は休診日です</p>
                  if (av.businessHours.is_closed) return <p className="text-red-500 text-sm">この日は休診です</p>
                  if (timeSlots.length === 0) return <p className="text-gray-500 text-sm">空き時間がありません</p>
                  return (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {timeSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                            selectedTime === slot
                              ? "bg-teal-600 text-white border-teal-600"
                              : "border-gray-300 text-gray-700 hover:border-teal-400 hover:bg-teal-50"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedDate || !selectedTime}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8"
              >
                次へ <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Patient Info */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">患者情報を入力してください</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> お名前 <span className="text-red-500 text-xs">*必須</span>
                </Label>
                <Input
                  id="name"
                  value={patientInfo.name}
                  onChange={e => setPatientInfo(p => ({ ...p, name: e.target.value }))}
                  placeholder="山田 太郎"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="name_kana">フリガナ</Label>
                <Input
                  id="name_kana"
                  value={patientInfo.name_kana}
                  onChange={e => setPatientInfo(p => ({ ...p, name_kana: e.target.value }))}
                  placeholder="ヤマダ タロウ"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> 電話番号 <span className="text-red-500 text-xs">*必須</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={patientInfo.phone}
                  onChange={e => setPatientInfo(p => ({ ...p, phone: e.target.value }))}
                  placeholder="090-1234-5678"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={patientInfo.email}
                  onChange={e => setPatientInfo(p => ({ ...p, email: e.target.value }))}
                  placeholder="example@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dob" className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> 生年月日
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={patientInfo.date_of_birth}
                  onChange={e => setPatientInfo(p => ({ ...p, date_of_birth: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes" className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> 症状・備考
                </Label>
                <Textarea
                  id="notes"
                  value={patientInfo.notes}
                  onChange={e => setPatientInfo(p => ({ ...p, notes: e.target.value }))}
                  placeholder="気になる症状や備考があればご記入ください"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
              </Button>
              <Button
                onClick={handleNext}
                disabled={!patientInfo.name.trim() || !patientInfo.phone.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8"
              >
                次へ <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">予約内容をご確認ください</h2>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-700">予約内容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">治療内容</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">所要時間</span>
                  <span>{selectedService?.duration}分</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">料金（目安）</span>
                  <span>{selectedService?.price.toLocaleString()}円</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">担当スタッフ</span>
                  <span>{selectedStaff === "any" ? "おまかせ" : (selectedStaff as Staff)?.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">日付</span>
                  <span>{selectedDate ? formatDateDisplay(selectedDate) : ""}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">時間</span>
                  <span>
                    {selectedTime} ～{" "}
                    {selectedTime && selectedService
                      ? fromMinutes(toMinutes(selectedTime) + selectedService.duration)
                      : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-700">患者情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-500">お名前</span>
                  <span className="font-medium">{patientInfo.name}</span>
                </div>
                {patientInfo.name_kana && (
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-gray-500">フリガナ</span>
                    <span>{patientInfo.name_kana}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-500">電話番号</span>
                  <span>{patientInfo.phone}</span>
                </div>
                {patientInfo.email && (
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-gray-500">メール</span>
                    <span>{patientInfo.email}</span>
                  </div>
                )}
                {patientInfo.date_of_birth && (
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-gray-500">生年月日</span>
                    <span>{patientInfo.date_of_birth}</span>
                  </div>
                )}
                {patientInfo.notes && (
                  <div className="py-1">
                    <p className="text-gray-500 mb-1">備考</p>
                    <p className="text-gray-700">{patientInfo.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    送信中...
                  </span>
                ) : (
                  "予約を確定する"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 5 && reservationResult && (
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">ご予約ありがとうございます</h2>
            <p className="text-gray-500 mb-6">以下の内容でご予約を承りました</p>

            <Card className="text-left mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-700">予約内容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">予約番号</span>
                  <span className="font-mono font-medium text-teal-700">{reservationResult.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">治療内容</span>
                  <span>{reservationResult.treatment_type}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">日付</span>
                  <span>{formatDateDisplay(reservationResult.date)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">時間</span>
                  <span>{reservationResult.start_time} ～ {reservationResult.end_time}</span>
                </div>
              </CardContent>
            </Card>

            {clinicInfo && (
              <Card className="text-left">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-gray-700">クリニック情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 py-1">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{clinicInfo.name}</p>
                      {clinicInfo.address && <p className="text-gray-500">{clinicInfo.address}</p>}
                    </div>
                  </div>
                  {clinicInfo.phone && (
                    <div className="flex items-center gap-2 py-1">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <a href={`tel:${clinicInfo.phone}`} className="text-teal-600 hover:underline">
                        {clinicInfo.phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
