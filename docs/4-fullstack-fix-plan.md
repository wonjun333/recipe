# Archived: Fullstack Fix Plan

Last updated: 2026-06-18

이 문서는 과거 fullstack 수정 계획을 보관하기 위한 자리다. 현재 실행 계획 정본은 `docs/3-execution-plan.md`다.

과거 문서에는 다음과 같은 현재 기준과 맞지 않는 전제가 포함되어 있었다.

- 과거 Windows 중심 운영 기준
- test-only fake data 기반 개발/테스트 전략
- 과거 `invalidate-runtime-cache` 구현 상태
- 과거 frontend/backend 빌드 상태

현재 기준:

- 실제 PostgreSQL / MongoDB / FTP / SAML만 runtime 기준으로 사용
- Windows는 Codex/Claude Code 실행 및 편집 환경
- 구현/검증/배포는 Linux/Ubuntu 기준
- 주요 실행 계획은 `docs/3-execution-plan.md`에서 관리

필요한 항목은 `docs/3-execution-plan.md`와 `docs/ubuntu-deployment-guide.md`에 반영한다.
