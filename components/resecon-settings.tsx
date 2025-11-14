"use client"

import { useState, useEffect } from "react"
import { Building2, Database, Upload, TestTube2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getReseconSettings, updateReseconSettings, testReseconConnection } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

export function ReseconSettings() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [settings, setSettings] = useState({
    enabled: false,
    resecon_type: "ORCA",
    api_endpoint: "",
    api_key: "",
    csv_format: "standard",
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setIsLoading(true)
    try {
      const data = await getReseconSettings()
      setSettings(data)
    } catch (error) {
      console.error("[v0] Error loading resecon settings:", error)
      toast({
        title: "エラー",
        description: "設定の読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await updateReseconSettings(settings)
      toast({
        title: "保存しました",
        description: "レセコン連携設定を保存しました",
      })
    } catch (error) {
      console.error("[v0] Error saving resecon settings:", error)
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTestConnection() {
    if (!settings.api_endpoint || !settings.api_key) {
      toast({
        title: "入力エラー",
        description: "APIエンドポイントとAPIキーを入力してください",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)
    try {
      const result = await testReseconConnection(settings.api_endpoint, settings.api_key)
      setTestResult(result)
      if (result.success) {
        toast({
          title: "接続成功",
          description: result.message,
        })
      } else {
        toast({
          title: "接続失敗",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error testing connection:", error)
      setTestResult({ success: false, message: "接続テストに失敗しました" })
      toast({
        title: "エラー",
        description: "接続テストに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const needsApiConnection = ["ORCA", "デンタルX", "ハイシステム", "ノーザ（NOD）", "PowerChart"].includes(
    settings.resecon_type,
  )
  const needsCsvUpload = settings.resecon_type === "その他（CSV連携）"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <CardTitle>レセコン連携</CardTitle>
          </div>
          <CardDescription>歯科レセコンと予約システムを連携するか設定できます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div>
              <p className="font-medium">レセコン連携を有効化</p>
              <p className="text-sm text-gray-600 mt-1">連携をONにすると患者情報や予約データを同期できます</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <Label>レセコンの種類</Label>
                <Select
                  value={settings.resecon_type}
                  onValueChange={(value) => setSettings({ ...settings, resecon_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="レセコンを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORCA">ORCA（オルカ）</SelectItem>
                    <SelectItem value="デンタルX">デンタルX</SelectItem>
                    <SelectItem value="ハイシステム">ハイシステム</SelectItem>
                    <SelectItem value="ノーザ（NOD）">ノーザ（NOD）</SelectItem>
                    <SelectItem value="PowerChart">PowerChart</SelectItem>
                    <SelectItem value="その他（CSV連携）">その他（CSV連携）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">使用しているレセプトコンピュータを選択してください</p>
              </div>

              {needsApiConnection && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-base">API連携設定</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="api_endpoint">APIエンドポイント</Label>
                      <Input
                        id="api_endpoint"
                        type="url"
                        placeholder="https://api.example.com/v1"
                        value={settings.api_endpoint}
                        onChange={(e) => setSettings({ ...settings, api_endpoint: e.target.value })}
                      />
                      <p className="text-sm text-gray-600 mt-1">レセコンシステムのAPI URLを入力してください</p>
                    </div>
                    <div>
                      <Label htmlFor="api_key">APIキー</Label>
                      <Input
                        id="api_key"
                        type="password"
                        placeholder="••••••••••••••••"
                        value={settings.api_key}
                        onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                      />
                      <p className="text-sm text-gray-600 mt-1">レセコンシステムから発行されたAPIキー</p>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTesting || !settings.api_endpoint || !settings.api_key}
                        className="w-full sm:w-auto"
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            接続テスト中...
                          </>
                        ) : (
                          <>
                            <TestTube2 className="w-4 h-4 mr-2" />
                            接続テスト
                          </>
                        )}
                      </Button>

                      {testResult && (
                        <div
                          className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                            testResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                          }`}
                        >
                          {testResult.success ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                          <p className="text-sm">{testResult.message}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {needsCsvUpload && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-green-600" />
                      <CardTitle className="text-base">CSV連携設定</CardTitle>
                    </div>
                    <CardDescription>CSVファイルをアップロードしてデータを同期します</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-2">CSVファイルをドラッグ&amp;ドロップ</p>
                      <p className="text-xs text-gray-500 mb-3">または</p>
                      <Button variant="outline" size="sm">
                        ファイルを選択
                      </Button>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <p className="font-medium text-sm mb-2">CSVフォーマット要件：</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 1行目：ヘッダー行（患者ID, 氏名, フリガナ, 生年月日, 電話番号, 保険番号）</li>
                        <li>• 文字コード：UTF-8またはShift-JIS</li>
                        <li>• 日付形式：YYYY-MM-DD</li>
                        <li>• 最大行数：10,000行</li>
                      </ul>
                    </div>

                    <Button variant="outline" className="w-full sm:w-auto">
                      <Upload className="w-4 h-4 mr-2" />
                      サンプルCSVをダウンロード
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">💡 レセコン連携について</p>
                <p className="text-sm text-blue-800">
                  連携を有効にすると、患者情報や診療記録がレセコンシステムと自動的に同期されます。データの整合性を保つため、必ず接続テストを行ってから運用を開始してください。
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            "設定を保存"
          )}
        </Button>
      </div>
    </div>
  )
}
