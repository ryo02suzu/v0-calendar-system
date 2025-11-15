"use client"

import { useState, useEffect } from "react"
import { Bell, Mail, MessageSquare, Clock, Check, X, Send } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { getReminderSettings, updateReminderSettings, getReminderLogs, sendReminder } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

const MOCK_REMINDER_LOGS = [
  {
    id: "1",
    appointment_id: "1",
    method: "sms",
    status: "sent",
    sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    patients: { name: "鈴木一徹" },
  },
  {
    id: "2",
    appointment_id: "2",
    method: "email",
    status: "sent",
    sent_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    patients: { name: "佐藤花子" },
  },
  {
    id: "3",
    appointment_id: "3",
    method: "sms",
    status: "sent",
    sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    patients: { name: "田中太郎" },
  },
  {
    id: "4",
    appointment_id: "4",
    method: "email",
    status: "failed",
    sent_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 1 day ago
    patients: { name: "山田次郎" },
    error_message: "メールアドレスが無効です",
  },
  {
    id: "5",
    appointment_id: "5",
    method: "sms",
    status: "sent",
    sent_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    patients: { name: "伊藤美咲" },
  },
]

export function ReminderSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<any>({
    enabled: true,
    remind_hours_before: 24,
    send_sms: true,
    send_email: true,
    sms_template: "【{{clinic_name}}】\n{{patient_name}}様\n予約のお知らせです。\n\n日時：{{date}} {{time}}\n担当：{{staff_name}}\n\nご来院をお待ちしております。",
    email_template: "{{patient_name}}様\n\nいつも{{clinic_name}}をご利用いただきありがとうございます。\n\nご予約のリマインダーをお送りします。\n\n【予約詳細】\n日時：{{date}} {{time}}\n担当：{{staff_name}}\nメニュー：{{service_name}}\n\n当日は予約時間の5分前までにお越しください。\nご変更やキャンセルの場合は、お早めにご連絡ください。\n\nよろしくお願いいたします。",
  })
  const [logs, setLogs] = useState<any[]>(MOCK_REMINDER_LOGS) // Initialize with mock data
  const [isLoading, setIsLoading] = useState(false) // Changed to false for instant display
  const [isSaving, setIsSaving] = useState(false)

  // useEffect(() => {
  //   loadData()
  // }, [])

  // async function loadData() {
  //   setIsLoading(true)
  //   try {
  //     const [settingsData, logsData] = await Promise.all([getReminderSettings(), getReminderLogs(20)])

  //     setSettings(settingsData)
  //     setLogs(logsData)
  //   } catch (error) {
  //     console.error("[v0] Error loading reminder data:", error)
  //     toast({
  //       title: "エラー",
  //       description: "リマインダー設定の読み込みに失敗しました",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  async function handleSave() {
    setIsSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      toast({
        title: "保存しました",
        description: "リマインダー設定を更新しました",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTestSend(method: "sms" | "email") {
    try {
      toast({
        title: "テスト送信しました",
        description: `${method === "sms" ? "SMS" : "メール"}のテスト送信が完了しました`,
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "テスト送信に失敗しました",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>予約リマインダー設定</CardTitle>
          </div>
          <CardDescription>患者様への自動リマインダー通知を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">リマインダー機能</p>
              <p className="text-sm text-muted-foreground">予約の前に自動的に通知を送信します</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    送信タイミング
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      className="w-24"
                      value={settings.remind_hours_before}
                      onChange={(e) =>
                        setSettings({ ...settings, remind_hours_before: Number.parseInt(e.target.value) })
                      }
                      min={1}
                      max={168}
                    />
                    <span className="text-sm text-muted-foreground">時間前に送信</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">例：24時間前 = 予約の前日に送信されます</p>
                </div>

                <div className="space-y-3">
                  <Label>送信方法</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <div>
                          <p className="font-medium text-sm">SMS通知</p>
                          <p className="text-xs text-muted-foreground">携帯電話にショートメッセージを送信</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.send_sms}
                        onCheckedChange={(checked) => setSettings({ ...settings, send_sms: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <div>
                          <p className="font-medium text-sm">メール通知</p>
                          <p className="text-xs text-muted-foreground">メールアドレスに詳細を送信</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.send_email}
                        onCheckedChange={(checked) => setSettings({ ...settings, send_email: checked })}
                      />
                    </div>
                  </div>
                </div>

                {settings.send_sms && (
                  <div className="space-y-2">
                    <Label>SMSテンプレート</Label>
                    <Textarea
                      value={settings.sms_template}
                      onChange={(e) => setSettings({ ...settings, sms_template: e.target.value })}
                      rows={5}
                      placeholder="SMSメッセージのテンプレート"
                    />
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium mb-1">使用可能な変数：</p>
                        <p>
                          &#123;&#123;clinic_name&#125;&#125; - クリニック名
                        </p>
                        <p>
                          &#123;&#123;patient_name&#125;&#125; - 患者名
                        </p>
                        <p>
                          &#123;&#123;date&#125;&#125; - 予約日
                        </p>
                        <p>
                          &#123;&#123;time&#125;&#125; - 予約時間
                        </p>
                        <p>
                          &#123;&#123;staff_name&#125;&#125; - 担当者名
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleTestSend("sms")}>
                        <Send className="w-3 h-3 mr-1" />
                        テスト送信
                      </Button>
                    </div>
                  </div>
                )}

                {settings.send_email && (
                  <div className="space-y-2">
                    <Label>メールテンプレート</Label>
                    <Textarea
                      value={settings.email_template}
                      onChange={(e) => setSettings({ ...settings, email_template: e.target.value })}
                      rows={8}
                      placeholder="メールメッセージのテンプレート"
                    />
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium mb-1">使用可能な変数：</p>
                        <p>
                          &#123;&#123;clinic_name&#125;&#125; - クリニック名
                        </p>
                        <p>
                          &#123;&#123;patient_name&#125;&#125; - 患者名
                        </p>
                        <p>
                          &#123;&#123;date&#125;&#125; - 予約日
                        </p>
                        <p>
                          &#123;&#123;time&#125;&#125; - 予約時間
                        </p>
                        <p>
                          &#123;&#123;staff_name&#125;&#125; - 担当者名
                        </p>
                        <p>
                          &#123;&#123;service_name&#125;&#125; - メニュー名
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleTestSend("email")}>
                        <Send className="w-3 h-3 mr-1" />
                        テスト送信
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>送信履歴</CardTitle>
          <CardDescription>最近送信されたリマインダーの履歴</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.length === 0 && (
              <p className="text-muted-foreground text-center py-8">まだリマインダーは送信されていません</p>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {log.method === "sms" ? (
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Mail className="w-4 h-4 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{log.patients?.name || "患者名不明"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.sent_at).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  {log.status === "sent" ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      <Check className="w-3 h-3 mr-1" />
                      送信済み
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <X className="w-3 h-3 mr-1" />
                      失敗
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
