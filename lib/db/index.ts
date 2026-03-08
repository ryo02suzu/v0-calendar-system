/**
 * lib/db/index.ts
 *
 * 全 DB モジュールの re-export。
 * `import { xxx } from "@/lib/db"` の後方互換性を維持するためにも使用。
 */

export * from "./utils"
export * from "./patients"
export * from "./staff"
export * from "./medical-records"
export * from "./services"
export * from "./appointments"
export * from "./business-hours"
export * from "./holidays"
export * from "./clinic-settings"
export * from "./notifications"
export * from "./resecon"
export * from "./reminder"
export * from "./waitlist"
export * from "./initialize"
