import { useState } from 'react'
import { Badge, Notice } from '../ui'
import { useDB } from '../store'

type TabKey = 'std' | 'guide' | 'sheet' | 'machine'

export default function Standard() {
  const db = useDB()
  const s = db.settings
  const [tab, setTab] = useState<TabKey>('std')
  const [vi, setVi] = useState<boolean>(true)

  return (
    <>
      <div className="row noprint" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="seg-tabs">
          <button className={tab === 'std' ? 'on' : ''} onClick={() => setTab('std')}>
            1. SMC 생산 공정 표준서 (SMC-STD-001)
          </button>
          <button className={tab === 'guide' ? 'on' : ''} onClick={() => setTab('guide')}>
            2. 공정별 핵심 가이드 (실무 상세본)
          </button>
          <button className={tab === 'sheet' ? 'on' : ''} onClick={() => setTab('sheet')}>
            3. 시트 관리 핵심 수칙 (한·베트남어)
          </button>
          <button className={tab === 'machine' ? 'on' : ''} onClick={() => setTab('machine')}>
            4. 기계 관리·예방보전 가이드 (한·베트남어)
          </button>
        </div>
        <div className="row">
          {(tab === 'sheet' || tab === 'machine') && (
            <label className="row" style={{ fontSize: 13, cursor: 'pointer', marginRight: 6 }}>
              <input type="checkbox" checked={vi} onChange={(e) => setVi(e.target.checked)} />
              <span>베트남어(Tiếng Việt) 원문 병기</span>
            </label>
          )}
          <button className="btn pri" onClick={() => window.print()}>
            🖨️ 현재 매뉴얼 인쇄
          </button>
        </div>
      </div>

      {/* 1. SMC 생산 공정 표준서 (SMC_공정표준서-1.xlsx 'SMC 공정 표준서' 시트 전문) */}
      {tab === 'std' && (
        <section className="card printable doc-sheet">
          <div className="doc-banner">
            <div className="doc-brand">
              {s.companyLogo ? (
                <img src={s.companyLogo} alt="logo" className="doc-logo" />
              ) : (
                <div className="brand-mark">SMC</div>
              )}
              <div>
                <div className="doc-title">SMC 생산 공정 표준서 / SMC Production Process Standard</div>
                <div className="doc-sub">출처: SMC_공정표준서-1.xlsx · {s.companyName}</div>
              </div>
            </div>
            <div className="doc-meta-box">
              <div><span>작성일</span><b>2025년 6월</b></div>
              <div><span>문서번호</span><b>SMC-STD-001</b></div>
              <div><span>개정</span><b>Rev.01</b></div>
              <div><span>승인현장</span><b>{s.siteCode}</b></div>
            </div>
          </div>

          {/* 1. 원재료 배합 공정 */}
          <div className="std-sec">
            <div className="std-sec-head">
              <span className="std-num">1</span>
              <div>
                <h3>원재료 배합 공정 (Compounding Standard)</h3>
                <p>배합은 화학적 균질성을 결정하는 핵심 공정입니다. 투입 순서와 정밀 계량은 품질의 기본입니다.</p>
              </div>
            </div>

            <h4>■ 원재료 투입 프로세스 (Sequence of Addition)</h4>
            <p className="mute" style={{ margin: '0 0 10px' }}>
              분산 효율 극대화 및 미세 기포 방지를 위해 반드시 아래 순서를 엄수합니다.
            </p>
            <div className="scroll" style={{ marginBottom: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>단계</th>
                    <th style={{ width: 250 }}>공정명</th>
                    <th>세부 설명 및 투입 원료</th>
                    <th style={{ width: 170 }}>교반 속도 / 주의사항</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><Badge kind="info">STEP 1</Badge></td>
                    <td><b>메인 액상 및 저수축제 혼합</b><br /><small className="mute">(Base Liquids)</small></td>
                    <td>
                      가장 양이 많고 기초가 되는 액체들을 먼저 섞습니다.<br />
                      <b>투입 원료 : 불포화수지 + 저수축제 + SM(희석제)</b>
                    </td>
                    <td><b>400 RPM</b></td>
                  </tr>
                  <tr>
                    <td><Badge kind="info">STEP 2</Badge></td>
                    <td><b>희석제, 첨가제 및 중합방지제 투입</b><br /><small className="mute">(Additives)</small></td>
                    <td>
                      수지의 안정성과 분산력을 높이는 성분들을 넣습니다.<br />
                      <b>투입 원료 : SM(희석제) + K996(분산제) + K972(분리방지제) + CBA109N(중합방지제)</b>
                    </td>
                    <td><b>400 RPM</b></td>
                  </tr>
                  <tr>
                    <td><Badge kind="info">STEP 3</Badge></td>
                    <td><b>경화제 투입</b><br /><small className="mute">(Initiator)</small></td>
                    <td>
                      <b>투입 원료 : T-BPB(경화제)</b> (+ 초기증점조절제 CBA308S)<br />
                      Liquid Phase 투입 후 파우더류 전 한번 고속으로 교반합니다. → <b>600 RPM</b>
                    </td>
                    <td><b>600 RPM</b></td>
                  </tr>
                  <tr>
                    <td><Badge kind="info">STEP 4</Badge></td>
                    <td><b>내부이형제 및 PE 파우더</b><br /><small className="mute">(Release Agents &amp; Powders)</small></td>
                    <td>
                      <b>투입 원료 : ZN-ST / HI-FLOW(내부이형제) + FHP05040(PE 파우더)</b>
                    </td>
                    <td><b>600 RPM</b></td>
                  </tr>
                  <tr>
                    <td><Badge kind="warn">STEP 5</Badge></td>
                    <td><b>충진제 대량 투입</b><br /><small className="mute">(Main Filler)</small></td>
                    <td>
                      <b>투입 원료 : CaCO3(충진제)</b><br />
                      전체 배합량의 40%를 차지합니다. 2~3회로 나누어 투입하며 고속 교반합니다.
                    </td>
                    <td>
                      <b>750~{s.mixRpmMax} RPM</b><br />
                      <span className="bad-text">{s.fillerTempMaxC}℃ 이상 상승 금지!</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Notice kind="bad">
              <b>⚠ 주의 ▶ 충진제 투입 중 온도 {s.fillerTempMaxC}℃ 이상 상승 금지! 냉각 관리 철저 (배합기 마찰열 주의)</b><br />
              ※ 각 단계별 성분이 시각적으로 완전히 균일해질 때까지 충분히 교반하여 물성 편차를 방지합니다. (MAX {s.mixRpmMax} RPM)
            </Notice>

            <h4>■ 공정 관리 항목 (Management Points)</h4>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 180 }}>관리 항목</th>
                    <th>내용</th>
                    <th style={{ width: 180 }}>기준 / 비고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>실수 방지 (Poka-Yoke)</b></td>
                    <td>배합기 옆 투입 체크리스트 및 배합 지시서에 투입 즉시 서명 → 휴먼 에러 원천 차단</td>
                    <td><Badge kind="ok">배합 지시서 필수 날인</Badge></td>
                  </tr>
                  <tr>
                    <td><b>교반 제어</b></td>
                    <td>지정 RPM으로 교반, 고속 교반 시 마찰열 과도 발생 주의</td>
                    <td><b>MAX {s.mixRpmMax} RPM</b></td>
                  </tr>
                  <tr>
                    <td><b>초기 점도 검사</b></td>
                    <td>
                      배합 직후 점도 측정으로 레시피 준수 여부 최종 판정<br />
                      <small className="mute">* 검사 전 시료 컵/병을 수차례 테이블에 태핑(Tapping)</small>
                    </td>
                    <td>예) <b>150P / 35℃</b></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. 시트 제조 및 유리섬유 투입 */}
          <div className="std-sec">
            <div className="std-sec-head">
              <span className="std-num">2</span>
              <div>
                <h3>시트 제조 및 유리섬유 투입 (Sheet Production)</h3>
                <p>물리적 형상 구현 및 GF(유리섬유) 함량을 제어하는 단계입니다.</p>
              </div>
            </div>

            <div className="grid g2">
              <div className="std-box">
                <h4>■ 시트 제조 (Production)</h4>
                <ul className="std-list">
                  <li><b>▶ SMC 기계 투입:</b> 펌프 토출 압력, 레진, 증점제 및 착색제 정량 확인 실시</li>
                  <li><b>▶ 닥터박스 도포:</b> 닥터박스 높이(Gap) 정밀 조정 / 수지 도포 두께 및 흐름의 균일성 상시 확인</li>
                  <li><b>▶ 필름 주름·사행 관리:</b> 필름이 울거나 접히면 수지 도포 불균일 → 성형 불량 원인 직결</li>
                  <li><b>※ 상시 점검:</b> 상/하부 필름 공급 롤의 텐션 브레이크(Tension Brake) 압력을 확인하여 필름이 팽팽하게 유지되는지 체크합니다.</li>
                  <li><b>※ 가이드 세팅:</b> 필름 가장자리가 말리거나 주름 발생 시 즉시 수평 가이드를 재세팅합니다.</li>
                </ul>
              </div>
              <div className="std-box">
                <h4>■ 유리섬유(GF) 투입</h4>
                <p className="mute" style={{ margin: '0 0 6px', fontSize: 12.5 }}>제품 설계 강도에 맞게 유리섬유가 균일하게 도포되는지 확인하는 과정입니다.</p>
                <ul className="std-list">
                  <li><b>▶ 커터 속도 동기화:</b> 라인 속도(m/min) ↔ 커터 회전수(RPM) 연동 확인, 설정 %값(예: 25%, 30%, 33%)에 맞게 투입되는지 상시 모니터링</li>
                  <li><b>▶ 도포 폭 확인:</b> 시트 전체 폭에 걸쳐 빈 곳 없이 골고루 퍼지는지 확인 (가장자리 부족 현상 주의)</li>
                  <li><b>▶ 실측 검사(중량법):</b> 배치 초기·중간 일정 면적 시트 채취 → <code>전체 중량 − 수지 중량 = GF 중량</code> → 실제 투입 % 역산</li>
                </ul>
              </div>
            </div>
            <Notice kind="warn">
              <div>
                <b>⚠ 커터 블레이드(Cutter Blade) 마모 감시 ▶</b> 유리섬유가 정장(25mm/50mm)으로 잘리지 않고 뭉쳐 덜렁거리는 가닥이 수지 위로 유입 시 즉각 점검!<br />
                <b>⚠ 분산 슈트 정전기·청결 관리 ▶</b> 슈트 오염 시 유리섬유가 불균일하게 낙하합니다. 롤 교체 시마다 커터 장치 및 분산기 내부를 청결하게 유지하십시오.
              </div>
            </Notice>
          </div>

          {/* 3. 함침 및 포장 */}
          <div className="std-sec" style={{ marginBottom: 0 }}>
            <div className="std-sec-head">
              <span className="std-num">3</span>
              <div>
                <h3>함침 및 포장 (Impregnation &amp; Packaging)</h3>
                <p>투입된 유리섬유 가닥 사이의 공기를 완전히 빼내고 수지를 흡수시키는 핵심 단계입니다.</p>
              </div>
            </div>

            <h4>■ 에어 실린더 정격 압력 관리</h4>
            <div className="grid g2" style={{ marginBottom: 12 }}>
              <div className="std-box warn-border">
                <h4>⬇ 압력 부족 시 불량</h4>
                <ul className="std-list">
                  <li>미세 공기 잔류 → 숙성 중 조기 경화</li>
                  <li>물탱크 성형 시 표면 하얗게 뜨는 함침 불량(Wet-out 부실) 및 기포(Blister) 불량 유발</li>
                </ul>
              </div>
              <div className="std-box bad-border">
                <h4>⬆ 압력 과다 시 불량</h4>
                <ul className="std-list">
                  <li>수지가 필름 측면 터짐 (Compound Bleeding)</li>
                  <li>유리섬유 과압착으로 기계적 충격 강도 저하</li>
                </ul>
              </div>
            </div>

            <h4>■ 메쉬벨트-롤러 속도 동기화</h4>
            <Notice kind="info">
              <div>
                <b>메쉬벨트 주행 속도 ↔ 함침 롤러 회전 속도 완벽 일치 필수</b><br />
                ⚠ 속도 미세 불일치 → 슬립(Slip) 현상 발생 → 시트 표면 필름 밀림 / 수지층 찢어짐. 구동 모터 RPM 상태를 실시간 체크하십시오.
              </div>
            </Notice>

            <h4>■ 시트 검사 항목</h4>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 200 }}>검사 항목</th>
                    <th>검사 방법</th>
                    <th style={{ width: 200 }}>관리 기준</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>단 중 (Areal Weight)</b></td>
                    <td>일정 면적 채취 후 중량 측정</td>
                    <td><Badge kind="ok">설계 기준 ±{s.arealTolKg}kg</Badge></td>
                  </tr>
                  <tr>
                    <td><b>함침성 (Wet-out)</b></td>
                    <td>육안 및 투과 검사</td>
                    <td><Badge kind="ok">기포·백화 없음</Badge></td>
                  </tr>
                  <tr>
                    <td><b>폭 (Width)</b></td>
                    <td>양단 및 중앙 3점 측정</td>
                    <td><Badge kind="ok">설계 폭 ±{s.widthTolMm}mm</Badge></td>
                  </tr>
                  <tr>
                    <td><b>두 께 (Thickness)</b></td>
                    <td>버니어 캘리퍼스 측정</td>
                    <td><Badge kind="ok">설계 두께 ±{s.thicknessTolMm}mm</Badge></td>
                  </tr>
                  <tr>
                    <td><b>말기 점도 (Final Viscosity)</b></td>
                    <td>숙성 후 RAMY 점도계 측정 → 데이터화</td>
                    <td><Badge kind="info">설계 점도 기준 이내</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mute" style={{ marginTop: 10, marginBottom: 0 }}>
              ※ 본 표준서는 생산 현장에 게시하여 전 작업자가 숙지하도록 합니다. | 이상 발생 시 즉시 품질팀에 보고
            </p>
          </div>
        </section>
      )}

      {/* 2. SMC 공정별 핵심 가이드 (하영 SMC-1.xlsx 'SMC 공정별 핵심 가이드' 시트 원문 전문) */}
      {tab === 'guide' && (
        <section className="card printable doc-sheet">
          <div className="doc-banner">
            <div className="doc-brand">
              {s.companyLogo ? <img src={s.companyLogo} alt="logo" className="doc-logo" /> : <div className="brand-mark">SMC</div>}
              <div>
                <div className="doc-title">SMC 공정별 핵심 가이드 (현장 실무 상세 매뉴얼)</div>
                <div className="doc-sub">출처: 하영 SMC-1.xlsx 「SMC 공정별 핵심 가이드」 시트 원문 전문</div>
              </div>
            </div>
            <div className="doc-meta-box">
              <div><span>구분</span><b>현장 작업자 교육·실무 지침</b></div>
              <div><span>적용현장</span><b>{s.siteCode}</b></div>
            </div>
          </div>

          <div className="std-sec">
            <div className="std-sec-head">
              <span className="std-num">1</span>
              <div>
                <h3>1. 원재료 배합 공정 (Compounding Standard)</h3>
                <p>배합은 화학적 균질성을 결정하는 핵심 공정입니다. 투입 순서와 정밀 계량은 품질의 기본입니다.</p>
              </div>
            </div>
            <div className="std-box" style={{ marginBottom: 12 }}>
              <h4>■ 원재료 투입 프로세스 (Sequence of Addition)</h4>
              <p className="mute" style={{ marginTop: 0 }}>분산 효율 극대화 및 미세 기포 방지를 위해 반드시 아래 순서를 엄수합니다.</p>
              <ul className="std-list">
                <li>
                  <b>1단계: 메인 액상 및 저수축제 혼합 (Base Liquids)</b><br />
                  가장 양이 많고 기초가 되는 액체들을 먼저 섞습니다.<br />
                  <span className="mute">투입 원료: 불포화수지 + 저수축제 + SM(희석제)</span>
                </li>
                <li>
                  <b>2단계: 희석제, 첨가제 및 중합방지제 투입 (Additives)</b><br />
                  수지의 안정성과 분산력을 높이는 성분들을 넣습니다.<br />
                  <span className="mute">투입 원료: SM(희석제) + K996(분산제) + K972(분리방지제) + CBA109N(중합방지제)</span>
                </li>
                <li>
                  <b>3단계: 경화제 투입 (Initiator)</b><br />
                  <span className="mute">투입 원료: T-BPB(경화제)</span><br />
                  Liquid Phase 투입 후 파우더류 전 한번 고속으로 교반해 줍니다. <b>(600RPM)</b>
                </li>
                <li>
                  <b>4단계: 내부이형제 및 PE 파우더 (Release Agents &amp; Powders)</b><br />
                  <span className="mute">투입 원료: ZN-ST(내부이형제) + FHP05040(PE 파우더)</span>
                </li>
                <li>
                  <b>5단계: 충진제 대량 투입 (Main Filler)</b><br />
                  <span className="mute">투입 원료: CaCO3(충진제)</span><br />
                  전체 배합량의 40%를 차지하므로, 2~3회에 나누어 넣으면서 고속 교반합니다.<br />
                  <span className="bad-text">주의: 이때 온도가 45℃ 이상 올라가지 않도록 냉각에 신경 써야 합니다. (배합기 열 발생 주의)</span>
                </li>
              </ul>
              <p style={{ margin: '8px 0 0', fontWeight: 600 }}>
                * 각 단계별로 성분이 완전히 시각적으로 균일해질 때까지 충분히 교반 시간을 주어야 물성 편차가 없습니다. (MAX 950RPM)
              </p>
            </div>

            <div className="std-box">
              <h4>■ 공정 관리 항목 (Management Points)</h4>
              <ul className="std-list">
                <li><b>실수 방지(Poka-Yoke):</b> 배합기 옆 &apos;투입 체크리스트&apos; 및 배합 지시서에 투입 즉시 서명하여 휴먼 에러를 원천 차단합니다.</li>
                <li><b>교반 제어:</b> 지정된 RPM으로 교반하되, 고속 교반 시 발생하는 마찰열이 과도하게 발생하지 않도록 주의합니다.</li>
                <li><b>초기 점도 검사:</b> 배합 직후 점도를 측정하여 레시피 준수 여부를 최종 판정합니다. (예: 150P/35℃)<br />
                  <span className="mute">* 점도 검사 전 시료가 담긴 컵 혹은 병을 수차례 테이블에 두드릅니다.(태핑)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="std-sec">
            <div className="std-sec-head">
              <span className="std-num">2</span>
              <div>
                <h3>2. 시트 제조 및 유리섬유 투입 (Sheet Production)</h3>
                <p>물리적 형상 구현 및 GF(유리섬유) 함량을 제어하는 단계입니다.</p>
              </div>
            </div>
            <div className="grid g2">
              <div className="std-box">
                <h4>■ 시트 제조 (Production)</h4>
                <ul className="std-list">
                  <li><b>SMC 기계 투입:</b> 펌프 토출 압력, 레진, 증점제 및 착색제 정량 확인을 실시합니다.</li>
                  <li><b>닥터박스 도포:</b> 닥터박스 높이(Gap)를 정밀 조정하고 수지 도포 두께 및 흐름의 균일성을 상시 확인합니다.</li>
                  <li><b>필름 주름 및 사행 상시 관리:</b> 필름이 울거나 접히면 수지 도포가 불균일해지고 성형 시 불량의 원인이 됩니다.</li>
                  <li><b>* 상시 점검:</b> 상/하부 필름 공급 롤의 텐션 브레이크(Tension Brake) 압력을 확인하여 필름이 팽팽하게 유지되는지 체크합니다.</li>
                  <li><b>* 수평 가이드:</b> 필름 가장자리가 말리거나 주름이 생기면 즉시 수평 가이드를 재세팅합니다.</li>
                </ul>
              </div>
              <div className="std-box">
                <h4>■ 유리섬유(GF) 투입</h4>
                <p className="mute" style={{ marginTop: 0 }}>제품 설계 강도에 맞게 유리섬유가 균일하게 도포되는지 확인하는 과정입니다.</p>
                <ul className="std-list">
                  <li><b>커터 속도 동기화:</b> 라인 속도(m/min)와 커터 회전수(RPM)가 연동되어 설정된 %값(예: 25%, 30%)에 맞게 투입되는지 상시 모니터링합니다.</li>
                  <li><b>도포 폭 확인:</b> 유리섬유가 시트 전체 폭에 걸쳐 빈 곳 없이 골고루 퍼지는지 확인합니다. (가장자리 부족 현상 주의)</li>
                  <li><b>실측 검사(중량법):</b> 매 배치 초기와 중간에 일정 면적의 시트를 채취하여 <code>[전체 중량 - 수지 중량 = 유리섬유 중량]</code>을 계산해 실제 투입 %를 역산합니다.</li>
                </ul>
              </div>
            </div>
            <div className="std-box warn-border" style={{ marginTop: 12 }}>
              <ul className="std-list">
                <li>
                  <b>* 커터 블레이드(Cutter Blade) 마모 상태 감시:</b><br />
                  생산 중 유리섬유가 정장(25mm 또는 50mm)으로 깔끔하게 잘리지 않고 뭉쳐서 덜렁거리며 떨어지는 가닥(안 잘린 가닥)이 수지 위로 유입되는지 육안으로 상시 감시해야 합니다. 칼날이나 고무 롤러에 파임이 생기면 그 즉시 국부적 함침 불량이 발생하므로 롤 교체 시마다 커터 장치를 점검하십시오.
                </li>
                <li>
                  <b>* 분산 슈트 정전기 및 청결 관리:</b><br />
                  분산 슈트에 유리섬유 가루나 수지가 튀어 오염되면 유리섬유가 불균일하게 떨어집니다. 시트 전 면적에 설계 함량(30% 또는 40%)이 균등하게 배분되도록 분산기 내부를 상시 청결하게 유지하십시오.
                </li>
              </ul>
            </div>
          </div>

          <div className="std-sec" style={{ marginBottom: 0 }}>
            <div className="std-sec-head">
              <span className="std-num">3</span>
              <div>
                <h3>3. 함침 및 포장 (Impregnation &amp; Packaging)</h3>
                <p>투입된 유리섬유(CPIC, WEIBO 등) 가닥 사이사이의 공기를 완전히 빼내고 수지를 흡수시키는 핵심 단계입니다.</p>
              </div>
            </div>
            <div className="std-box">
              <h4>■ 에어 실린더 정격 압력 준수</h4>
              <ul className="std-list">
                <li>
                  <b className="bad-text">* 압력 부족 시 현장 다발 불량:</b> 유리섬유 가닥 내부에 미세 공기가 잔류하여 숙성 중 조기 경화가 오거나, 추후 물탱크 성형 시 표면이 하얗게 뜨는 함침 불량(Wet-out 부실) 및 기포(Blister) 불량을 유발합니다.
                </li>
                <li>
                  <b className="bad-text">* 압력 과다 시:</b> 수지가 필름 측면으로 터져 나와 설비를 오염시키는 떡짐 현상(Compound Bleeding)이 발생하고, 유리섬유 가닥이 과압착으로 깎여 완제품의 기계적 충격 강도가 떨어집니다.
                </li>
                <li>
                  <b>메쉬벨트-롤러 속도 동기화:</b> 메쉬벨트의 주행 속도와 함침 롤러의 회전 속도가 완벽히 일치해야 합니다. 미세하게 속도가 어긋나면 슬립(Slip) 현상이 발생하여 시트 표면 필름이 밀리거나 수지층 찢어짐 현상이 발생하므로 구동 모터의 RPM 상태를 실시간 체크하십시오.
                </li>
                <li><b>시트 검사:</b> 제조 로트마다 단중, 함침성, 폭, 두께 등을 검사해 데이터화 합니다.</li>
                <li><b>말기점도검사:</b> 설계 점도에 따른 숙성 점도 확인 데이터화 합니다.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 3. SMC 시트 관리 핵심 수칙 (SMC_공정표준서-1.xlsx 시트 2 + 하영 SMC-1.xlsx 시트 8 한·베트남어 완역본) */}
      {tab === 'sheet' && (
        <section className="card printable doc-sheet">
          <div className="doc-banner">
            <div className="doc-brand">
              {s.companyLogo ? <img src={s.companyLogo} alt="logo" className="doc-logo" /> : <div className="brand-mark">SMC</div>}
              <div>
                <div className="doc-title">SMC 시트 관리 핵심 수칙 / Quy tắc cốt lõi về quản lý tấm SMC</div>
                <div className="doc-sub">출처: SMC_공정표준서-1.xlsx &amp; 하영 SMC-1.xlsx 「SMC시트관리가이드」 통합 전문</div>
              </div>
            </div>
            <div className="doc-meta-box">
              <div><span>보관온도</span><b>20 ± 5℃ (상한 {s.storageTempMaxC}℃)</b></div>
              <div><span>숙성기간</span><b>{s.matureMinH} ~ {s.matureMaxH}시간</b></div>
              <div><span>사용기한</span><b>{s.shelfMonths}개월</b></div>
            </div>
          </div>

          <h4 style={{ marginTop: 0 }}>■ 성형 품질 확보를 위한 5가지 필수 관리 요약표</h4>
          <div className="scroll" style={{ marginBottom: 18 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 45 }}>NO</th>
                  <th style={{ width: 170 }}>관리 항목</th>
                  <th>주요 내용 및 적정 범위</th>
                  <th style={{ width: 190 }}>목적 / 원칙</th>
                  <th>주의사항 (불량 유형)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>1</b></td>
                  <td><b>온도 관리 (보관 환경)</b></td>
                  <td>서늘한 곳에서 <b>20 ± 5°C</b> 유지</td>
                  <td>보관 환경 적정 온도 유지</td>
                  <td><span className="bad-text">30~40°C 이상 장시간 노출 시 조기 경화(Pre-gelation) 발생 → 성형 불량</span></td>
                </tr>
                <tr>
                  <td><b>2</b></td>
                  <td><b>밀봉 및 습기 차단 (잔재 시트)</b></td>
                  <td>사용 후 알루미늄 증착 필름 등으로 완전 밀봉</td>
                  <td>습기 침투 방지</td>
                  <td><span className="bad-text">미밀봉 시 습기 침투 → 성형 시 기포(Blister) 발생</span></td>
                </tr>
                <tr>
                  <td><b>3</b></td>
                  <td><b>숙성(Maturation) 기간 (점도 확보)</b></td>
                  <td>증점제(MgO 등) 반응 후 <b>18 ~ 36시간</b> 숙성</td>
                  <td>금형 내 유동성 확보</td>
                  <td><span className="bad-text">2 ~ 3개월 이상 방치(과숙성) 시 유동성 저하 → 미충진 불량</span></td>
                </tr>
                <tr>
                  <td><b>4</b></td>
                  <td><b>선입선출 (FIFO) (제조일 기준)</b></td>
                  <td>먼저 입고된 시트를 먼저 사용 (제조일 확인 필수)</td>
                  <td>제조일 기준 선입선출 원칙 준수</td>
                  <td><span className="bad-text">장기 보관 시 시트 성형성 급격히 저하</span></td>
                </tr>
                <tr>
                  <td><b>5</b></td>
                  <td><b>작업 전 예열 (동절기/Winter)</b></td>
                  <td>작업 전 <b>12 ~ 24시간</b> 미리 작업장 온도 환경으로 이동</td>
                  <td>시트 온도 안정화 및 급격한 온도 변화 방지</td>
                  <td><span className="bad-text">상온 적응 미실시 시 온도차에 의한 성형 불량 가능성</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4>■ 현장 게시용 상세 지침 (한국어 · 베트남어 원문 전문)</h4>
          <div className="grid g2">
            <div className="std-box">
              <h3>1. 온도 관리 {vi && <span className="mute">/ 1. Quản lý nhiệt độ</span>}</h3>
              <ul className="std-list">
                <li>
                  <b>적정 온도:</b> 반드시 20±5°C의 서늘한 곳에 보관해야 합니다.
                  {vi && <div className="vi-text">Nhiệt độ thích hợp: Phải bảo quản ở nơi thoáng mát với nhiệt độ duy trì ở mức 20±5°C.</div>}
                </li>
                <li>
                  <b>주의사항:</b> 30°C 이상의 고온에 장시간 노출되면 성형하기도 전에 딱딱하게 굳는 조기 경화(Pre-gelation) 현상이 발생하며 불량의 원인이 됩니다.
                  {vi && <div className="vi-text">Lưu ý: Nếu tiếp xúc với nhiệt độ cao trên 30°C trong thời gian dài, hiện tượng đông kết sớm (Pre-gelation) sẽ xảy ra khiến tấm bị cứng lại trước khi tạo hình, dẫn đến sản phẩm lỗi.</div>}
                </li>
              </ul>
            </div>

            <div className="std-box">
              <h3>2. 밀봉 및 습기 차단 {vi && <span className="mute">/ 2. Niêm phong và ngăn chặn độ ẩm</span>}</h3>
              <ul className="std-list">
                <li>
                  <b>밀봉 유지:</b> 습기가 스며들면 성형 시 기포(Blister)가 발생하므로 사용하고 남은 시트는 반드시 알루미늄 증착 필름 등으로 공기가 통하지 않게 밀봉하여야 합니다.
                  {vi && <div className="vi-text">Duy trì niêm phong: Nếu độ ẩm xâm nhập, các bọt khí (Blister) sẽ xuất hiện trong quá trình tạo hình. Do đó, các tấm còn dư sau khi sử dụng phải được niêm phong kín bằng màng nhôm chuyên dụng để ngăn không khí lọt vào.</div>}
                </li>
              </ul>
            </div>

            <div className="std-box">
              <h3>3. 숙성(Maturation) 기간 준수 {vi && <span className="mute">/ 3. Tuân thủ thời gian ủ (Maturation)</span>}</h3>
              <ul className="std-list">
                <li>
                  <b>적정 점도 확보:</b> 증점제(MgO 등)가 충분히 반응하여 금형 내에서 잘 흐를 수 있는 점도가 될 때까지 보통 18~36시간 정도의 숙성 기간을 거친 후 투입하세요.
                  {vi && <div className="vi-text">Đảm bảo độ nhớt phù hợp: Để chất làm đặc (như MgO) phản ứng đầy đủ và đạt đến độ nhớt có thể chảy tốt trong khuôn, hãy đưa vào sử dụng sau thời gian ủ thông thường từ 18 đến 36 giờ.</div>}
                </li>
                <li>
                  <b>과숙성 주의:</b> 너무 오래 방치(보통 2~3개월 이상)하면 유동성이 떨어져 미충진 불량이 생길 수 있습니다.
                  {vi && <div className="vi-text">Cảnh báo quá hạn: Nếu để quá lâu (thường trên 2~3 tháng), tính lưu động sẽ giảm, dẫn đến lỗi không điền đầy khuôn.</div>}
                </li>
              </ul>
            </div>

            <div className="std-box">
              <h3>4. 선입선출 (FIFO) 원칙 &amp; 5. 작업 전 예열</h3>
              <ul className="std-list">
                <li>
                  <b>4. 제조일 확인 (FIFO):</b> 먼저 들어온 시트를 먼저 사용하는 선입선출을 철저히 지켜야 합니다. 장기 보관된 시트는 성형성이 급격히 저하됩니다.
                  {vi && <div className="vi-text">4. Nguyên tắc nhập trước xuất trước (FIFO) — Kiểm tra ngày sản xuất: Phải tuân thủ nghiêm ngặt nguyên tắc FIFO, sử dụng những tấm nhập kho trước. Những tấm bảo quản quá lâu sẽ bị giảm mạnh khả năng tạo hình.</div>}
                </li>
                <li>
                  <b>5. 상온 적응 (Winter Season):</b> 작업 전 약 12~24시간 정도 미리 작업장 온도로 옮겨두어 시트의 온도를 안정시킨 후 성형하는 것이 좋습니다.
                  {vi && <div className="vi-text">5. Làm ấm trước khi làm việc (Mùa đông) — Thích nghi với nhiệt độ phòng: Trước khi làm việc khoảng 12~24 giờ, nên chuyển tấm SMC đến khu vực làm việc để ổn định nhiệt độ trước khi tiến hành tạo hình.</div>}
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 4. SMC 기계 관리가이드 (하영 SMC-1.xlsx 'SMC기계 관리가이드' 시트 한국어·베트남어 원문 100% 수록) */}
      {tab === 'machine' && (
        <section className="card printable doc-sheet">
          <div className="doc-banner">
            <div className="doc-brand">
              {s.companyLogo ? <img src={s.companyLogo} alt="logo" className="doc-logo" /> : <div className="brand-mark">SMC</div>}
              <div>
                <div className="doc-title">SMC Machine Management &amp; Maintenance Guide</div>
                <div className="doc-sub">Hướng dẫn Quản lý &amp; Bảo trì Máy SMC · 출처: 하영 SMC-1.xlsx 「SMC기계 관리가이드」 시트 전문</div>
              </div>
            </div>
            <div className="doc-meta-box">
              <div><span>커터날 교체주기</span><b>{s.cutterBladeChangeTon}톤 또는 월 1회</b></div>
              <div><span>일일 청소</span><b>매 작업 종료 후 필수</b></div>
            </div>
          </div>

          {/* 1. 닥터박스(D/B) 관리 가이드 */}
          <div className="std-sec">
            <div className="std-sec-head">
              <span className="std-num">1</span>
              <div>
                <h3>1. SMC 닥터박스(D/B) 관리 가이드 {vi && <span className="mute">/ 1. Hướng dẫn quản lý Doctor Box (D/B)</span>}</h3>
                <p>
                  닥터박스는 수지가 직접 담겨 있고 칼날(Blade)을 통해 두께를 조절하는 곳이라, 청소와 관리가 조금이라도 소홀하면 바로 <b>제품 표면 불량(줄 생김)</b>이나 두께 불균일로 이어집니다.
                </p>
                {vi && (
                  <div className="vi-text">
                    Doctor Box là bộ phận điều chỉnh độ dày thông qua nhựa và lưỡi gạt (Blade). Nếu việc vệ sinh và quản lý bị lơ là, bề mặt sản phẩm sẽ bị lỗi ngay lập tức, vì vậy cần phải kiểm tra định kỳ.
                  </div>
                )}
              </div>
            </div>

            <div className="grid g2">
              <div className="std-box">
                <h4>① 작업 종료 후 청소 (Daily Cleaning)</h4>
                <p style={{ margin: '0 0 6px', fontWeight: 600 }}>수지가 경화(굳음)되기 전에 닦아내는 것이 가장 중요합니다.</p>
                {vi && <div className="vi-text" style={{ marginBottom: 6 }}>① Vệ sinh sau khi kết thúc công việc (Daily Cleaning): Điều quan trọng nhất là phải lau sạch nhựa trước khi nó bị đông cứng.</div>}
                <ul className="std-list">
                  <li>
                    <b>수지 배출:</b> 작업이 끝나면 박스 내부의 잔류 수지를 최대한 비워냅니다.
                    {vi && <div className="vi-text">Xả nhựa: Sau khi kết thúc công việc, hãy dọn sạch tối đa lượng nhựa còn sót lại bên trong hộp.</div>}
                  </li>
                  <li>
                    <b>1차 닦기:</b> 헤라(스크래퍼)를 이용해 벽면에 붙은 수지를 긁어냅니다. 이때 스테인리스 박스라면 플라스틱 및 황동 헤라를 사용하여 스크래치를 방지하세요.
                    {vi && <div className="vi-text">Lần lau 1: Dùng dao cạo (Hera) để cạo bỏ nhựa dính trên bề mặt. Nếu là hộp inox, hãy sử dụng dao cạo bằng nhựa hoặc đồng để tránh làm trầy xước.</div>}
                  </li>
                  <li>
                    <b>세척제 활용:</b> 수지 전용 세척제 및 아세톤을 헝겊에 적셔 칼날(Blade)과 박스 내부 구석구석을 닦아냅니다.
                    {vi && <div className="vi-text">Sử dụng chất tẩy rửa: Thấm dung dịch tẩy rửa chuyên dụng cho nhựa hoặc axeton vào vải cotton để lau sạch lưỡi gạt (Blade) và mọi ngóc ngách bên trong hộp.</div>}
                  </li>
                </ul>
              </div>

              <div className="std-box">
                <h4>② 칼날 집중 관리 &amp; ③ 댐(Dam) 관리</h4>
                <ul className="std-list">
                  <li>
                    <b>② 칼날 집중 관리:</b> 닥터박스의 핵심인 칼날은 아주 작은 이물질이나 손상에도 예민합니다.<br />
                    <b>칼날 날 끝(Edge) 점검:</b> 청소 시 칼날 끝을 손가락으로 살짝 만져보아(<b>맨손 필수</b>) 거칠거칠한 부분이나 이빨 빠진 곳이 없는지 확인합니다.
                    {vi && <div className="vi-text">② Quản lý tập trung lưỡi gạt: Lưỡi gạt là bộ phận cốt lõi của Doctor Box, rất nhạy cảm với các vật thể lạ hoặc hư hỏng dù là nhỏ nhất. Kiểm tra cạnh lưỡi (Edge): Khi vệ sinh, hãy dùng ngón tay chạm nhẹ vào cạnh lưỡi (bắt buộc dùng tay trần) để kiểm tra xem có chỗ nào bị thô ráp hoặc sứt mẻ không.</div>}
                  </li>
                  <li>
                    <b>③ 댐(Dam) 관리:</b> 수지가 옆으로 새는 것을 막아주는 부위입니다.<br />
                    <b>측면 댐 청소:</b> 양옆 댐 부위 하단에 컴파운드가 굳거나 유리섬유 가루가 엉겨 붙어 굳는 경우가 많습니다. 이 부위가 지저분하면 필름이 지나가면서 찢어질 수 있으므로 매일 확인해야 합니다.
                    {vi && <div className="vi-text">③ Quản lý đệm kín (Dam): Đây là bộ phận ngăn nhựa rò rỉ ra hai bên.</div>}
                  </li>
                </ul>

                <div className="std-box bad-border" style={{ marginTop: 8 }}>
                  <h4 style={{ margin: '0 0 6px', color: 'var(--bad)' }}>④ 닥터박스 금지 수칙</h4>
                  <ul className="std-list">
                    <li><b>철 헤라 사용금지:</b> 칼날 표면에 스크래치를 내면 그 자리에 수지가 더 잘 붙고 시트에 줄이 생깁니다. 반드시 부드러운 천이나 황동 헤라를 쓰세요.</li>
                    <li><b>무리한 힘 가하지 않기:</b> 닥터박스 세팅이 안 맞는다고 망치로 때리면 정밀한 수평(0.05mm)이 영구적으로 틀어집니다. 반드시 조절 볼트를 이용하세요.</li>
                    <li><b>잔류 수지 방치 금지:</b> &quot;내일 아침에 닦지 뭐&quot; 하고 퇴근하면 다음 날 D/B를 통째로 갈아야 할 수도 있습니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 유리섬유 커팅날(Cutter Blade) 관리 및 교체 가이드 */}
          <div className="std-sec">
            <div className="std-sec-head">
              <span className="std-num">2</span>
              <div>
                <h3>2. 유리섬유 커팅날(Cutter Blade) 관리 및 교체 가이드</h3>
                <p>커팅날이 무뎌지면 유리섬유가 제대로 잘리지 않아 시트 내부에 섬유가 뭉치거나 분산이 불균일해집니다.</p>
              </div>
            </div>

            <Notice kind="bad">
              <div>
                <b>사전 안전 조치</b><br />
                • <b>기계정지:</b> 설비가 갑자기 구동되지 않도록 반드시 기계를 정지하고 잠금장치를 하세요.<br />
                • <b>보호구 착용:</b> 유리섬유 가루는 피부에 박히면 매우 따갑고 눈이나 호흡기에 해롭습니다. <b>내절단 장갑(방검 장갑), 고글, 마스크</b>를 반드시 착용하세요.
              </div>
            </Notice>

            <div className="grid g2">
              <div className="std-box">
                <h4>① 청소 및 관리 가이드 (매 작업 종료 후 필수)</h4>
                <ul className="std-list">
                  <li>
                    <b>1단계: 에어건을 이용한 1차 분진 제거</b><br />
                    커팅 유닛 주변과 칼날 사이에 낀 유리섬유 부스러기를 에어건으로 불어냅니다.<br />
                    <small className="bad-text">주의: 분진이 비산되므로 반드시 집진기를 가동하거나 환기가 잘 되는 상태에서 작업하세요.</small>
                  </li>
                  <li>
                    <b>2단계: 고착된 수지 및 이물질 제거</b><br />
                    칼날 표면에 수지가 굳어 있다면 <b>황동 브러시(Brass Brush)</b>를 사용하세요. 칼날 사이사이에 낀 섬유 뭉치는 핀셋이나 뾰족한 도구를 이용해 수동으로 제거합니다.
                  </li>
                  <li>
                    <b>3단계: 용제를 이용한 정밀 세척</b><br />
                    헝겊에 아세톤이나 전용 세척제를 묻혀 칼날 표면을 닦아냅니다. 수지 성분을 녹여내어 칼날이 매끄럽게 회전하도록 돕습니다. 이때 칼날의 마모 상태(이빨 빠짐 등)를 함께 육안으로 점검하세요.
                  </li>
                  <li>
                    <b>4단계: 백업 롤(Rubber Roll) 청소</b><br />
                    칼날이 맞닿는 고무 롤(Backup Roll) 표면에 박힌 유리섬유 조각들도 함께 제거해야 합니다. 고무 롤이 깨끗해야 칼날이 끝까지 균일하게 눌려 절단이 잘 됩니다. 커팅롤과 고무 롤을 손으로 살짝 돌려보아 걸리는 느낌 없이 부드럽게 회전하는지 확인합니다.
                  </li>
                </ul>
                <p className="mute" style={{ margin: '8px 0 0', fontSize: 12 }}>
                  * 주기: 매 작업 종료 후 에어 청소를 기본으로 하고, 일주일에 한 번은 용제를 이용한 정밀 청소를 권장합니다.<br />
                  * 청소 후에도 섬유가 씹히거나 보풀이 많이 난다면 청소의 문제가 아니라 날의 수명이 다한 것이므로 즉시 교체해야 합니다.
                </p>
              </div>

              <div className="std-box">
                <h4>② 교체 가이드</h4>
                <ul className="std-list">
                  <li>
                    <b>정기 교체 주기:</b> 누적 생산량 또는 시간 단위로 설정 (<b>{s.cutterBladeChangeTon}톤 생산 후, 또는 월 1회 정기 교체</b>)
                  </li>
                  <li>
                    <b>육안 확인 시점:</b>
                    <ul>
                      <li>커팅된 유리섬유 끝부분이 매끄럽지 않고 <b>보풀(Fuzz)</b>이 심하게 발생할 때.</li>
                      <li>섬유가 완전히 잘리지 않아 두세 가닥이 붙어서 나오는 <b>미절단 현상</b> 발생 시.</li>
                    </ul>
                  </li>
                  <li>
                    <b>설비 점검 시점:</b>
                    <ul>
                      <li>커팅 소음이 평소보다 커지거나 불규칙한 금속음이 들릴 때.</li>
                      <li>백업 롤(Rubber Roll) 표면에 깊은 파임이 생겨 절단력이 저하되었을 때 (이때는 날과 롤을 함께 점검).</li>
                    </ul>
                  </li>
                </ul>
                <Notice kind="info">
                  <b>* 백업 롤 교체 주기:</b> 커팅날 2~3회 교체 후 백업 롤 교체, 혹 그 전에 백업 롤 이상 시 즉시 교체
                </Notice>
              </div>
            </div>
          </div>

          {/* 3. 탈포기 관리 및 교체 가이드 */}
          <div className="std-sec">
            <div className="std-sec-head">
              <span className="std-num">3</span>
              <div>
                <h3>3. 탈포기(Compaction / De-airing Roller) 관리 및 교체 가이드</h3>
                <p>탈포기는 시트 내부의 잔류 공기를 제거하는 역할을 합니다. 수지가 묻어 굳으면 공기가 빠지지 않고 오히려 시트에 구멍(Pin-hole)을 낼 수 있습니다.</p>
              </div>
            </div>

            <div className="grid g2">
              <div className="std-box">
                <h4>① 청소 및 관리 가이드 (매 작업 종료 후 필수)</h4>
                <ul className="std-list">
                  <li><b>잔류 수지 제거:</b> 수지가 완전히 경화되기 전, 전용 용제(아세톤 또는 대체 세척제)를 적신 헝겊으로 롤러 표면을 닦아냅니다.</li>
                  <li><b>홈(Groove) 집중 청소:</b> 탈포 롤러는 보통 홈이 파여 있는 형태이므로, 홈 사이에 끼인 수지는 <b>황동 브러시</b>(Steel 브러시는 롤러 손상 위험)를 사용하여 제거합니다.</li>
                  <li><b>필름 가루 제거:</b> 정전기로 인해 붙은 필름 부스러기를 에어건으로 불어내어 다음 작업 시 이물질 혼입을 방지합니다.</li>
                </ul>
              </div>
              <div className="std-box">
                <h4>② 교체 가이드</h4>
                <ul className="std-list">
                  <li><b>교체 신호:</b> 탈포 롤러의 돌기 부분이 마모되어 공기 제거 효율이 급격히 떨어지거나, 수지가 고착되어 청소로 해결되지 않을 때.</li>
                  <li><b>조립 팁:</b> 조립 후 무부하 상태에서 회전시켜 <b>편심(떨림)</b>이 없는지 반드시 확인하십시오.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 4. SMC 함침기 및 메쉬벨트 관리 가이드 */}
          <div className="std-sec" style={{ marginBottom: 0 }}>
            <div className="std-sec-head">
              <span className="std-num">4</span>
              <div>
                <h3>4. SMC 함침기(Impregnation Unit) 교체 및 관리 가이드</h3>
                <p>함침기는 수지가 유리섬유 사이사이로 잘 스며들게 압력을 가하는 장치입니다. 롤러의 평행도와 압력이 깨지면 제품 두께가 불균일해집니다.</p>
              </div>
            </div>

            <div className="grid g2">
              <div className="std-box">
                <h4>① 청소 및 관리 가이드 (매 작업 종료 전·후 필수)</h4>
                <ul className="std-list">
                  <li><b>벨트 세척:</b> 작업 종료 후 벨트에 묻은 수지를 아세톤 등으로 닦아내어 구멍이 막히지 않게 함.</li>
                  <li><b>이물질 제거:</b> 롤러와 벨트 사이에 낀 컴파운드 및 유리섬유 조각을 에어로 불어냄.</li>
                  <li><b>롤러 베어링:</b> 메쉬벨트의 장력 때문에 베어링에 무리가 가므로 주기적으로 구리스 주입.</li>
                  <li><b>텐션 점검:</b> 벨트가 늘어지지 않았는지 확인하고 필요시 장력을 재조정.</li>
                </ul>

                <h4>* 함침기 롤러(Roller) 관리</h4>
                <p className="mute" style={{ margin: '0 0 4px', fontSize: 12.5 }}>롤러는 메쉬벨트를 통해 전달되는 압력을 시트에 고르게 분사하는 역할을 합니다.</p>
                <ul className="std-list">
                  <li><b>표면 수지 고착:</b> 롤러에 수지가 굳어 붙으면 메쉬벨트를 파손시키거나 시트 두께를 불균일하게 만듭니다.</li>
                  <li><b>편마모 발생:</b> 롤러의 특정 부분만 닳아서 메쉬벨트가 헛돌거나 한쪽으로 쏠릴 때 점검·교체합니다.</li>
                </ul>

                <h4>* 메쉬벨트(Mesh Belt) 점검 및 교체 시점</h4>
                <p className="mute" style={{ margin: '0 0 4px', fontSize: 12.5 }}>메쉬벨트는 통기성과 압착력을 동시에 가져야 하며, 파손 시 즉시 교체해야 합니다.</p>
                <ul className="std-list">
                  <li><b>벨트 사행(쏠림):</b> 벨트가 자꾸 한쪽으로 치우쳐 프레임에 닿아 끝부분이 너덜너덜해질 때.</li>
                  <li><b>메쉬 눈막힘:</b> 유리섬유 가루와 수지가 메쉬 구멍을 다 막아서 함침 능력이 떨어질 때.</li>
                  <li><b>이음매(Joint) 파손:</b> 벨트를 연결하는 핀이나 이음매 부위가 벌어지거나 끊어지려 할 때.</li>
                </ul>
              </div>

              <div className="std-box">
                <h4>② 메쉬벨트 교체 가이드 (4단계)</h4>
                <ul className="std-list">
                  <li>
                    <b>1단계: 텐션 해제</b><br />
                    텐션 롤러를 조절하여 벨트의 장력을 완전히 풉니다.
                  </li>
                  <li>
                    <b>2단계: 이음매 분리</b><br />
                    벨트의 연결 핀(Clipper Joint)을 뽑아 헌 벨트를 제거합니다.
                  </li>
                  <li>
                    <b>3단계: 신규 벨트 주행</b><br />
                    새 벨트를 롤러 사이로 통과시킨 후 연결 핀을 삽입합니다.
                  </li>
                  <li>
                    <b>4단계: 텐션 및 사행 조절</b><br />
                    벨트가 팽팽하게 당겨지도록 조절한 후, 저속으로 돌리며 좌우로 쏠리지 않게 <b>트래킹(Tracking)</b>을 잡습니다.
                  </li>
                </ul>

                <div className="std-box warn-border" style={{ marginTop: 10 }}>
                  <h4 style={{ margin: '0 0 6px' }}>현장 핵심 주의사항 (필독)</h4>
                  <ul className="std-list">
                    <li><b>* 메쉬벨트 쏠림 방지:</b> 작업자들에게 벨트가 한쪽으로 쏠리는지 수시로 확인하게 하세요. 쏠림을 방치하면 새 벨트도 하루 만에 망가질 수 있습니다. (실제 경험 있음)</li>
                    <li><b>* 스페어 확보:</b> 메쉬벨트는 갑자기 끊어지는 경우가 많으므로 반드시 상하부 1세트 이상 상시 재고를 보유하셔야 합니다.</li>
                    <li><b>* 수평의 중요성:</b> &quot;롤러 수평이 안 맞으면 벨트가 죽는다&quot;는 점을 강조하시고, 세팅을 직접 확인하시는 것이 좋습니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
