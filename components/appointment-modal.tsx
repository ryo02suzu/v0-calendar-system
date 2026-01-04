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
import { AlertCircle, Search, User, Phone, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Patient, Staff, Appointment } from "@/lib/types"
import { getPatientRiskScore } from "@/lib/db"

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
  appointment: Appointment | null
  staff: Staff[]
  onSave: (appointment: Appointment) => Promise<void>
  onDelete: (id: string) => void
  initialSlotData?: { date: string; time: string; staffId?: string } | null
  debugSearch?: boolean // true にするとゼロ件時に console に候補出力
}

/* ひらがな→カタカナ */
function hiraToKata(str: string) {
  return str.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
}
/* カタカナ→ひらがな */
function kataToHira(str: string) {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
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

  const [formData, setFormData] = useState<Partial<Appointment>>({
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
  const [newPatientData, setNewPatientData] = useState({ name: "", name_kana: "", phone: "", email: "", date_of_birth: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [riskScore, setRiskScore] = useState<any>(null)
  const [capacityCheck, setCapacityCheck] = useState<any>(null)
  const [patientRiskScore, setPatientRiskScore] = useState<any>(null)

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === formData.patient_id),
    [patients, formData.patient_id],
  )

  // 🆕 患者選択時にリスクスコアを読み込む
  useEffect(() => {
    if (formData.patient_id) {
      loadPatientRiskScore(formData.patient_id)
    } else {
      setPatientRiskScore(null)
    }
  }, [formData.patient_id])

  const loadPatientRiskScore = async (patientId: string) => {
    try {
      const riskData = await getPatientRiskScore(patientId)
      setPatientRiskScore(riskData)
    } catch (error) {
      console.error("[v0] Error loading risk score:", error)
    }
  }

  // 🆕 リスクレベルの色分け
  const getRiskLevel = (score: number) => {
    if (score >= 50)
      return { label: "高リスク", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-300" }
    if (score >= 20)
      return { label: "中リスク", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-300" }
    return { label: "低リスク", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-300" }
  }

  // 検索フィルタ
  const filteredPatients = useMemo(() => {
    if (!searchValue) return patients
    const queryVariants = buildVariants(searchValue)
    if (queryVariants.length === 0) return patients

    const matches = patients.filter((p) => {
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
      return queryVariants.some((qv) => targetStrings.some((ts) => ts.includes(qv)))
    })

    if (debugSearch && matches.length === 0) {
      // デバッグ出力
      console.group("[DEBUG] Patient search no result")
      console.log("query:", searchValue)
      console.log("queryVariants:", queryVariants)
      console.log(
        "first 5 patients sample:",
        patients.slice(0, 5).map((p) => ({
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
    }
  }, [isOpen])

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
      setNewPatientData({ name: "", name_kana: "", phone: "", email: "", date_of_birth: "" })
    }
    setError(null)
  }, [appointment, staff, initialSlotData])

  // 🆕 Check capacity when date/time/staff/chair changes
  useEffect(() => {
    const checkCapacity = async () => {
      if (
        formData.date &&
        formData.start_time &&
        formData.end_time &&
        formData.staff_id &&
        formData.start_time < formData.end_time
      ) {
        try {
          const response = await fetch("/api/appointments/check-conflict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: formData.date,
              start_time: formData.start_time,
              end_time: formData.end_time,
              staff_id: formData.staff_id,
              chair_number: formData.chair_number,
              exclude_id: appointment?.id,
            }),
          })
          if (response.ok) {
            const data = await response.json()
            setCapacityCheck(data)
          }
        } catch (error) {
          console.error("Failed to check capacity:", error)
        }
      }
    }
    checkCapacity()
  }, [formData.date, formData.start_time, formData.end_time, formData.staff_id, formData.chair_number, appointment?.id])

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

      // 🆕 Check capacity before saving
      if (capacityCheck && !capacityCheck.canBook) {
        setError(capacityCheck.message || "この時間帯は予約できません")
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
          name_kana: newPatientData.name_kana,
          phone: newPatientData.phone,
          email: newPatientData.email,
          date_of_birth: newPatientData.date_of_birth,
        })
        patientId = newPatient.id
        setPatients((prev) => [newPatient, ...prev])
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
      } as Appointment)

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
          {/* 患者選択セクション */}
          <div>
            <Label>患者</Label>
            <div className="flex gap-2 mb-3">
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
              <div className="space-y-3">
                {/* 🆕 検索ボックスを常時表示 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="患者名、カナ、電話番号、患者番号で検索..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>

                {/* 🆕 選択済み患者カード（リスクスコア表示） */}
                {selectedPatient && !searchValue && (
                  <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-lg">{selectedPatient.name}</div>
                          {selectedPatient.name_kana && (
                            <div className="text-sm text-muted-foreground">{selectedPatient.name_kana}</div>
                          )}
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Phone className="w-3 h-3" />
                            {selectedPatient.phone}
                            {selectedPatient.age && <span>・ {selectedPatient.age}歳</span>}
                          </div>
                          {selectedPatient.patient_number && (
                            <div className="text-xs text-muted-foreground mt-1">
                              患者番号: {selectedPatient.patient_number}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, patient_id: undefined })}
                      >
                        変更
                      </Button>
                    </div>

                    {/* 🆕 リスクスコア表示 */}
                    {patientRiskScore && patientRiskScore.totalAppointments > 0 && (
                      <div
                        className={`p-3 rounded-lg border ${getRiskLevel(patientRiskScore.riskScore).bgColor} ${getRiskLevel(patientRiskScore.riskScore).borderColor}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`w-4 h-4 ${getRiskLevel(patientRiskScore.riskScore).color}`} />
                          <span className={`text-sm font-bold ${getRiskLevel(patientRiskScore.riskScore).color}`}>
                            {getRiskLevel(patientRiskScore.riskScore).label} (スコア: {patientRiskScore.riskScore})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>総予約数: {patientRiskScore.totalAppointments}回</div>
                          {patientRiskScore.cancellationCount > 0 && (
                            <div>キャンセル: {patientRiskScore.cancellationCount}回</div>
                          )}
                          {patientRiskScore.noShowCount > 0 && (
                            <div className="text-red-600 font-semibold">
                              無断キャンセル: {patientRiskScore.noShowCount}回
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 🆕 検索結果リスト */}
                {searchValue && filteredPatients.length > 0 && (
                  <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2 bg-muted/20">
                    <div className="text-xs text-muted-foreground px-2 py-1">
                      {filteredPatients.length}件の患者が見つかりました
                    </div>
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, patient_id: patient.id })
                          setSearchValue("")
                        }}
                        className="w-full p-3 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left bg-card"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold">{patient.name}</div>
                            {patient.name_kana && (
                              <div className="text-xs text-muted-foreground">{patient.name_kana}</div>
                            )}
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                              <Phone className="w-3 h-3" />
                              {patient.phone}
                              {patient.age && <span>・ {patient.age}歳</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {patient.patient_number && (
                                <span className="text-[10px] text-muted-foreground">{patient.patient_number}</span>
                              )}
                              {patient.no_show_count && patient.no_show_count > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">
                                  無断{patient.no_show_count}回
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 検索結果なし */}
                {searchValue && filteredPatients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg bg-muted/10">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <div>患者が見つかりませんでした</div>
                    <div className="text-xs mt-1">別のキーワードで検索してみてください</div>
                  </div>
                )}

                {/* 未選択状態 */}
                {!selectedPatient && !searchValue && (
                  <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <div>患者を検索してください</div>
                    <div className="text-xs mt-1">名前、カナ、電話番号、患者番号で検索できます</div>
                  </div>
                )}
              </div>
            ) : (
              // 新規患者フォーム
              <div className="space-y-2">
                <Input
                  placeholder="患者名（必須）"
                  value={newPatientData.name}
                  onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="カナ"
                  value={newPatientData.name_kana}
                  onChange={(e) => setNewPatientData({ ...newPatientData, name_kana: e.target.value })}
                />
                <Input
                  placeholder="電話番号（必須）"
                  value={newPatientData.phone}
                  onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                  required
                />
                <Input
                  placeholder="メールアドレス"
                  type="email"
                  value={newPatientData.email}
                  onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                />
                <div>
                  <Label htmlFor="date_of_birth" className="text-xs text-muted-foreground">
                    生年月日
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={newPatientData.date_of_birth}
                    onChange={(e) => setNewPatientData({ ...newPatientData, date_of_birth: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 🆕 Risk Score Display */}
          {riskScore && selectedPatient && (
            <Alert className={cn(
              "border-l-4",
              riskScore.riskLevel === "high" ? "border-l-red-500 bg-red-50" :
              riskScore.riskLevel === "medium" ? "border-l-yellow-500 bg-yellow-50" :
              "border-l-green-500 bg-green-50"
            )}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">
                  リスクスコア: {riskScore.riskScore}/100
                  {riskScore.riskLevel === "high" ? " (高リスク)" :
                   riskScore.riskLevel === "medium" ? " (中リスク)" : " (低リスク)"}
                </div>
                <div className="text-xs mt-1">
                  キャンセル: {riskScore.cancellationCount}回 / 無断キャンセル: {riskScore.noShowCount}回 / 総予約: {riskScore.totalAppointments}回
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 🆕 Capacity Check Display */}
          {capacityCheck && !capacityCheck.canBook && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{capacityCheck.message}</AlertDescription>
            </Alert>
          )}
          {capacityCheck && capacityCheck.canBook && capacityCheck.remainingCapacity > 0 && (
            <Alert className="border-l-4 border-l-blue-500 bg-blue-50">
              <AlertDescription>
                この時間帯の残り予約可能数: {capacityCheck.remainingCapacity}/{capacityCheck.staffCapacity}
              </AlertDescription>
            </Alert>
          )}

          {/* 日付 / 担当者 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={isSaving}
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

          {/* 時間 / チェア */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_time">開始時間</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="chair_number">チェア番号</Label>
              <Select
                value={formData.chair_number?.toString()}
                onValueChange={(value) => setFormData({ ...formData, chair_number: parseInt(value) })}
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

          {/* 治療内容 */}
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

          {/* ステータス */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">ステータス</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as Appointment["status"] })
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
              <Label htmlFor="confirmation_status">患者確認</Label>
              <Select
                value={formData.confirmation_status || "pending"}
                onValueChange={(value) =>
                  setFormData({ ...formData, confirmation_status: value as "pending" | "confirmed" })
                }
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">未確認</SelectItem>
                  <SelectItem value="confirmed">確認済み</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* メモ */}
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

async function createPatientViaApi(patient: { name: string; name_kana?: string; phone: string; email?: string; date_of_birth?: string }) {
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