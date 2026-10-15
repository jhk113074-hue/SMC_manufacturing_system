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

  return (
    <>
      <div className="grid g2">
        <Card title="1. 처방과 생산 조건">
          <div className="grid g2">
            <Field label="처방">
              <select value={recipeId} onChange={(e) => { setRecipeId(e.target.value); setWidthMm(null); setAreal(null); setGfOverride(null) }}>
                {usable.map((r) => <option key={r.id} value={r.id}>{recipeName(r)} ({db.products.find((p) => p.id === r.productId)?.name})</option>)}
              </select>
            </Field>
            <Field label="라인 속도 (m/min)"><Num value={speed} onChange={setSpeed} /></Field>
            <Field label="제품 폭 (mm)" hint="비우면 제품 기본값"><Num value={input.widthMm} onChange={setWidthMm} /></Field>
            <Field label="목표 단중 (kg/m²)" hint="제품 기본값에서 가져옴"><Num value={input.arealKgM2} onChange={setAreal} /></Field>
            <Field label="유리섬유 함량 (%)" hint={`처방 값 ${fmt(gfRecipe * 100, 2)} %`}><Num value={Number((input.gf * 100).toFixed(4))} onChange={setGfOverride} /></Field>
            <Field label="페이스트 비중 (자동)"><b>{fmt(sg, 4)}</b></Field>
          </div>
          {recipe?.status === 'draft' && <Notice kind="warn">승인되지 않은 처방입니다.</Notice>}
        </Card>

        <Card title="2. 설비 값 (저장되어 다음에도 유지)">
          <div className="grid g2">
            <Field label="블레이드 두께 L (mm)"><Num value={m.bladeMm} onChange={(n) => setMachine({ bladeMm: n })} /></Field>
            <Field label="페이스트 점도 η (cps)"><Num value={m.viscosityCps} onChange={(n) => setMachine({ viscosityCps: n })} /></Field>
            <Field label="페이스트 높이 H (mm)"><Num value={m.pasteHeightMm} onChange={(n) => setMachine({ pasteHeightMm: n })} /></Field>
            <Field label="글라스 TEX">
              <select value={m.tex} onChange={(e) => setMachine({ tex: Number(e.target.value) })}>
                {[2400, 4400, 4800, 9600].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="컷팅 길이 (inch)">
              <select value={m.cutInch} onChange={(e) => setMachine({ cutInch: Number(e.target.value) })}>
                {[0.5, 1, 2].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <table style={{ marginTop: 10 }}>
            <thead><tr><th>컷터</th><th>사용</th><th className="r">공급 로빙 수</th><th className="r">블레이드 수</th></tr></thead>
            <tbody>
              {([0, 1] as const).map((i) => (
                <tr key={i}>
                  <td>{i + 1}번</td>
                  <td><input type="checkbox" checked={m.cutters[i].on} onChange={(e) => setCutter(i, { on: e.target.checked })} /></td>
                  <td className="r"><Num value={m.cutters[i].rovings} onChange={(n) => setCutter(i, { rovings: n })} width={70} /></td>
                  <td className="r"><Num value={m.cutters[i].blades} onChange={(n) => setCutter(i, { blades: n })} width={70} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card title="3. 계산 결과" right={<button className="btn pri" disabled={!out} onClick={save}>이 설정값 저장</button>}>
        {!v.ok && v.errors.map((e) => <Notice key={e} kind="bad">{e}</Notice>)}
        {out && (
          <>
            <div className="grid g4">
              <div className="kpi hot"><b>{fmt(out.Qm, 3)} kg/min</b><span>페이스트 토출 총량</span></div>
              <div className="kpi hot"><b>{fmt(out.boxGapMm, 3)} mm</b><span>닥터박스 1·2 갭 (각각)</span></div>
              <div className="kpi hot"><b>{out.cutterRpm.map((r) => (r === null ? 'OFF' : fmt(r, 1))).join(' / ')}</b><span>컷터 1 / 2 RPM</span></div>
              <div className="kpi"><b>{fmt(out.gapMm, 3)} mm</b><span>총 갭 h</span></div>
            </div>
            <h4>펌프 3계통 토출량</h4>
            <div className="grid g4">
              <div className="kpi"><b>{fmt(out.pumpA, 3)} kg/min</b><span>컴파운드(Paste A)</span></div>
              <div className="kpi"><b>{fmt(out.pumpMgO, 1)} g/min</b><span>증점제</span></div>
              <div className="kpi"><b>{fmt(out.pumpColor, 1)} g/min</b><span>조색제</span></div>
              <div className="kpi"><b>{fmt(out.QLmin, 3)} L/min</b><span>체적 유량</span></div>
            </div>
            <h4>검증</h4>
            <div className="row">
              <span>갭으로 역산한 단중 {fmt(out.backCalcKgM2, 4)} kg/m²</span>
              <span className={targetOk ? 'ok-text' : 'bad-text'}>{targetOk ? '목표 단중과 일치' : '목표 단중과 다름'}</span>
            </div>
            <div className="mute" style={{ marginTop: 6 }}>
              길이 1 m당 시트 {fmt(out.mSheet, 0)} g = 페이스트 {fmt(out.mPaste, 0)} g + 유리섬유 {fmt(out.mGlass, 0)} g · 끌림 유동이 총 유량의 {fmt(out.dragShare * 100, 1)} %를 차지하므로 속도·폭·단중이 바뀌면 갭을 다시 계산하세요. (엔진 {ENGINE_VERSION})
            </div>
          </>
        )}
      </Card>

      <Card title="저장된 설정값">
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
