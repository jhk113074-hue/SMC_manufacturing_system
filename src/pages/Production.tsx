import { useState } from 'react'
import { Badge, Card, Field, Notice, Num } from '../ui'
import { update, uid, useDB } from '../store'
import { fmt, matLabel, matOf, nextLotNo, recipeName, today } from '../util'
import { glassFraction } from '../engine/calc'
import type { ProductionRun, Roll } from '../types'

const VISC_LABELS = ['초기', '5분', '10분', '15분', '20분', '25분']
const PRESHIP: [string, string, string][] = [
  ['edge', '시트 가장자리', 'R/V 돌출 및 커팅 불량 없을 것'],
  ['tack', '시트 점착성', '필름을 벗길 때 너무 끈적거리지 않은가'],
  ['impreg', '표면 함침 상태', '육안상 함침이 미비한 곳이 없는가'],
  ['foreign', '이물질 혼입', '금속 및 기타 이물질 혼입 여부'],
  ['pack', '포장', '포장 상태는 양호한가'],
]

export default function Production() {
  const db = useDB()
  const [openId, setOpenId] = useState('')
  const [mixId, setMixId] = useState(db.mixOrders[0]?.id ?? '')
  const [settingId, setSettingId] = useState('')
  const [date, setDate] = useState(today())
  const [sampleTotal, setSampleTotal] = useState(0)
  const [samplePaste, setSamplePaste] = useState(0)
  const run = db.runs.find((r) => r.id === openId)
  const noUser = !db.user.trim()

  const create = () => {
    const mix = db.mixOrders.find((m) => m.id === mixId)
    if (!mix) return
    const recipe = db.recipes.find((r) => r.id === mix.recipeId)
    const product = db.products.find((p) => p.id === recipe?.productId)
    const st = db.settingRuns.find((s) => s.id === settingId)
    const r: ProductionRun = {
      id: uid('g'), date, productCode: product?.code ?? '', lotNo: nextLotNo(db, date), mixOrderId: mix.id, settingRunId: settingId,
      tempC: 0, humidity: 0, weather: '맑음', workers: 6, downtime: '', rolls: [],
      matLots: {}, actualUse: Object.fromEntries(mix.lines.map((l) => [l.materialId, l.actualKg ?? l.planKg])),
      viscosity: VISC_LABELS.map((label) => ({ label, ps: 0, tempC: 0 })),
      dischargeMeasured: { compound: 0, mgo: 0, color: 0 }, glassLots: '', glassRollKg: 0,
      preShip: {}, targetArealKgM2: st?.input.arealKgM2 ?? product?.arealKgM2 ?? 0, targetWidthMm: st?.input.widthMm ?? product?.widthMm ?? 0,
      targetThicknessMm: 0, notes: '', status: 'open',
    }
    update((d) => ({ ...d, runs: [r, ...d.runs] }), { action: '생산일지 작성', detail: `${r.lotNo} ${mix.no}` })
    setOpenId(r.id)
  }

  const patch = (id: string, fn: (r: ProductionRun) => ProductionRun, audit?: { action: string; detail: string }) =>
    update((d) => ({ ...d, runs: d.runs.map((r) => (r.id === id ? fn(r) : r)) }), audit)

  const mixRecipeIds = (mixIdv: string) => db.mixOrders.find((m) => m.id === mixIdv)?.recipeId
  const settingsForMix = db.settingRuns.filter((s) => s.recipeId === mixRecipeIds(mixId))

  return (
    <>
      <Card title="새 생산일지">
        {db.mixOrders.length === 0 ? <Notice kind="info">먼저 배합지시서를 발행하세요.</Notice> : (
          <div className="grid g4">
            <Field label="배합지시서">
              <select value={mixId} onChange={(e) => { setMixId(e.target.value); setSettingId('') }}>
                {db.mixOrders.map((m) => <option key={m.id} value={m.id}>{m.no} {m.status === 'done' ? '' : '(배합 미완료)'}</option>)}
              </select>
            </Field>
            <Field label="설정값 (저장한 계산)" hint="없으면 토출 목표가 비어 있습니다">
              <select value={settingId} onChange={(e) => setSettingId(e.target.value)}>
                <option value="">선택 안 함</option>
                {settingsForMix.map((s) => <option key={s.id} value={s.id}>{s.at.slice(5, 16).replace('T', ' ')} 속도 {s.input.speed} 단중 {s.input.arealKgM2}</option>)}
              </select>
            </Field>
            <Field label="생산일"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <div style={{ alignSelf: 'end' }}><button className="btn pri" onClick={create}>일지 작성 시작</button></div>
          </div>
        )}
      </Card>

      <Card title="생산일지 목록">
        {db.runs.length === 0 ? <span className="mute">작성된 일지가 없습니다.</span> : (
          <table>
            <thead><tr><th>LOT</th><th>생산일</th><th className="r">롤 수</th><th className="r">실중량 합 (kg)</th><th>상태</th><th></th></tr></thead>
            <tbody>
              {db.runs.map((r) => (
                <tr key={r.id}>
                  <td>{r.lotNo}</td><td>{r.date}</td><td className="r">{r.rolls.length}</td>
                  <td className="r">{fmt(r.rolls.reduce((s, x) => s + x.netKg, 0), 1)}</td>
                  <td><Badge kind={r.status === 'closed' ? 'ok' : 'info'}>{r.status === 'closed' ? '마감' : '작성 중'}</Badge></td>
                  <td><button className="btn" onClick={() => setOpenId(r.id)}>열기</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {run && (() => {
        const mix = db.mixOrders.find((m) => m.id === run.mixOrderId)
        const recipe = db.recipes.find((r) => r.id === mix?.recipeId)
        const st = db.settingRuns.find((s) => s.id === run.settingRunId)
        const locked = run.status === 'closed'
        const P = (fn: (r: ProductionRun) => ProductionRun) => patch(run.id, fn)
        const netSum = run.rolls.reduce((s, x) => s + x.netKg, 0)
        const grossSum = run.rolls.reduce((s, x) => s + x.grossKg, 0)
        const matKg = Object.values(run.actualUse).reduce((s, v) => s + v, 0)
        const inKg = matKg + run.glassRollKg
        const yieldPct = inKg > 0 ? (netSum / inKg) * 100 : 0
        const allOk = PRESHIP.every(([k]) => run.preShip[k] === 'ok')
        const canClose = run.rolls.length > 0 && netSum > 0 && allOk
        const judge = (x: Roll) => {
          const bad: string[] = []
          if (run.targetArealKgM2 > 0 && x.arealKgM2 > 0 && Math.abs(x.arealKgM2 - run.targetArealKgM2) > db.settings.arealTolKg) bad.push('단중')
          if (run.targetWidthMm > 0 && x.widthMm > 0 && Math.abs(x.widthMm - run.targetWidthMm) > db.settings.widthTolMm) bad.push('폭')
          if (run.targetThicknessMm > 0 && x.thicknessMm > 0 && Math.abs(x.thicknessMm - run.targetThicknessMm) > db.settings.thicknessTolMm) bad.push('두께')
          return bad
        }
        const addRoll = () => P((r) => ({
          ...r,
          rolls: [...r.rolls, { widthMm: st?.input.widthMm ?? r.targetWidthMm, speed: st?.input.speed ?? 0, db1: st ? Number(st.output.boxGapMm.toFixed(3)) : 0, db2: st ? Number(st.output.boxGapMm.toFixed(3)) : 0, cut1: Number((st?.output.cutterRpm[0] ?? 0).toFixed(1)), cut2: Number((st?.output.cutterRpm[1] ?? 0).toFixed(1)), arealKgM2: 0, thicknessMm: 0, impregPct: 0, grossKg: 0, netKg: 0, finalVisc: 0, note: '' }],
        }))
        const setRoll = (i: number, p: Partial<Roll>) => P((r) => ({ ...r, rolls: r.rolls.map((x, j) => (j === i ? { ...x, ...p } : x)) }))
        const diffPct = (m: number, t: number) => (t > 0 && m > 0 ? ((m - t) / t) * 100 : null)

        const close = () => {
          const producedAt = new Date(`${run.date}T${new Date().toTimeString().slice(0, 5)}:00`).toISOString()
          const gf = run.sampleGfPct ?? (recipe ? Number((glassFraction(recipe.lines, db.materials) * 100).toFixed(2)) : 0)
          update((d) => ({
            ...d,
            runs: d.runs.map((r) => (r.id === run.id ? { ...r, status: 'closed' } : r)),
            lots: [...d.lots, { id: uid('l'), lotNo: run.lotNo, runId: run.id, productCode: run.productCode, producedAt, gfPct: gf, grossKg: grossSum, netKg: netSum, released: false, note: '' }],
          }), { action: '생산일지 마감', detail: `${run.lotNo} 실중량 ${fmt(netSum, 1)}kg` })
        }

        return (
          <>
            <Card title={`생산일지 ${run.lotNo}`} right={<button className="btn" onClick={() => setOpenId('')}>닫기</button>}>
              <div className="grid g4">
                <Field label="제품 코드"><input value={run.productCode} disabled={locked} onChange={(e) => P((r) => ({ ...r, productCode: e.target.value }))} /></Field>
                <Field label="LOT"><b>{run.lotNo}</b></Field>
                <Field label="배합지시서">{mix?.no} {recipe ? `· ${recipeName(recipe)}` : ''}</Field>
                <Field label="생산일"><input type="date" value={run.date} disabled={locked} onChange={(e) => P((r) => ({ ...r, date: e.target.value }))} /></Field>
                <Field label="온도 (℃)"><Num value={run.tempC} disabled={locked} onChange={(n) => P((r) => ({ ...r, tempC: n }))} /></Field>
                <Field label="습도 (%)"><Num value={run.humidity} disabled={locked} onChange={(n) => P((r) => ({ ...r, humidity: n }))} /></Field>
                <Field label="날씨">
                  <select value={run.weather} disabled={locked} onChange={(e) => P((r) => ({ ...r, weather: e.target.value }))}>{['맑음', '흐림', '비', '눈'].map((w) => <option key={w}>{w}</option>)}</select>
                </Field>
                <Field label="작업 인원"><Num value={run.workers} disabled={locked} onChange={(n) => P((r) => ({ ...r, workers: n }))} /></Field>
                <Field label="목표 단중 (kg/m²)"><Num value={run.targetArealKgM2} disabled={locked} onChange={(n) => P((r) => ({ ...r, targetArealKgM2: n }))} /></Field>
                <Field label="목표 폭 (mm)"><Num value={run.targetWidthMm} disabled={locked} onChange={(n) => P((r) => ({ ...r, targetWidthMm: n }))} /></Field>
                <Field label="목표 두께 (mm)" hint="0이면 두께 판정 안 함"><Num value={run.targetThicknessMm} disabled={locked} onChange={(n) => P((r) => ({ ...r, targetThicknessMm: n }))} /></Field>
                <Field label="비가동·준비·청소 내역"><input value={run.downtime} disabled={locked} onChange={(e) => P((r) => ({ ...r, downtime: e.target.value }))} /></Field>
              </div>
              {mix?.status !== 'done' && <Notice kind="warn">연결된 배합지시서가 아직 완료되지 않았습니다.</Notice>}
            </Card>

            <Card title="원재료 투입량 (지시량 · 실사용량 · Lot)">
              <div className="scroll">
                <table>
                  <thead><tr><th>원재료</th><th className="r">지시량 (kg)</th><th className="r">실사용량 (kg)</th><th>원재료 Lot</th></tr></thead>
                  <tbody>
                    {mix?.lines.map((l) => (
                      <tr key={l.materialId}>
                        <td>{matLabel(db, l.materialId)}</td>
                        <td className="r">{fmt(l.planKg, 2)}</td>
                        <td className="r"><Num value={run.actualUse[l.materialId] ?? 0} disabled={locked} onChange={(n) => P((r) => ({ ...r, actualUse: { ...r.actualUse, [l.materialId]: n } }))} /></td>
                        <td><input value={run.matLots[l.materialId] ?? ''} disabled={locked} onChange={(e) => P((r) => ({ ...r, matLots: { ...r.matLots, [l.materialId]: e.target.value } }))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="점도 확인 (PS / ℃)">
              <div className="scroll">
                <table>
                  <thead><tr><th>구분</th>{run.viscosity.map((v) => <th key={v.label}>{v.label}</th>)}</tr></thead>
                  <tbody>
                    <tr><td>점도 (PS)</td>{run.viscosity.map((v, i) => <td key={i}><Num width={70} value={v.ps} disabled={locked} onChange={(n) => P((r) => ({ ...r, viscosity: r.viscosity.map((x, j) => (j === i ? { ...x, ps: n } : x)) }))} /></td>)}</tr>
                    <tr><td>온도 (℃)</td>{run.viscosity.map((v, i) => <td key={i}><Num width={70} value={v.tempC} disabled={locked} onChange={(n) => P((r) => ({ ...r, viscosity: r.viscosity.map((x, j) => (j === i ? { ...x, tempC: n } : x)) }))} /></td>)}</tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="토출량 확인 (목표는 저장한 설정값에서 자동)">
              {!st && <Notice kind="info">설정값을 연결하지 않아 목표가 없습니다. 설정값 계산 화면에서 저장한 뒤 새 일지에서 선택하세요.</Notice>}
              <table>
                <thead><tr><th>항목</th><th className="r">목표</th><th className="r">실측</th><th className="r">차이</th></tr></thead>
                <tbody>
                  {([['compound', '컴파운드 (kg/min)', st?.output.pumpA ?? 0], ['mgo', '증점제 (g/min)', st?.output.pumpMgO ?? 0], ['color', '조색제 (g/min)', st?.output.pumpColor ?? 0]] as const).map(([k, label, t]) => {
                    const m = run.dischargeMeasured[k]
                    const dp = diffPct(m, t)
                    return (
                      <tr key={k}>
                        <td>{label}</td><td className="r">{fmt(t, 3)}</td>
                        <td className="r"><Num value={m} disabled={locked} onChange={(n) => P((r) => ({ ...r, dischargeMeasured: { ...r.dischargeMeasured, [k]: n } }))} /></td>
                        <td className="r">{dp === null ? '-' : `${dp > 0 ? '+' : ''}${fmt(dp, 1)} %`}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>

            <Card title="롤별 생산 기록" right={!locked && <button className="btn pri" onClick={addRoll}>롤 추가 (설정값 자동 입력)</button>}>
              <div className="scroll">
                <table>
                  <thead>
                    <tr><th>No</th><th className="r">폭 (mm)</th><th className="r">속도</th><th className="r">D/B 1</th><th className="r">D/B 2</th><th className="r">컷터1</th><th className="r">컷터2</th><th className="r">단중</th><th className="r">두께</th><th className="r">함침 %</th><th className="r">총중량</th><th className="r">실중량</th><th className="r">말기점도</th><th>판정</th><th>비고</th><th></th></tr>
                  </thead>
                  <tbody>
                    {run.rolls.map((x, i) => {
                      const bad = judge(x)
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          {(['widthMm', 'speed', 'db1', 'db2', 'cut1', 'cut2', 'arealKgM2', 'thicknessMm', 'impregPct', 'grossKg', 'netKg', 'finalVisc'] as const).map((k) => (
                            <td key={k} className="r"><Num width={64} value={x[k]} disabled={locked} onChange={(n) => setRoll(i, { [k]: n })} /></td>
                          ))}
                          <td>{bad.length ? <Badge kind="bad">{bad.join('·')} 이탈</Badge> : x.arealKgM2 > 0 ? <Badge kind="ok">정상</Badge> : '-'}</td>
                          <td><input value={x.note} disabled={locked} onChange={(e) => setRoll(i, { note: e.target.value })} /></td>
                          <td>{!locked && <button className="btn dan" onClick={() => P((r) => ({ ...r, rolls: r.rolls.filter((_, j) => j !== i) }))}>삭제</button>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="grid g4" style={{ marginTop: 10 }}>
                <div className="kpi"><b>{fmt(grossSum, 1)} kg</b><span>총중량 합계</span></div>
                <div className="kpi"><b>{fmt(netSum, 1)} kg</b><span>실중량 합계</span></div>
                <div className="kpi"><b>{inKg > 0 ? `${fmt(yieldPct, 1)} %` : '-'}</b><span>생산 수율 (실중량 ÷ 투입 합계)</span></div>
              </div>
            </Card>

            <Card title="유리섬유 체크">
              <div className="grid g4">
                <Field label="유리섬유 Lot"><input value={run.glassLots} disabled={locked} onChange={(e) => P((r) => ({ ...r, glassLots: e.target.value }))} /></Field>
                <Field label="유리섬유 전체 사용량 (kg)"><Num value={run.glassRollKg} disabled={locked} onChange={(n) => P((r) => ({ ...r, glassRollKg: n }))} /></Field>
                <Field label="시료 전체 중량 (g)" hint="중량법: 전체 − 수지 = 유리섬유"><Num value={sampleTotal} onChange={setSampleTotal} /></Field>
                <Field label="시료 수지 중량 (g)"><Num value={samplePaste} onChange={setSamplePaste} /></Field>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                {sampleTotal > samplePaste && samplePaste > 0 ? (
                  <>
                    <span>실측 유리섬유 함량 <b>{fmt(((sampleTotal - samplePaste) / sampleTotal) * 100, 2)} %</b></span>
                    {!locked && <button className="btn" onClick={() => P((r) => ({ ...r, sampleGfPct: Number((((sampleTotal - samplePaste) / sampleTotal) * 100).toFixed(2)) }))}>일지에 기록</button>}
                  </>
                ) : <span className="mute">시료 중량을 입력하면 함량이 계산됩니다.</span>}
                {run.sampleGfPct !== undefined && <Badge kind="info">기록된 함량 {run.sampleGfPct} %</Badge>}
              </div>
            </Card>

            <Card title="출고 전 최종 품질 확인">
              <table>
                <thead><tr><th>점검 항목</th><th>관리 기준</th><th>결과</th></tr></thead>
                <tbody>
                  {PRESHIP.map(([k, name, std]) => (
                    <tr key={k}>
                      <td>{name}</td><td className="mute">{std}</td>
                      <td>
                        <select value={run.preShip[k] ?? ''} disabled={locked} onChange={(e) => P((r) => ({ ...r, preShip: { ...r.preShip, [k]: e.target.value as 'ok' | 'ng' | '' } }))}>
                          <option value="">미점검</option><option value="ok">합격</option><option value="ng">불합격</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="특이사항 및 조치">
              <textarea value={run.notes} disabled={locked} onChange={(e) => P((r) => ({ ...r, notes: e.target.value }))} />
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn pri" disabled={locked || !canClose || noUser} onClick={close}>일지 마감 · 로트 등록</button>
                {locked ? <Badge kind="ok">마감됨 (로트 등록 완료)</Badge> : <span className="mute">마감 조건: 롤 1개 이상(실중량 입력), 출고 전 5항목 모두 합격{noUser ? ', 작업자 이름' : ''}</span>}
              </div>
            </Card>
          </>
        )
      })()}
    </>
  )
}
