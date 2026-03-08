/**
 * lib/db.ts
 *
 * 後方互換性維持のためのファサード。
 * 実際の実装は lib/db/ ディレクトリの各モジュールに分割されています。
 * `import { xxx } from "@/lib/db"` は引き続き動作します。
 */
export * from "./db/index"
