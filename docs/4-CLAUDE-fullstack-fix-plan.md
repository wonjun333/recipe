# Archived: CLAUDE Fullstack Fix Plan

Last updated: 2026-06-18

이 문서는 과거 Claude 기반 fullstack 수정 계획의 보관 문서다. 현재 작업 정본으로 사용하지 않는다.

현재 기준과 충돌하는 과거 전제:

- test-only runtime switch 도입/분기
- Windows 최종 배포
- `.bat` 중심 운영 절차
- 이미 구현된 API를 미구현으로 보는 항목
- 과거 코드 리뷰 스냅샷 기반 우선순위

현재 기준:

- 실제 사내 PostgreSQL / MongoDB / FTP / SAML 연결
- Linux/Ubuntu 기준 구현 및 검증
- Windows는 AI 편집 환경
- 실행 계획 정본은 `docs/3-execution-plan.md`
- 배포 기준은 `docs/ubuntu-deployment-guide.md`
