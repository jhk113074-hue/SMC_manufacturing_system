---
trigger: always_on
description: SMC 기술·생산관리 시스템 AI 연속성 및 버전/히스토리 관리 규칙
---

# 프로젝트 연속성 및 히스토리 관리 지침

이 워크스페이스(`SMC_manufacturing_system`)에서 작업할 때는 모델이나 세션이 바뀌더라도 히스토리가 끊기지 않도록 반드시 다음 절차를 준수하세요:

1. **작업 시작 전**: 루트의 `AGENTS.md`와 `CHANGELOG.md`, 그리고 `git log -n 5 --oneline`을 확인하여 직전 작업 맥락을 파악합니다.
2. **작업 완료 후**:
   - `npm test`로 계산 엔진 테스트 통과 여부를 검증합니다.
   - `npm run build` 실행 후 `dist/index.html`을 루트의 `SMC_system.html`에 덮어써서 단독 실행 파일을 최신 상태로 유지합니다.
   - `CHANGELOG.md`에 날짜와 변경 내역을 기록합니다.
   - `git add` 및 `git commit`을 수행하여 변경 이력을 Git에 남깁니다.
