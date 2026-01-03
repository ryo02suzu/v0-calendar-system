"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, Briefcase, ArrowLeft } from "lucide-react"
import type { Staff } from "@/lib/types"

export default function ProfilePage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const response = await fetch("/api/staff")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "プロフィール情報の取得に失敗しました")
      }

      // TODO: Supabase Authのユーザー情報と照合して適切なスタッフを特定する
      // 現在は仮実装として最初のスタッフを使用
      const currentStaff = data.data?.[0]
      setStaff(currentStaff)
    } catch (err: any) {
      console.error("[Profile] Error loading profile:", err)
      setError(err.message || "プロフィールの読み込みに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{staff?.name || "ユーザー名"}</CardTitle>
                <CardDescription className="text-base">{getRoleLabel(staff?.role)}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  メールアドレス
                </Label>
                <p className="mt-1 text-lg">{staff?.email || "未設定"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  電話番号
                </Label>
                <p className="mt-1 text-lg">{staff?.phone || "未設定"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  役割
                </Label>
                <p className="mt-1 text-lg">{getRoleLabel(staff?.role)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">登録日</Label>
                <p className="mt-1 text-lg">
                  {staff?.created_at ? new Date(staff.created_at).toLocaleDateString("ja-JP") : "不明"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={() => router.push("/settings")} className="w-full sm:w-auto">
                設定を編集
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getRoleLabel(role?: string): string {
  if (!role) return "未設定"
  const roleMap: Record<string, string> = {
    doctor: "歯科医師",
    hygienist: "歯科衛生士",
    receptionist: "受付",
    admin: "管理者",
    歯科医師: "歯科医師",
    歯科衛生士: "歯科衛生士",
  }
  return roleMap[role] || role
}
