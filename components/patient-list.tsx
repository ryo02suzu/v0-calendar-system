"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Patient } from "@/lib/types"

type PatientFormState = {
  name: string
  kana?: string
  phone: string
  email?: string
  date_of_birth?: string
  gender?: string
  address?: string
  medical_notes?: string
}

export function PatientList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [formData, setFormData] = useState<PatientFormState>({
    name: "",
    kana: "",
    phone: "",
    email: "",
    date_of_birth: "",
    gender: "",
    address: "",
    medical_notes: "",
  })

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    setIsLoading(true)
    try {
      const data = await fetchPatientsFromApi()
      setPatients(data)
    } catch (error) {
      console.error("[v0] Error loading patients:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function openDialog(patient?: Patient) {
    if (patient) {
      setEditingPatient(patient)
      setFormData({
        name: patient.name,
        kana: patient.kana || "",
        phone: patient.phone,
        email: patient.email || "",
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "",
        address: patient.address || "",
        medical_notes: patient.medical_notes || "",
      })
    } else {
      setEditingPatient(null)
      setFormData({
        name: "",
        kana: "",
        phone: "",
        email: "",
        date_of_birth: "",
        gender: "",
        address: "",
        medical_notes: "",
      })
    }
    setIsDialogOpen(true)
  }

  async function handleSavePatient() {
    try {
      if (!formData.name || !formData.phone) {
        alert("患者名と電話番号は必須です")
        return
      }

      if (editingPatient) {
        await updatePatientViaApi(editingPatient.id!, formData)
      } else {
        // createPatientViaApi は作成した patient を返すように修正済み
        await createPatientViaApi(formData)
      }
      await loadPatients()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error saving patient:", error)
      alert("保存に失敗しました")
    }
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name?.includes(searchTerm) ||
      patient.kana?.includes(searchTerm) ||
      patient.patient_number?.includes(searchTerm) ||
      patient.phone?.includes(searchTerm) ||
      patient.email?.includes(searchTerm),
  )

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">患者一覧</h1>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          新規患者登録
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="search"
            placeholder="患者名、ID、電話番号で検索..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>患者ID</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>フリガナ</TableHead>
              <TableHead>生年月日</TableHead>
              <TableHead>性別</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead>メール</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {searchTerm ? "該当する患者が見つ���りません" : "患者データがありません"}
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.patient_number || "-"}</TableCell>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell className="text-gray-600">{patient.kana || "-"}</TableCell>
                  <TableCell>{patient.date_of_birth || "-"}</TableCell>
                  <TableCell>{patient.gender || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {patient.phone || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {patient.email || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{patient.created_at ? patient.created_at.split("T")[0] : "-"}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openDialog(patient)}>
                      編集
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPatient ? "患者情報編集" : "新規患者登録"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>氏名 *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="山田 太郎"
                  required
                />
              </div>
              <div>
                <Label>フリガナ</Label>
                <Input
                  value={formData.kana || ""}
                  onChange={(e) => setFormData({ ...formData, kana: e.target.value })}
                  placeholder="ヤマダ タロウ"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>電話番号 *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="090-1234-5678"
                  required
                />
              </div>
              <div>
                <Label>メールアドレス</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>生年月日</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth || ""}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <Label>性別</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="男性">男性</SelectItem>
                    <SelectItem value="女性">女性</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>住所</Label>
              <Input
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="東京都渋谷区..."
              />
            </div>
            <div>
              <Label>医療メモ</Label>
              <Textarea
                value={formData.medical_notes || ""}
                onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                placeholder="アレルギー、既往歴などを記載"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSavePatient}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type PatientPayload = PatientFormState

async function fetchPatientsFromApi(): Promise<Patient[]> {
  const response = await fetch("/api/patients", { cache: "no-store" })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || "患者情報の取得に失敗しました")
  }

  return (data.data as Patient[]) || []
}

async function createPatientViaApi(patient: PatientPayload) {
  const response = await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || "患者の作成に失敗しました")
  }

  // ✅ 成功時に作成された patient を返す
  return data.data as Patient
}

async function updatePatientViaApi(id: string, patient: PatientPayload) {
  const response = await fetch(`/api/patients/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || "患者情報の更新に失敗しました")
  }

  return data.data as Patient
}