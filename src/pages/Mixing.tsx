import { useState } from 'react'
import { Badge, Card, Field, Notice, Num } from '../ui'
import { update, uid, useDB } from '../store'
import { fmt, matLabel, matOf, nextMixNo, recipeName, today } from '../util'
import { scaleRecipe } from '../engine/calc'
import type { MatCat, MixOrder } from '../types'

export const MIX_STEPS: { n: number; name: string; cats: MatCat[]; rpm: string }[] = [
  { n: 1, name: 'STEP 1 메인 액상·저수축제 혼합', cats: ['resin', 'lpa', 'sm'], rpm: '400 RPM' },
  { n: 2, name: 'STEP 2 첨가제·중합금지제', cats: ['additive', 'inhibitor'], rpm: '400 RPM' },
  { n: 3, name: 'STEP 3 경화제 (투입 후 파우더 전 고속 교반)', cats: ['initiator'], rpm: '600 RPM' },
  { n: 4, name: 'STEP 4 내부이형제·PE 파우더', cats: ['release', 'pe'], rpm: '600 RPM' },
  { n: 5, name: 'STEP 5 충진제 (2~3회 분할 투입)', cats: ['filler'], rpm: '750~950 RPM · 45℃ 이상 금지' },
  { n: 6, name: 'STEP 6 증점제·조색제 (별도 계량)', cats: ['thickener', 'color'], rpm: '배합지시서 기준' },
]

export default function Mixing() {
  const db = useDB()
  const [openId, setOpenId] = useState<string>('')
  const usable = db.recipes.filter((r) => r.status !== 'retired')
  const [recipeId, setRecipeId] = useState(usable[0]?.id ?? '')
  const [resinKg, setResinKg] = useState(350)
  const [batches, setBatches] = useState(1)
  const [date, setDate] = useState(today())
  const order = db.mixOrders.find((o) => o.id === openId)
  const noUser = !db.user.trim()

  const create = () => {
    const r = db.recipes.find((x) => x.id === recipeId)
    if (!r) return
    const scaled = scaleRecipe(r.lines, db.materials, resinKg).filter((l) => matOf(db, l.materialId)?.cat !== 'glass')
    if (scaled.length === 0) return
    const o: MixOrder = {
      id: uid('x'), no: nextMixNo(db, date), date, recipeId, resinKg, batches,
      lines: scaled.map((l) => ({ materialId: l.materialId, planKg: l.kg * batches })),
      tempC: [], worker: db.user, status: 'issued', note: '',
    }
    update((d) => ({ ...d, mixOrders: [o, ...d.mixOrders] }), { action: '배합지시서 발행', detail: `${o.no} ${recipeName(r)} ×${batches}` })
    setOpenId(o.id)
  }

  const patch = (id: string, fn: (o: MixOrder) => MixOrder, audit?: { action: string; detail: string }) =>
    update((d) => ({ ...d, mixOrders: d.mixOrders.map((o) => (o.id === id ? fn(o) : o)) }), audit)

  const glassKg = (o: MixOrder) => {
    const r = db.recipes.find((x) => x.id === o.recipeId)
    if (!r) return 0
    return scaleRecipe(r.lines, db.materials, o.resinKg).filter((l) => matOf(db, l.materialId)?.cat === 'glass').reduce((s, l) => s + l.kg, 0) * o.batches
  }

  return (
    <>
      <Card title="새 배합지시서">
        <div className="grid g4">
          <Field label="처방">
            <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
              {usable.map((r) => <option key={r.id} value={r.id}>{recipeName(r)} [{db.products.find((p) => p.id === r.productId)?.name}] {r.status === 'draft' ? '(초안)' : ''}</option>)}
            </select>
          </Field>
          <Field label="1배치 수지 투입량 (kg)" hint="이 값으로 나머지 원재료가 phr대로 환산됩니다"><Num value={resinKg} onChange={setResinKg} /></Field>
          <Field label="배치 수"><Num value={batches} onChange={(n) => setBatches(Math.max(1, Math.round(n)))} /></Field>
          <Field label="작업일"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn pri" onClick={create} disabled={!recipeId || resinKg <= 0}>지시서 발행</button>
          {db.recipes.find((r) => r.id === recipeId)?.status === 'draft' && <Badge kind="warn">미승인 처방으로 발행됩니다</Badge>}
        </div>
      </Card>

      <Card title="발행된 지시서">
        {db.mixOrders.length === 0 ? <span className="mute">발행된 지시서가 없습니다.</span> : (
          <table>
            <thead><tr><th>번호</th><th>작업일</th><th>처방</th><th className="r">배치</th><th>상태</th><th></th></tr></thead>
            <tbody>
              {db.mixOrders.map((o) => {
                const r = db.recipes.find((x) => x.id === o.recipeId)
                return (
                  <tr key={o.id}>
                    <td>{o.no}</td><td>{o.date}</td><td>{r ? recipeName(r) : '-'}</td><td className="r">{o.batches}</td>
                    <td><Badge kind={o.status === 'done' ? 'ok' : o.status === 'mixing' ? 'info' : 'mute'}>{{ issued: '발행', mixing: '배합 중', done: '완료' }[o.status]}</Badge></td>
                    <td><button className="btn" onClick={() => setOpenId(o.id)}>열기</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {order && (() => {
        const r = db.recipes.find((x) => x.id === order.recipeId)
        const locked = order.status === 'done'
        const stepOf = (id: string) => MIX_STEPS.find((s) => s.cats.includes(matOf(db, id)?.cat as MatCat))?.n ?? 99
        const unsignedStep = Math.min(...order.lines.filter((l) => !l.signedAt).map((l) => stepOf(l.materialId)), 99)
        const allSigned = order.lines.every((l) => l.signedAt)
        const hot = (order.maxTempC ?? 0) >= db.settings.fillerTempMaxC
        const over = (order.maxRpm ?? 0) > db.settings.mixRpmMax
        const canFinish = allSigned && (order.initViscPs ?? 0) > 0 && (!hot || order.note.trim().length > 0)
        return (
          <section className="card printable">
            <header>
              <div className="row" style={{ gap: 10 }}>
                {db.settings.companyLogo && <img src={db.settings.companyLogo} alt="logo" style={{ height: 32, maxWidth: 110, objectFit: 'contain' }} />}
                <div>
                  <h3>배합 생산 지시서 {order.no}</h3>
                  <small className="mute">{db.settings.companyName}</small>
                </div>
              </div>
              <div className="row noprint">
                <button className="btn pri" onClick={() => window.print()}>🖨️ 지시서 인쇄</button>
                <button className="btn" onClick={() => setOpenId('')}>닫기</button>
              </div>
            </header>
            <div className="grid g4" style={{ marginBottom: 8 }}>
              <div><span className="mute">품명</span><br /><b>{db.products.find((p) => p.id === r?.productId)?.name}</b></div>
              <div><span className="mute">처방</span><br /><b>{r ? recipeName(r) : '-'}</b> {r?.status === 'draft' && <Badge kind="warn">미승인</Badge>}</div>
              <div><span className="mute">작업일 / 배치</span><br /><b>{order.date} / {order.batches} 배치</b></div>
              <div><span className="mute">필요 유리섬유(참고)</span><br /><b>{fmt(glassKg(order), 1)} kg</b></div>
            </div>
            {MIX_STEPS.map((st) => {
              const ls = order.lines.filter((l) => st.cats.includes(matOf(db, l.materialId)?.cat as MatCat))
              if (ls.length === 0) return null
              return (
                <div key={st.n} style={{ marginBottom: 8 }}>
                  <table>
                    <thead>
                      <tr className="step"><td colSpan={6}>{st.name} <span className="mute">· {st.rpm}</span></td></tr>
                      <tr><th>원재료</th><th className="r">지시량 (kg)</th><th className="r">실제 투입 (kg)</th><th className="r">차이</th><th>서명</th><th></th></tr>
                    </thead>
                    <tbody>
                      {ls.map((l) => {
                        const diff = (l.actualKg ?? 0) - l.planKg
                        const blockedByOrder = st.n > unsignedStep
                        return (
                          <tr key={l.materialId}>
                            <td>{matLabel(db, l.materialId)}</td>
                            <td className="r">{fmt(l.planKg, 2)}</td>
                            <td className="r">
                              <Num value={l.actualKg ?? 0} disabled={locked || !!l.signedAt} onChange={(n) => patch(order.id, (o) => ({ ...o, status: 'mixing', lines: o.lines.map((x) => (x.materialId === l.materialId ? { ...x, actualKg: n } : x)) }))} />
                            </td>
                            <td className={`r ${l.actualKg && Math.abs(diff / l.planKg) > 0.02 ? 'bad-text' : 'mute'}`}>{l.actualKg ? fmt(diff, 2) : '-'}</td>
                            <td>{l.signedAt ? `${l.signedBy} ${l.signedAt.slice(11, 16)}` : <span className="mute">미서명</span>}</td>
                            <td className="noprint">
                              {!l.signedAt && (
                                <button className="btn pri" disabled={locked || noUser || !(l.actualKg && l.actualKg > 0) || blockedByOrder}
                                  title={blockedByOrder ? '앞 단계 원재료를 먼저 서명하세요' : noUser ? '상단에 작업자 이름을 입력하세요' : ''}
                                  onClick={() => patch(order.id, (o) => ({ ...o, lines: o.lines.map((x) => (x.materialId === l.materialId ? { ...x, signedBy: db.user, signedAt: new Date().toISOString() } : x)) }), { action: '투입 서명', detail: `${order.no} ${matOf(db, l.materialId)?.grade} ${l.actualKg}kg` })}
                                >서명</button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}
            <div className="grid g4">
              <Field label="충진제 투입 중 최고 온도 (℃)"><Num value={order.maxTempC ?? 0} disabled={locked} onChange={(n) => patch(order.id, (o) => ({ ...o, maxTempC: n }))} /></Field>
              <Field label="최고 교반 RPM"><Num value={order.maxRpm ?? 0} disabled={locked} onChange={(n) => patch(order.id, (o) => ({ ...o, maxRpm: n }))} /></Field>
              <Field label="초기 점도 (PS)"><Num value={order.initViscPs ?? 0} disabled={locked} onChange={(n) => patch(order.id, (o) => ({ ...o, initViscPs: n }))} /></Field>
              <Field label="점도 측정 온도 (℃)"><Num value={order.initViscTempC ?? 0} disabled={locked} onChange={(n) => patch(order.id, (o) => ({ ...o, initViscTempC: n }))} /></Field>
            </div>
            {hot && <Notice kind="bad">충진제 투입 중 {db.settings.fillerTempMaxC}℃ 이상입니다. 냉각 조치 내용을 비고에 기록해야 완료할 수 있습니다.</Notice>}
            {over && <Notice kind="warn">교반 RPM이 최대 {db.settings.mixRpmMax} RPM을 넘었습니다.</Notice>}
            <Field label="비고·특이사항"><textarea value={order.note} disabled={locked} onChange={(e) => patch(order.id, (o) => ({ ...o, note: e.target.value }))} /></Field>
            <div className="row noprint" style={{ marginTop: 8 }}>
              <button className="btn pri" disabled={locked || !canFinish}
                onClick={() => patch(order.id, (o) => ({ ...o, status: 'done' }), { action: '배합 완료', detail: order.no })}>배합 완료 처리</button>
              {!locked && !canFinish && <span className="mute">완료 조건: 모든 원재료 서명, 초기 점도 입력{hot ? ', 고온 조치 기록' : ''}</span>}
              {locked && <Badge kind="ok">완료됨</Badge>}
            </div>
          </section>
        )
      })()}
    </>
  )
}
