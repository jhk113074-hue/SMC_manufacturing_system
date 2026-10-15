import { Card, Num } from '../ui'
import { update, uid, useDB } from '../store'
import type { MatCat, Material } from '../types'

export const CAT_LABEL: Record<MatCat, string> = {
  resin: '수지', lpa: '저수축제', sm: '희석제(SM)', additive: '첨가제', inhibitor: '중합금지제',
  initiator: '경화제·증점조절', release: '이형제', pe: 'PE 파우더', filler: '충진제', thickener: '증점제', color: '조색제', glass: '유리섬유',
}

export default function Materials() {
  const db = useDB()
  const used = new Set(db.recipes.flatMap((r) => r.lines.map((l) => l.materialId)))

  const patch = (id: string, p: Partial<Material>) =>
    update((d) => ({ ...d, materials: d.materials.map((m) => (m.id === id ? { ...m, ...p } : m)) }), {
      action: '원재료 수정',
      detail: `${db.materials.find((m) => m.id === id)?.grade}: ${Object.entries(p).map(([k, v]) => `${k}=${v}`).join(', ')}`,
    })

  const add = () =>
    update((d) => ({
      ...d,
      materials: [...d.materials, { id: uid('m'), cat: 'additive', name: '새 원재료', grade: '새 규격', density: 1, price: 0 }],
    }), { action: '원재료 추가', detail: '새 원재료' })

  return (
    <>
      <p className="mute">비중·단가는 여기 한 곳에서만 관리하고, 처방·설정값 계산·원가가 모두 이 값을 참조합니다.</p>
      <Card title="원재료 마스터" right={<button className="btn pri" onClick={add}>원재료 추가</button>}>
        <div className="scroll">
          <table>
            <thead>
              <tr><th>구분</th><th>품명</th><th>규격</th><th className="r">비중 (g/cm³)</th><th className="r">단가 (원/kg)</th><th>비고</th><th></th></tr>
            </thead>
            <tbody>
              {db.materials.map((m) => (
                <tr key={m.id}>
                  <td>
                    <select value={m.cat} onChange={(e) => patch(m.id, { cat: e.target.value as MatCat })}>
                      {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td><input value={m.name} onChange={(e) => patch(m.id, { name: e.target.value })} /></td>
                  <td><input value={m.grade} onChange={(e) => patch(m.id, { grade: e.target.value })} /></td>
                  <td className="r"><Num value={m.density} onChange={(n) => patch(m.id, { density: n })} /></td>
                  <td className="r"><Num value={m.price} onChange={(n) => patch(m.id, { price: n })} /></td>
                  <td className="mute">{m.note}</td>
                  <td>
                    <button
                      className="btn dan"
                      disabled={used.has(m.id)}
                      title={used.has(m.id) ? '처방에서 사용 중이라 삭제할 수 없습니다' : ''}
                      onClick={() => update((d) => ({ ...d, materials: d.materials.filter((x) => x.id !== m.id) }), { action: '원재료 삭제', detail: m.grade })}
                    >삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
