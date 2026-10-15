# CLAUDE.md

이 프로젝트를 작업하기 전 반드시 루트 폴더의 [`AGENTS.md`](./AGENTS.md)와 [`CHANGELOG.md`](./CHANGELOG.md)를 먼저 읽고 지침을 따르세요.

## 핵심 규칙 요약
1. 작업 전: `CHANGELOG.md` 및 `git log -n 5 --oneline` 확인
2. 코드 수정 후:
   - `npm test` 실행하여 계산 엔진(`src/engine/calc.test.ts`) 통과 확인
   - `npm run build` 실행 후 `dist/index.html`을 `SMC_system.html`로 복사하여 단일 실행 파일 최신화
   - `CHANGELOG.md`에 변경 이력 기록
   - `git commit`으로 버전 히스토리 기록
