"use client"

import { DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Service } from "./types"

interface ServicesSettingsTabProps {
  services: Service[]
  editingService: Partial<Service> | null
  setEditingService: (service: Partial<Service> | null) => void
  isServiceDialogOpen: boolean
  setIsServiceDialogOpen: (open: boolean) => void
  isSavingService: boolean
  handleSaveService: () => void
  handleDeleteService: (id: string) => void
}

export function ServicesSettingsTab({
  services,
  editingService,
  setEditingService,
  isServiceDialogOpen,
  setIsServiceDialogOpen,
  isSavingService,
  handleSaveService,
  handleDeleteService,
}: ServicesSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <CardTitle>診療メニュー・料金プラン</CardTitle>
          </div>
          <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingService({
                    name: "",
                    description: "",
                    duration: 30,
                    price: 0,
                    category: "一般歯科",
                    is_active: true,
                  })
                }}
              >
                メニュー追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingService?.id ? "メニュー編集" : "メニュー追加"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>メニュー名</Label>
                  <Input
                    value={editingService?.name || ""}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>説明</Label>
                  <Textarea
                    value={editingService?.description || ""}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>所要時間（分）</Label>
                    <Input
                      type="number"
                      value={editingService?.duration || 30}
                      onChange={(e) =>
                        setEditingService({ ...editingService, duration: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>料金（円）</Label>
                    <Input
                      type="number"
                      value={editingService?.price || 0}
                      onChange={(e) =>
                        setEditingService({ ...editingService, price: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>カテゴリー</Label>
                  <Select
                    value={editingService?.category || "一般歯科"}
                    onValueChange={(value) => setEditingService({ ...editingService, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="一般歯科">一般歯科</SelectItem>
                      <SelectItem value="審美歯科">審美歯科</SelectItem>
                      <SelectItem value="矯正歯科">矯正歯科</SelectItem>
                      <SelectItem value="小児歯科">小児歯科</SelectItem>
                      <SelectItem value="予防歯科">予防歯科</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingService?.is_active ?? true}
                    onCheckedChange={(checked) => setEditingService({ ...editingService, is_active: checked })}
                  />
                  <Label>有効</Label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveService} disabled={isSavingService}>
                  {isSavingService ? "保存中..." : "保存"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>患者予約ページに表示されるメニュー</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{service.name}</p>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{service.category}</span>
                  {!service.is_active && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">非表示</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {service.duration}分 / ¥{service.price.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingService(service)
                    setIsServiceDialogOpen(true)
                  }}
                >
                  編集
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeleteService(service.id)}>
                  削除
                </Button>
              </div>
            </div>
          ))}
          {services.length === 0 && <p className="text-gray-500 text-center py-8">メニューがありません</p>}
        </div>
      </CardContent>
    </Card>
  )
}
