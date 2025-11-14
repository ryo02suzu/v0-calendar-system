"use client"

import { useState, useEffect } from "react"
import { Search, FileText, Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getMedicalRecords, getPatients, createMedicalRecord, getStaff } from "@/lib/db"
import type { MedicalRecord, Patient, Staff } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MedicalRecords() {
  const [searchTerm, setSearchTerm] = useState("")
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    patient_id: "",
    staff_id: "",
    date: new Date().toISOString().split("T")[0],
    diagnosis: "",
    treatment: "",
    treatment_details: "",
    tooth_number: "",
    cost: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const [recordsData, patientsData, staffData] = await Promise.all([getMedicalRecords(), getPatients(), getStaff()])
      setRecords(recordsData)
      setPatients(patientsData)
      setStaff(staffData)
    } catch (error) {
      console.error("[v0] Error loading medical records:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveRecord() {
    try {
      await createMedicalRecord(formData)
      await loadData()
      setIsDialogOpen(false)
      setFormData({
        patient_id: "",
        staff_id: "",
        date: new Date().toISOString().split("T")[0],
        diagnosis: "",
        treatment: "",
        treatment_details: "",
        tooth_number: "",
        cost: 0,
      })
    } catch (error) {
      console.error("[v0] Error saving medical record:", error)
      alert("保存に失敗しました")
    }
  }

  const filteredRecords = records.filter(
    (record) =>
      record.patient?.name?.includes(searchTerm) ||
      record.patient?.patient_number?.includes(searchTerm) ||
      record.diagnosis?.includes(searchTerm) ||
      record.treatment?.includes(searchTerm),
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
        <div>
          <h1 className="text-2xl font-bold">カルテ</h1>
          <p className="text-gray-600 mt-1">診療記録の閲覧と管理</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          カルテ作成
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="search"
            placeholder="患者名、ID、診断名で検索..."
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
              <TableHead>日付</TableHead>
              <TableHead>患者ID</TableHead>
              <TableHead>患者名</TableHead>
              <TableHead>診断</TableHead>
              <TableHead>治療内容</TableHead>
              <TableHead>担当者</TableHead>
              <TableHead>費用</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  {searchTerm ? "該当するカルテが見つかりません" : "カルテデータがありません"}
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {record.date}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{record.patient?.patient_number || "-"}</TableCell>
                  <TableCell>{record.patient?.name || "-"}</TableCell>
                  <TableCell>{record.diagnosis}</TableCell>
                  <TableCell>{record.treatment}</TableCell>
                  <TableCell>{record.staff?.name || "-"}</TableCell>
                  <TableCell>¥{record.cost?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>カルテ作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>患者</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="患者を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id!}>
                        {patient.name} ({patient.patient_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>担当者</Label>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>日付</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>歯番号</Label>
                <Input
                  placeholder="例: 16"
                  value={formData.tooth_number}
                  onChange={(e) => setFormData({ ...formData, tooth_number: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>診断</Label>
              <Input
                placeholder="例: 虫歯（C2）"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />
            </div>
            <div>
              <Label>治療内容</Label>
              <Input
                placeholder="例: コンポジットレジン充填"
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              />
            </div>
            <div>
              <Label>治療詳細</Label>
              <Textarea
                placeholder="詳細な治療内容や経過を記載"
                value={formData.treatment_details}
                onChange={(e) => setFormData({ ...formData, treatment_details: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label>費用（円）</Label>
              <Input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSaveRecord}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
