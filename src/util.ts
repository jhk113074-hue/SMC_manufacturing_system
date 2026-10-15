import type { DB, Material, Recipe, SheetLot, Settings } from './types'

export const today = () => {
  const d = new Date()
  const z = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}

export const yymmdd = (iso: string) => iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10)

export const fmt = (n: number | null | undefined, d = 2) =>
  n === null || n === undefined || Number.isNaN(n) ? '-' : n.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d })

export const matOf = (db: DB, id: string): Material | undefined => db.materials.find((m) => m.id === id)
export const matLabel = (db: DB, id: string) => {
  const m = matOf(db, id)
  return m ? `${m.name} (${m.grade})` : '(삭제된 원재료)'
}

export const recipeName = (r: Recipe) => `${r.family} v${r.version}`
export const statusLabel = { draft: '초안', approved: '승인', retired: '폐기' } as const

export function nextLotNo(db: DB, date: string): string {
  const prefix = `${db.settings.siteCode}${yymmdd(date)}-`
  const used = [...db.runs.map((r) => r.lotNo), ...db.lots.map((l) => l.lotNo)].filter((x) => x.startsWith(prefix))
  const seq = used.reduce((mx, x) => Math.max(mx, parseInt(x.slice(prefix.length), 10) || 0), 0) + 1
  return prefix + String(seq).padStart(2, '0')
}

export function nextMixNo(db: DB, date: string): string {
  const prefix = `MX-${yymmdd(date)}-`
  const seq = db.mixOrders.filter((m) => m.no.startsWith(prefix)).length + 1
  return prefix + String(seq).padStart(2, '0')
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() !== day) d.setDate(0) // 엑셀 EDATE처럼 말일로 보정
  return d.toISOString()
}

export type LotState = '숙성중' | '사용가능' | '만료임박' | '만료' | '출고완료'
export function lotState(l: SheetLot, s: Settings, now = new Date()): { state: LotState; ageH: number; expiry: string } {
  const ageH = (now.getTime() - new Date(l.producedAt).getTime()) / 3.6e6
  const expiry = addMonths(l.producedAt, s.shelfMonths)
  const daysLeft = (new Date(expiry).getTime() - now.getTime()) / 8.64e7
  let state: LotState = '사용가능'
  if (l.released) state = '출고완료'
  else if (daysLeft < 0) state = '만료'
  else if (daysLeft <= 14) state = '만료임박'
  else if (ageH < s.matureMinH) state = '숙성중'
  return { state, ageH, expiry }
}

export const dateOnly = (iso: string) => iso.slice(0, 10)

export function download(name: string, text: string, mime = 'application/json') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: mime }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
