# Backend Code Review — 요약 리포트

**기준일**: 2026-05-18  
**범위**: `backend/` 전체  
**총 이슈**: 123건 (Critical 18, High 35, Medium 45, Low 25)

---

## 이슈 통계

| 심각도 | 건수 | 분류 |
|-------|------|------|
| **Critical** | 18 | API 비동작, 구현 미완료, 보안 취약 |
| **High** | 35 | 중복 코드, 성능, 에러 처리 |
| **Medium** | 45 | 코드 품질, 설계, 데이터 저장 |
| **Low** | 25 | 클린 코드, 개선 권장사항 |

---

## Critical 이슈 18건 (즉시 수정)

1. **C-BE-01**: main.py에 include_router() 전무
   - 결과: 모든 `/recipe-test/*`, `/recipe-inventory/*` 404 반환. 전체 API 비동작
   - 수정: 6개 라우터 등록 + app.include_router(...)
   - 예상: 30분

2. **C-BE-02**: sub-라우터가 호출하는 impl 함수 미정의
   - 문제: recipe_test_impl.py에 요청 모델만 있고 16개 핸들러 함수 부재
   - 수정: A) 모든 핸들러를 impl.py로 이전 또는 B) recipe_test.py 라우터 등록
   - 예상: 2-4시간

3. **C-BE-03**: 8개 ops 엔드포인트 + /recipe-content 미구현
   - cas/save, cas/persist, job/save, job/persist, recipe/clone, file/rename, delete, transfer 모두 없음
   - 예상: 8-16시간 (EP-05~11 기능 구현)

4. **C-BE-04**: recipe_test.py:1701 문법 오류
   - `[<backend/app/api/routes/recipe_test.py> - part4]` 라는 텍스트가 라인 중간에 존재 → 파서 오류
   - 수정: 즉시 삭제
   - 예상: 1분

5. **C-BE-05**: 인증/권한 처리 전무
   - 모든 엔드포인트 무방비. actorName/Team 클라이언트 임의 지정 → 감사 로그 위조 가능
   - 수정: 사내 SSO/JWT 기반 인증 미들웨어 도입
   - 예상: 4-6시간

6. **C-BE-06**: CORS 미설정 → 정책 불명확
   - CORSMiddleware 0건. 프론트 호출 시 CORS 에러 가능
   - 수정: env 기반 allow_origins 설정
   - 예상: 1시간

7. **C-BE-07**: FTP path traversal 취약점 (사용자 입력 무검증)
   - SaveAsRequest.sourceDir/targetDir, RenameRequest.remoteDir 검증 없이 ftp.cwd/STOR/DELE 전달
   - 영향: `../../` 또는 CRLF 인젝션으로 임의 경로 접근 가능
   - 수정: 화이트리스트 + 정규식 검증
   - 예상: 2-3시간

8. **C-BE-08**: DB 자격증명 기본값 비어있음
   - DB_PASSWORD 기본값 `""`, MONGO_URL localhost 하드코딩
   - 운영 시 .env 누락 → 의도치 않은 로컬 DB 또는 연결 실패
   - 수정: 필수 env는 누락 시 RuntimeError 던지고 부팅 실패
   - 예상: 1시간

9. **C-BE-09**: bare except 패턴 40+ 곳
   - FTP 연결 실패, DB 에러, 디스크 IO 모두 묻힘 → 디버깅 불가
   - `except Exception: pass` 주로 ftp.quit, recipe_test.py, recipe_inventory_sync.py에서
   - 수정: 예외별 로깅 + 의도적 raise
   - 예상: 3-4시간

10. **C-BE-10~18**: (중복, main/app 진입점 이중화, recipe_test.py 삭제 필요, RMS_down.py 절대 경로, 레거시 구조 등 8건)

---

## High 이슈 35건 (우선 처리)

| ID | 항목 | 파일 | 예상 |
|----|------|------|------|
| H-BE-01 | recipe_test.py 70% 중복 제거/삭제 | recipe_test.py vs impl.py | 2-4시간 |
| H-BE-02 | 동일 함수 3-4번 정의 (connect_ftp, parse_cfg) | ftp_client, text_utils 분리 | 2-3시간 |
| H-BE-03 | FTP 매 작업마다 새 연결 (성능) | file_ops_service.py | FtpSession Context Manager 2시간 |
| H-BE-04 | 쿼리 fallback 패턴 (오타 4번) | load_eqp_master_options | 1시간 |
| H-BE-05 | N+1 쿼리: get_inventory_entry 전체 스캔 | recipe_cache_store.py | WHERE 직접 쿼리 1시간 |
| H-BE-06 | 두 종류 PostgreSQL 접근 (db.py vs create_engine) | 싱글톤 커넥션 풀로 통일 | 2시간 |
| H-BE-07 | MongoClient 매 호출마다 new/close | ftp_credentials, ftp_eqp_ip | 싱글톤 + lifespan | 1시간 |
| H-BE-08 | SQLite WAL 미설정 + ensure_schema 매번 실행 | recipe_cache_store.py | PRAGMA + 1회 호출 | 1시간 |
| H-BE-09 | /transfer 경로 중복 정의 가능성 | recipe_file_ops vs recipe_test_ops | 정책 결정 후 1개만 유지 | 1시간 |
| H-BE-10~35 | (print→logging, 이력 JSONL 손실, HTTP예외 상태코드, 나머지 25건) | 전체 | 15-20시간 |

---

## Medium 45건 (권장 개선)

- 임시 저장소 tempdir 사용 (재부팅 손실, Windows 미호환)
- 절대 경로 하드코딩 (RMS_down.py)
- SQL 에러 원문 클라이언트 노출
- 미사용 import, dead code
- 전역 캐시 무한 증가 (메모리 누수)
- JSONL 이력 파일 동시성 문제

---

## Low 25건 (선택 개선)

- Cloud protected 정책 권한 검증 부재
- FTP 평문 전송 (FTP_TLS 미지원)
- FTP 자격증명 로그 누출 위험

---

## Phase별 로드맵

### Phase 1 (Critical 1주)
- [ ] C-BE-01~09: 즉시 수정 (라우터, 함수정의, 구현, 문법, 인증, CORS, 경로검증, 자격증명, 로깅)
- 예상: 1명 × 5-6일

### Phase 2 (High 2주)
- [ ] H-BE-01~08: 중복 제거, 성능 최적화, 쿼리 개선
- 예상: 1-2명 × 2주

### Phase 3 (Medium 2주)
- [ ] 데이터 저장소 정규화 (tempdir→env, JSONL→SQLite)
- [ ] 에러 처리/로깅 통일
- 예상: 1명 × 2주

### Phase 4 (테스트 + 운영)
- [ ] conftest.py 신설, TestClient 기반 회귀 테스트
- [ ] Windows 호환성 최종 검증

---

## 우선순위

**즉시** (1주):
```
✅ include_router 등록 (30분)
✅ recipe_test.py:1701 삭제 (1분)
✅ 16개 impl 함수 정의 (2-4시간)
✅ 인증 미들웨어 (4-6시간)
✅ CORS 설정 (1시간)
✅ FTP path traversal 검증 (2-3시간)
✅ DB 자격증명 강제화 (1시간)
✅ bare except → logging (3-4시간)
```

**핵심 차단** (Phase 2 조건):
```
🔴 ops 8개 + recipe-content 구현 (기능 완성)
🔴 중복 코드 제거 (유지보수성)
🔴 성능 최적화 (사내 FTP/DB 부하)
```

---

## 강점 & 약점

**강점**:
- ✅ FastAPI + SQLAlchemy 기본 프레임워크 설정
- ✅ 대부분의 비즈니스 로직 구현 존재 (recipe_test.py)
- ✅ 서비스 레이어 기본 구조

**약점**:
- ❌ API 라우팅 전면 비동작 (include_router 0건)
- ❌ 핵심 기능 8개 미구현 (ops)
- ❌ 인증/보안 전무 (감사 불가)
- ❌ 테스트 0건 (회귀 방지 불가)
- ❌ 코드 중복 70% (유지보수 악화)

---

**결론**: Critical 9건 해결 후 impl 함수 정의 완성이 Phase 1 핵심. include_router + 함수 정의로 API 기동 가능 상태 달성. 이후 High/Medium 단계에서 코드 품질 및 성능 개선.
