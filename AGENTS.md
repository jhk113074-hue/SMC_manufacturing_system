# AGENTS.md — AI 에이전트 작업 지침서 (AI Continuity & History Guide)

> **중요**: 이 문서는 본 프로젝트(`SMC 기술·생산관리 시스템`)를 유지보수하거나 기능을 추가하는 **모든 AI 에이전트(Antigravity/Gemini, Claude Code, Cursor, GitHub Copilot, Codex 등)**가 작업 전후에 반드시 준수해야 하는 표준 지침입니다. 모델이나 도구가 변경되더라도 일관된 코드 품질과 히스토리 추적을 보장하기 위해 작성되었습니다.

---

## 1. 작업 시작 전 필수 확인 사항 (Pre-Flight Checklist)

새로운 요청을 받으면 코드를 수정하기 전에 반드시 다음을 먼저 확인하세요:
1. **`CHANGELOG.md` 확인**: 최근 작업 내역, 설계 의도, 미결 사항(Open Issues)을 파악합니다.
2. **Git 상태 및 로그 확인**: `git status` 및 `git log -n 5 --oneline`을 실행하여 작업 트리가 깨끗한지, 직전 커밋이 무엇인지 확인합니다.
3. **기존 주석 및 도메인 규칙 보존**: `src/data/seed.ts`, `src/engine/calc.ts`, `src/pages/Rules.tsx` 등에 기록된 현장 표준서 근거와 도메인 주석을 임의로 삭제하지 마세요.

---

## 2. 프로젝트 아키텍처 및 도메인 요약

- **목적**: SMC(Sheet Molding Compound) 제조 공정의 처방 관리 → 닥터블레이드/펌프/컷터 설정값 계산 → 배합지시서 발행 및 단계별 서명 → 생산일지 기록 → 완제품 로트(FIFO)·라벨 인쇄 통합 시스템
- **기술 스택**: React 18 + TypeScript + Vite 5 + `vite-plugin-singlefile` + Vitest
- **저장소 구조**:
  - `src/types.ts`: 전체 데이터 모델 (`Material`, `Product`, `Recipe`, `SettingInput/Output`, `MixOrder`, `ProductionRun`, `SheetLot`, `Settings`, `DB`)
  - `src/store.ts`: `localStorage` (`smc-db-v1`) 기반 상태 저장소 + 감사 이력(`audit`) 자동 기록 + JSON 백업/복원
  - `src/data/seed.ts`: 초기 원재료, 물탱크 처방 4종(물탱크, 물탱크2, YSACC1, YSACC2), 기본 설비 프로필 및 관리 기준값
  - `src/engine/calc.ts` & `src/engine/calc.test.ts`:
    - 페이스트 비중(`pasteSG`), 유리섬유 함량(`glassFraction`), kg당 원가(`recipeCostPerKg`)
    - 닥터블레이드 유량 방정식 $A \cdot h^3 + B \cdot h = q$ 카르단 해법(`solveGapM`) 및 역산 검증(`computeSetting`)
    - 배치 스케일링(`scaleRecipe`)
  - `src/pages/`:
    - `Dashboard.tsx`: 핵심 KPI, 사용기한/숙성/미승인 알림, 커터 날 교체 누적 톤수 관리, 최근 감사 이력
    - `Recipes.tsx`: 제품 및 처방 버전 관리(초안 → 승인 → 폐기), 이전 버전 대비 phr 비교
    - `Setting.tsx`: 닥터블레이드 갭, 3계통 펌프(컴파운드/증점제/조색제) 토출량, 컷터 RPM 계산 및 저장
    - `Mixing.tsx`: STEP 1~6 순서 강제 서명, 충진제 온도/RPM 상한 경고, 배합 생산 지시서 인쇄(`.printable`)
    - `Production.tsx`: 롤별 생산/품질 판정, 점도 추이(초기~25분), 토출 실측 대비 목표 오차율, 수율 계산, 출고 전 5대 항목 점검, 마감 시 로트 자동 생성
    - `Lots.tsx`: 선입선출(FIFO) 재고 관리, 숙성(18h) 및 사용기한(2개월) 출고 제한, 완제품 라벨 2매 인쇄(`.printable`)
    - `Materials.tsx`: 원재료 마스터(비중·단가 단일 출처 관리, 사용 중인 원재료 삭제 방지)
    - `Rules.tsx`: 공정 관리 기준값 설정, JSON 백업/복원, 감사 이력 조회
  - `SMC_system.html`: **서버 없이 더블클릭만으로 실행 가능한 단일 HTML 배포본** (`dist/index.html`의 복사본)

---

## 3. 작업 완료 후 필수 절차 (Post-Work Protocol)

코드를 수정한 뒤에는 **예외 없이** 아래 4단계를 순서대로 수행해야 합니다:

### Step 1. 계산 엔진 테스트 및 타입 검증
```bash
npm test
```
- `src/engine/calc.test.ts`의 모든 단위 테스트가 통과하는지 확인합니다.
- 계산 로직을 수정하거나 추가한 경우 반드시 테스트 케이스도 함께 추가합니다.

### Step 2. 단일 실행 파일(`SMC_system.html`) 동기화 빌드
```bash
npm run build
```
- 빌드가 성공하면 생성된 `dist/index.html`을 프로젝트 루트의 `SMC_system.html`로 복사하여 항상 최신 상태를 유지합니다:
  - PowerShell: `Copy-Item -Path "dist\index.html" -Destination "SMC_system.html" -Force`
  - Bash: `cp dist/index.html SMC_system.html`

### Step 3. `CHANGELOG.md` 업데이트
- `CHANGELOG.md` 상단에 날짜, 버전/작업 제목, 변경된 내용(Added / Changed / Fixed), 관련 파일 목록을 기록합니다.

### Step 4. Git 커밋 생성
- 작업 단위가 끝날 때마다 명확한 커밋 메시지로 Git 커밋을 남깁니다:
  - `feat: ...` (새 기능)
  - `style: ...` (UI/디자인 개선)
  - `fix: ...` (버그 수정)
  - `refactor: ...` (리팩토링)
  - `docs: ...` (문서/히스토리 업데이트)

---

## 4. UI 및 디자인 유지보수 원칙

1. **프리미엄 인더스트리얼 디자인**:
   - 현장 작업자와 연구원 모두가 명확히 읽을 수 있는 고대비 타이포그래피, 정돈된 카드 레이아웃, 직관적인 상태 배지(`ok`, `warn`, `bad`, `info`, `mute`)를 유지합니다.
   - 숫자 입력(`input.num`)과 테이블 수치(`td.r`, `th.r`)는 항상 우측 정렬 및 `tabular-nums`를 유지하여 자릿수 비교가 쉬워야 합니다.
2. **인쇄 레이아웃(`@media print`) 보존**:
   - 배합지시서(`Mixing.tsx`)와 완제품 라벨(`Lots.tsx`)의 `.printable` 영역 및 `.label` 규격은 실제 현장 프린터로 출력되므로 인쇄 스타일이 깨지지 않도록 주의합니다.
3. **단일 파일 호환성**:
   - `SMC_system.html`이 오프라인/로컬 환경에서도 문제없이 동작하도록 외부 이미지나 무거운 런타임 의존성 추가를 지양하고, 인라인 SVG 아이콘과 CSS 스타일을 활용합니다.
