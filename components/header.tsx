"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Settings, User, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const notifications = [
    { id: 1, title: "新規予約", message: "田中太郎さんから予約が入りました", time: "5分前", read: false },
    { id: 2, title: "予約変更", message: "山田花子さんが予約を変更しました", time: "1時間前", read: false },
    { id: 3, title: "キャンセル", message: "佐藤次郎さんが予約をキャンセルしました", time: "2時間前", read: true },
  ]

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input type="search" placeholder="患者名、ID、電話番号で検索..." className="pl-10 w-full" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold">通知</h3>
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                    全て既読にする
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notif.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>

          <div className="relative" ref={userRef}>
            <Button variant="ghost" size="icon" onClick={() => setShowUserMenu(!showUserMenu)} className="rounded-full">
              <User className="w-5 h-5" />
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-semibold">今泉歯科クリニック</p>
                  <p className="text-sm text-gray-600">管理者</p>
                </div>
                <div className="p-2">
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    プロフィール
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    アカウント設定
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm text-red-600">
                    ログアウト
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
