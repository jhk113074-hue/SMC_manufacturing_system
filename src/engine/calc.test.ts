import { describe, expect, it } from 'vitest'
import { computeSetting, pasteSG, solveGapM, validateSetting, recipeCostPerKg } from './calc'
import { SEED_MATERIALS, SEED_RECIPES } from '../data/seed'
import type { SettingInput } from '../types'

const caseA: SettingInput = {
  speed: 10, widthMm: 1100, arealKgM2: 4.6, gf: 0.33,
  bladeMm: 6, viscosityCps: 10000, pasteHeightMm: 50, pasteSG: 1.6254284658577733,
  tex: 4800, cutInch: 1,
  cutters: [{ on: true, rovings: 48, blades: 24 }, { on: true, rovings: 48, blades: 24 }],
  mgoShare: 14 / 1457.6, colorShare: 20 / 1457.6,
}
const caseB: SettingInput = {
  speed: 5, widthMm: 1000, arealKgM2: 4.0, gf: 0.4,
  bladeMm: 2.5, viscosityCps: 9000, pasteHeightMm: 50, pasteSG: 1.4618934255743825,
  tex: 4800, cutInch: 1,
  cutters: [{ on: true, rovings: 32, blades: 24 }, { on: true, rovings: 32, blades: 24 }],
  mgoShare: 0, colorShare: 0,
}

describe('엑셀 사례 A: 설정값 계산 시트(물탱크)', () => {
  const o = computeSetting(caseA)!
  it('토출 총량 33.902 kg/min', () => expect(o.Qm).toBeCloseTo(33.902, 3))
  it('체적 유량 20.857 L/min', () => expect(o.QLmin).toBeCloseTo(20.85727, 4))
  it('갭 3.31024 mm, 박스당 1.65512', () => {
    expect(o.gapMm).toBeCloseTo(3.3102437, 5)
    expect(o.boxGapMm).toBeCloseTo(1.6551218, 5)
  })
  it('컷터 RPM 59.4439', () => {
    expect(o.cutterRpm[0]).toBeCloseTo(59.44386, 3)
    expect(o.cutterRpm[1]).toBeCloseTo(59.44386, 3)
  })
  it('역산 단중이 목표와 일치', () => expect(o.backCalcKgM2).toBeCloseTo(4.6, 6))
  it('끌림 유동 비중 약 87%', () => expect(o.dragShare).toBeCloseTo(0.873, 3))
})

describe('엑셀 사례 B: Doctor Blade 계산기 40%-T1', () => {
  const o = computeSetting(caseB)!
  it('토출 12.0 kg/min', () => expect(o.Qm).toBeCloseTo(12, 6))
  it('갭이 Goal Seek 값 2.401090 과 일치', () => expect(o.gapMm).toBeCloseTo(2.40109, 5))
  it('컷터 RPM 42.719', () => expect(o.cutterRpm[0]).toBeCloseTo(42.7193, 3))
})

describe('방어', () => {
  it('점도 0이면 계산 거부', () => {
    expect(computeSetting({ ...caseA, viscosityCps: 0 })).toBeNull()
    expect(validateSetting({ ...caseA, viscosityCps: 0 }).errors.length).toBeGreaterThan(0)
  })
  it('GF 100% 거부', () => expect(computeSetting({ ...caseA, gf: 1 })).toBeNull())
  it('컷터 모두 OFF 거부', () =>
    expect(computeSetting({ ...caseA, cutters: [{ on: false, rovings: 0, blades: 0 }, { on: false, rovings: 0, blades: 0 }] })).toBeNull())
  it('해가 방정식을 만족', () => {
    const A = 1000, B = 0.08, q = 0.0003
    const h = solveGapM(q, A, B)
    expect(A * h ** 3 + B * h).toBeCloseTo(q, 12)
  })
})

describe('처방 시드', () => {
  const tank = SEED_RECIPES.find((r) => r.family === '물탱크')!
  it('물탱크 처방의 페이스트 비중은 엑셀 1.6277 근처', () =>
    expect(pasteSG(tank.lines, SEED_MATERIALS)).toBeCloseTo(1.6277, 3))
  it('물탱크 처방 원가는 엑셀 물탱크 배합 1,298 원/kg(1톤 기준) 근처', () =>
    expect(recipeCostPerKg(tank.lines, SEED_MATERIALS)).toBeGreaterThan(1250))
})
