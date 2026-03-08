"use client"

import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Staff } from "./types"

interface StaffSettingsTabProps {
  staff: Staff[]
  editingStaff: Partial<Staff> | null
  setEditingStaff: (staff: Partial<Staff> | null) => void
  isStaffDialogOpen: boolean
  setIsStaffDialogOpen: (open: boolean) => void
  handleSaveStaff: () => void
  handleDeleteStaff: (id: string) => void
}

export function StaffSettingsTab({
  staff,
  editingStaff,
  setEditingStaff,
  isStaffDialogOpen,
  setIsStaffDialogOpen,
  handleSaveStaff,
  handleDeleteStaff,
}: StaffSettingsTabProps) {
  return (
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
                <div>
                  <Label>同時対応人数</Label>
                  <Select
                    value={String(editingStaff?.max_concurrent_appointments || 1)}
                    onValueChange={(v) =>
                      setEditingStaff({ ...editingStaff, max_concurrent_appointments: Number(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1人</SelectItem>
                      <SelectItem value="2">2人</SelectItem>
                      <SelectItem value="3">3人</SelectItem>
                      <SelectItem value="4">4人</SelectItem>
                      <SelectItem value="5">5人</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">このスタッフが同時に対応できる患者数</p>
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
  )
}
