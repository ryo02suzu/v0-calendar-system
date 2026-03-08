"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, FileText, BarChart3, Settings, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getClinic } from "@/lib/db"
import type { ViewType } from "@/lib/types"
import { usePermission } from "@/hooks/use-permission"
import type { Permission } from "@/lib/types/auth"

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [clinicName, setClinicName] = useState("今泉歯科クリニック")
  const { hasPermission } = usePermission()

  useEffect(() => {
    const fetchClinicName = async () => {
      try {
        const clinic = await getClinic()
        if (clinic?.name) {
          setClinicName(clinic.name)
        }
      } catch (error) {
        console.error("Failed to fetch clinic name:", error)
      }
    }
    fetchClinicName()
  }, [])

  const menuItems: Array<{
    id: ViewType
    icon: React.ElementType
    label: string
    resource: keyof Permission
    action: string
  }> = [
    { id: "dashboard", icon: LayoutDashboard, label: "ダッシュボード", resource: "calendar", action: "view" },
    { id: "calendar", icon: Calendar, label: "カレンダー", resource: "calendar", action: "view" },
    { id: "patients", icon: Users, label: "患者一覧", resource: "patients", action: "view" },
    { id: "records", icon: FileText, label: "カルテ", resource: "records", action: "view" },
    { id: "reports", icon: BarChart3, label: "レポート", resource: "reports", action: "view" },
    { id: "settings", icon: Settings, label: "設定", resource: "settings", action: "view" },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">DentalFlow</h1>
        <p className="text-sm text-gray-600 mt-1">{clinicName}</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          if (!hasPermission(item.resource, item.action)) return null
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
