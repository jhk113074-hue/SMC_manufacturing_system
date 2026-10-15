import { useState } from 'react'
import { useDB } from '../store'
import { fmt } from '../util'

type FormKey = 'daily_new' | 'prod_17' | 'mix_sheet' | 'label_sheet'

export default function Forms() {
  const db = useDB()
  const s = db.settings
  const [tab, setTab] = useState<FormKey>('daily_new')
  const [blank, setBlank] = useState<boolean>(false)
  const [prodSub, setProdSub] = useState<'v4' | 'v05'>('v4')
  const [mixSub, setMixSub] = useState<'40' | '30'>('40')

  return (
    <>
      <div className="row noprint" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="seg-tabs">
          <button className={tab === 'daily_new' ? 'on' : ''} onClick={() => setTab('daily_new')}>
            1. 일일 생산일지 (신규·14롤)
          </button>
          <button className={tab === 'prod_17' ? 'on' : ''} onClick={() => setTab('prod_17')}>
            2. SMC 생산일지 (기존·17롤/0.5배치)
          </button>
          <button className={tab === 'mix_sheet' ? 'on' : ''} onClick={() => setTab('mix_sheet')}>
            3. 배합 생산 지시서 (40% / 30%)
          </button>
          <button className={tab === 'label_sheet' ? 'on' : ''} onClick={() => setTab('label_sheet')}>
            4. 완제품 라벨 양식 (2매)
          </button>
        </div>

        <div className="row">
          {tab === 'prod_17' && (
            <select value={prodSub} onChange={(e) => setProdSub(e.target.value as 'v4' | 'v05')}>
              <option value="v4">생산일지 (4) — 1배치 (수지 350kg)</option>
              <option value="v05">생산일지 0.5 — 0.5배치×2 (수지 175kg)</option>
            </select>
          )}
          {tab === 'mix_sheet' && (
            <select value={mixSub} onChange={(e) => setMixSub(e.target.value as '40' | '30')}>
              <option value="40">배합지시서 (40%) — SC-637S 350kg / PS40</option>
              <option value="30">배합지시서 (30%) — 수지 180kg / PS30 × 2배치</option>
            </select>
          )}
          <label className="row" style={{ fontSize: 13, cursor: 'pointer', marginRight: 6 }}>
            <input type="checkbox" checked={blank} onChange={(e) => setBlank(e.target.checked)} />
            <span>수기 기록용 빈 양식(공양식)으로 보기</span>
          </label>
          <button className="btn pri" onClick={() => window.print()}>
            🖨️ 현재 양식 인쇄
          </button>
        </div>
      </div>

      {/* 1. 일일 생산일지(신규) — GRP_작업일지_개선_v6_1.xlsx 시트 2 원형 그대로 */}
      {tab === 'daily_new' && (
        <section className="card printable doc-sheet">
          <div className="doc-banner" style={{ marginBottom: 10, paddingBottom: 10 }}>
            <div className="doc-brand">
              {s.companyLogo ? <img src={s.companyLogo} alt="logo" className="doc-logo" /> : <div className="brand-mark">SMC</div>}
              <div>
                <div className="doc-title">SMC 일일 생산일지 (신규 표준 양식)</div>
                <div className="doc-sub">출처: GRP_작업일지_개선_v6_1.xlsx 「일일 생산일지(신규)」 · 파란 글씨(노란 칸)=직접 입력 | 초록 글씨=설정값 계산 자동 연동 | 검정 글씨=자동 계산</div>
              </div>
            </div>
            <table className="sign-box">
              <thead><tr><th>작성</th><th>검토</th><th>승인</th></tr></thead>
              <tbody><tr><td style={{ height: 28 }}></td><td></td><td></td></tr></tbody>
            </table>
          </div>

          <div className="print-sec-title">1. 기본사항</div>
          <table className="print-tbl" style={{ marginBottom: 10 }}>
            <tbody>
              <tr>
                <th>품명</th>
                <td><b>SMC 물탱크용</b></td>
                <th>제품 Lot</th>
                <td>{blank ? '' : `${s.siteCode}-WTG-260707-01`}</td>
                <th>생산 Batch</th>
                <td className="r">{blank ? '' : '2'}</td>
                <th>목표 생산중량 (Kg)</th>
                <td className="r">{blank ? '' : '4,351.04'}</td>
              </tr>
              <tr>
                <th>온도 (℃)</th>
                <td className="r">{blank ? '' : '25'}</td>
                <th>습도 (%)</th>
                <td className="r">{blank ? '' : '52'}</td>
                <th>날씨</th>
                <td>{blank ? '' : '맑음'}</td>
                <th>작업인원 / 생산시간</th>
                <td>{blank ? '      명 /      ~     ' : '6 명 / 08:30 ~ 17:30'}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div className="print-sec-title">2. 원재료 투입량 (Lot 포함)</div>
              <table className="print-tbl">
                <thead>
                  <tr>
                    <th>No</th><th>품목</th><th>규격</th><th>Lot No.</th>
                    <th className="r">사용량(Kg)</th><th className="r">총사용량(Kg)</th><th className="r">실사용량(Kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['1', '불포화수지', 'SC-637S', 350, 700],
                    ['2', '저수축제', 'PS40', 112.5, 225],
                    ['3', '희석제', 'SM', 37.5, 75],
                    ['3-2', '희석제(추가)', 'SM', 20, 40],
                    ['4', 'K972', 'K972', 5, 10],
                    ['5', 'K996', 'K996', 6.6, 13.2],
                    ['6', '중합금지제', 'CBA109N', 8.5, 17],
                    ['7', '경화제', 'TBPB', 6, 12],
                    ['8', '초기증점조절제', 'CBA308S', 7.5, 15],
                    ['9', '저수축제', 'FHP', 25, 50],
                    ['10', '이형제', 'HI-FLOW', 20, 40],
                    ['11', '충진제', 'CaCO3', 825, 1650],
                    ['12', '증점제', 'MGO-813', 14, 28],
                    ['13', '조색제', 'GRAY(9098)', 20, 40],
                    ['14', '유리섬유', '4800TEX', 717.92, 1435.84],
                  ].map(([no, name, grade, u1, u2]) => (
                    <tr key={String(no)}>
                      <td style={{ textAlign: 'center' }}>{no}</td>
                      <td>{name}</td>
                      <td>{grade}</td>
                      <td></td>
                      <td className="r">{fmt(Number(u1), 2)}</td>
                      <td className="r">{fmt(Number(u2), 2)}</td>
                      <td className="r">{blank ? '' : '0'}</td>
                    </tr>
                  ))}
                  <tr>
                    <th colSpan={4} className="r">TTL</th>
                    <th className="r">2,175.52</th>
                    <th className="r">4,351.04</th>
                    <th className="r">{blank ? '' : '0'}</th>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="print-sec-title">3. 점도 확인 (회차별 1 ~ 14회차)</div>
              <table className="print-tbl">
                <thead>
                  <tr>
                    <th>회차</th><th className="r">초기점도(PS/℃)</th><th className="r">5분</th><th className="r">10분</th>
                    <th className="r">15분</th><th className="r">20분</th><th className="r">25분</th><th className="r">말기점도(PS/℃)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 14 }).map((_, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center', height: 19 }}>{i + 1}</td>
                      <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div className="print-sec-title">4. 유리섬유 함량 체크</div>
              <table className="print-tbl">
                <tbody>
                  <tr><th>유리섬유 Lot</th><td colSpan={3}>{blank ? '' : 'CPIC / WEIBO'}</td></tr>
                  <tr><th>롤 사용량 (Kg)</th><td style={{ width: 90 }}></td><th>전체사용량 (Kg)</th><td>{blank ? '' : '0'}</td></tr>
                  <tr><th>유리섬유 함량 (%)</th><td colSpan={3}>{blank ? '          %' : '33.0 %'}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <div className="print-sec-title">5. 토출량 확인 (총 토출량 목표: 33.902 Kg/min)</div>
              <table className="print-tbl">
                <thead>
                  <tr><th>항목</th><th className="r">목표(자동)</th><th className="r">실측</th><th>단위</th></tr>
                </thead>
                <tbody>
                  <tr><td>컴파운드(페이스트)</td><td className="r">33.109</td><td className="r">{blank ? '' : '0'}</td><td>Kg/min</td></tr>
                  <tr><td>증점제 (MGO-813)</td><td className="r">325.604</td><td className="r">{blank ? '' : '0'}</td><td>g/min</td></tr>
                  <tr><td>조색제 (GRAY 9098)</td><td className="r">465.148</td><td className="r">{blank ? '' : '0'}</td><td>g/min</td></tr>
                </tbody>
              </table>
              <small className="mute">※ 비율 = 증점제·조색제 사용량 ÷ 전체 사용량 (유리섬유 제외 1,457.6 kg 기준)</small>
            </div>
          </div>

          <div className="print-sec-title">6. 생산 확인 (Doctor Box 높이 · 유리섬유 컷터 RPM · 단중 · 생산중량)</div>
          <table className="print-tbl">
            <thead>
              <tr style={{ background: '#ecfdf5' }}>
                <th colSpan={3}>↓ 권장값 (설정값 계산 시트 연동)</th>
                <th className="r">1.655</th>
                <th className="r">1.655</th>
                <th className="r">59.4</th>
                <th className="r">59.4</th>
                <th className="r">4.60</th>
                <th colSpan={4}></th>
              </tr>
              <tr>
                <th style={{ width: 30 }}>NO</th>
                <th className="r">제품 폭(mm)</th>
                <th className="r">생산 속도(m/min)</th>
                <th className="r">D/B 1(mm)</th>
                <th className="r">D/B 2(mm)</th>
                <th className="r">컷터1 RPM</th>
                <th className="r">컷터2 RPM</th>
                <th className="r">단중(Kg/㎡)</th>
                <th className="r">함침정도(%)</th>
                <th className="r">총중량(Kg)</th>
                <th className="r">실중량(Kg)</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 14 }).map((_, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center', height: 19 }}>{i + 1}</td>
                  <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                </tr>
              ))}
              <tr>
                <th colSpan={9} className="r">TTL (합계)</th>
                <th></th>
                <th></th>
                <th>생산수율: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;%</th>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* 2. SMC 생산일지 (기존 17롤 상세 양식 — 생산일지 (4) & 생산일지 0.5) */}
      {tab === 'prod_17' && (
        <section className="card printable doc-sheet">
          <div className="doc-banner" style={{ marginBottom: 8, paddingBottom: 8 }}>
            <div className="doc-brand">
              {s.companyLogo ? <img src={s.companyLogo} alt="logo" className="doc-logo" /> : <div className="brand-mark">SMC</div>}
              <div>
                <div className="doc-title">
                  SMC 생산일지 {prodSub === 'v4' ? '(생산일지 4 · 1배치 350kg 기준)' : '(생산일지 0.5 · 0.5배치 175kg × 2 Batch 기준)'}
                </div>
                <div className="doc-sub">출처: 하영 SMC-1.xlsx &amp; GRP_작업일지_개선_v6_1.xlsx 원본 양식</div>
              </div>
            </div>
            <table className="sign-box">
              <thead><tr><th>작성</th><th>검토</th><th>승인</th></tr></thead>
              <tbody><tr><td style={{ height: 28 }}></td><td></td><td></td></tr></tbody>
            </table>
          </div>

          <div className="print-sec-title">1. 기본사항</div>
          <table className="print-tbl" style={{ marginBottom: 8 }}>
            <tbody>
              <tr>
                <th>품명</th><td><b>SMC 물탱크용</b></td>
                <th>온도 / 습도 / 날씨</th><td>{blank ? '    ℃ /     % /    ' : '25 ℃ / 52 % / 맑음'}</td>
                <th>생산 Batch</th><td>{blank ? '    Batch' : prodSub === 'v4' ? '1 Batch' : '2 Batch (0.5×2)'}</td>
              </tr>
              <tr>
                <th>Lot</th><td>{blank ? 'HYVINA-WTG-          ' : prodSub === 'v4' ? 'HYVINA-WTG-260707-1~' : 'HYVINA-WTG-2606013-1~'}</td>
                <th>생산시간 / 비가동·청소</th><td>{blank ? '' : prodSub === 'v05' ? '13:00~16:00 / 생산준비 및 청소' : '생산준비 및 청소'}</td>
                <th>작업인원 / 생산중량</th><td>{blank ? '   명 /       Kg' : '6 명 / 0 Kg'}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <div className="print-sec-title">2. 원재료 투입량</div>
              <table className="print-tbl">
                <thead>
                  <tr>
                    <th>No</th><th>품목</th><th>규격</th>
                    <th className="r">사용량(Kg)</th><th className="r">총 원료 사용량(Kg)</th><th className="r">실 원료 사용량(Kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {(prodSub === 'v4'
                    ? [
                        ['1', '불포화수지', 'SC-637S', 350, 350, 1730],
                        ['2', '저수축제', 'PS40', 112.5, 112.5, 560],
                        ['3', '희석제', 'SM', 37.5, 37.5, 285],
                        ['3-2', '희석제', 'SM', 20, 20, 25],
                        ['4', '첨가제', 'K972', 5, 5, 25],
                        ['5', '첨가제', 'K996', 6.6, 6.6, 25],
                        ['6', '중합금지제', 'CBA109N', 8.5, 8.5, 42.5],
                        ['7', '경화제', 'TBPB', 6, 6, 30],
                        ['8', '초기 증점조절제', 'CBA308S', 7.5, 7.5, 25],
                        ['9', '저수축제', 'FHP', 25, 25, 125],
                        ['10', '이형제', 'HI-FLOW', 20, 20, 125],
                        ['11', '충진제', 'CaCO3', 825, 825, 4238],
                        ['12', '증점제', 'MGO-813', 14, 14, 52],
                        ['13', '조색제', 'GRAY (9098)', 20, 20, 88],
                        ['14', '유리섬유 (0.33)', '4800TEX', 717.92, 717.92, '-'],
                      ]
                    : [
                        ['1', '불포화수지', 'SC-637S', 175, 350, 200.56],
                        ['2', '저수축제', 'PS40', 56.25, 112.5, 64.48],
                        ['3', '희석제', 'SM', 18.75, 37.5, 32],
                        ['4', '희석제(추가)', 'SM', 10, 2.96, 25],
                        ['5', '첨가제', 'K972', 2.5, 2, 25],
                        ['5-2', '첨가제', 'K996', 2.5, 5, '-'],
                        ['6', '중합금지제', 'CBA109N', 4.25, 3.1, 42.5],
                        ['7', '경화제', 'TBPB', 3, 6, 30],
                        ['8', '초기 증점조절제', 'CBA308S', 3.25, 6.5, 25],
                        ['9', '저수축제', 'FHP', 12.5, 11.97, 125],
                        ['10', '이형제', 'HI-FLOW', 12.5, 11.97, 125],
                        ['11', '충진제', 'CaCO3', 425, 850, 4238],
                        ['12', '증점제', 'MGO-813', 5, 10, 52],
                        ['13', '조색제', 'GRAY (9098)', 10, 20, 88],
                        ['14', '유리섬유 (0.31)', '4800TEX', 332.69, 665.38, '-'],
                      ]
                  ).map(([no, name, grade, u1, u2, act]) => (
                    <tr key={String(no)}>
                      <td style={{ textAlign: 'center' }}>{no}</td>
                      <td>{name}</td>
                      <td>{grade}</td>
                      <td className="r">{fmt(Number(u1), 2)}</td>
                      <td className="r">{fmt(Number(u2), 2)}</td>
                      <td className="r">{blank ? '' : act}</td>
                    </tr>
                  ))}
                  <tr>
                    <th colSpan={3} className="r">TTL</th>
                    <th className="r">{prodSub === 'v4' ? '2,175.52' : '1,073.19'}</th>
                    <th className="r">{prodSub === 'v4' ? '2,175.52' : '2,094.88'}</th>
                    <th className="r">{blank ? '' : prodSub === 'v4' ? '7,375.5' : '-'}</th>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="print-sec-title">3. 점도 확인 (초기점도 및 증점거동 PS/℃)</div>
              <table className="print-tbl" style={{ marginBottom: 8 }}>
                <thead>
                  <tr><th>No.</th><th>초기점도</th><th>5분</th><th>10분</th><th>15분</th><th>20분</th><th>25분</th></tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <tr key={n}><td style={{ textAlign: 'center', height: 20 }}>{n}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                  ))}
                </tbody>
              </table>

              <div className="print-sec-title">4. 토출량 확인 (기준 총토출: {prodSub === 'v4' ? '33.9' : '34.0'} Kg/min)</div>
              <table className="print-tbl">
                <thead>
                  <tr>
                    <th>품목</th><th className="r">토출 비</th><th className="r">토출량</th>
                    <th className="r">실토출량(시작)</th><th className="r">실토출량(종료)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>컴파운드(Kg/min)</td>
                    <td className="r">{prodSub === 'v4' ? '0.9767' : '0.9797'}</td>
                    <td className="r">{prodSub === 'v4' ? '33.109' : '33.311'}</td>
                    <td></td><td></td>
                  </tr>
                  <tr>
                    <td>증점제(g/min)</td>
                    <td className="r">{prodSub === 'v4' ? '0.0096' : '0.0068'}</td>
                    <td className="r">{prodSub === 'v4' ? '325.604' : '229.575'}</td>
                    <td></td><td></td>
                  </tr>
                  <tr>
                    <td>조색제(g/min)</td>
                    <td className="r">{prodSub === 'v4' ? '0.0137' : '0.0135'}</td>
                    <td className="r">{prodSub === 'v4' ? '465.148' : '459.149'}</td>
                    <td></td><td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="print-sec-title">4. SMC 생산 확인 (1 ~ 17번 롤 기록)</div>
          <table className="print-tbl" style={{ marginBottom: 8 }}>
            <thead>
              <tr>
                <th>No</th><th>온도(℃)</th><th>습도(%)</th><th>제품 폭(mm)</th><th>생산 속도(m/min)</th>
                <th>D/B 1,2(mm)</th><th>CUTTER 1/2 RPM</th><th>단중(Kg/m2)</th><th>함침 정도(%)</th>
                <th>총 중량(Kg)</th><th>실 중량(Kg)</th><th>말기점도(PS/℃)</th><th>비고</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 17 }).map((_, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center', height: 18 }}>{i + 1}</td>
                  <td></td><td></td>
                  <td className="r">{!blank && i === 0 && prodSub === 'v4' ? '1100' : ''}</td>
                  <td className="r">{!blank && i === 0 && prodSub === 'v4' ? '10' : ''}</td>
                  <td className="r">{!blank && i === 0 && prodSub === 'v4' ? '1.5/1.5' : ''}</td>
                  <td className="r">{!blank && i === 0 && prodSub === 'v4' ? '59/59' : ''}</td>
                  <td className="r">{!blank && i === 0 && prodSub === 'v4' ? '4.6(5.06)' : ''}</td>
                  <td></td><td></td><td></td><td></td><td></td>
                </tr>
              ))}
              <tr>
                <th colSpan={10} className="r">TTL</th>
                <th></th>
                <th>생산수율</th>
                <th></th>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 8 }}>
            <div>
              <div className="print-sec-title">5. 유리섬유 체크</div>
              <table className="print-tbl" style={{ marginBottom: 8 }}>
                <thead>
                  <tr><th>구분</th><th>CPIC</th><th>CPIC</th><th>WEIBO</th><th>WEIBO</th></tr>
                </thead>
                <tbody>
                  <tr><th>유리 섬유 Lot</th><td style={{ height: 22 }}></td><td></td><td></td><td></td></tr>
                  <tr><th>롤 사용량 (Kg)</th><td style={{ height: 22 }}></td><td></td><td></td><td></td></tr>
                  <tr><th>전체사용량 (Kg)</th><td colSpan={4}></td></tr>
                  <tr><th>유리섬유 함량</th><td colSpan={4}></td></tr>
                </tbody>
              </table>
              <div className="print-sec-title">7. 특이사항 및 조치</div>
              <div style={{ border: '1px solid #000', minHeight: 54, padding: 6 }}></div>
            </div>
            <div>
              <div className="print-sec-title">6. 출고 전 최종 품질 확인</div>
              <table className="print-tbl">
                <thead>
                  <tr><th>점검 항목</th><th>관리 기준</th><th>점검결과</th><th>판정</th></tr>
                </thead>
                <tbody>
                  <tr><td>시트가장자리</td><td>R/V 돌출 및 커팅불량 없을것</td><td></td><td></td></tr>
                  <tr><td>시트 점착성</td><td>필름을 벗길때 너무 끈적거리지 않은가?</td><td></td><td></td></tr>
                  <tr><td>표면 함침 상태</td><td>육안상 함침이 미비한곳이 없는가?</td><td></td><td></td></tr>
                  <tr><td>이물질 혼입</td><td>금속 및 기타 이물질 혼입 여부</td><td></td><td></td></tr>
                  <tr><td>포장</td><td>포장 상태는 양호한가?</td><td></td><td></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 3. 배합 생산 지시서 (40% / 30%) — 하영 SMC-1.xlsx 시트 3 & 시트 4 원형 그대로 */}
      {tab === 'mix_sheet' && (
        <section className="card printable doc-sheet">
          <div className="doc-banner" style={{ marginBottom: 10, paddingBottom: 10 }}>
            <div className="doc-brand">
              {s.companyLogo ? <img src={s.companyLogo} alt="logo" className="doc-logo" /> : <div className="brand-mark">SMC</div>}
              <div>
                <div className="doc-title">배합 생산 지시서 ({mixSub === '40' ? '40% 기준 · 배합지시서(40%)' : '30% 기준 · 배합지시서(30%)'})</div>
                <div className="doc-sub">출처: 하영 SMC-1.xlsx 「{mixSub === '40' ? '배합지시서(40%) (2)' : '배합지시서 (30%)'}」 시트 원형</div>
              </div>
            </div>
            <table className="sign-box">
              <thead><tr><th>작성</th><th>검토</th><th>승인</th></tr></thead>
              <tbody><tr><td style={{ height: 28 }}></td><td></td><td></td></tr></tbody>
            </table>
          </div>

          <div className="print-sec-title">1. 기본 사항</div>
          <table className="print-tbl" style={{ marginBottom: 10 }}>
            <tbody>
              <tr>
                <th>품명</th><td><b>SMC 물탱크</b></td>
                <th>온도(℃) / 습도(%)</th><td>{blank ? '      ℃ /       %' : '25 ℃ / 50 %'}</td>
                <th>배합작업자</th><td>{blank ? '' : '김길동 / 박말순'}</td>
                <th>생산 Batch</th><td>{blank ? '    Batch' : mixSub === '40' ? '1 Batch (0.5)' : '2 Batch'}</td>
              </tr>
              <tr>
                <th>Lot No</th><td>{blank ? 'HYVINA-WTG-        ' : mixSub === '40' ? 'HYVINA-WTG' : 'HYVINA WTG 260505-01~'}</td>
                <th>배합시간</th><td colSpan={3}></td>
                <th>생산량 (KG)</th><td className="r"><b>{mixSub === '40' ? '2,110.87 KG' : '2,168.69 KG'}</b></td>
              </tr>
            </tbody>
          </table>

          <div className="print-sec-title">2. 배합 순서 및 확인 사항</div>
          <table className="print-tbl" style={{ marginBottom: 10 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ width: 34 }}>순번</th>
                <th rowSpan={2}>품목</th>
                <th rowSpan={2}>규격</th>
                <th rowSpan={2} className="r">1배치 투입량(Kg)</th>
                <th rowSpan={2} className="r">총 투입량(Kg)</th>
                <th colSpan={6} style={{ textAlign: 'center' }}>실제 투입량 확인 (배치별 서명/체크)</th>
                <th rowSpan={2} className="r">교반기 속도(RPM)</th>
                <th rowSpan={2}>비고</th>
              </tr>
              <tr>
                <th style={{ textAlign: 'center', width: 42 }}>{mixSub === '40' ? '0.5' : '1'}</th>
                <th style={{ textAlign: 'center', width: 42 }}>2</th>
                <th style={{ textAlign: 'center', width: 42 }}>3</th>
                <th style={{ textAlign: 'center', width: 42 }}>4</th>
                <th style={{ textAlign: 'center', width: 42 }}>5</th>
                <th style={{ textAlign: 'center', width: 42 }}>6</th>
              </tr>
            </thead>
            <tbody>
              {(mixSub === '40'
                ? [
                    ['1', '불포화수지', 'SC-637S', '350', '175', '400', ''],
                    ['2', '저수축제', 'PS40', '112.5', '56.25', '400', ''],
                    ['3', '희석제', 'SM', '37.5', '18.75', '400', '점도 이상시 5~10kg 투입'],
                    ['4', '첨가제', 'K972', '5', '2.5', '400', ''],
                    ['5', '첨가제', 'K996', '5', '2.5', '400', ''],
                    ['6', '중합금지제', 'CBA109N', '8.5', '4.25', '400', ''],
                    ['7', '경화제', 'TBPB', '6', '3', '400', ''],
                    ['8', '초기 증점조절제', 'CBA308S', '5', '2.5', '400', ''],
                    ['9', '저수축제', 'FHP', '25', '12.5', '600', ''],
                    ['10', '이형제', 'HI-FLOW', '25', '12.5', '600', ''],
                    ['11', '충진제', 'S-3000 (CaCO3)', '850', '425', '750~950', '45℃ 이하 관리'],
                    ['-', '탈포 교반', '-', '-', '0', '150', '*탈포'],
                    ['12', '증점제', 'MGO-813', '11', '5.5', '비율 0.0077', '별도 계량'],
                    ['13', '조색제', 'GRAY (9098)', '16', '8', '비율 0.0112', '별도 계량'],
                    ['14', '유리섬유', '4800TEX', '0.31 (654.37)', '-', '-', 'GF 31%'],
                  ]
                : [
                    ['1', '불포화수지', 'SC-637S', '180', '360', '400', ''],
                    ['2', '저수축제', 'PS30', '80', '160', '400', ''],
                    ['3', '첨가제', 'K972', '2.5', '5', '400', ''],
                    ['4', '첨가제', 'K996', '2.5', '5', '400', ''],
                    ['5', '희석제', 'SM', '18.8', '37.6', '400', ''],
                    ['6', '중합금지제', 'CBA109N', '3.8', '7.6', '400', ''],
                    ['7', '경화제', 'TBPB', '3', '6', '400', ''],
                    ['8', '초기 증점조절제', 'CBA308S', '3.8', '7.6', '600', ''],
                    ['9', '저수축제', 'FHP', '12.5', '25', '600', ''],
                    ['10', '이형제', 'HI-FLOW', '12.5', '25', '600', ''],
                    ['11', '충진제', 'S-3000 (CaCO3)', '430', '860', '750~950', '45℃이하 관리'],
                    ['-', '탈포 공정', '-', '-', '-', '150', '*탈포'],
                    ['12', '증점제', 'MGO-813', '3.76', '7.51', '비율 0.0050', '별도 계량'],
                    ['13', '조색제', 'GRAY (9098)', '10.02', '20.04', '비율 0.0134', '별도 계량'],
                    ['14', '유리섬유', '4800TEX', '0.30 (321.17)', '642.34', '-', 'GF 30%'],
                  ]
              ).map(([no, name, grade, q1, q2, rpm, note]) => (
                <tr key={String(no) + String(name)}>
                  <td style={{ textAlign: 'center' }}>{no}</td>
                  <td><b>{name}</b></td>
                  <td>{grade}</td>
                  <td className="r">{q1}</td>
                  <td className="r">{q2}</td>
                  <td></td><td></td><td></td><td></td><td></td><td></td>
                  <td className="r">{rpm}</td>
                  <td>{note}</td>
                </tr>
              ))}
              <tr>
                <th colSpan={3} className="r">TTL</th>
                <th className="r">{mixSub === '40' ? '2,110.87' : '1,084.35'}</th>
                <th className="r">{mixSub === '40' ? '1,055.43' : '2,168.69'}</th>
                <th colSpan={8}></th>
              </tr>
            </tbody>
          </table>

          <div className="print-sec-title">3. Compound 점도 관리</div>
          <table className="print-tbl" style={{ marginBottom: 10 }}>
            <thead>
              <tr>
                <th style={{ width: 45 }}>순번</th>
                <th>초기점도 (PS/℃)</th>
                <th>5분 (PS/℃)</th>
                <th>10분 (PS/℃)</th>
                <th>15분 (PS/℃)</th>
                <th>20분 (PS/℃)</th>
                <th>25분 (PS/℃)</th>
                <th>말기점도 (PS/℃)</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <tr key={n}>
                  <td style={{ textAlign: 'center', height: 22 }}>{n}</td>
                  <td style={{ textAlign: 'center' }}>{!blank && n === 1 && mixSub === '30' ? '123 / 35' : ''}</td>
                  <td style={{ textAlign: 'center' }}>{!blank && n === 1 && mixSub === '30' ? '123 / 33' : ''}</td>
                  <td style={{ textAlign: 'center' }}>{!blank && n === 1 && mixSub === '30' ? '200 / 33' : ''}</td>
                  <td style={{ textAlign: 'center' }}>{!blank && n === 1 && mixSub === '30' ? '450 / 33' : ''}</td>
                  <td style={{ textAlign: 'center' }}>{!blank && n === 1 && mixSub === '30' ? '500 / 33' : ''}</td>
                  <td style={{ textAlign: 'center' }}>{!blank && n === 1 && mixSub === '30' ? '650 / 30' : ''}</td>
                  <td style={{ textAlign: 'center' }}>{!blank && n === 1 && mixSub === '30' ? '4.5 × 10⁵' : ''}</td>
                  <td>{!blank && n === 1 && mixSub === '30' ? '이상없음' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div className="print-sec-title">4. 기타 특이 사항</div>
              <div style={{ border: '1px solid #000', minHeight: 74, padding: 6 }}></div>
            </div>
            <div>
              <div className="print-sec-title">참고: 40% 지시서 우측 하단 3계통 토출량 메모 (총 41.3 kg/min 기준)</div>
              <table className="print-tbl">
                <thead><tr><th>구분</th><th className="r">토출 비율</th><th className="r">목표 토출량</th><th>단위</th></tr></thead>
                <tbody>
                  <tr><td>컴파운드 (Paste A)</td><td className="r">0.98146</td><td className="r">40.534</td><td>kg/min</td></tr>
                  <tr><td>증점제 (MGO-813)</td><td className="r">0.00755</td><td className="r">311.912</td><td>g/min</td></tr>
                  <tr><td>조색제 (GRAY 9098)</td><td className="r">0.01099</td><td className="r">453.690</td><td>g/min</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 4. 완제품 라벨 양식 — SMC_공정표준서-1.xlsx 시트 3 '완제품 라벨' 원형 */}
      {tab === 'label_sheet' && (
        <section className="card printable doc-sheet">
          <header className="noprint">
            <h3>완제품 라벨 표준 양식 (출처: SMC_공정표준서-1.xlsx 「완제품 라벨」 시트)</h3>
          </header>
          {[0, 1].map((idx) => (
            <div key={idx}>
              {idx === 1 && (
                <div className="mute" style={{ margin: '14px 0', letterSpacing: 2 }}>
                  ✂ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ✂
                </div>
              )}
              <div className="label" style={{ width: 460 }}>
                <div className="t" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  {s.companyLogo && <img src={s.companyLogo} alt="logo" style={{ height: 22, maxWidth: 80, objectFit: 'contain' }} />}
                  <span>PRODUCT LABEL</span>
                </div>
                <div className="lr" style={{ gridTemplateColumns: '1.3fr 1fr 1fr' }}>
                  <div><small>품명 PRODUCT NAME</small><b>{blank ? '' : 'SMCSHEETWTR33'}</b></div>
                  <div><small>생산일자 DATE</small><b>{blank ? '' : '2026-07-10'}</b></div>
                  <div><small>사용기한 EXPIRY DATE</small><b>{blank ? '' : '2026-09-10'}</b></div>
                </div>
                <div className="lr" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
                  <div><small>LOT NO.</small><b>{blank ? '' : 'HYVN260710-01'}</b></div>
                  <div><small>유리섬유 함량 GF Content (%)</small><b>{blank ? '' : '33'}</b></div>
                </div>
                <div className="lr" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div><small>총 중량 GROSS WEIGHT (Kg)</small><b>{blank ? '' : '1,152'}</b></div>
                  <div><small>실 중량 NET WEIGHT (Kg)</small><b>{blank ? '' : '1,099'}</b></div>
                </div>
                <div style={{ padding: '8px 10px', fontSize: 11.5 }}>
                  <small>특이사항 REMARKS · {s.companyName}</small>
                  * 직사광선 금지 Keep out of direct sunlight<br />
                  * 냉암소 보관 Store in a cool, dark place (Max. 25°C)
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  )
}
