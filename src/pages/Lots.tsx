import { useState } from 'react'
import { Badge, Card, Notice } from '../ui'
import { update, useDB } from '../store'
import { addMonths, dateOnly, fmt, lotState } from '../util'
import type { SheetLot } from '../types'

export default function Lots() {
  const db = useDB()
  const [printId, setPrintId] = useState('')
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const noUser = !db.user.trim()
  const lots = [...db.lots].sort((a, b) => a.producedAt.localeCompare(b.producedAt)) // FIFO: 오래된 순
  const stock = lots.filter((l) => !l.released)
  const printLot = db.lots.find((l) => l.id === printId)

  const release = (l: SheetLot, reason: string) =>
    update((d) => ({ ...d, lots: d.lots.map((x) => (x.id === l.id ? { ...x, released: true, note: reason ? `FIFO 예외: ${reason}` : x.note } : x)) }), {
      action: '출고 처리', detail: `${l.lotNo}${reason ? ` (FIFO 예외: ${reason})` : ''}`,
    })

  const Label = ({ l }: { l: SheetLot }) => (
    <div className="label">
      <div className="t" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {db.settings.companyLogo && (
          <img src={db.settings.companyLogo} alt="logo" style={{ height: 22, maxWidth: 80, objectFit: 'contain' }} />
        )}
        <span>PRODUCT LABEL</span>
      </div>
      <div className="lr" style={{ gridTemplateColumns: '1.3fr 1fr 1fr' }}>
        <div><small>품명 PRODUCT NAME</small><b>{l.productCode}</b></div>
        <div><small>생산일자 DATE</small>{dateOnly(l.producedAt)}</div>
        <div><small>사용기한 EXPIRY DATE</small>{dateOnly(addMonths(l.producedAt, db.settings.shelfMonths))}</div>
      </div>
      <div className="lr" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <div><small>LOT NO.</small><b>{l.lotNo}</b></div>
        <div><small>유리섬유 함량 GF Content (%)</small>{l.gfPct}</div>
      </div>
      <div className="lr" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div><small>총 중량 GROSS WEIGHT (Kg)</small>{fmt(l.grossKg, 0)}</div>
        <div><small>실 중량 NET WEIGHT (Kg)</small>{fmt(l.netKg, 0)}</div>
      </div>
      <div style={{ padding: '6px 8px', fontSize: 11 }}>
        <small>특이사항 REMARKS · {db.settings.companyName}</small>
        직사광선 금지 Keep out of direct sunlight<br />냉암소 보관 Store in a cool, dark place (Max. 25°C)
      </div>
    </div>
  )

  return (
    <>
      <Card title="로트 재고 (오래된 로트가 위)">
        {lots.length === 0 ? <span className="mute">생산일지를 마감하면 로트가 자동 등록됩니다.</span> : (
          <div className="scroll">
            <table>
              <thead><tr><th>LOT</th><th>생산일시</th><th className="r">경과(시간)</th><th className="r">GF %</th><th className="r">실중량 (kg)</th><th>사용기한</th><th>상태</th><th>출고</th><th></th></tr></thead>
              <tbody>
                {lots.map((l) => {
                  const s = lotState(l, db.settings)
                  const olderAvailable = stock.some((o) => o.id !== l.id && o.producedAt < l.producedAt && lotState(o, db.settings).state !== '만료' && lotState(o, db.settings).state !== '숙성중')
                  const kind = { 숙성중: 'info', 사용가능: 'ok', 만료임박: 'warn', 만료: 'bad', 출고완료: 'mute' }[s.state] as 'ok'
                  const blocked = s.state === '숙성중' || s.state === '만료'
                  const reason = reasons[l.id] ?? ''
                  return (
                    <tr key={l.id}>
                      <td>{l.lotNo}</td>
                      <td>{l.producedAt.slice(0, 16).replace('T', ' ')}</td>
                      <td className="r">{fmt(s.ageH, 1)}</td>
                      <td className="r">{l.gfPct}</td>
                      <td className="r">{fmt(l.netKg, 1)}</td>
                      <td>{dateOnly(s.expiry)}</td>
                      <td><Badge kind={kind}>{s.state}</Badge>{s.state === '숙성중' && <span className="mute"> {db.settings.matureMinH}시간 후</span>}</td>
                      <td>
                        {!l.released && (
                          <div className="row">
                            {olderAvailable && !blocked && <input placeholder="더 오래된 로트가 있음: 사유" value={reason} onChange={(e) => setReasons({ ...reasons, [l.id]: e.target.value })} />}
                            <button className="btn" disabled={noUser || blocked || (olderAvailable && !reason.trim())} onClick={() => release(l, olderAvailable ? reason : '')}>출고</button>
                          </div>
                        )}
                        {l.released && l.note && <span className="mute">{l.note}</span>}
                      </td>
                      <td><button className="btn" onClick={() => setPrintId(l.id)}>라벨</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Notice kind="info">숙성 {db.settings.matureMinH}시간 이전 또는 사용기한이 지난 로트는 출고할 수 없습니다. 선입선출을 건너뛰면 사유가 필요합니다.</Notice>
      </Card>

      {printLot && (
        <section className="card printable">
          <header>
            <h3>완제품 라벨 {printLot.lotNo}</h3>
            <div className="row noprint">
              <button className="btn pri" onClick={() => window.print()}>인쇄 (2매)</button>
              <button className="btn" onClick={() => setPrintId('')}>닫기</button>
            </div>
          </header>
          <Label l={printLot} />
          <div className="mute noprint" style={{ margin: '0 0 8px' }}>✂ 절취선 — 아래는 같은 라벨 1매 더</div>
          <Label l={printLot} />
        </section>
      )}
    </>
  )
}
