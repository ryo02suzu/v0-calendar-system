"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell, Settings, User, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Notification {
  id: string
  type: string
  message: string
  payload?: {
    reservation_id?: string
    date?: string
    [key: string]: any
  }
  target_url?: string
  is_read: boolean
  created_at: string
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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

  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifications(true)
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const { data } = await response.json()
        setNotifications(data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch notifications:", error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showNotifications && notifications.length === 0 && !isLoadingNotifications) {
      fetchNotifications()
    }
  }, [showNotifications, notifications.length, isLoadingNotifications, fetchNotifications])

  const resolveTargetUrl = (notification: Notification): string => {
    // If explicit target_url exists, use it
    if (notification.target_url) {
      return notification.target_url
    }

    // If type is reservation-related and has reservation_id
    if (
      (notification.type === "reservation_created" || notification.type === "reservation_updated") &&
      notification.payload?.reservation_id
    ) {
      return `/reservations/${notification.payload.reservation_id}`
    }

    // If payload has date, go to calendar with date
    if (notification.payload?.date) {
      return `/calendar?date=${notification.payload.date}`
    }

    // Fallback to calendar
    return "/calendar"
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    )

    // Mark as read in background (fire and forget)
    fetch(`/api/notifications/${notification.id}/read`, {
      method: "PATCH",
    }).catch((error) => {
      console.error("[v0] Failed to mark notification as read:", error)
    })

    // Navigate to target
    const targetUrl = resolveTargetUrl(notification)
    router.push(targetUrl)
    
    // Close dropdown
    setShowNotifications(false)
  }

  const handleMarkAllRead = async () => {
    // Optimistically update UI
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

    // Mark all as read in background
    fetch("/api/notifications/read-all", {
      method: "POST",
    }).catch((error) => {
      console.error("[v0] Failed to mark all notifications as read:", error)
    })
  }

  const handleLogout = () => {
    console.log("logout")
  }

  const getRelativeTime = (timestamp: string): string => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "たった今"
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    return `${diffDays}日前`
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:global-search", { detail: { query } }))
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="search"
              placeholder="患者名、ID、電話番号で検索..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
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
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold">通知</h3>
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600" onClick={handleMarkAllRead}>
                    全て既読にする
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notif.is_read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notif.type}</p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{getRelativeTime(notif.created_at)}</p>
                        </div>
                        {!notif.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
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
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      router.push("/profile")
                      setShowUserMenu(false)
                    }}
                  >
                    プロフィール
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm text-red-600"
                    onClick={() => {
                      handleLogout()
                      setShowUserMenu(false)
                    }}
                  >
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
