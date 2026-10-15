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

export default function Recipes() {
  const db = useDB()
  const [sel, setSel] = useState<string>(db.recipes[0]?.id ?? '')
  const [reason, setReason] = useState('')
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

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(260px,320px) 1fr', alignItems: 'start' }}>
      <div>
        <Card title="제품과 처방" right={<button className="btn pri" onClick={newProduct}>제품 추가</button>}>
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
                <Field label="변경 사유">
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
  )
}
