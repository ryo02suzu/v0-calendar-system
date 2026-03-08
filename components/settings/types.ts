import type { Service, BusinessHours, Holiday, ClinicSettings, Staff } from "@/lib/types"

export type { Service, BusinessHours, Holiday, ClinicSettings, Staff }

export interface ClinicInfo {
  name: string
  phone: string
  email: string
  address: string
  description: string
}

export interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
}
