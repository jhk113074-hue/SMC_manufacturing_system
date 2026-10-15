import { useEffect, useSyncExternalStore } from 'react'

export type Lang = 'ko' | 'en'

const LANG_KEY = 'smc-lang-v1'

function detectInitialLang(): Lang {
  try {
    const params = new URLSearchParams(location.search)
    const q = params.get('lang')
    if (q === 'en' || q === 'ko') return q
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'en' || saved === 'ko') return saved
  } catch {
    // ignore
  }
  return 'ko'
}

let currentLang: Lang = detectInitialLang()
const listeners = new Set<() => void>()

export function getLang(): Lang {
  return currentLang
}

export function setLang(l: Lang) {
  if (currentLang === l) return
  currentLang = l
  try {
    localStorage.setItem(LANG_KEY, l)
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn())
}

export function useLang(): [Lang, (l: Lang) => void] {
  const l = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => currentLang,
  )
  return [l, setLang]
}

export function tr(ko: string, en: string): string {
  return currentLang === 'en' ? en : ko
}

/**
 * Exhaustive Korean -> English phrase and technical term dictionary for SMC MES & R&D System.
 * Sorted automatically from longest phrase to shortest token so multi-word sentences match first.
 */
const RAW_DICT: [string, string][] = [
  // App & Navigation
  ['SMC 통합 기술·생산·품질관리 시스템', 'SMC Integrated R&D, Production & Quality MES'],
  ['SMC 기술·생산관리', 'SMC MES & R&D Suite'],
  ['로고 클릭 시 변경', 'Click logo to change'],
  ['+ 클릭하여 회사 로고 등록', '+ Click to upload Company Logo'],
  ['클릭하여 회사 로고 이미지를 등록하거나 변경합니다', 'Click to upload or change Company Logo'],
  ['로컬 DB 자동 저장 중', 'Local DB Auto-Saving'],
  ['성명 입력 (필수)', 'Enter Name (Req.)'],
  ['생산·재고·설비 핵심 지표 및 실시간 공정 현황', 'Real-time Production, Inventory & Equipment KPIs'],
  ['엑셀 9종 전체 처방(phr) 마스터 관리 및 물탱크 배합 총 제조원가 계산서', 'All 9 Excel Recipes (phr) Master & Full Water Tank Manufacturing Cost Sheet'],
  ['닥터블레이드 갭, 3계통 펌프 유량, 컷터 RPM, 시편 중량 및 배합표 권장값 vs 실제값 비교', 'Doctor Blade Gap, 3-Pump Flow, Cutter RPM, Specimen Wt & Recipe vs Actual Log'],
  ['배치별 원재료 환산, STEP 1~6 공정별 계량·서명 및 지시서 인쇄', 'Batch Scaling, STEP 1~6 Sequential Weighing/Signing & Work Order Print'],
  ['점도 변화·토출량 검증·롤별 품질 판정 · 빈 양식 인쇄 및 사진 스캔(OCR) 자동 입력', 'Viscosity, Flow Verification, Roll QC, Blank Form Print & AI Photo Scan (OCR)'],
  ['숙성 시간 및 유효기한 기반 선입선출(FIFO) 출고 관리·라벨 발행', 'Aging & Shelf-life Based FIFO Release Control & Product Label Printing'],
  ['SMC 공정 표준서(SMC-STD-001) · 공정별 핵심 가이드 · 시트 관리 5대 수칙(한/베) · 기계 예방보전 가이드(한/베)', 'SMC Process Standard (SMC-STD-001) · Core Guide · 5 Sheet Rules · Machine Maintenance Guide'],
  ['엑셀 원본 양식 그대로 인쇄·열람 (신규 14롤 일지 / 기존 17롤 일지 v4·0.5배치 / 배합지시서 40%·30% / 완제품 라벨)', 'Exact Excel Replicas for Print & View (14-Roll Log / 17-Roll v4 & 0.5 Batch / 40% & 30% Mix Orders / Labels)'],
  ['수지·첨가제·충진제·유리섬유 비중 및 단가 기준 정보 관리', 'Specific Gravity & Unit Price Master for Resins, Additives, Fillers & Glass Fiber'],
  ['회사 로고 등록, 스마트 스캔 AI 설정, 공정 관리 기준값, 백업·복원 및 감사 로그', 'Company Logo, Vision AI OCR Setup, Process Control Limits, Backup/Restore & Audit Trail'],
  ['MANUALS & FORMS (엑셀 통합)', 'MANUALS & FORMS (EXCEL)'],
  ['제품·처방·원가', 'Products, Recipes & Cost'],
  ['설정값 계산기', 'Setting Calculator'],
  ['설정값 계산', 'Machine Setting Calc'],
  ['배합지시서', 'Mixing Work Order'],
  ['생산일지 (스마트스캔)', 'Production Log (AI Scan)'],
  ['생산일지·스마트스캔', 'Prod. Log & Smart Scan'],
  ['로트·재고·라벨', 'Lots, FIFO & Labels'],
  ['로트·숙성·라벨', 'Lots, Aging & Labels'],
  ['공정표준서·매뉴얼', 'Process Standards & Manuals'],
  ['작업일지·관리양식함', 'Work Logs & Official Forms'],
  ['원재료 마스터', 'Raw Material Master'],
  ['기준값·로고·이력', 'Settings, Logo & Audit'],
  ['대시보드', 'Dashboard'],
  ['작업자', 'Operator'],

  // Dashboard
  ['📘 공정표준서·매뉴얼 열람', '📘 View Process Manuals'],
  ['📋 작업일지·관리양식함', '📋 Official Forms Center'],
  ['🚀 영업 시연용 샘플 데이터 원클릭 생성', '🚀 Load 1-Click Sales Demo Data'],
  ['SMC 스마트 공정 워크플로우 (클릭 시 해당 공정으로 즉시 이동)', 'SMC Smart Manufacturing Workflow (Click any step to jump)'],
  ['원가계산서 포함', 'Includes Cost Sheet'],
  ['D/B 갭 · 펌프 3계통 · 컷터 RPM', 'D/B Gap · 3-Pump · Cutter RPM'],
  ['STEP 1~6 정밀 계량·서명', 'STEP 1~6 Weighing & Sign'],
  ['빈 양식 인쇄 · 사진 스캔(OCR)', 'Blank Print · Photo OCR'],
  ['FIFO 출고 통제 · 라벨 인쇄', 'FIFO Control · Label Print'],
  ['현재 가용 재고 중량', 'Available Stock Net Weight'],
  ['출고 가능', 'Ready to Release'],
  ['항온 숙성실 숙성 진행 중', 'Maturing in Aging Room'],
  ['진행 중 배합지시서 / 작성 중 생산일지', 'Active Mix Orders / Open Production Logs'],
  ['사용기한이 지난 로트(출고 차단됨):', 'Expired Lots (Release Blocked):'],
  ['사용기한 14일 이내 임박 로트(우선 출고 요망):', 'Lots Expiring Within 14 Days (Priority Release):'],
  ['전 제품·처방 마스터 물성 및 원가 요약 (9종)', 'All 9 Recipes — Physical Properties & Cost Summary'],
  ['처방·원가 상세 →', 'Recipe & Cost Details →'],
  ['예상 총제조원가', 'Est. Total Mfg Cost'],
  ['설비 예방보전(PM) 및 커터 날 교체 주기 모니터', 'Equipment Preventive Maintenance (PM) & Cutter Blade Monitor'],
  ['교체 완료 기록', 'Record Blade Change'],
  ['교체 이후 누적 생산량:', 'Cumulative Output Since Change:'],
  ['즉시 교체 필요', 'Replace Immediately'],
  ['교체 임박', 'Replacement Soon'],
  ['정상 가동 중', 'Operating Normally'],
  ['핵심 설비 유닛', 'Key Equipment Unit'],
  ['일일·정기 점검 핵심 기준', 'Daily & Periodic Inspection Standard'],
  ['1. 닥터박스 (D/B)', '1. Doctor Box (D/B)'],
  ['황동·플라스틱 헤라 세척(철 헤라 금지), 수평 0.05mm 유지', 'Clean with brass/plastic scraper (NO steel), keep 0.05mm level'],
  ['2. 유리섬유 커팅날', '2. Glass Fiber Cutter Blade'],
  ['3. 3계통 계량 펌프', '3. 3-Stream Metering Pumps'],
  ['작업 전 토출량 실측 검증 (허용 오차 ±3% 이내 관리)', 'Pre-run flow rate verification (Tolerance within ±3%)'],
  ['최근 작업 및 감사 로그 (Audit Trail)', 'Recent Operations & Audit Trail'],
  ['아직 작업 이력이 없습니다. 상단 「🚀 영업 시연용 샘플 데이터 원클릭 생성」 버튼을 눌러보세요.', 'No audit entries yet. Click "🚀 Load 1-Click Sales Demo Data" at the top to populate sample data.'],
  ['※ 예상 총제조원가 = 처방별 원재료비 + 부재료비(41.83원) + 노무비(23.76원) + 제조경비·감가비(92.00원) 합산 기준', '* Est. Total Mfg Cost = Raw Material Cost + Sub-Material (41.83) + Direct Labor (23.76) + Overhead/Depr. (92.00 KRW/kg)'],

  // Recipes & Cost Sheet
  ['1. 제품·처방 마스터 (전 처방 9종 관리)', '1. Product & Recipe Master (All 9 Recipes)'],
  ['2. 물탱크 배합 원가계산서 (엑셀 원본 통합 시트)', '2. Water Tank Manufacturing Cost Sheet (Excel Replica)'],
  ['🖨️ 원가계산서 인쇄', '🖨️ Print Cost Sheet'],
  ['제품과 처방 (엑셀 9종 전체 수록)', 'Products & Recipes (All 9 Excel Formulas)'],
  ['왼쪽에서 처방을 선택하거나 새 처방을 만드세요.', 'Select a recipe on the left or create a new recipe.'],
  ['제품 추가', 'Add Product'],
  ['새 처방', 'New Recipe'],
  ['제품 정보', 'Product Information'],
  ['제품명', 'Product Name'],
  ['라벨 품명 코드', 'Label Product Code'],
  ['목표 단중 (kg/m²)', 'Target Areal Wt (kg/m²)'],
  ['제품 폭 (mm)', 'Sheet Width (mm)'],
  ['복사해서 새 처방', 'Duplicate Recipe'],
  ['처방 이름', 'Recipe Family Name'],
  ['변경 사유 / 출처', 'Change Reason / Source'],
  ['변경 사유', 'Change Reason'],
  ['승인·폐기된 처방은 수정할 수 없습니다. 아래에서 새 버전을 만들어 수정하세요.', 'Approved or retired recipes are locked. Create a new draft version below to edit.'],
  ['엑셀에서 가져온 처방입니다. 현장에서 쓰는 값과 맞는지 확인한 뒤 승인하세요.', 'Imported from Excel. Verify against shop-floor parameters before approving.'],
  ['불포화수지 phr이 없어 배합지시서를 만들 수 없습니다.', 'Cannot issue Mixing Order without Unsaturated Resin phr.'],
  ['원재료 추가:', 'Add Material:'],
  ['phr 합계', 'Total phr'],
  ['유리섬유 함량', 'Glass Fiber Content'],
  ['페이스트 비중 (유리 제외)', 'Paste SG (Excl. Glass)'],
  ['원재료비 (kg당)', 'Raw Material Cost (/kg)'],
  ['새 버전 만들기', 'Create New Version'],
  ['새 버전(초안) 만들기', 'Create New Draft Version'],
  ['같은 이름의 처방은 버전으로 이어집니다', 'Recipes with the same family name track versions automatically'],
  ['SMC 물탱크 배합표 및 총 제조원가 계산서', 'SMC Water Tank Formulation & Total Manufacturing Cost Sheet'],
  ['상세 분석 기준 배합 선택:', 'Select Base Formulation:'],
  ['목표 배합 중량(kg):', 'Target Batch Weight (kg):'],
  ['엑셀 5대 배합별 Batch 기준값', 'Excel 5 Formulations — Batch Reference Values'],
  ['전체 합계 (유리섬유 포함, Row 23)', 'Grand Total (Incl. Glass Fiber, Row 23)'],
  ['컴파운드 합계 (유리 제외, Row 24)', 'Compound Total (Excl. Glass Fiber, Row 24)'],
  ['2) 부재료비 (Row 31~36)', '2) Sub-Material Cost (Row 31~36)'],
  ['3) 노무비 (Row 31~36)', '3) Direct Labor Cost (Row 31~36)'],
  ['4) 제조경비 — 감가비 포함 (Row 31~38)', '4) Manufacturing Overhead — Incl. Depreciation (Row 31~38)'],
  ['5) 총 제조원가 합계 (Row 31~33)', '5) Total Manufacturing Cost Summary (Row 31~33)'],
  ['케리어필름', 'Carrier Film'],
  ['CPP필름', 'CPP Film'],
  ['UV차단필름', 'UV Barrier Film'],
  ['알루미늄, 30미크론', 'Aluminum, 30 Micron'],
  ['테이프 외', 'Packaging Tape & Misc.'],
  ['포장 부자재 외', 'Packaging Sub-materials'],
  ['부재료비 계', 'Sub-Material Subtotal'],
  ['1인 월 작업시간(h)', 'Monthly Hours/Worker (h)'],
  ['종합시급(원)', 'Hourly Wage (KRW)'],
  ['작업 인원(명)', 'Workers (Persons)'],
  ['월 생산량(kg)', 'Monthly Output (kg)'],
  ['전기료, 난방비', 'Electricity & Heating'],
  ['폐자재비', 'Waste Disposal Cost'],
  ['환경부담비', 'Environmental Charge'],
  ['보수유지비', 'Maintenance & Repair'],
  ['시트설비감가비', 'SMC Line Depreciation'],
  ['제조경비 합계', 'Overhead Subtotal'],
  ['소량생산비(기술비)', 'Small-Batch / Tech Fee'],

  // Setting Calculator
  ['1. 처방과 생산 조건 (작업일지 연동)', '1. Recipe & Production Conditions (Linked to Log)'],
  ['2. 설비 파라미터 및 유리섬유 컷터 설정', '2. Machine Parameters & Glass Cutter Setup'],
  ['3. 핵심 계산 결과 (Doctor Blade 갭 · 펌프 3계통 · 시편 중량)', '3. Core Calculation Results (Doctor Blade Gap · 3-Pumps · Specimen Wt)'],
  ['이 설정값 저장', 'Save Machine Setting'],
  ['처방 선택', 'Select Recipe'],
  ['라인 속도 V₀ (m/min)', 'Line Speed V₀ (m/min)'],
  ['제품 폭 w (mm)', 'Sheet Width w (mm)'],
  ['페이스트 비중 ρ (자동)', 'Paste Specific Gravity ρ (Auto)'],
  ['블레이드 두께 L (mm)', 'Blade Thickness L (mm)'],
  ['페이스트 점도 η (cps)', 'Paste Viscosity η (cps)'],
  ['페이스트 높이 H (mm)', 'Paste Head Height H (mm)'],
  ['캐리어 필름 두께 (mm)', 'Carrier Film Thickness (mm)'],
  ['글라스 TEX (g/km)', 'Glass Roving TEX (g/km)'],
  ['컷팅 길이 (inch)', 'Cutting Length (inch)'],
  ['공급 로빙 수 / 규격', 'Supplied Rovings / Spec'],
  ['블레이드 수', 'No. of Blades'],
  ['분담 유리중량 (g/m)', 'Glass Weight Share (g/m)'],
  ['1번 로빙 컷터', '1st Roving Cutter'],
  ['2번 로빙 컷터', '2nd Roving Cutter'],
  ['3번 다이렉트 로빙', '3rd Direct Roving'],
  ['4번 직조 로빙 (Woven)', '4th Woven Roving'],
  ['★ 페이스트 토출 총량 (작업일지 연동)', '★ Total Paste Flow Rate (Linked to Log)'],
  ['닥터박스 1 · 2 갭 (각각)', 'Doctor Box 1 & 2 Gap (Each)'],
  ['컷터 1 / 2 회전수', 'Cutter 1 / 2 Speed'],
  ['총 갭 Height (h)', 'Total Gap Height (h)'],
  ['펌프 3계통 토출량 (작업일지 4번·5번 표 연동)', '3-Stream Metering Pump Flow Rates'],
  ['단위 면적(1m×1m) 및 200×200mm 시편 기준 중량 (.xlsm 연동)', 'Unit Area (1m×1m) & 200×200mm Specimen Weights (.xlsm)'],
  ['4. Doctor Blade 유체역학 수식 및 카르다노 풀이 중간값 상세 (엑셀 Row 40~53 & .xlsm Row 16~36)', '4. Doctor Blade Fluid Dynamics & Cardano Cubic Solution Breakdown'],
  ['SMC 시트 중량 (길이 1m당)', 'SMC Sheet Weight (per 1m length)'],
  ['페이스트 중량 (길이 1m당)', 'Paste Weight (per 1m length)'],
  ['유리섬유 중량 (길이 1m당)', 'Glass Fiber Weight (per 1m length)'],
  ['폭 1m당 필요 체적 유량 (q)', 'Volumetric Flow per Unit Width (q)'],
  ['정수압 (Hydrostatic Pressure Δp)', 'Hydrostatic Pressure Drop (Δp)'],
  ['압력 유동 계수 (A)', 'Pressure Flow Coefficient (A)'],
  ['끌림 유동 계수 (B)', 'Drag Flow Coefficient (B)'],
  ['1. 끌림 유동 항 (Drag Flow Term)', '1. Drag Flow Term'],
  ['2. 압력 유동 항 (Pressure Flow Term)', '2. Pressure Flow Term'],
  ['카르다노 3차 방정식 풀이 중간값 1, 2', 'Cardano Cubic Equation Roots u₁, u₂'],
  ['검증: 갭(h)으로 역산한 단중', 'Verification: Back-Calculated Areal Weight from Gap (h)'],
  ['✓ 목표 단중과 완벽히 일치합니다', '✓ Matches Target Areal Weight Exactly'],
  ['5. 원재료별 비중 · 부피(L) · 부피분율(Vol %) 상세 (설정값 계산 3번 표 & .xlsm 연동)', '5. Material Specific Gravity, Volume (L) & Volume Fraction (Vol %) Breakdown'],
  ['6. 배합.xlsx 연동 — 배합표 권장값 vs 작업일지 실제값 비교 검증 (설정값 계산 6번 표)', '6. Recipe Recommended Kg vs. Actual Production Log Comparison'],
  ['기준 배합 선택', 'Select Base Formulation'],
  ['선택 배합 수지 phr', 'Selected Resin phr'],
  ['배율 (실제 수지 ÷ 수지 phr)', 'Multiplier (Actual Resin ÷ phr)'],
  ['PS40 농도 보정계수', 'PS40 Concentration Factor'],
  ['권장 사용량(Kg)', 'Recommended (Kg)'],
  ['작업일지 실제(Kg)', 'Actual Log (Kg)'],
  ['희석제 (SM, 3-2행 수동 추가분)', 'Styrene Monomer (SM, Row 3-2 Extra)'],
  ['희석제 (SM) 합계 비교', 'Styrene Monomer (SM) Total Comparison'],
  ['저장된 설정값 이력', 'Saved Machine Setting History'],
  ['아직 저장한 계산이 없습니다. 저장하면 생산일지에서 불러옵니다.', 'No saved settings yet. Save a calculation above to load it in Production Logs.'],

  // Mixing Work Order
  ['새 배합지시서', 'Issue New Mixing Work Order'],
  ['1배치 수지 투입량 (kg)', 'Resin Input per 1 Batch (kg)'],
  ['이 값으로 나머지 원재료가 phr대로 환산됩니다', 'All other materials are scaled by phr from this resin amount'],
  ['배치 수', 'No. of Batches'],
  ['작업일', 'Work Date'],
  ['지시서 발행', 'Issue Work Order'],
  ['미승인 처방으로 발행됩니다', 'Issued with unapproved draft recipe'],
  ['발행된 지시서', 'Issued Mixing Work Orders'],
  ['발행된 지시서가 없습니다.', 'No mixing work orders issued yet.'],
  ['🖨️ 지시서 인쇄', '🖨️ Print Work Order'],
  ['필요 유리섬유(참고)', 'Required Glass Fiber (Ref.)'],
  ['STEP 1 메인 액상·저수축제 혼합', 'STEP 1 Base Liquids (Resin + LPA + SM)'],
  ['STEP 2 첨가제·중합금지제', 'STEP 2 Additives & Inhibitor'],
  ['STEP 3 경화제 (투입 후 파우더 전 고속 교반)', 'STEP 3 Initiator (High-speed mix before powders)'],
  ['STEP 4 내부이형제·PE 파우더', 'STEP 4 Internal Release Agent & PE Powder'],
  ['STEP 5 충진제 (2~3회 분할 투입)', 'STEP 5 Main Filler CaCO3 (Split into 2~3 additions)'],
  ['STEP 6 증점제·조색제 (별도 계량)', 'STEP 6 Thickener & Pigment (Separate metering)'],
  ['충진제 투입 중 최고 온도 (℃)', 'Max Temp During Filler Addition (℃)'],
  ['최고 교반 RPM', 'Max Mixing RPM'],
  ['초기 점도 (PS)', 'Initial Viscosity (PS)'],
  ['점도 측정 온도 (℃)', 'Viscosity Measurement Temp (℃)'],
  ['비고·특이사항', 'Remarks & Special Notes'],
  ['배합 완료 처리', 'Complete Mixing Order'],

  // Production Log & Smart Scan
  ['새 생산일지 시작', 'Start New Production Log'],
  ['🖨️ 빈 생산일지 양식 인쇄 (수기 기록용)', '🖨️ Print Blank Production Log (For Handwriting)'],
  ['🖨️ 빈 생산일지 양식 인쇄', '🖨️ Print Blank Production Log'],
  ['📷 사진 찍어 스캔 입력 (OCR)', '📷 Photo Scan & AI OCR Input'],
  ['📷 사진 찍어 스캔 입력', '📷 Photo Scan & AI OCR Input'],
  ['🖨️ 작성 일지 인쇄', '🖨️ Print Completed Log'],
  ['⚡ 샘플 일지 스캔 시연', '⚡ 1-Click Sample Scan Demo'],
  ['🤖 AI 자동 인식 실행', '🤖 Run Vision AI Extraction'],
  ['생산일지 마감 및 로트 생성', 'Close Production Log & Generate Lots'],

  // Lots & Labels
  ['로트 재고 (오래된 로트가 위)', 'Sheet Lot Inventory (FIFO: Oldest First)'],
  ['생산일지를 마감하면 로트가 자동 등록됩니다.', 'Closing a production log automatically registers sheet lots here.'],
  ['숙성 18시간 이전 또는 사용기한이 지난 로트는 출고할 수 없습니다. 선입선출을 건너뛰면 사유가 필요합니다.', 'Lots under 18h maturation or past expiry cannot be released. Skipping FIFO requires a reason.'],
  ['완제품 라벨', 'Finished Product Label'],
  ['인쇄 (2매)', 'Print Labels (2-Up)'],
  ['✂ 절취선 — 아래는 같은 라벨 1매 더', '✂ Cut Line — Duplicate Label Below (2-Up Print)'],

  // Materials Master
  ['비중·단가는 여기 한 곳에서만 관리하고, 처방·설정값 계산·원가가 모두 이 값을 참조합니다.', 'Specific gravity and unit prices are managed in this single master table and referenced across all recipes, settings, and cost sheets.'],
  ['원재료 추가', 'Add Material'],

  // Rules & Settings
  ['회사 브랜드 · 로고 설정', 'Company Brand & Logo Settings'],
  ['회사명 / 시스템 타이틀', 'Company Name / System Title'],
  ['좌측 메뉴 상단 및 인쇄 양식(배합지시서·생산일지·공정표준서·라벨)에 표시됩니다.', 'Displayed on the sidebar header and all printed forms/labels.'],
  ['로고 이미지 등록/변경', 'Upload / Change Logo'],
  ['로고 삭제', 'Remove Logo'],
  ['생산일지 사진 스캔 (Vision AI OCR) 설정', 'Production Log Photo Scan (Vision AI OCR) Setup'],
  ['AI 인식 엔진', 'Vision AI Engine'],
  ['API Key (선택)', 'API Key (Optional)'],
  ['관리 기준값', 'Process Control Limits & Thresholds'],
  ['여기 값이 배합·일지·로트·공정표준서 화면의 경고와 판정에 그대로 쓰입니다. 변경은 감사 이력에 남습니다.', 'These thresholds govern real-time warnings and pass/fail checks across Mixing, Production, Lots, and Process Standards.'],
  ['시트 보관 온도 상한', 'Max Sheet Storage Temperature'],
  ['충진제 투입 중 온도 상한', 'Max Temp During Filler Addition'],
  ['교반 최대 RPM', 'Max Agitator Speed (RPM)'],
  ['단중 허용 오차', 'Areal Weight Tolerance'],
  ['폭 허용 오차', 'Sheet Width Tolerance'],
  ['두께 허용 오차', 'Sheet Thickness Tolerance'],
  ['최소 숙성 시간', 'Minimum Maturation (Aging) Time'],
  ['권장 숙성 상한', 'Recommended Max Maturation Time'],
  ['사용기한', 'Shelf Life (Expiry)'],
  ['커터 날 정기 교체 누적 생산량', 'Cutter Blade Replacement Tonnage'],
  ['LOT 접두 코드(현장)', 'Plant LOT Prefix Code'],
  ['데이터 백업·복원', 'Database Backup & Restore'],
  ['백업 파일 내려받기', 'Download JSON Backup'],
  ['백업 파일로 복원', 'Restore from Backup File'],
  ['초기화', 'Factory Reset'],
  ['감사 이력 (최근 100건)', 'System Audit Trail (Latest 100 Entries)'],

  // Manuals (Standard.tsx) & Forms (Forms.tsx)
  ['1. SMC 생산 공정 표준서 (SMC-STD-001)', '1. SMC Process Standard (SMC-STD-001)'],
  ['2. 공정별 핵심 가이드 (실무 상세본)', '2. Process Core Guide (Shop-Floor Detail)'],
  ['3. 시트 관리 핵심 수칙 (한·베트남어)', '3. 5 Sheet Management Rules (EN/VI)'],
  ['4. 기계 관리·예방보전 가이드 (한·베트남어)', '4. Machine Maintenance Guide (EN/VI)'],
  ['베트남어(Tiếng Việt) 원문 병기', 'Show Vietnamese (Tiếng Việt) Subtitle'],
  ['🖨️ 현재 매뉴얼 인쇄', '🖨️ Print Current Manual'],
  ['1. 일일 생산일지 (신규·14롤)', '1. Daily Production Log (New · 14 Rolls)'],
  ['2. SMC 생산일지 (기존·17롤/0.5배치)', '2. SMC Production Log (Legacy · 17 Rolls / 0.5 Batch)'],
  ['3. 배합 생산 지시서 (40% / 30%)', '3. Mixing Work Order (40% / 30%)'],
  ['4. 완제품 라벨 양식 (2매)', '4. Finished Product Label Form (2-Up)'],
  ['수기 기록용 빈 양식(공양식)으로 보기', 'View as Blank Form (For Handwriting)'],
  ['🖨️ 현재 양식 인쇄', '🖨️ Print Current Form'],
  ['SMC 일일 생산일지 (신규 표준 양식)', 'SMC Daily Production Log (New Standard Form)'],
  ['1. 기본사항', '1. General Information'],
  ['2. 원재료 투입량 (Lot 포함)', '2. Raw Material Input (Incl. Lot No.)'],
  ['2. 원재료 투입량', '2. Raw Material Input'],
  ['3. 점도 확인 (회차별 1 ~ 14회차)', '3. Viscosity Check (Batches 1 ~ 14)'],
  ['3. 점도 확인', '3. Viscosity Check'],
  ['4. 유리섬유 함량 체크', '4. Glass Fiber Content Check'],
  ['4. 토출량 확인', '4. Flow Rate Verification'],
  ['5. 토출량 확인 (총 토출량 목표: 33.902 Kg/min)', '5. Flow Rate Check (Target Total: 33.902 Kg/min)'],
  ['5. 유리섬유 체크', '5. Glass Fiber Check'],
  ['6. 생산 확인 (Doctor Box 높이 · 유리섬유 컷터 RPM · 단중 · 생산중량)', '6. Production Roll Check (Doctor Box Gap · Cutter RPM · Areal Wt · Roll Wt)'],
  ['6. 출고 전 최종 품질 확인', '6. Pre-Shipment Final Quality Inspection'],
  ['7. 특이사항 및 조치', '7. Special Remarks & Corrective Actions'],

  // Standard Manual Content
  ['원재료 배합 공정 (Compounding Standard)', '1. Raw Material Compounding Standard'],
  ['배합은 화학적 균질성을 결정하는 핵심 공정입니다. 투입 순서와 정밀 계량은 품질의 기본입니다.', 'Compounding determines chemical homogeneity. Strict addition sequence and precision weighing are fundamental to quality.'],
  ['■ 원재료 투입 프로세스 (Sequence of Addition)', '■ Raw Material Sequence of Addition'],
  ['분산 효율 극대화 및 미세 기포 방지를 위해 반드시 아래 순서를 엄수합니다.', 'Strictly follow the sequence below to maximize dispersion efficiency and prevent micro-bubbles.'],
  ['메인 액상 및 저수축제 혼합', 'Base Liquids & LPA Mixing'],
  ['가장 양이 많고 기초가 되는 액체들을 먼저 섞습니다.', 'Mix the highest-volume base liquids first.'],
  ['희석제, 첨가제 및 중합방지제 투입', 'Monomer, Additives & Inhibitor Addition'],
  ['수지의 안정성과 분산력을 높이는 성분들을 넣습니다.', 'Add components that stabilize the resin and improve filler dispersion.'],
  ['경화제 투입', 'Initiator Addition'],
  ['내부이형제 및 PE 파우더', 'Internal Release Agent & PE Powder'],
  ['충진제 대량 투입', 'Main Filler (CaCO3) Addition'],
  ['전체 배합량의 40%를 차지합니다. 2~3회로 나누어 투입하며 고속 교반합니다.', 'Accounts for ~40% of total batch weight. Split into 2~3 additions under high-speed agitation.'],
  ['■ 공정 관리 항목 (Management Points)', '■ Key Process Control Points'],
  ['실수 방지 (Poka-Yoke)', 'Mistake-Proofing (Poka-Yoke)'],
  ['배합기 옆 투입 체크리스트 및 배합 지시서에 투입 즉시 서명 → 휴먼 에러 원천 차단', 'Sign the Mixing Work Order immediately after weighing each material to eliminate human error.'],
  ['배합 지시서 필수 날인', 'Mandatory Sign-off'],
  ['교반 제어', 'Agitation Control'],
  ['지정 RPM으로 교반, 고속 교반 시 마찰열 과도 발생 주의', 'Mix at specified RPM; monitor frictional heat buildup during high-speed dispersion.'],
  ['초기 점도 검사', 'Initial Viscosity Check'],
  ['배합 직후 점도 측정으로 레시피 준수 여부 최종 판정', 'Measure initial viscosity immediately after compounding to verify recipe compliance.'],
  ['시트 제조 및 유리섬유 투입 (Sheet Production)', '2. Sheet Production & Glass Fiber Chopping'],
  ['함침 및 포장 (Impregnation & Packaging)', '3. Impregnation & Packaging'],

  // Materials & Recipes Names
  ['물탱크용 SMC 시트 (유리섬유 33%)', 'Water Tank SMC Sheet (GF 33%)'],
  ['맨홀 C250용 SMC 시트 (TEST)', 'Manhole C250 SMC Sheet (TEST)'],
  ['일반 성형용 SMC 시트 (40%-T1 / 40%-O / 32.5%)', 'General Molding SMC Sheet (40%-T1 / 40%-O / 32.5%)'],
  ['SMC 물탱크용', 'SMC for Water Tank'],
  ['물탱크 (AL열 7배치)', 'Water Tank (Col AL 7-Batch)'],
  ['물탱크2', 'Water Tank 2'],
  ['물탱크', 'Water Tank'],
  ['불포화수지', 'Unsaturated Polyester Resin'],
  ['저수축제 (PS)', 'Low Profile Additive (PS)'],
  ['저수축제', 'Low Profile Additive (LPA)'],
  ['PE 파우더 (저수축)', 'PE Powder (Low Profile)'],
  ['PE 파우더', 'PE Powder'],
  ['희석제(추가)', 'Styrene Monomer (Extra)'],
  ['희석제 (SM)', 'Styrene Monomer (SM)'],
  ['희석제(SM)', 'Styrene Monomer (SM)'],
  ['희석제', 'Styrene Monomer (SM)'],
  ['분리방지제', 'Anti-Separation Agent'],
  ['분산제', 'Wetting & Dispersing Agent'],
  ['중합금지제', 'Polymerization Inhibitor'],
  ['중합방지제', 'Polymerization Inhibitor'],
  ['경화제·증점조절', 'Initiator & Modifier'],
  ['경화제', 'Initiator (Catalyst)'],
  ['초기증점조절제', 'Initial Thickening Modifier'],
  ['초기 증점조절제', 'Initial Thickening Modifier'],
  ['내부이형제', 'Internal Release Agent'],
  ['이형제', 'Release Agent'],
  ['충진제', 'Filler (CaCO3)'],
  ['증점제', 'Thickener (MgO Paste)'],
  ['조색제', 'Color Pigment Paste'],
  ['유리섬유', 'Glass Fiber Roving'],
  ['컴파운드(페이스트)', 'Compound (Paste A)'],
  ['컴파운드(Paste A)', 'Compound (Paste A)'],
  ['컴파운드', 'Compound'],
  ['수지', 'Resin'],
  ['첨가제', 'Additive'],

  // Common Table Headers & Status Badges
  ['승인됨', 'Approved'],
  ['초안', 'Draft'],
  ['폐기', 'Retired'],
  ['숙성중', 'Maturing'],
  ['사용가능', 'Ready'],
  ['만료임박', 'Expiring Soon'],
  ['만료', 'Expired'],
  ['출고완료', 'Released'],
  ['발행', 'Issued'],
  ['배합 중', 'Mixing'],
  ['완료됨', 'Completed'],
  ['완료', 'Done'],
  ['승인', 'Approve'],
  ['삭제', 'Delete'],
  ['제거', 'Remove'],
  ['열기', 'Open'],
  ['닫기', 'Close'],
  ['출고', 'Release'],
  ['라벨', 'Label'],
  ['서명', 'Sign'],
  ['미서명', 'Unsigned'],
  ['원재료비', 'Raw Mat. Cost'],
  ['부재료비', 'Sub-Mat. Cost'],
  ['노무비', 'Labor Cost'],
  ['제조경비', 'Overhead'],
  ['원재료', 'Material'],
  ['품목', 'Item'],
  ['품명', 'Product / Item'],
  ['규격', 'Specification'],
  ['비중', 'Specific Gravity'],
  ['단가 (원/kg)', 'Unit Price (KRW/kg)'],
  ['단가', 'Unit Price'],
  ['비고', 'Remarks'],
  ['상태', 'Status'],
  ['처방명', 'Recipe Name'],
  ['처방', 'Recipe'],
  ['작성자', 'Author'],
  ['작업일시', 'Timestamp'],
  ['생산일시', 'Produced At'],
  ['사용기한', 'Expiry Date'],
  ['실중량 (kg)', 'Net Weight (kg)'],
  ['실중량(Kg)', 'Net Wt (Kg)'],
  ['실중량', 'Net Wt'],
  ['총중량(Kg)', 'Gross Wt (Kg)'],
  ['총중량', 'Gross Wt'],
  ['단중(Kg/㎡)', 'Areal Wt (Kg/㎡)'],
  ['단중', 'Areal Wt'],
  ['생산 속도(m/min)', 'Line Speed (m/min)'],
  ['생산 속도', 'Line Speed'],
  ['제품 폭(mm)', 'Width (mm)'],
  ['제품 폭', 'Sheet Width'],
  ['함침정도(%)', 'Impreg. (%)'],
  ['함침정도', 'Impregnation'],
  ['함침 정도', 'Impregnation'],
  ['초기점도(PS/℃)', 'Init. Visc (PS/℃)'],
  ['초기점도', 'Initial Visc.'],
  ['말기점도(PS/℃)', 'Final Visc (PS/℃)'],
  ['말기점도', 'Final Visc.'],
  ['증점거동', 'Thickening Profile'],
  ['생산수율', 'Production Yield'],
  ['사용량(Kg)', 'Per Batch (Kg)'],
  ['총사용량(Kg)', 'Total Plan (Kg)'],
  ['실사용량(Kg)', 'Actual Used (Kg)'],
  ['지시량 (kg)', 'Target (kg)'],
  ['실제 투입 (kg)', 'Actual (kg)'],
  ['차이', 'Diff'],
  ['단위', 'Unit'],
  ['근거', 'Basis / Standard'],
  ['시각', 'Time'],
  ['일시', 'Date/Time'],
  ['구분', 'Category'],
  ['상세 내역', 'Details'],
  ['내용', 'Description'],
  ['항목', 'Item'],
  ['온도 (℃)', 'Temp (℃)'],
  ['습도 (%)', 'Humidity (%)'],
  ['날씨', 'Weather'],
  ['맑음', 'Clear'],
]

const SORTED_DICT = [...RAW_DICT].sort((a, b) => b[0].length - a[0].length)

export function translateText(input: string): string {
  if (!input || !/[가-힣]/.test(input)) return input
  let out = input
  for (const [ko, en] of SORTED_DICT) {
    if (out.includes(ko)) {
      out = out.split(ko).join(en)
    }
  }
  return out
}

const origTextMap = new WeakMap<Text, string>()
const origAttrMap = new WeakMap<Element, { placeholder?: string; title?: string }>()

function applyDomTranslation(root: HTMLElement, lang: Lang) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  let cur = walker.nextNode()
  while (cur) {
    textNodes.push(cur as Text)
    cur = walker.nextNode()
  }

  for (const node of textNodes) {
    const val = node.nodeValue ?? ''
    if (lang === 'en') {
      if (/[가-힣]/.test(val)) {
        if (!origTextMap.has(node)) {
          origTextMap.set(node, val)
        }
        const source = origTextMap.get(node) ?? val
        const translated = translateText(source)
        if (translated !== val) node.nodeValue = translated
      }
    } else {
      const orig = origTextMap.get(node)
      if (orig !== undefined && node.nodeValue !== orig) {
        node.nodeValue = orig
      }
    }
  }

  const els = root.querySelectorAll('[placeholder], [title]')
  els.forEach((el) => {
    const saved = origAttrMap.get(el) ?? {}
    if (lang === 'en') {
      const ph = el.getAttribute('placeholder')
      if (ph && /[가-힣]/.test(ph)) {
        if (!saved.placeholder) saved.placeholder = ph
        el.setAttribute('placeholder', translateText(saved.placeholder))
      }
      const ti = el.getAttribute('title')
      if (ti && /[가-힣]/.test(ti)) {
        if (!saved.title) saved.title = ti
        el.setAttribute('title', translateText(saved.title))
      }
      origAttrMap.set(el, saved)
    } else {
      if (saved.placeholder) el.setAttribute('placeholder', saved.placeholder)
      if (saved.title) el.setAttribute('title', saved.title)
    }
  })
}

export function useDomTranslator(containerRef: React.RefObject<HTMLElement>, lang: Lang, pageKey: string) {
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    let busy = false
    const run = () => {
      if (busy) return
      busy = true
      applyDomTranslation(root, lang)
      busy = false
    }
    run()
    const obs = new MutationObserver(() => {
      run()
    })
    obs.observe(root, { childList: true, subtree: true, characterData: true })
    return () => obs.disconnect()
  }, [containerRef, lang, pageKey])
}
