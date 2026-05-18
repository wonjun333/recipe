# FrontEnd 코드 리뷰 — 요약 리포트

**기준일**: 2026-05-18  
**범위**: `frontend/src/` 전체  
**총 이슈**: 69건 (Critical 6, High 17, Medium 26, Low 20)

---

## 이슈 통계

| 심각도 | 건수 | 분류 |
|-------|------|------|
| **Critical** | 6 | 런타임 오류, 미정의 함수, 테스트 전무 |
| **High** | 17 | 아키텍처, 에러 처리, 상태 관리 |
| **Medium** | 26 | 중복 코드, 디자인 불일치, 라우팅 |
| **Low** | 20 | 미사용 코드, 타입 안전성 |

---

## Critical 이슈 6건 (즉시 수정)

1. **C-FE-01**: String.endswith() 오타 (6곳)
   - 파일: RecipeTestPage.vue
   - 수정: `.endswith(` → `.endsWith(` 일괄 치환
   - 예상: 1시간

2. **C-FE-02**: loadHistory() 함수 미정의 (8곳)
   - RecipeTestPage에서 호출하나 정의 없음
   - 옵션: A) 제거 / B) 정의 추가
   - 예상: 30분~2시간

3. **C-FE-03**: 테스트 러너 미설정
   - package.json 무 test 스크립트
   - 방안: vitest + @vue/test-utils 설치
   - 예상: 4시간 셋업

4. **C-FE-04,05**: 구문 오염 (주석 없는 한글, compress_output_matrix)
   - 예상: 30분

5. **C-FE-06**: 전역 폰트 미선언
   - index.html에 font-family 선언 추가 (Win97 호환)
   - 예상: 2시간

---

## High 이슈 17건 (우선 처리)

| ID | 항목 | 파일 | 예상 |
|----|------|------|------|
| H-FE-01 | RecipeTestPage 3,522줄 분해 | composables로 분리 | 1-2주 |
| H-FE-02 | 디자인 혼용 (Win97 vs 현대) | TopBarNav 통일 필요 | 3일 |
| H-FE-03 | SPA fallback 라우트 미구현 | /recipe-test 새로고침 404 | 2일 |
| H-FE-04 | window.alert 남용 (14곳) | 토스트 notification으로 교체 | 3일 |
| H-FE-05 | 피처 간 직접 의존 | history → recipe_test import | 2일 |
| H-FE-06~07 | reactive(Set) + watch skip 플래그 | ref/watchPausable로 개선 | 2일 |
| H-FE-08 | CasFileListPanel/JobFileListPanel 90% 중복 | 제네릭 컴포넌트로 통합 | 3-4일 |
| H-FE-09 | API 에러 처리 미흡 | ApiError 클래스 정의 | 2시간 |
| H-FE-10~12 | 접근성 미흡 (포커스, 경계, 반응형) | ARIA + Escape 키 + max-height | 5일 |
| H-FE-13~14 | Sidebar 미사용, /recipe 미정의 | 정리 또는 명확화 | 2시간 |
| H-FE-15~16 | *.vue.js 파일 + console.log | .gitignore + 삭제 | 1시간 |
| H-FE-17 | displayJobName 함수 중복 | 공유 유틸 분리 | 1시간 |

---

## Medium 26건 (권장 개선)

- 폰트 크기 불일치 (10px vs 17px)
- 디자인/언어 불일치 (MyHistoryPage)
- 중복 함수 (selectRange*, deepClone 등)
- 타이머 누수, 폼 검증 누락
- 이모지 접근성, /recipe-test 중복 라우팅

---

## Low 20건 (선택 개선)

- 느슨한 비교 (== → ===)
- 타입 안전성 (any 제거)
- HTML lang="ko" 변경
- Computed 오남용

---

## Phase별 로드맵

### Phase 1 (1주)
- [ ] C-FE-01~06: 즉시 수정 6건
- [ ] vitest 셋업
- 예상: 1명 × 5일

### Phase 2 (2-3주)
- [ ] H-FE-01: RecipeTestPage 분해
- [ ] H-FE-02~04: 디자인, 토스트, 피처 분리
- 예상: 2명 × 2주

### Phase 3 (3-4주)
- [ ] Medium 26건 일괄 처리
- [ ] 접근성 개선, 중복 코드 제거
- 예상: 1.5명 × 3주

### Phase 4 (진행 중)
- [ ] Low 20건 + 테스트 커버리지 80%+

---

## 우선순위

**즉시** (1주):
```
✅ endswith 오타 → .endsWith (1시간)
✅ loadHistory 제거 또는 정의 (30분)
✅ 구문 오염 제거 (30분)
✅ 폰트 선언 추가 (2시간)
✅ vitest 설치 (4시간)
```

**핵심 차단** (Phase 2 조건):
```
🔴 RecipeTestPage 분해 (유지보수성)
🔴 API 에러 처리 (안정성)
🔴 디자인 통일 (UX)
```

---

## 강점 & 약점

**강점**:
- ✅ Win97 스타일 컴포넌트 기본 구현
- ✅ 라우팅 기본 구조 존재
- ✅ API 계약 타입 부분 정의

**약점**:
- ❌ 3,522줄 단일 파일 (유지보수 불가)
- ❌ 런타임 오류 6건 (사용자 영향)
- ❌ 테스트 0% (회귀 검증 불가)
- ❌ 디자인 시스템 미정의

---

**결론**: Critical 6건 해결 후 RecipeTestPage 분해가 가장 중요. 이 둘이 Phase 1-2의 80% 작업량.
