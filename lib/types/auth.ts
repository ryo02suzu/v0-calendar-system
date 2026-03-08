export type UserRole = "admin" | "dentist" | "hygienist" | "receptionist" | "viewer"

export interface Permission {
  calendar: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  patients: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  records: { view: boolean; create: boolean; edit: boolean; delete: boolean }
  reports: { view: boolean }
  settings: { view: boolean; edit: boolean }
  staff: { view: boolean; create: boolean; edit: boolean; delete: boolean }
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin: {
    calendar: { view: true, create: true, edit: true, delete: true },
    patients: { view: true, create: true, edit: true, delete: true },
    records: { view: true, create: true, edit: true, delete: true },
    reports: { view: true },
    settings: { view: true, edit: true },
    staff: { view: true, create: true, edit: true, delete: true },
  },
  dentist: {
    calendar: { view: true, create: true, edit: true, delete: true },
    patients: { view: true, create: true, edit: true, delete: false },
    records: { view: true, create: true, edit: true, delete: false },
    reports: { view: true },
    settings: { view: true, edit: false },
    staff: { view: true, create: false, edit: false, delete: false },
  },
  hygienist: {
    calendar: { view: true, create: true, edit: true, delete: false },
    patients: { view: true, create: false, edit: false, delete: false },
    records: { view: true, create: true, edit: false, delete: false },
    reports: { view: false },
    settings: { view: false, edit: false },
    staff: { view: true, create: false, edit: false, delete: false },
  },
  receptionist: {
    calendar: { view: true, create: true, edit: true, delete: true },
    patients: { view: true, create: true, edit: true, delete: false },
    records: { view: false, create: false, edit: false, delete: false },
    reports: { view: true },
    settings: { view: true, edit: false },
    staff: { view: true, create: false, edit: false, delete: false },
  },
  viewer: {
    calendar: { view: true, create: false, edit: false, delete: false },
    patients: { view: true, create: false, edit: false, delete: false },
    records: { view: false, create: false, edit: false, delete: false },
    reports: { view: true },
    settings: { view: false, edit: false },
    staff: { view: false, create: false, edit: false, delete: false },
  },
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "管理者",
  dentist: "歯科医師",
  hygienist: "歯科衛生士",
  receptionist: "受付",
  viewer: "閲覧者",
}
