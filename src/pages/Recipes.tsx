import { useState } from 'react'
import { Badge, Card, Field, Notice, Num } from '../ui'
import { update, uid, useDB } from '../store'
import { fmt, matLabel, matOf, recipeName, statusLabel } from '../util'
import { glassFraction, pasteSG, recipeCostPerKg } from '../engine/calc'
import type { DB, Product, Recipe } from '../types'

function summary(db: DB, r: Recipe) {
  const total = r.lines.reduce((s, l) => s + l.phr, 0)
  return {
    total,
    gf: glassFraction(r.lines, db.materials),
    sg: pasteSG(r.lines, db.materials),
    cost: recipeCostPerKg(r.lines, db.materials),
  }
}

interface CostRow {
  name: string
  price: number
  sg: number
  wt1: number
  wt2: number
  ys1: number
  ys2: number
  wt7: number
}

const EXCEL_COST_ROWS: CostRow[] = [
  { name: '불포화수지', price: 2700, sg: 1.1, wt1: 70, wt2: 70, ys1: 65, ys2: 66, wt7: 490 },
  { name: '저수축제', price: 2500, sg: 1.0, wt1: 30, wt2: 30, ys1: 35, ys2: 20, wt7: 210 },
  { name: 'K972(분리방지제)', price: 22500, sg: 1.02, wt1: 1, wt2: 1, ys1: 1.2, ys2: 0.4, wt7: 3.5 },
  { name: 'K996(분산제)', price: 15300, sg: 1.04, wt1: 1, wt2: 1, ys1: 0, ys2: 0, wt7: 10.5 },
  { name: 'SM(희석제)', price: 3600, sg: 0.91, wt1: 7.5, wt2: 7.5, ys1: 7, ys2: 15.12, wt7: 7.8 },
  { name: 'CBA109N(중합방지제)', price: 4100, sg: 0.91, wt1: 1.5, wt2: 1.7, ys1: 0.4, ys2: 1.3, wt7: 1.7 },
  { name: 'T-BPB(경화제)', price: 6000, sg: 1.04, wt1: 1.2, wt2: 1.2, ys1: 1.2, ys2: 1.0, wt7: 1.0 },
  { name: '개시제 보조제(8400단가)', price: 8400, sg: 1.0, wt1: 0, wt2: 0, ys1: 0.5, ys2: 0.5, wt7: 0 },
  { name: 'CBA-307F{초기증점 조절제}', price: 0, sg: 0.98, wt1: 1.5, wt2: 1.0, ys1: 0, ys2: 0, wt7: 1.5 },
  { name: 'FHP05040 (PE 파우더)', price: 4000, sg: 0.96, wt1: 5, wt2: 5, ys1: 4, ys2: 5.75, wt7: 5 },
  { name: 'ZN-ST(내부이형제)', price: 3500, sg: 1.1, wt1: 5, wt2: 5, ys1: 4, ys2: 6.5, wt7: 6.5 },
  { name: 'CaCO3(충진제)', price: 100, sg: 2.7, wt1: 170, wt2: 170, ys1: 185, ys2: 185, wt7: 185 },
  { name: 'CBU-813(증점제)', price: 5360, sg: 1.5, wt1: 1.5, wt2: 2.2, ys1: 1.2, ys2: 3.8, wt7: 18.76 },
  { name: '조색제', price: 5149, sg: 2.05, wt1: 4, wt2: 3.5, ys1: 1.1, ys2: 1.1, wt7: 17.5 },
  { name: '유리섬유', price: 1050, sg: 2.54, wt1: 148, wt2: 126, ys1: 132, ys2: 132, wt7: 132 },
]

export default function Recipes() {
  const db = useDB()
  const [subTab, setSubTab] = useState<'manage' | 'costSheet'>('manage')
  const [sel, setSel] = useState<string>(db.recipes[0]?.id ?? '')
  const [reason, setReason] = useState('')
  const [costCol, setCostCol] = useState<'wt1' | 'wt2' | 'ys1' | 'ys2' | 'wt7'>('wt1')
  const [targetKgMap, setTargetKgMap] = useState({ wt1: 1120, wt2: 609, ys1: 2500, ys2: 2300, wt7: 3185 })
  const [monthlyProdKg, setMonthlyProdKg] = useState(200000)
  const [workers, setWorkers] = useState(6)
  const [hoursPerMonth, setHoursPerMonth] = useState(198)
  const [hourlyWage, setHourlyWage] = useState(4000)
  const [smallBatchFee, setSmallBatchFee] = useState(0)

  const recipe = db.recipes.find((r) => r.id === sel)
  const product = db.products.find((p) => p.id === recipe?.productId)
  const noUser = !db.user.trim()

  const patchRecipe = (id: string, fn: (r: Recipe) => Recipe, action: string, detail: string) =>
    update((d) => ({ ...d, recipes: d.recipes.map((r) => (r.id === id ? fn(r) : r)) }), { action, detail })

  const newProduct = () => {
    const id = uid('p')
    update((d) => ({ ...d, products: [...d.products, { id, code: 'NEW-CODE', name: '새 제품', arealKgM2: 4, widthMm: 1000, note: '' }] }), { action: '제품 추가', detail: '새 제품' })
  }
  const patchProduct = (id: string, p: Partial<Product>) =>
    update((d) => ({ ...d, products: d.products.map((x) => (x.id === id ? { ...x, ...p } : x)) }))

  const newRecipe = (productId: string, copyFrom?: Recipe) => {
    const id = uid('r')
    const family = copyFrom ? `${copyFrom.family} (복사)` : '새 처방'
    const lines = copyFrom
      ? copyFrom.lines.map((l) => ({ ...l }))
      : db.materials.filter((m) => m.cat === 'resin' || m.cat === 'glass').map((m) => ({ materialId: m.id, phr: m.cat === 'resin' ? 100 : 0 }))
    update((d) => ({
      ...d,
      recipes: [...d.recipes, { id, productId, family, version: 1, status: 'draft', reason: copyFrom ? `${recipeName(copyFrom)} 복사` : '신규 작성', createdAt: new Date().toISOString(), lines }],
    }), { action: '처방 추가', detail: family })
    setSel(id)
  }

  const newVersion = (r: Recipe) => {
    const maxV = Math.max(...db.recipes.filter((x) => x.family === r.family && x.productId === r.productId).map((x) => x.version))
    const id = uid('r')
    update((d) => ({
      ...d,
      recipes: [...d.recipes, { ...r, id, version: maxV + 1, status: 'draft', reason: reason || '(사유 입력 필요)', approvedBy: undefined, approvedAt: undefined, createdAt: new Date().toISOString(), lines: r.lines.map((l) => ({ ...l })) }],
    }), { action: '처방 새 버전', detail: `${r.family} v${maxV + 1}: ${reason}` })
    setSel(id)
    setReason('')
  }

  const prev = recipe
    ? db.recipes.filter((x) => x.family === recipe.family && x.productId === recipe.productId && x.version < recipe.version).sort((a, b) => b.version - a.version)[0]
    : undefined

  const editable = recipe?.status === 'draft'
  const usableMats = db.materials.filter((m) => !recipe?.lines.some((l) => l.materialId === m.id))

  // Cost Sheet calculations
  const yieldFactor = costCol === 'ys1' || costCol === 'ys2' ? 0.98 : 1.0
  const targetBatchKg = targetKgMap[costCol]
  const totalBatch = EXCEL_COST_ROWS.reduce((s, r) => s + r[costCol], 0)
  const pasteBatch = EXCEL_COST_ROWS.slice(0, -1).reduce((s, r) => s + r[costCol], 0)
  const resinPlusLpa = EXCEL_COST_ROWS[0][costCol] + EXCEL_COST_ROWS[1][costCol]
  const totalVol = EXCEL_COST_ROWS.reduce((s, r) => s + r[costCol] / r.sg, 0)
  const pasteVol = EXCEL_COST_ROWS.slice(0, -1).reduce((s, r) => s + r[costCol] / r.sg, 0)
  const totalSg = totalBatch / totalVol
  const compSg = pasteBatch / pasteVol
  const oneTonTotal = 1000 / yieldFactor
  const rawCostPerKg = EXCEL_COST_ROWS.reduce((s, r) => {
    const oneTonKg = (r[costCol] / totalBatch) * oneTonTotal
    return s + (r.price * oneTonKg) / 1000
  }, 0)

  const subMatCost = 36.83 + 4 + 1 // 41.83
  const totalWage = hoursPerMonth * hourlyWage * workers
  const laborCostPerKg = monthlyProdKg > 0 ? totalWage / monthlyProdKg : 0
  const mfgItems = [
    { name: '전기료, 난방비', monthly: 5000000 },
    { name: '폐자재비', monthly: 1800000 },
    { name: '환경부담비', monthly: 3300000 },
    { name: '보수유지비', monthly: 3300000 },
    { name: '시트설비감가비', monthly: 5000000 },
  ]
  const mfgCostPerKg = mfgItems.reduce((s, x) => s + (monthlyProdKg > 0 ? x.monthly / monthlyProdKg : 0), 0)
  const grandTotalCost = rawCostPerKg + subMatCost + laborCostPerKg + mfgCostPerKg + smallBatchFee

  return (
    <>
      <div className="row noprint" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="seg-tabs">
          <button className={subTab === 'manage' ? 'on' : ''} onClick={() => setSubTab('manage')}>
            1. 제품·처방 마스터 (전 처방 9종 관리)
          </button>
          <button className={subTab === 'costSheet' ? 'on' : ''} onClick={() => setSubTab('costSheet')}>
            2. 물탱크 배합 원가계산서 (엑셀 원본 통합 시트)
          </button>
        </div>
        {subTab === 'costSheet' && (
          <button className="btn pri" onClick={() => window.print()}>🖨️ 원가계산서 인쇄</button>
        )}
      </div>

      {subTab === 'manage' && (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(260px,320px) 1fr', alignItems: 'start' }}>
          <div>
            <Card title="제품과 처방 (엑셀 9종 전체 수록)" right={<button className="btn pri" onClick={newProduct}>제품 추가</button>}>
              {db.products.map((p) => (
                <div key={p.id} style={{ marginBottom: 14 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <b>{p.name}</b>
                    <button className="btn" onClick={() => newRecipe(p.id)}>새 처방</button>
                  </div>
                  <div className="mute" style={{ fontSize: 12, marginBottom: 4 }}>{p.code} · 단중 {p.arealKgM2} kg/m² · 폭 {p.widthMm} mm</div>
                  {db.recipes.filter((r) => r.productId === p.id).sort((a, b) => a.family.localeCompare(b.family) || a.version - b.version).map((r) => (
                    <button key={r.id} className={`btn ${r.id === sel ? 'pri' : ''}`} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginBottom: 4 }} onClick={() => setSel(r.id)}>
                      <span>{recipeName(r)}</span>
                      <span>{statusLabel[r.status]}</span>
                    </button>
                  ))}
                </div>
              ))}
            </Card>
          </div>

          <div>
            {!recipe && <Notice kind="info">왼쪽에서 처방을 선택하거나 새 처방을 만드세요.</Notice>}
            {recipe && product && (
              <>
                <Card title="제품 정보">
                  <div className="grid g4">
                    <Field label="제품명"><input value={product.name} onChange={(e) => patchProduct(product.id, { name: e.target.value })} /></Field>
                    <Field label="라벨 품명 코드"><input value={product.code} onChange={(e) => patchProduct(product.id, { code: e.target.value })} /></Field>
                    <Field label="목표 단중 (kg/m²)"><Num value={product.arealKgM2} onChange={(n) => patchProduct(product.id, { arealKgM2: n })} /></Field>
                    <Field label="제품 폭 (mm)"><Num value={product.widthMm} onChange={(n) => patchProduct(product.id, { widthMm: n })} /></Field>
                  </div>
                  {product.note && <div className="mute" style={{ fontSize: 12, marginTop: 6 }}>비고: {product.note}</div>}
                </Card>

                <Card
                  title={`${recipeName(recipe)} ${statusLabel[recipe.status]}`}
                  right={
                    <div className="row">
                      <button className="btn" onClick={() => newRecipe(recipe.productId, recipe)}>복사해서 새 처방</button>
                      {recipe.status === 'draft' && (
                        <button
                          className="btn pri"
                          disabled={noUser}
                          title={noUser ? '상단에 작업자 이름을 먼저 입력하세요' : ''}
                          onClick={() =>
                            patchRecipe(recipe.id, (r) => ({ ...r, status: 'approved', approvedBy: db.user, approvedAt: new Date().toISOString() }), '처방 승인', recipeName(recipe))
                          }
                        >승인</button>
                      )}
                      {recipe.status === 'approved' && (
                        <button className="btn dan" onClick={() => patchRecipe(recipe.id, (r) => ({ ...r, status: 'retired' }), '처방 폐기', recipeName(recipe))}>폐기</button>
                      )}
                    </div>
                  }
                >
                  <div className="grid g4" style={{ marginBottom: 10 }}>
                    <Field label="처방 이름">
                      <input value={recipe.family} disabled={!editable} onChange={(e) => patchRecipe(recipe.id, (r) => ({ ...r, family: e.target.value }), '처방 이름 변경', e.target.value)} />
                    </Field>
                    <Field label="제품">
                      <select value={recipe.productId} disabled={!editable} onChange={(e) => patchRecipe(recipe.id, (r) => ({ ...r, productId: e.target.value }), '처방 제품 변경', e.target.value)}>
                        {db.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </Field>
                    <Field label="변경 사유 / 출처">
                      <input value={recipe.reason} disabled={!editable} onChange={(e) => patchRecipe(recipe.id, (r) => ({ ...r, reason: e.target.value }), '처방 사유 변경', e.target.value)} />
                    </Field>
                    <Field label="승인">{recipe.approvedBy ? `${recipe.approvedBy} (${recipe.approvedAt?.slice(0, 10)})` : '-'}</Field>
                  </div>
                  {!editable && <Notice kind="info">승인·폐기된 처방은 수정할 수 없습니다. 아래에서 새 버전을 만들어 수정하세요.</Notice>}
                  {recipe.reason.includes('엑셀') && recipe.status === 'draft' && <Notice kind="warn">엑셀에서 가져온 처방입니다. 현장에서 쓰는 값과 맞는지 확인한 뒤 승인하세요.</Notice>}

                  <div className="scroll">
                    <table>
                      <thead><tr><th>원재료</th><th className="r">phr</th><th className="r">비중</th><th className="r">단가 (원/kg)</th><th></th></tr></thead>
                      <tbody>
                        {recipe.lines.map((l) => {
                          const m = matOf(db, l.materialId)
                          return (
                            <tr key={l.materialId}>
                              <td>{matLabel(db, l.materialId)}</td>
                              <td className="r">
                                <Num value={l.phr} disabled={!editable} onChange={(n) => patchRecipe(recipe.id, (r) => ({ ...r, lines: r.lines.map((x) => (x.materialId === l.materialId ? { ...x, phr: n } : x)) }), '처방 수정', `${recipeName(recipe)} ${m?.grade}=${n}`)} />
                              </td>
                              <td className="r">{m?.density}</td>
                              <td className="r">{m?.price?.toLocaleString()}</td>
                              <td>
                                {editable && <button className="btn dan" onClick={() => patchRecipe(recipe.id, (r) => ({ ...r, lines: r.lines.filter((x) => x.materialId !== l.materialId) }), '처방 원재료 제거', `${recipeName(recipe)} ${m?.grade}`)}>제거</button>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {editable && usableMats.length > 0 && (
                    <div className="row" style={{ marginTop: 8 }}>
                      <span className="mute">원재료 추가:</span>
                      <select value="" onChange={(e) => e.target.value && patchRecipe(recipe.id, (r) => ({ ...r, lines: [...r.lines, { materialId: e.target.value, phr: 0 }] }), '처방 원재료 추가', `${recipeName(recipe)} ${matOf(db, e.target.value)?.grade}`)}>
                        <option value="">선택…</option>
                        {usableMats.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.grade})</option>)}
                      </select>
                    </div>
                  )}
                  {(() => {
                    const s = summary(db, recipe)
                    const hasResin = recipe.lines.some((l) => matOf(db, l.materialId)?.cat === 'resin' && l.phr > 0)
                    return (
                      <>
                        {!hasResin && <Notice kind="bad">불포화수지 phr이 없어 배합지시서를 만들 수 없습니다.</Notice>}
                        <div className="grid g4" style={{ marginTop: 10 }}>
                          <div className="kpi"><b>{fmt(s.total, 2)}</b><span>phr 합계</span></div>
                          <div className="kpi"><b>{fmt(s.gf * 100, 2)} %</b><span>유리섬유 함량</span></div>
                          <div className="kpi"><b>{fmt(s.sg, 4)}</b><span>페이스트 비중 (유리 제외)</span></div>
                          <div className="kpi"><b>{fmt(s.cost, 0)} 원/kg</b><span>원재료비 (kg당)</span></div>
                        </div>
                      </>
                    )
                  })()}
                </Card>

                {recipe.status !== 'draft' && (
                  <Card title="새 버전 만들기">
                    <div className="row">
                      <input style={{ flex: 1, minWidth: 240 }} placeholder="변경 사유 (예: 증점제 14로 조정)" value={reason} onChange={(e) => setReason(e.target.value)} />
                      <button className="btn pri" disabled={!reason.trim()} onClick={() => newVersion(recipe)}>새 버전(초안) 만들기</button>
                    </div>
                  </Card>
                )}

                {prev && (
                  <Card title={`${recipeName(prev)} 과 비교`}>
                    <table>
                      <thead><tr><th>원재료</th><th className="r">이전 phr</th><th className="r">현재 phr</th><th className="r">차이</th></tr></thead>
                      <tbody>
                        {Array.from(new Set([...prev.lines, ...recipe.lines].map((l) => l.materialId))).map((id) => {
                          const a = prev.lines.find((l) => l.materialId === id)?.phr ?? 0
                          const b = recipe.lines.find((l) => l.materialId === id)?.phr ?? 0
                          if (a === b) return null
                          return (
                            <tr key={id}><td>{matLabel(db, id)}</td><td className="r">{a}</td><td className="r">{b}</td><td className={`r ${b > a ? 'ok-text' : 'bad-text'}`}>{fmt(b - a, 2)}</td></tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div className="mute" style={{ marginTop: 6 }}>변경 사유: {recipe.reason}</div>
                  </Card>
                )}
                <Badge kind="mute">같은 이름의 처방은 버전으로 이어집니다</Badge>
              </>
            )}
          </div>
        </div>
      )}

      {subTab === 'costSheet' && (
        <div className="card printable">
          <div className="doc-banner" style={{ marginBottom: 16 }}>
            <div className="doc-brand">
              {db.settings.companyLogo && <img src={db.settings.companyLogo} alt="로고" className="doc-logo" />}
              <div>
                <div className="doc-sub">{db.settings.companyName || 'SMC MANUFACTURING SYSTEM'} · 원본: 하영 SMC-1.xlsx 「물탱크 배합」 시트</div>
                <h2 className="doc-title">SMC 물탱크 배합표 및 총 제조원가 계산서</h2>
              </div>
            </div>
            <div className="doc-meta-box">
              <div><span>원본 시트</span><b>물탱크 배합 (Row 2~47)</b></div>
              <div><span>수록 배합</span><b>물탱크 / 물탱크2 / YSACC1 / YSACC2 / 7배치</b></div>
              <div><span>총 제조원가</span><b>{fmt(grandTotalCost, 2)} 원/kg</b></div>
            </div>
          </div>

          <div className="row noprint" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="row">
              <span className="mute">상세 분석 기준 배합 선택:</span>
              {([
                { id: 'wt1', label: '물탱크 (1,120kg 기준)' },
                { id: 'wt2', label: '물탱크2 (609kg 기준)' },
                { id: 'ys1', label: 'YSACC1 (2,500kg · 수율 0.98)' },
                { id: 'ys2', label: 'YSACC2 (2,300kg · 수율 0.98)' },
                { id: 'wt7', label: '물탱크 AL열 (3,185kg · 7배치)' },
              ] as const).map((c) => (
                <button key={c.id} className={`btn ${costCol === c.id ? 'pri' : ''}`} onClick={() => setCostCol(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="row">
              <span className="mute">목표 배합 중량(kg):</span>
              <Num
                value={targetBatchKg}
                width={100}
                onChange={(n) => setTargetKgMap((m) => ({ ...m, [costCol]: n }))}
              />
            </div>
          </div>

          <h4>1) 원재료비 — 5대 배합 비교 및 선택 배합({costCol.toUpperCase()}) 정밀 원가</h4>
          <div className="scroll" style={{ marginBottom: 14 }}>
            <table className="print-tbl">
              <thead>
                <tr>
                  <th rowSpan={2}>품목</th>
                  <th rowSpan={2} className="r">단가적용<br />(원/kg)</th>
                  <th rowSpan={2} className="r">비중<br />(g/cm³)</th>
                  <th colSpan={5} style={{ textAlign: 'center', background: '#eff6ff' }}>엑셀 5대 배합별 Batch 기준값</th>
                  <th colSpan={6} style={{ textAlign: 'center', background: '#fefce8' }}>선택 배합 ({costCol.toUpperCase()}) 상세 계산</th>
                </tr>
                <tr>
                  <th className="r">물탱크</th>
                  <th className="r">물탱크2</th>
                  <th className="r">YSACC1</th>
                  <th className="r">YSACC2</th>
                  <th className="r">AL열(7배치)</th>
                  <th className="r">부피(L)</th>
                  <th className="r">백분율(%)</th>
                  <th className="r">1톤 배합량(kg)</th>
                  <th className="r">원재료비(원/kg)</th>
                  <th className="r">phr / GF비</th>
                  <th className="r">목표({targetBatchKg}kg) 배합량</th>
                </tr>
              </thead>
              <tbody>
                {EXCEL_COST_ROWS.map((r, idx) => {
                  const isGlass = idx === EXCEL_COST_ROWS.length - 1
                  const batchVal = r[costCol]
                  const vol = batchVal / r.sg
                  const pct = totalBatch > 0 ? batchVal / totalBatch : 0
                  const oneTonKg = pct * oneTonTotal
                  const costW = (r.price * oneTonKg) / 1000
                  const phrOrGf = isGlass
                    ? `${fmt(pct * 100, 2)}%`
                    : fmt(resinPlusLpa > 0 ? (batchVal / resinPlusLpa) * 100 : 0, 2)
                  const scaledKg = oneTonKg * (targetBatchKg / 1000)
                  return (
                    <tr key={r.name}>
                      <td><b>{r.name}</b></td>
                      <td className="r">{r.price ? r.price.toLocaleString() : '-'}</td>
                      <td className="r">{fmt(r.sg, 2)}</td>
                      <td className="r">{r.wt1 || '-'}</td>
                      <td className="r">{r.wt2 || '-'}</td>
                      <td className="r">{r.ys1 || '-'}</td>
                      <td className="r">{r.ys2 || '-'}</td>
                      <td className="r">{r.wt7 || '-'}</td>
                      <td className="r">{fmt(vol, 2)}</td>
                      <td className="r">{fmt(pct * 100, 2)}%</td>
                      <td className="r">{fmt(oneTonKg, 2)}</td>
                      <td className="r"><b>{fmt(costW, 2)}</b></td>
                      <td className="r">{phrOrGf}</td>
                      <td className="r" style={{ fontWeight: 700, color: '#1d4ed8' }}>{fmt(scaledKg, 2)}</td>
                    </tr>
                  )
                })}
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>전체 합계 (유리섬유 포함, Row 23)</td>
                  <td className="r">-</td>
                  <td className="r">전체비중 {fmt(totalSg, 4)}</td>
                  <td className="r">447.2</td>
                  <td className="r">425.1</td>
                  <td className="r">437.6</td>
                  <td className="r">438.47</td>
                  <td className="r">1,090.76</td>
                  <td className="r">{fmt(totalVol, 2)} L</td>
                  <td className="r">100.0%</td>
                  <td className="r">{fmt(oneTonTotal, 2)} kg</td>
                  <td className="r">{fmt(rawCostPerKg, 2)} 원/kg</td>
                  <td className="r">수율 {yieldFactor}</td>
                  <td className="r">{fmt(targetBatchKg / yieldFactor, 2)} kg</td>
                </tr>
                <tr style={{ background: '#eff6ff', fontWeight: 700 }}>
                  <td>컴파운드 합계 (유리 제외, Row 24)</td>
                  <td className="r">-</td>
                  <td className="r">컴파운드비중 {fmt(compSg, 4)}</td>
                  <td className="r">299.2</td>
                  <td className="r">299.1</td>
                  <td className="r">305.6</td>
                  <td className="r">306.47</td>
                  <td className="r">958.76</td>
                  <td className="r">{fmt(pasteVol, 2)} L</td>
                  <td className="r">{fmt((pasteBatch / totalBatch) * 100, 2)}%</td>
                  <td className="r">-</td>
                  <td className="r">-</td>
                  <td className="r">-</td>
                  <td className="r">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Notice kind="info">
            <b>엑셀 원본 시트 현장 메모 (I26~I28 셀 및 P45~Q47 셀):</b> ① <code>sm 3파트추가</code> &nbsp;|&nbsp; ② <code>증점제는 2,2.5파트로 한다.</code> &nbsp;|&nbsp; ③ <code>초기증점조절제 1.3</code> &nbsp;|&nbsp; ④ 하단 메모: <code>550 / 385 (0.7 = 385/550) / 165</code>
          </Notice>

          <div className="grid g2" style={{ marginTop: 16 }}>
            <div>
              <h4>2) 부재료비 (Row 31~36)</h4>
              <table className="print-tbl" style={{ marginBottom: 14 }}>
                <thead>
                  <tr><th>구분</th><th>품목 규격</th><th className="r">단위 원가 (원/kg)</th></tr>
                </thead>
                <tbody>
                  <tr><td>케리어필름</td><td>CPP필름</td><td className="r">36.83</td></tr>
                  <tr><td>UV차단필름</td><td>알루미늄, 30미크론</td><td className="r">4.00</td></tr>
                  <tr><td>테이프 외</td><td>포장 부자재 외</td><td className="r">1.00</td></tr>
                  <tr style={{ fontWeight: 700, background: '#f8fafc' }}><td colSpan={2}>부재료비 계</td><td className="r">{fmt(subMatCost, 2)} 원/kg</td></tr>
                </tbody>
              </table>

              <h4>3) 노무비 (Row 31~36)</h4>
              <div className="grid g4 noprint" style={{ marginBottom: 8 }}>
                <Field label="1인 월 작업시간(h)"><Num value={hoursPerMonth} onChange={setHoursPerMonth} /></Field>
                <Field label="종합시급(원)"><Num value={hourlyWage} onChange={setHourlyWage} /></Field>
                <Field label="작업 인원(명)"><Num value={workers} onChange={setWorkers} /></Field>
                <Field label="월 생산량(kg)"><Num value={monthlyProdKg} onChange={setMonthlyProdKg} /></Field>
              </div>
              <table className="print-tbl">
                <thead>
                  <tr>
                    <th className="r">1인 월작업시간</th>
                    <th className="r">종합시급</th>
                    <th className="r">인원</th>
                    <th className="r">월 생산량(Kg)</th>
                    <th className="r">임금계(원/월)</th>
                    <th className="r">노무비(원/kg)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="r">{hoursPerMonth}</td>
                    <td className="r">{hourlyWage.toLocaleString()}</td>
                    <td className="r">{workers}</td>
                    <td className="r">{monthlyProdKg.toLocaleString()}</td>
                    <td className="r">{totalWage.toLocaleString()}</td>
                    <td className="r"><b>{fmt(laborCostPerKg, 2)}</b></td>
                  </tr>
                </tbody>
              </table>
              <div className="mute" style={{ fontSize: 12, marginTop: 6 }}>
                ◎ 노무비 참고사항: ① 작업인원: 6명(@198) · ② 1인 월 작업시간: 198시간/월(22일, 1일 9시간) · ③ 환경부담비: 3.85 × 85원 = 327.25만원/월
              </div>
            </div>

            <div>
              <h4>4) 제조경비 — 감가비 포함 (Row 31~38)</h4>
              <table className="print-tbl" style={{ marginBottom: 14 }}>
                <thead>
                  <tr><th>품목</th><th className="r">월 소요량 (원/월)</th><th className="r">단위 금액 (원/kg)</th></tr>
                </thead>
                <tbody>
                  {mfgItems.map((m) => (
                    <tr key={m.name}>
                      <td>{m.name}</td>
                      <td className="r">{m.monthly.toLocaleString()}</td>
                      <td className="r">{fmt(monthlyProdKg > 0 ? m.monthly / monthlyProdKg : 0, 2)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, background: '#f8fafc' }}>
                    <td>제조경비 합계</td>
                    <td className="r">{mfgItems.reduce((s, x) => s + x.monthly, 0).toLocaleString()}</td>
                    <td className="r">{fmt(mfgCostPerKg, 2)} 원/kg</td>
                  </tr>
                </tbody>
              </table>

              <h4>5) 총 제조원가 합계 (Row 31~33)</h4>
              <div className="row noprint" style={{ marginBottom: 8 }}>
                <span className="mute">소량생산비(기술비, 원/kg):</span>
                <Num value={smallBatchFee} width={100} onChange={setSmallBatchFee} />
              </div>
              <table className="print-tbl">
                <thead>
                  <tr>
                    <th className="r">원재료비</th>
                    <th className="r">부재료비</th>
                    <th className="r">노무비</th>
                    <th className="r">제조경비(감가비포함)</th>
                    <th className="r">소량생산비(기술비)</th>
                    <th className="r">총 합계 (원/kg)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="r">{fmt(rawCostPerKg, 2)}</td>
                    <td className="r">{fmt(subMatCost, 2)}</td>
                    <td className="r">{fmt(laborCostPerKg, 2)}</td>
                    <td className="r">{fmt(mfgCostPerKg, 2)}</td>
                    <td className="r">{fmt(smallBatchFee, 2)}</td>
                    <td className="r" style={{ fontWeight: 800, color: '#1d4ed8', fontSize: 15 }}>
                      {fmt(grandTotalCost, 2)} 원/kg
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mute" style={{ fontSize: 12, marginTop: 6 }}>
                ※ 엑셀 원본 <code>물탱크2</code> 기준 재료비(원재료 1,316.36 + 부재료 41.83 = 1,358.19원/kg) + 노무비(23.76원) + 제조경비(92.00원) = <b>1,473.95원/kg</b> 완벽 일치.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
