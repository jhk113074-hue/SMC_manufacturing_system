import { Badge, Card, Notice } from '../ui'
import { update, useDB } from '../store'
import { fmt, lotState } from '../util'

export default function Dashboard() {
  const db = useDB()
  const stock = db.lots.filter((l) => !l.released)
  const states = stock.map((l) => ({ l, s: lotState(l, db.settings) }))
  const aging = states.filter((x) => x.s.state === '숙성중')
  const soon = states.filter((x) => x.s.state === '만료임박')
  const expired = states.filter((x) => x.s.state === '만료')
  const stockKg = stock.reduce((s, l) => s + l.netKg, 0)
  const totalKg = db.lots.reduce((s, l) => s + l.netKg, 0)
  const sinceBlade = (totalKg - db.settings.bladeBaseKg) / 1000
  const bladeDue = sinceBlade >= db.settings.cutterBladeChangeTon
  const draftRecipes = db.recipes.filter((r) => r.status === 'draft')
  const openRuns = db.runs.filter((r) => r.status === 'open')
  const openMix = db.mixOrders.filter((m) => m.status !== 'done')

  return (
    <>
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <div className="kpi"><b>{openMix.length}</b><span>진행 중 배합지시서</span></div>
        <div className="kpi"><b>{openRuns.length}</b><span>작성 중 생산일지</span></div>
        <div className="kpi"><b>{fmt(stockKg, 0)} kg</b><span>재고 실중량 ({stock.length}개 로트)</span></div>
        <div className="kpi"><b>{aging.length}</b><span>숙성 중 로트</span></div>
      </div>
      {expired.length > 0 && <Notice kind="bad">사용기한이 지난 로트: {expired.map((x) => x.l.lotNo).join(', ')}</Notice>}
      {soon.length > 0 && <Notice kind="warn">사용기한 14일 이내 로트: {soon.map((x) => x.l.lotNo).join(', ')}</Notice>}
      {draftRecipes.length > 0 && <Notice kind="info">승인되지 않은 처방 {draftRecipes.length}개: {draftRecipes.map((r) => r.family).join(', ')}</Notice>}
      <Card title="커터 날 교체 관리"
        right={<button className="btn" disabled={totalKg === 0} onClick={() => update((d) => ({ ...d, settings: { ...d.settings, bladeBaseKg: totalKg } }), { action: '커터 날 교체 기록', detail: `누적 ${fmt(totalKg / 1000, 1)}톤 시점` })}>교체 완료 기록</button>}>
        <div className="row">
          <span>교체 이후 누적 생산량 <b>{fmt(sinceBlade, 1)} 톤</b> / 기준 {db.settings.cutterBladeChangeTon} 톤</span>
          <Badge kind={bladeDue ? 'bad' : 'ok'}>{bladeDue ? '교체 시기' : '정상'}</Badge>
        </div>
        <p className="mute">마감된 생산일지의 실중량 합계로 자동 집계합니다. 월 1회 정기 교체와 함께 점검하세요.</p>
      </Card>
      <Card title="최근 작업">
        <table>
          <tbody>
            {db.audit.slice(0, 8).map((a, i) => <tr key={i}><td>{a.at.slice(5, 16).replace('T', ' ')}</td><td>{a.user}</td><td>{a.action}</td><td className="mute">{a.detail}</td></tr>)}
            {db.audit.length === 0 && <tr><td className="mute">아직 작업 이력이 없습니다. 처방 탭에서 시작하세요.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  )
}
