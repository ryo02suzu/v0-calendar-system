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

/*
  改善点:
  - kana / name_kana 両対応
  - ひらがな ⇄ カタカナ 変換で揺れ吸収
  - スペース・ハイフン除去
  - 患者番号・電話番号部分一致対応
  - ゼロ件時のデバッグログ (toggle可能)
*/

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: CalendarAppointment | null
  staff: Staff[]
  onSave: (appointment: CalendarAppointment) => Promise<void>
  onDelete: (id: string) => void
  initialSlotData?: { date: string; time: string; staffId?: string } | null
  debugSearch?: boolean // true にするとゼロ件時に console に候補出力
}

/* ひらがな→カタカナ */
function hiraToKata(str: string) {
  return str.replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60))
}
/* カタカナ→ひらがな */
function kataToHira(str: string) {
  return str.replace(/[\u30A1-\u30F6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
}

/* 正規化（スペース/ハイフン除去＋小文字化） */
function stripBasic(str: string) {
  return str.replace(/[\s\-]/g, "").toLowerCase()
}

/*
  与えられた文字列から検索用バリエーションセットを作る
  - オリジナル
  - ひらがな化
  - カタカナ化
  (漢字はそのまま保持)
*/
function buildVariants(str: string): string[] {
  const raw = stripBasic(str)
  if (!raw) return []
  // ひらがなとカタカナ相互変換
  const hira = kataToHira(raw)
  const kata = hiraToKata(raw)
  const set = new Set<string>([raw, hira, kata])
  return [...set]
}

export function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  staff,
  onSave,
  onDelete,
  initialSlotData,
  debugSearch = false,
}: AppointmentModalProps) {
  const getCurrentDate = () => new Date().toISOString().split("T")[0]

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
  const [searchValue, setSearchValue] = useState("")
  const [open, setOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const newPatientNameRef = useRef<HTMLInputElement>(null)

  // 最近 10 件
  const recentPatients = useMemo(() => patients.slice(0, 10), [patients])

  const selectedPatient = useMemo(
    () => patients.find(p => p.id === formData.patient_id),
    [patients, formData.patient_id],
  )

  // 検索フィルタ
  const filteredPatients = useMemo(() => {
    if (!searchValue) return patients
    const queryVariants = buildVariants(searchValue)
    if (queryVariants.length === 0) return patients

    const matches = patients.filter(p => {
      const nameField = p.name || ""
      // kana は mapPatientFromDb 後のフィールド。万一 name_kana が残っていても対応
      const kanaField = (p as any).kana || (p as any).name_kana || ""
      const phoneField = (p.phone || "").replace(/[\s\-]/g, "")
      const numberField = (p.patient_number || "").replace(/[\s\-]/g, "")

      const targetStrings = [
        stripBasic(nameField),
        stripBasic(kanaField),
        stripBasic(phoneField),
        stripBasic(numberField),
        // 追加: ひらがな化/カタカナ化両方
        stripBasic(hiraToKata(kanaField)),
        stripBasic(kataToHira(kanaField)),
      ].filter(Boolean)

      // 部分一致: いずれかの variant がいずれかの targetStrings に含まれる
      return queryVariants.some(qv => targetStrings.some(ts => ts.includes(qv)))
    })

    if (debugSearch && matches.length === 0) {
      // デバッグ出力
      console.group("[DEBUG] Patient search no result")
      console.log("query:", searchValue)
      console.log("queryVariants:", queryVariants)
      console.log(
        "first 5 patients sample:",
        patients.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          kana: (p as any).kana || (p as any).name_kana,
          phone: p.phone,
          patient_number: p.patient_number,
        })),
      )
      console.groupEnd()
    }

    return matches
  }, [patients, searchValue, debugSearch])

  // モーダル開時のフォーカス
  useEffect(() => {
    if (isOpen) {
      loadPatients()
      setError(null)
      setTimeout(() => {
        if (isNewPatient) {
          newPatientNameRef.current?.focus()
        } else {
          searchRef.current?.focus()
        }
      }, 50)
    }
  }, [isOpen, isNewPatient])

  const loadPatients = async () => {
    try {
      const response = await fetch("/api/patients", { cache: "no-store" })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "患者データの取得に失敗しました")
      setPatients(json.data || [])
    } catch (e) {
      console.error("[v0] Error loading patients:", e)
      setError("患者データの読み込みに失敗しました")
    }
  }

  // 初期化
  useEffect(() => {
    if (appointment) {
      setFormData(appointment)
      setIsNewPatient(false)
    } else {
      const start = initialSlotData?.time || "09:00"
      const endHour = (parseInt(start.split(":")[0]) + 1).toString().padStart(2, "0")
      setFormData({
        date: initialSlotData?.date || getCurrentDate(),
        start_time: start,
        end_time: `${endHour}:00`,
        treatment_type: "定期検診",
        status: "confirmed",
        chair_number: 1,
        notes: "",
        staff_id: initialSlotData?.staffId || staff[0]?.id,
      })
      setIsNewPatient(false)
      setNewPatientData({ name: "", phone: "", email: "" })
    }
    setError(null)
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
        const newPatient = await createPatientViaApi({
          name: newPatientData.name,
            phone: newPatientData.phone,
          email: newPatientData.email,
          patient_number: `P${Date.now().toString().slice(-6)}`,
        })
        patientId = newPatient.id
        setPatients(prev => [newPatient, ...prev])
      } else if (!patientId) {
        setError("患者を選択してください")
        setIsSaving(false)
        return
      }

      const { patient, staff: staffField, ...rest } = formData as any
      await onSave({
        ...rest,
        id: appointment?.id || crypto.randomUUID(),
        patient_id: patientId!,
        staff_id: formData.staff_id!,
      } as CalendarAppointment)

      onClose()
    } catch (err: any) {
      console.error("[v0] Error saving appointment:", err)
      setError(err?.message || "予約の保存に失敗しました")
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
          {/* 患者選択 */}
          <div>
            <Label>患者</Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={!isNewPatient ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsNewPatient(false)
                  setSearchValue("")
                  setTimeout(() => searchRef.current?.focus(), 50)
                }}
                disabled={isSaving}
              >
                既存患者
              </Button>
              <Button
                type="button"
                variant={isNewPatient ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsNewPatient(true)
                  setTimeout(() => newPatientNameRef.current?.focus(), 50)
                }}
                disabled={isSaving}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                新規患者
              </Button>
            </div>

            {!isNewPatient ? (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    className={cn("w-full justify-between text-left", !selectedPatient && "text-muted-foreground")}
                    disabled={isSaving}
                    onClick={() => setTimeout(() => searchRef.current?.focus(), 30)}
                  >
                    {selectedPatient ? (
                      <span className="flex flex-col w-full min-w-0">
                        <span className="truncate font-medium">
                          {selectedPatient.name}
                          {selectedPatient.patient_number && ` [${selectedPatient.patient_number}]`}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {(selectedPatient as any).kana && `${(selectedPatient as any).kana} / `}
                          {selectedPatient.phone}
                        </span>
                      </span>
                    ) : (
                      "患者を選択"
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[480px] p-0" align="start">
                  <Command>
                    <CommandInput
                      ref={searchRef}
                      placeholder="患者名 / カナ / ひらがな / 電話 / 番号で検索..."
                      value={searchValue}
                      onValueChange={setSearchValue}
                      disabled={isSaving}
                    />
                    <CommandList>
                      <CommandEmpty>該当する患者が見つかりません</CommandEmpty>

                      {!searchValue && recentPatients.length > 0 && (
                        <CommandGroup heading="最近来院">
                          {recentPatients.map(p => (
                            <CommandItem
                              key={p.id}
                              value={p.id!}
                              onSelect={() => {
                                setFormData({ ...formData, patient_id: p.id })
                                setOpen(false)
                                setSearchValue("")
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.patient_id === p.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate font-medium">
                                  {p.name}
                                  {p.patient_number && ` [${p.patient_number}]`}
                                </span>
                                <span className="text-xs text-gray-500 truncate">
                                  {(p as any).kana && `${(p as any).kana} / `}
                                  {p.phone}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {searchValue && (
                        <CommandGroup heading="検索結果">
                          {filteredPatients.map(p => (
                            <CommandItem
                              key={p.id}
                              value={p.id!}
                              onSelect={() => {
                                setFormData({ ...formData, patient_id: p.id })
                                setOpen(false)
                                setSearchValue("")
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.patient_id === p.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate font-medium">
                                  {p.name}
                                  {p.patient_number && ` [${p.patient_number}]`}
                                </span>
                                <span className="text-xs text-gray-500 truncate">
                                  {(p as any).kana && `${(p as any).kana} / `}
                                  {p.phone}
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
                    placeholder="患者名（漢字）"
                    value={newPatientData.name}
                    onChange={e => setNewPatientData({ ...newPatientData, name: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <Label htmlFor="new-patient-phone">電話番号 *</Label>
                  <Input
                    id="new-patient-phone"
                    placeholder="電話番号"
                    value={newPatientData.phone}
                    onChange={e => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                    required
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <Label htmlFor="new-patient-email">メールアドレス（任意）</Label>
                  <Input
                    id="new-patient-email"
                    type="email"
                    placeholder="メールアドレス"
                    value={newPatientData.email}
                    onChange={e => setNewPatientData({ ...newPatientData, email: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 日付 / 担当者 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="staff_id">担当者</Label>
              <Select
                value={formData.staff_id}
                onValueChange={value => setFormData({ ...formData, staff_id: value })}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="担当者を選択" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 時間 / チェア */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_time">開始時間</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="end_time">終了時間</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="chair_number">チェア番号</Label>
              <Select
                value={formData.chair_number?.toString()}
                onValueChange={value => setFormData({ ...formData, chair_number: parseInt(value) })}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      チェア {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 治療内容 */}
          <div>
            <Label htmlFor="treatment_type">治療内容</Label>
            <Select
              value={formData.treatment_type}
              onValueChange={value => setFormData({ ...formData, treatment_type: value })}
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

          {/* ステータス */}
          <div>
            <Label htmlFor="status">ステータス</Label>
            <Select
              value={formData.status}
              onValueChange={value =>
                setFormData({ ...formData, status: value as CalendarAppointment["status"] })
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

          {/* メモ */}
          <div>
            <Label htmlFor="notes">メモ</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="特記事項があれば記入してください"
              disabled={isSaving}
            />
          </div>

          {/* アクション */}
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