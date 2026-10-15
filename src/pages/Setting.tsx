import { useMemo, useState } from 'react'
import { Card, Field, Notice, Num } from '../ui'
import { update, uid, useDB } from '../store'
import { fmt, matOf, recipeName } from '../util'
import { ENGINE_VERSION, computeSetting, glassFraction, pasteSG, validateSetting } from '../engine/calc'
import type { SettingInput } from '../types'

export function recipeShares(db: ReturnType<typeof useDB>, recipeId: string) {
  const r = db.recipes.find((x) => x.id === recipeId)
  if (!r) return { mgo: 0, color: 0 }
  let sum = 0, mgo = 0, color = 0
  for (const l of r.lines) {
    const m = matOf(db, l.materialId)
    if (!m || m.cat === 'glass') continue
    sum += l.phr
    if (m.cat === 'thickener') mgo += l.phr
    if (m.cat === 'color') color += l.phr
  }
  return { mgo: sum ? mgo / sum : 0, color: sum ? color / sum : 0 }
}

const COMPARE_RECIPES: Record<string, { resin: number; lpa: number; sm: number; k972: number; k996: number; cba109: number; tbpb: number; cba308: number; fhp: number; hiflow: number; caco3: number; mgo: number; color: number; glass: number }> = {
  물탱크: { resin: 70, lpa: 30, sm: 7.5, k972: 1, k996: 1, cba109: 1.5, tbpb: 1.2, cba308: 1.5, fhp: 5, hiflow: 5, caco3: 170, mgo: 1.5, color: 4, glass: 148 },
  물탱크2: { resin: 70, lpa: 30, sm: 7.5, k972: 1, k996: 1, cba109: 1.7, tbpb: 1.2, cba308: 1.0, fhp: 5, hiflow: 5, caco3: 170, mgo: 2.2, color: 3.5, glass: 126 },
  YSACC1: { resin: 65, lpa: 35, sm: 7.0, k972: 1.2, k996: 0, cba109: 0.4, tbpb: 1.2, cba308: 0, fhp: 4, hiflow: 4, caco3: 185, mgo: 1.2, color: 1.1, glass: 132 },
  YSACC2: { resin: 66, lpa: 20, sm: 15.12, k972: 0.4, k996: 0, cba109: 1.3, tbpb: 1.0, cba308: 0, fhp: 5.75, hiflow: 6.5, caco3: 185, mgo: 3.8, color: 1.1, glass: 132 },
}

export default function Setting() {
  const db = useDB()
  const usable = db.recipes.filter((r) => r.status !== 'retired')
  const [recipeId, setRecipeId] = useState(usable[0]?.id ?? '')
  const recipe = db.recipes.find((r) => r.id === recipeId)
  const product = db.products.find((p) => p.id === recipe?.productId)

  const [speed, setSpeed] = useState(10)
  const [widthMm, setWidthMm] = useState<number | null>(null)
  const [areal, setAreal] = useState<number | null>(null)
  const [gfOverride, setGfOverride] = useState<number | null>(null)
  const [carrierFilmMm, setCarrierFilmMm] = useState(0.04)

  // 3rd Direct Roving & 4th Woven Roving from original .xlsm calculator
  const [directRovingOn, setDirectRovingOn] = useState(false)
  const [directRovingTex, setDirectRovingTex] = useState(4800)
  const [directRovingPcs, setDirectRovingPcs] = useState(48)
  const [wovenRovingOn, setWovenRovingOn] = useState(false)
  const [wovenRovingGm2, setWovenRovingGm2] = useState(580)

  // Section 6: Recipe vs Actual Log comparison state
  const [cmpFamily, setCmpFamily] = useState<'물탱크' | '물탱크2' | 'YSACC1' | 'YSACC2'>('물탱크')
  const [psFactor, setPsFactor] = useState(0.75)
  const [actualLog, setActualLog] = useState({
    resin: 350,
    lpa: 112.5,
    sm: 37.5,
    smExtra: 20,
    k972: 5,
    k996: 6.6,
    cba109: 8.5,
    tbpb: 6,
    cba308: 7.5,
    fhp: 25,
    hiflow: 20,
    caco3: 825,
    mgo: 14,
    color: 20,
    glass: 717.9224,
  })

  const m = db.machine
  const gfRecipe = recipe ? glassFraction(recipe.lines, db.materials) : 0
  const sg = recipe ? pasteSG(recipe.lines, db.materials) : 0
  const sh = recipeShares(db, recipeId)

  const input: SettingInput = {
    speed,
    widthMm: widthMm ?? product?.widthMm ?? 0,
    arealKgM2: areal ?? product?.arealKgM2 ?? 0,
    gf: (gfOverride ?? gfRecipe * 100) / 100,
    bladeMm: m.bladeMm,
    viscosityCps: m.viscosityCps,
    pasteHeightMm: m.pasteHeightMm,
    pasteSG: sg,
    tex: m.tex,
    cutInch: m.cutInch,
    cutters: m.cutters,
    mgoShare: sh.mgo,
    colorShare: sh.color,
  }
  const v = useMemo(() => validateSetting(input), [JSON.stringify(input)])
  const out = useMemo(() => computeSetting(input), [JSON.stringify(input)])

  const setMachine = (p: Partial<typeof m>) => update((d) => ({ ...d, machine: { ...d.machine, ...p } }))
  const setCutter = (i: 0 | 1, p: Partial<(typeof m.cutters)[0]>) =>
    update((d) => {
      const c = [...d.machine.cutters] as typeof d.machine.cutters
      c[i] = { ...c[i], ...p }
      return { ...d, machine: { ...d.machine, cutters: c } }
    })

  const save = () => {
    if (!out || !recipe) return
    update((d) => ({
      ...d,
      settingRuns: [{ id: uid('s'), at: new Date().toISOString(), by: d.user, recipeId, input, output: out, engine: ENGINE_VERSION }, ...d.settingRuns],
    }), { action: '설정값 저장', detail: `${recipeName(recipe)} 속도 ${speed} 갭 ${fmt(out.gapMm, 3)}mm` })
  }

  const targetOk = out && Math.abs(out.backCalcKgM2 - input.arealKgM2) < 1e-6

  // Detailed intermediate variables (from GRP_작업일지_개선_v6_1.xlsx & .xlsm)
  const wM = input.widthMm / 1000
  const v0Ms = input.speed / 60
  const hM = out ? out.gapMm / 1000 : 0
  const lM = input.bladeMm / 1000
  const etaPas = input.viscosityCps / 1000
  const H_m = input.pasteHeightMm / 1000
  const dpPa = sg * 1000 * 9.81 * H_m
  const dragTermM2s = (v0Ms * hM) / 2
  const pressTermM2s = out ? (Math.pow(hM, 3) / (12 * etaPas * lM)) * dpPa : 0
  const qM3s = (dragTermM2s + pressTermM2s) * wM
  const pCardano = out && out.A > 0 ? out.B / (3 * out.A) : 0
  const qCardano = out && out.A > 0 ? out.q / (2 * out.A) : 0
  const disc = Math.sqrt(qCardano * qCardano + Math.pow(pCardano, 3))
  const u1 = Math.cbrt(qCardano + disc)
  const u2 = Math.cbrt(Math.max(0, disc - qCardano))
  const gPerCut = (input.tex * (input.cutInch * 25.4)) / 1_000_000

  // 200x200mm specimen weight (from .xlsm Row 38~40)
  const spec200SmcG = (input.arealKgM2 * 1000) / 25
  const spec200GlassG = spec200SmcG * input.gf
  const spec200PasteG = spec200SmcG - spec200GlassG

  // 3rd Direct Roving & 4th Woven Roving (from .xlsm Row 51~62)
  const directRovingGm = directRovingOn ? (directRovingTex * 1000 / 1_000_000) * directRovingPcs : 0
  const wovenRovingGm = wovenRovingOn ? wovenRovingGm2 * wM : 0

  // Section 3: Material SG & Volume table for selected recipe
  const matBreakdown = useMemo(() => {
    if (!recipe) return { rows: [], pasteWt: 0, pasteVol: 0, totalWt: 0, totalVol: 0, pasteSg: 0, totalSg: 0 }
    const rows = recipe.lines.map((l) => {
      const mat = matOf(db, l.materialId)
      const density = mat?.density ?? 1
      const vol = density > 0 ? l.phr / density : 0
      return {
        id: l.materialId,
        name: mat?.name ?? l.materialId,
        grade: mat?.grade ?? '-',
        cat: mat?.cat ?? 'additive',
        phr: l.phr,
        density,
        vol,
      }
    })
    const pasteRows = rows.filter((r) => r.cat !== 'glass')
    const pasteWt = pasteRows.reduce((s, r) => s + r.phr, 0)
    const pasteVol = pasteRows.reduce((s, r) => s + r.vol, 0)
    const totalWt = rows.reduce((s, r) => s + r.phr, 0)
    const totalVol = rows.reduce((s, r) => s + r.vol, 0)
    return {
      rows,
      pasteWt,
      pasteVol,
      totalWt,
      totalVol,
      pasteSg: pasteVol > 0 ? pasteWt / pasteVol : 0,
      totalSg: totalVol > 0 ? totalWt / totalVol : 0,
    }
  }, [recipe, db.materials])

  // Section 6: Recipe vs Actual Log comparison
  const cmpBase = COMPARE_RECIPES[cmpFamily]
  const cmpScale = cmpBase.resin > 0 ? actualLog.resin / cmpBase.resin : 5

  return (
    <>
      <div className="grid g2">
        <Card title="1. 처방과 생산 조건 (작업일지 연동)">
          <div className="grid g2">
            <Field label="처방 선택">
              <select value={recipeId} onChange={(e) => { setRecipeId(e.target.value); setWidthMm(null); setAreal(null); setGfOverride(null) }}>
                {usable.map((r) => <option key={r.id} value={r.id}>{recipeName(r)} ({db.products.find((p) => p.id === r.productId)?.name})</option>)}
              </select>
            </Field>
            <Field label="라인 속도 V₀ (m/min)"><Num value={speed} onChange={setSpeed} /></Field>
            <Field label="제품 폭 w (mm)" hint="비우면 제품 기본값"><Num value={input.widthMm} onChange={setWidthMm} /></Field>
            <Field label="목표 단중 (kg/m²)" hint={`환산: ${fmt(input.arealKgM2 * 1000, 0)} g/m²`}><Num value={input.arealKgM2} onChange={setAreal} /></Field>
            <Field label="유리섬유 함량 (%)" hint={`처방 값 ${fmt(gfRecipe * 100, 2)} %`}><Num value={Number((input.gf * 100).toFixed(4))} onChange={setGfOverride} /></Field>
            <Field label="페이스트 비중 ρ (자동)" hint={`전체 SMC 비중: ${fmt(matBreakdown.totalSg, 4)} g/cm³`}>
              <b>{fmt(sg, 4)} g/cm³ ({fmt(sg * 1000, 1)} kg/m³)</b>
            </Field>
          </div>
          {recipe?.status === 'draft' && <Notice kind="warn">승인되지 않은 처방입니다.</Notice>}
        </Card>

        <Card title="2. 설비 파라미터 및 유리섬유 컷터 설정">
          <div className="grid g2">
            <Field label="블레이드 두께 L (mm)"><Num value={m.bladeMm} onChange={(n) => setMachine({ bladeMm: n })} /></Field>
            <Field label="페이스트 점도 η (cps)"><Num value={m.viscosityCps} onChange={(n) => setMachine({ viscosityCps: n })} /></Field>
            <Field label="페이스트 높이 H (mm)"><Num value={m.pasteHeightMm} onChange={(n) => setMachine({ pasteHeightMm: n })} /></Field>
            <Field label="캐리어 필름 두께 (mm)" hint="원본 계산기 기본값 0.04mm"><Num value={carrierFilmMm} onChange={setCarrierFilmMm} /></Field>
            <Field label="글라스 TEX (g/km)">
              <select value={m.tex} onChange={(e) => setMachine({ tex: Number(e.target.value) })}>
                {[2400, 4400, 4800, 9600].map((t) => <option key={t} value={t}>{t} TEX</option>)}
              </select>
            </Field>
            <Field label="컷팅 길이 (inch)" hint={`1회 절단당 1본 중량: ${fmt(gPerCut, 5)} g (${fmt(m.cutInch * 25.4, 1)} mm)`}>
              <select value={m.cutInch} onChange={(e) => setMachine({ cutInch: Number(e.target.value) })}>
                {[0.5, 1, 2].map((t) => <option key={t} value={t}>{t} inch</option>)}
              </select>
            </Field>
          </div>
          <table style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>구분</th>
                <th>사용 (ON/OFF)</th>
                <th className="r">공급 로빙 수 / 규격</th>
                <th className="r">블레이드 수</th>
                <th className="r">분담 유리중량 (g/m)</th>
              </tr>
            </thead>
            <tbody>
              {([0, 1] as const).map((i) => {
                const activeCount = (m.cutters[0].on ? 1 : 0) + (m.cutters[1].on ? 1 : 0)
                const remainGlass = Math.max(0, (out?.mGlass ?? 0) - directRovingGm - wovenRovingGm)
                const shareGm = m.cutters[i].on && activeCount > 0 ? remainGlass / activeCount : 0
                return (
                  <tr key={i}>
                    <td><b>{i + 1}번 로빙 컷터</b></td>
                    <td><input type="checkbox" checked={m.cutters[i].on} onChange={(e) => setCutter(i, { on: e.target.checked })} /></td>
                    <td className="r"><Num value={m.cutters[i].rovings} onChange={(n) => setCutter(i, { rovings: n })} width={70} /> 본</td>
                    <td className="r"><Num value={m.cutters[i].blades} onChange={(n) => setCutter(i, { blades: n })} width={70} /> 날</td>
                    <td className="r">{fmt(shareGm, 1)} g/m</td>
                  </tr>
                )
              })}
              <tr>
                <td>3번 다이렉트 로빙 <span className="mute">(옵션)</span></td>
                <td><input type="checkbox" checked={directRovingOn} onChange={(e) => setDirectRovingOn(e.target.checked)} /></td>
                <td className="r">
                  <Num value={directRovingTex} onChange={setDirectRovingTex} width={65} /> TEX × <Num value={directRovingPcs} onChange={setDirectRovingPcs} width={55} /> PCS
                </td>
                <td className="r mute">연속투입</td>
                <td className="r">{fmt(directRovingGm, 1)} g/m</td>
              </tr>
              <tr>
                <td>4번 직조 로빙 (Woven) <span className="mute">(옵션)</span></td>
                <td><input type="checkbox" checked={wovenRovingOn} onChange={(e) => setWovenRovingOn(e.target.checked)} /></td>
                <td className="r"><Num value={wovenRovingGm2} onChange={setWovenRovingGm2} width={70} /> g/m²</td>
                <td className="r mute">원단투입</td>
                <td className="r">{fmt(wovenRovingGm, 1)} g/m</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      <Card title="3. 핵심 계산 결과 (Doctor Blade 갭 · 펌프 3계통 · 시편 중량)" right={<button className="btn pri" disabled={!out} onClick={save}>이 설정값 저장</button>}>
        {!v.ok && v.errors.map((e) => <Notice key={e} kind="bad">{e}</Notice>)}
        {out && (
          <>
            <div className="grid g4">
              <div className="kpi hot"><b>{fmt(out.Qm, 3)} kg/min</b><span>★ 페이스트 토출 총량 (작업일지 연동)</span></div>
              <div className="kpi hot"><b>{fmt(out.boxGapMm, 3)} mm</b><span>닥터박스 1 · 2 갭 (각각)</span></div>
              <div className="kpi hot"><b>{out.cutterRpm.map((r) => (r === null ? 'OFF' : fmt(r, 1))).join(' / ')} RPM</b><span>컷터 1 / 2 회전수</span></div>
              <div className="kpi"><b>{fmt(out.gapMm, 3)} mm</b><span>총 갭 Height (h)</span></div>
            </div>

            <div className="grid g2" style={{ marginTop: 14 }}>
              <div>
                <h4>펌프 3계통 토출량 (작업일지 4번·5번 표 연동)</h4>
                <div className="grid g4">
                  <div className="kpi"><b>{fmt(out.pumpA, 3)} kg/min</b><span>컴파운드(Paste A) ({fmt((1 - sh.mgo - sh.color) * 100, 2)}%)</span></div>
                  <div className="kpi"><b>{fmt(out.pumpMgO, 1)} g/min</b><span>증점제(MgO) ({fmt(sh.mgo * 100, 3)}%)</span></div>
                  <div className="kpi"><b>{fmt(out.pumpColor, 1)} g/min</b><span>조색제(Color) ({fmt(sh.color * 100, 3)}%)</span></div>
                  <div className="kpi"><b>{fmt(out.QLmin, 3)} L/min</b><span>체적 유량 Q</span></div>
                </div>
              </div>
              <div>
                <h4>단위 면적(1m×1m) 및 200×200mm 시편 기준 중량 (.xlsm 연동)</h4>
                <div className="grid g4">
                  <div className="kpi"><b>{fmt(out.mSheet, 1)} g/m</b><span>시트 중량 (1m당)</span></div>
                  <div className="kpi"><b>{fmt(spec200SmcG, 1)} g</b><span>200×200mm SMC 시편</span></div>
                  <div className="kpi"><b>{fmt(spec200PasteG, 1)} g</b><span>200×200mm PASTE 중량</span></div>
                  <div className="kpi"><b>{fmt(spec200GlassG, 1)} g</b><span>200×200mm GLASS 중량</span></div>
                </div>
              </div>
            </div>

            <h4>4. Doctor Blade 유체역학 수식 및 카르다노 풀이 중간값 상세 (엑셀 Row 40~53 & .xlsm Row 16~36)</h4>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>파라미터 항목</th>
                    <th>기호 / 수식</th>
                    <th className="r">계산 결과값</th>
                    <th>단위</th>
                    <th>비고 / 물리적 의미</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>SMC 시트 중량 (길이 1m당)</td>
                    <td><code>단중 × 폭(m) × 1000</code></td>
                    <td className="r"><b>{fmt(out.mSheet, 2)}</b></td>
                    <td>g/m</td>
                    <td>1m×1m 환산 단중: {fmt(input.arealKgM2 * 1000, 1)} g/m²</td>
                  </tr>
                  <tr>
                    <td>페이스트 중량 (길이 1m당)</td>
                    <td><code>시트중량 × (1 - GF)</code></td>
                    <td className="r"><b>{fmt(out.mPaste, 2)}</b></td>
                    <td>g/m</td>
                    <td>1m×1m 환산 페이스트: {fmt(input.arealKgM2 * (1 - input.gf) * 1000, 1)} g/m²</td>
                  </tr>
                  <tr>
                    <td>유리섬유 중량 (길이 1m당)</td>
                    <td><code>시트중량 × GF</code></td>
                    <td className="r"><b>{fmt(out.mGlass, 2)}</b></td>
                    <td>g/m</td>
                    <td>1m×1m 환산 유리섬유: {fmt(input.arealKgM2 * input.gf * 1000, 1)} g/m²</td>
                  </tr>
                  <tr>
                    <td>폭 1m당 필요 체적 유량 (q)</td>
                    <td><code>Q / w</code></td>
                    <td className="r">{out.q.toExponential(6)}</td>
                    <td>m²/s</td>
                    <td>총 체적 유량 Q = {qM3s.toExponential(6)} m³/s ({fmt(out.QLmin, 4)} L/min)</td>
                  </tr>
                  <tr>
                    <td>정수압 (Hydrostatic Pressure Δp)</td>
                    <td><code>ρ · g · H (g = 9.81)</code></td>
                    <td className="r">{fmt(dpPa, 4)}</td>
                    <td>Pa</td>
                    <td>ρ = {fmt(sg * 1000, 2)} kg/m³, H = {fmt(H_m, 3)} m</td>
                  </tr>
                  <tr>
                    <td>압력 유동 계수 (A)</td>
                    <td><code>Δp / (12 · η · L)</code></td>
                    <td className="r">{fmt(out.A, 4)}</td>
                    <td>1/(m·s)</td>
                    <td>h³ 항 계수 (η = {fmt(etaPas, 2)} Pa·s, L = {fmt(lM, 4)} m)</td>
                  </tr>
                  <tr>
                    <td>끌림 유동 계수 (B)</td>
                    <td><code>V₀ / 2</code></td>
                    <td className="r">{fmt(out.B, 6)}</td>
                    <td>m/s</td>
                    <td>h 항 계수 (벨트 속도 V₀ = {fmt(v0Ms, 5)} m/s)</td>
                  </tr>
                  <tr>
                    <td>1. 끌림 유동 항 (Drag Flow Term)</td>
                    <td><code>(V₀ · h) / 2</code></td>
                    <td className="r">{dragTermM2s.toExponential(6)}</td>
                    <td>m²/s</td>
                    <td>전체 유량 중 끌림 유동 비중: <b>{fmt(out.dragShare * 100, 2)}%</b></td>
                  </tr>
                  <tr>
                    <td>2. 압력 유동 항 (Pressure Flow Term)</td>
                    <td><code>(h³ / (12 · η · L)) · Δp</code></td>
                    <td className="r">{pressTermM2s.toExponential(6)}</td>
                    <td>m²/s</td>
                    <td>전체 유량 중 압력 유동 비중: <b>{fmt((1 - out.dragShare) * 100, 2)}%</b></td>
                  </tr>
                  <tr>
                    <td>카르다노 3차 방정식 풀이 중간값 1, 2</td>
                    <td><code>A·h³ + B·h = q</code></td>
                    <td className="r">{(qCardano * qCardano).toExponential(4)} / {Math.pow(pCardano, 3).toExponential(4)}</td>
                    <td>-</td>
                    <td>u₁ = {fmt(u1 * 1000, 4)} mm, u₂ = {fmt(u2 * 1000, 4)} mm → h = u₁ - u₂ = <b>{fmt(out.gapMm, 4)} mm</b></td>
                  </tr>
                  <tr>
                    <td>검증: 갭(h)으로 역산한 단중</td>
                    <td><code>(Q·ρ / V₀) / (1 - GF) / w</code></td>
                    <td className="r"><b>{fmt(out.backCalcKgM2, 6)}</b></td>
                    <td>kg/m²</td>
                    <td><span className={targetOk ? 'ok-text' : 'bad-text'}>{targetOk ? '✓ 목표 단중과 완벽히 일치합니다' : '⚠ 목표 단중과 차이 발생'}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <div className="grid g2">
        <Card title="5. 원재료별 비중 · 부피(L) · 부피분율(Vol %) 상세 (설정값 계산 3번 표 & .xlsm 연동)">
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>원재료 (규격)</th>
                  <th className="r">투입량 (phr)</th>
                  <th className="r">중량비 (WT %)</th>
                  <th className="r">비중 (g/cm³)</th>
                  <th className="r">부피 (L)</th>
                  <th className="r">페이스트 Vol %</th>
                  <th className="r">SMC 전체 Vol %</th>
                </tr>
              </thead>
              <tbody>
                {matBreakdown.rows.map((r) => {
                  const isGlass = r.cat === 'glass'
                  return (
                    <tr key={r.id} style={isGlass ? { background: '#eff6ff', fontWeight: 600 } : undefined}>
                      <td>{r.name} ({r.grade})</td>
                      <td className="r">{fmt(r.phr, 2)}</td>
                      <td className="r">{fmt(matBreakdown.totalWt > 0 ? (r.phr / matBreakdown.totalWt) * 100 : 0, 2)}%</td>
                      <td className="r">{fmt(r.density, 3)}</td>
                      <td className="r">{fmt(r.vol, 2)}</td>
                      <td className="r">{isGlass ? '-' : `${fmt(matBreakdown.pasteVol > 0 ? (r.vol / matBreakdown.pasteVol) * 100 : 0, 2)}%`}</td>
                      <td className="r">{fmt(matBreakdown.totalVol > 0 ? (r.vol / matBreakdown.totalVol) * 100 : 0, 2)}%</td>
                    </tr>
                  )
                })}
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>페이스트 합계 (유리섬유 제외)</td>
                  <td className="r">{fmt(matBreakdown.pasteWt, 2)}</td>
                  <td className="r">{fmt(matBreakdown.totalWt > 0 ? (matBreakdown.pasteWt / matBreakdown.totalWt) * 100 : 0, 2)}%</td>
                  <td className="r">비중 {fmt(matBreakdown.pasteSg, 4)}</td>
                  <td className="r">{fmt(matBreakdown.pasteVol, 2)} L</td>
                  <td className="r">100.00%</td>
                  <td className="r">{fmt(matBreakdown.totalVol > 0 ? (matBreakdown.pasteVol / matBreakdown.totalVol) * 100 : 0, 2)}%</td>
                </tr>
                <tr style={{ background: '#eff6ff', fontWeight: 800 }}>
                  <td>SMC 전체 합계 (유리섬유 포함)</td>
                  <td className="r">{fmt(matBreakdown.totalWt, 2)}</td>
                  <td className="r">100.00%</td>
                  <td className="r">비중 {fmt(matBreakdown.totalSg, 4)}</td>
                  <td className="r">{fmt(matBreakdown.totalVol, 2)} L</td>
                  <td className="r">-</td>
                  <td className="r">100.00%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="6. 배합.xlsx 연동 — 배합표 권장값 vs 작업일지 실제값 비교 검증 (설정값 계산 6번 표)">
          <div className="grid g4" style={{ marginBottom: 10 }}>
            <Field label="기준 배합 선택">
              <select value={cmpFamily} onChange={(e) => setCmpFamily(e.target.value as typeof cmpFamily)}>
                <option value="물탱크">물탱크 (수지 70phr)</option>
                <option value="물탱크2">물탱크2 (수지 70phr)</option>
                <option value="YSACC1">YSACC1 (수지 65phr)</option>
                <option value="YSACC2">YSACC2 (수지 66phr)</option>
              </select>
            </Field>
            <Field label="선택 배합 수지 phr"><b>{cmpBase.resin} phr</b></Field>
            <Field label="배율 (실제 수지 ÷ 수지 phr)"><b>{fmt(cmpScale, 2)} 배</b></Field>
            <Field label="PS40 농도 보정계수" hint="112.5 = 150×0.75 (30/40)"><Num value={psFactor} onChange={setPsFactor} /></Field>
          </div>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>품목 (규격)</th>
                  <th className="r">배합표 phr</th>
                  <th className="r">권장 사용량(Kg)</th>
                  <th className="r">작업일지 실제(Kg)</th>
                  <th className="r">차이 (Kg)</th>
                  <th>비고 / 현장 메모</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { key: 'resin', label: '불포화수지 (SC-637S)', phr: cmpBase.resin, rec: cmpBase.resin * cmpScale, note: '배율 기준 원료' },
                  { key: 'lpa', label: '저수축제 (PS40)', phr: cmpBase.lpa, rec: cmpBase.lpa * cmpScale * psFactor, note: 'PS 농도 보정계수(0.75) 적용' },
                  { key: 'sm', label: '희석제 기본 (SM)', phr: cmpBase.sm, rec: cmpBase.sm * cmpScale, note: '추가분(3-2행) 아래 별도 표시' },
                  { key: 'k972', label: '첨가제 (K972)', phr: cmpBase.k972, rec: cmpBase.k972 * cmpScale, note: '' },
                  { key: 'k996', label: '첨가제 (K996)', phr: cmpBase.k996, rec: cmpBase.k996 * cmpScale, note: '' },
                  { key: 'cba109', label: '중합금지제 (CBA109N)', phr: cmpBase.cba109, rec: cmpBase.cba109 * cmpScale, note: '' },
                  { key: 'tbpb', label: '경화제 (TBPB)', phr: cmpBase.tbpb, rec: cmpBase.tbpb * cmpScale, note: '' },
                  { key: 'cba308', label: '초기증점조절제 (CBA308S)', phr: cmpBase.cba308, rec: cmpBase.cba308 * cmpScale, note: '배합표 메모: "초기증점조절제 1.3"' },
                  { key: 'fhp', label: '저수축제 (FHP)', phr: cmpBase.fhp, rec: cmpBase.fhp * cmpScale, note: '' },
                  { key: 'hiflow', label: '이형제 (HI-FLOW)', phr: cmpBase.hiflow, rec: cmpBase.hiflow * cmpScale, note: '' },
                  { key: 'caco3', label: '충진제 (CaCO3)', phr: cmpBase.caco3, rec: cmpBase.caco3 * cmpScale, note: '' },
                  { key: 'mgo', label: '증점제 (MGO-813)', phr: cmpBase.mgo, rec: cmpBase.mgo * cmpScale, note: '배합표 메모: "증점제는 2, 2.5파트로 한다"' },
                  { key: 'color', label: '조색제 (GRAY 9098)', phr: cmpBase.color, rec: cmpBase.color * cmpScale, note: '' },
                  { key: 'glass', label: '유리섬유 (4800TEX)', phr: cmpBase.glass, rec: cmpBase.glass * cmpScale, note: '' },
                ] as const).map((row) => {
                  const act = actualLog[row.key]
                  const diff = act - row.rec
                  return (
                    <tr key={row.key}>
                      <td>{row.label}</td>
                      <td className="r">{row.phr}</td>
                      <td className="r">{fmt(row.rec, 2)}</td>
                      <td className="r">
                        <Num
                          value={act}
                          width={75}
                          onChange={(n) => setActualLog((prev) => ({ ...prev, [row.key]: n }))}
                        />
                      </td>
                      <td className={`r ${Math.abs(diff) < 0.01 ? 'mute' : diff > 0 ? 'ok-text' : 'bad-text'}`}>
                        {diff > 0 ? `+${fmt(diff, 2)}` : fmt(diff, 2)}
                      </td>
                      <td className="mute" style={{ fontSize: 12 }}>{row.note}</td>
                    </tr>
                  )
                })}
                <tr style={{ background: '#fffbeb' }}>
                  <td>희석제 (SM, 3-2행 수동 추가분)</td>
                  <td className="r">-</td>
                  <td className="r">-</td>
                  <td className="r">
                    <Num value={actualLog.smExtra} width={75} onChange={(n) => setActualLog((p) => ({ ...p, smExtra: n }))} />
                  </td>
                  <td className="r ok-text">+{fmt(actualLog.smExtra, 1)}</td>
                  <td className="mute" style={{ fontSize: 12 }}>PS40 보정용 추가 희석제 (메모: "SM 3파트 추가")</td>
                </tr>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>희석제 (SM) 합계 비교</td>
                  <td className="r">{cmpBase.sm}</td>
                  <td className="r">{fmt(cmpBase.sm * cmpScale, 2)}</td>
                  <td className="r">{fmt(actualLog.sm + actualLog.smExtra, 2)}</td>
                  <td className="r ok-text">+{fmt(actualLog.sm + actualLog.smExtra - cmpBase.sm * cmpScale, 2)}</td>
                  <td className="mute" style={{ fontSize: 12 }}>권장(기본 SM만) vs 실제(기본+3-2행 추가분)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mute" style={{ fontSize: 12, marginTop: 8 }}>
            ※ 배합.xlsx 자체 메모: <code>"증점제는 2,2.5파트로 한다"</code> / <code>"초기증점조절제 1.3"</code> / <code>"SM 3파트추가"</code> — 현장에서 배합표 기준값을 일부 조정해 사용하고 있다는 근거입니다.
          </div>
        </Card>
      </div>

      <Card title="저장된 설정값 이력">
        {db.settingRuns.length === 0 ? <span className="mute">아직 저장한 계산이 없습니다. 저장하면 생산일지에서 불러옵니다.</span> : (
          <div className="scroll">
            <table>
              <thead><tr><th>시각</th><th>작성자</th><th>처방</th><th className="r">속도</th><th className="r">폭</th><th className="r">단중</th><th className="r">토출</th><th className="r">박스 갭</th><th>컷터 RPM</th></tr></thead>
              <tbody>
                {db.settingRuns.slice(0, 20).map((s) => (
                  <tr key={s.id}>
                    <td>{s.at.slice(0, 16).replace('T', ' ')}</td>
                    <td>{s.by || '-'}</td>
                    <td>{(() => { const r = db.recipes.find((x) => x.id === s.recipeId); return r ? recipeName(r) : '-' })()}</td>
                    <td className="r">{s.input.speed}</td><td className="r">{s.input.widthMm}</td><td className="r">{s.input.arealKgM2}</td>
                    <td className="r">{fmt(s.output.Qm, 3)}</td><td className="r">{fmt(s.output.boxGapMm, 3)}</td>
                    <td>{s.output.cutterRpm.map((r) => (r === null ? 'OFF' : fmt(r, 1))).join(' / ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
