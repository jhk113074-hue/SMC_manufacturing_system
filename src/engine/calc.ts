import type { Material, RecipeLine, SettingInput, SettingOutput } from '../types'

export const ENGINE_VERSION = 'calc-1.0.0'
const G = 9.81

/** 유리섬유를 제외한 페이스트 비중(g/cm3) = Σm / Σ(m/ρ) */
export function pasteSG(lines: RecipeLine[], mats: Material[]): number {
  let m = 0
  let v = 0
  for (const l of lines) {
    const mat = mats.find((x) => x.id === l.materialId)
    if (!mat || mat.cat === 'glass' || l.phr <= 0 || mat.density <= 0) continue
    m += l.phr
    v += l.phr / mat.density
  }
  return v > 0 ? m / v : 0
}

export function glassFraction(lines: RecipeLine[], mats: Material[]): number {
  let glass = 0
  let total = 0
  for (const l of lines) {
    const mat = mats.find((x) => x.id === l.materialId)
    if (!mat) continue
    total += l.phr
    if (mat.cat === 'glass') glass += l.phr
  }
  return total > 0 ? glass / total : 0
}

/** 처방 원가(원/kg, 유리섬유 포함 전체 기준) */
export function recipeCostPerKg(lines: RecipeLine[], mats: Material[]): number {
  let cost = 0
  let total = 0
  for (const l of lines) {
    const mat = mats.find((x) => x.id === l.materialId)
    if (!mat) continue
    cost += l.phr * mat.price
    total += l.phr
  }
  return total > 0 ? cost / total : 0
}

/** A·h^3 + B·h = q 의 실근(카르단 공식). A,B > 0 이면 실근은 하나. 단위: m */
export function solveGapM(q: number, A: number, B: number): number {
  if (!(A > 0) || !(B > 0) || !(q > 0)) return 0
  const r2 = q / A / 2
  const p = B / A
  const s = Math.sqrt(r2 * r2 + Math.pow(p / 3, 3))
  return Math.cbrt(r2 + s) - Math.cbrt(s - r2)
}

export interface Validation { ok: boolean; errors: string[] }

export function validateSetting(i: SettingInput): Validation {
  const e: string[] = []
  if (!(i.speed > 0)) e.push('라인 속도는 0보다 커야 합니다.')
  if (!(i.widthMm > 0)) e.push('제품 폭은 0보다 커야 합니다.')
  if (!(i.arealKgM2 > 0)) e.push('목표 단중은 0보다 커야 합니다.')
  if (!(i.gf >= 0 && i.gf < 1)) e.push('유리섬유 함량은 0 이상 1 미만이어야 합니다.')
  if (!(i.bladeMm > 0)) e.push('블레이드 두께는 0보다 커야 합니다.')
  if (!(i.viscosityCps > 0)) e.push('페이스트 점도는 0보다 커야 합니다.')
  if (!(i.pasteHeightMm > 0)) e.push('페이스트 높이는 0보다 커야 합니다.')
  if (!(i.pasteSG > 0)) e.push('페이스트 비중을 계산할 수 없습니다. 처방을 확인하세요.')
  if (i.gf > 0 && !i.cutters.some((c) => c.on)) e.push('유리섬유가 있으면 컷터를 1대 이상 켜야 합니다.')
  for (const [n, c] of i.cutters.entries()) {
    if (c.on && (!(c.rovings > 0) || !(c.blades > 0))) e.push(`컷터 ${n + 1}의 로빙 수·블레이드 수를 입력하세요.`)
  }
  if (!(i.tex > 0) || !(i.cutInch > 0)) e.push('유리 TEX와 컷팅 길이를 입력하세요.')
  return { ok: e.length === 0, errors: e }
}

export function computeSetting(i: SettingInput): SettingOutput | null {
  if (!validateSetting(i).ok) return null
  const rho = i.pasteSG * 1000 // kg/m3
  const mSheet = i.widthMm * i.arealKgM2 // g/m (폭 mm × kg/m2 = g/m)
  const mPaste = mSheet * (1 - i.gf)
  const mGlass = mSheet * i.gf
  const Qm = (mPaste * i.speed) / 1000 // kg/min
  const QLmin = Qm / i.pasteSG
  const w = i.widthMm / 1000
  const q = QLmin / 60000 / w // m2/s
  const eta = i.viscosityCps / 1000
  const L = i.bladeMm / 1000
  const dp = rho * G * (i.pasteHeightMm / 1000)
  const A = dp / (12 * eta * L)
  const B = i.speed / 60 / 2
  const h = solveGapM(q, A, B)
  const gapMm = h * 1000
  const drag = B * h
  const dragShare = drag / (drag + A * h ** 3)
  // 검증 역산: 갭 → 단중
  const qBack = B * h + A * h ** 3
  const QLminBack = qBack * 60000 * w
  const QmBack = QLminBack * i.pasteSG
  const backKgM2 = QmBack / i.speed / (1 - i.gf) / w

  const gCut = (i.tex * 25.4 * i.cutInch) / 1e6
  const nOn = i.cutters.filter((c) => c.on).length
  const glassPerCutter = nOn > 0 ? mGlass / nOn : 0
  const cutterRpm = i.cutters.map((c) =>
    c.on && gCut > 0 ? (glassPerCutter * i.speed) / (gCut * c.rovings * c.blades) : null,
  )
  const pumpMgO = Qm * i.mgoShare * 1000
  const pumpColor = Qm * i.colorShare * 1000
  const pumpA = Qm * (1 - i.mgoShare - i.colorShare)

  return {
    mSheet, mPaste, mGlass, Qm, QLmin, q, A, B,
    gapMm, boxGapMm: gapMm / 2, backCalcKgM2: backKgM2, dragShare,
    cutterRpm, glassPerCutter, gCut, pumpA, pumpMgO, pumpColor,
  }
}

/** 처방 phr을 배치 수량으로 환산. resinKg: 불포화수지 기준 1배치 투입량 */
export function scaleRecipe(
  lines: RecipeLine[],
  mats: Material[],
  resinKg: number,
): { materialId: string; kg: number }[] {
  const resinLine = lines.find((l) => mats.find((m) => m.id === l.materialId)?.cat === 'resin')
  if (!resinLine || resinLine.phr <= 0) return []
  const k = resinKg / resinLine.phr
  return lines.filter((l) => l.phr > 0).map((l) => ({ materialId: l.materialId, kg: l.phr * k }))
}
