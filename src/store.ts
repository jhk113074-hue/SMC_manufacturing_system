import { useSyncExternalStore } from 'react'
import type { DB } from './types'
import { seedDB } from './data/seed'

const KEY = 'smc-db-v1'

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const s = seedDB()
      const pIds = new Set((parsed.products ?? []).map((x: { id: string }) => x.id))
      const rIds = new Set((parsed.recipes ?? []).map((x: { id: string }) => x.id))
      return {
        ...s,
        ...parsed,
        products: [...(parsed.products ?? []), ...s.products.filter((x) => !pIds.has(x.id))],
        recipes: [...(parsed.recipes ?? []), ...s.recipes.filter((x) => !rIds.has(x.id))],
        settings: { ...s.settings, ...(parsed.settings ?? {}) },
      }
    }
  } catch {
    /* 저장소를 못 쓰면 메모리로만 동작 */
  }
  return seedDB()
}

let db: DB = load()
const subs = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* ignore */
  }
}

export function getDB() {
  return db
}

/** 저장 + 감사 이력. audit가 있으면 변경 이력에 남긴다. */
export function update(fn: (d: DB) => DB, audit?: { action: string; detail: string }) {
  let next = fn(db)
  if (audit) {
    next = {
      ...next,
      audit: [
        { at: new Date().toISOString(), user: next.user || '(미입력)', ...audit },
        ...next.audit,
      ].slice(0, 1000),
    }
  }
  db = next
  persist()
  subs.forEach((f) => f())
}

export function useDB(): DB {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => db,
  )
}

export function exportJSON(): string {
  return JSON.stringify(db, null, 2)
}

export function importJSON(text: string) {
  const d = JSON.parse(text)
  if (!d || !Array.isArray(d.materials) || !Array.isArray(d.recipes)) throw new Error('올바른 백업 파일이 아닙니다.')
  const s = seedDB()
  update(() => ({ ...s, ...d, settings: { ...s.settings, ...(d.settings ?? {}) } }), { action: '백업 복원', detail: '백업 파일에서 복원' })
}

export function resetDB() {
  update(() => ({ ...seedDB(), user: db.user }), { action: '초기화', detail: '초기 데이터로 되돌림' })
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
