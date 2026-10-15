import { useRef } from 'react'
import { Card, Notice, Num } from '../ui'
import { exportJSON, importJSON, resetDB, update, useDB } from '../store'
import { download } from '../util'
import type { Settings } from '../types'

const ROWS: { key: keyof Settings; label: string; unit: string; src: string }[] = [
  { key: 'storageTempMaxC', label: '시트 보관 온도 상한', unit: '℃', src: '시트 관리 수칙(40℃)과 시트관리가이드(30℃)가 상충 — 결정 필요' },
  { key: 'fillerTempMaxC', label: '충진제 투입 중 온도 상한', unit: '℃', src: '공정 표준서 STEP 5' },
  { key: 'mixRpmMax', label: '교반 최대 RPM', unit: 'RPM', src: '공정 표준서' },
  { key: 'arealTolKg', label: '단중 허용 오차', unit: 'kg', src: '공정 표준서 시트 검사 (설계 기준 ±0.1 kg)' },
  { key: 'widthTolMm', label: '폭 허용 오차', unit: 'mm', src: '공정 표준서 (설계 폭 ±2 mm)' },
  { key: 'thicknessTolMm', label: '두께 허용 오차', unit: 'mm', src: '공정 표준서 (설계 두께 ±0.1 mm)' },
  { key: 'matureMinH', label: '최소 숙성 시간', unit: '시간', src: '시트 관리 수칙 (18~36시간)' },
  { key: 'matureMaxH', label: '권장 숙성 상한', unit: '시간', src: '시트 관리 수칙' },
  { key: 'shelfMonths', label: '사용기한', unit: '개월', src: '완제품 라벨 수식(생산일 + 2개월)' },
  { key: 'cutterBladeChangeTon', label: '커터 날 정기 교체 누적 생산량', unit: '톤', src: '기계 관리 가이드 (300톤 또는 월 1회)' },
]

export default function Rules() {
  const db = useDB()
  const file = useRef<HTMLInputElement>(null)
  const set = (k: keyof Settings, v: number | string) =>
    update((d) => ({ ...d, settings: { ...d.settings, [k]: v } }), { action: '기준값 변경', detail: `${k}=${v}` })

  return (
    <>
      <Card title="관리 기준값">
        <Notice kind="info">여기 값이 배합·일지·로트 화면의 경고와 판정에 그대로 쓰입니다. 변경은 감사 이력에 남습니다.</Notice>
        <table>
          <thead><tr><th>항목</th><th className="r">값</th><th>단위</th><th>근거</th></tr></thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td className="r"><Num value={db.settings[r.key] as number} onChange={(n) => set(r.key, n)} /></td>
                <td>{r.unit}</td><td className="mute">{r.src}</td>
              </tr>
            ))}
            <tr>
              <td>LOT 접두 코드(현장)</td>
              <td className="r"><input style={{ width: 90 }} value={db.settings.siteCode} onChange={(e) => set('siteCode', e.target.value.toUpperCase())} /></td>
              <td></td><td className="mute">예: HYVN → HYVN261015-01</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card title="데이터 백업·복원">
        <div className="row">
          <button className="btn pri" onClick={() => download(`smc-backup-${new Date().toISOString().slice(0, 10)}.json`, exportJSON())}>백업 파일 내려받기</button>
          <button className="btn" onClick={() => file.current?.click()}>백업 파일로 복원</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try { importJSON(await f.text()) } catch (err) { alert((err as Error).message) }
            e.target.value = ''
          }} />
          <button className="btn dan" onClick={() => { if (confirm('모든 데이터를 초기 상태로 되돌립니다. 계속할까요?')) resetDB() }}>초기화</button>
        </div>
        <p className="mute">이 프로그램은 현재 이 브라우저에 데이터를 저장합니다. 정기적으로 백업 파일을 내려받아 보관하세요.</p>
      </Card>

      <Card title="감사 이력 (최근 100건)">
        <div className="scroll">
          <table>
            <thead><tr><th>시각</th><th>작업자</th><th>작업</th><th>내용</th></tr></thead>
            <tbody>
              {db.audit.slice(0, 100).map((a, i) => (
                <tr key={i}><td>{a.at.slice(0, 19).replace('T', ' ')}</td><td>{a.user}</td><td>{a.action}</td><td className="mute">{a.detail}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
