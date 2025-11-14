"use client"

import { Calendar, Users, FileText, BarChart3, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  activeView: "calendar" | "patients" | "records" | "reports" | "settings"
  onViewChange: (view: "calendar" | "patients" | "records" | "reports" | "settings") => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: "calendar" as const, icon: Calendar, label: "カレンダー" },
    { id: "patients" as const, icon: Users, label: "患者一覧" },
    { id: "records" as const, icon: FileText, label: "カルテ" },
    { id: "reports" as const, icon: BarChart3, label: "レポート" },
    { id: "settings" as const, icon: Settings, label: "設定" },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">DentalFlow</h1>
        <p className="text-sm text-gray-600 mt-1">今泉歯科クリニック</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start mb-1"
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900">プロプラン</p>
          <p className="text-xs text-blue-700 mt-1">無制限の予約管理</p>
        </div>
      </div>
    </aside>
  )
}
