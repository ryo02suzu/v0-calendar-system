"use client"

import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Reports() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">レポート</h1>
        <p className="text-gray-600 mt-1">クリニックの統計と分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の予約数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> 先月比
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新規患者数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> 先月比
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の売上</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥2,450,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15%</span> 先月比
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">キャンセル率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.2%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+1.2%</span> 先月比
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>治療内容別の予約数</CardTitle>
            <CardDescription>今月の治療タイプ別統計</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: "定期検診", count: 98, percentage: 40 },
                { type: "虫歯治療", count: 72, percentage: 29 },
                { type: "クリーニング", count: 45, percentage: 18 },
                { type: "矯正", count: 20, percentage: 8 },
                { type: "その他", count: 10, percentage: 5 },
              ].map((item) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-sm text-gray-600">{item.count}件</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>予約時間帯別の分布</CardTitle>
            <CardDescription>人気の時間帯</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "09:00 - 11:00", count: 65, percentage: 35 },
                { time: "11:00 - 13:00", count: 48, percentage: 26 },
                { time: "13:00 - 15:00", count: 32, percentage: 17 },
                { time: "15:00 - 17:00", count: 55, percentage: 30 },
                { time: "17:00 - 19:00", count: 45, percentage: 24 },
              ].map((item) => (
                <div key={item.time}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.time}</span>
                    <span className="text-sm text-gray-600">{item.count}件</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
