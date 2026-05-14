너는 이 프로젝트의 유능한 시니어 풀스택 리팩토링 엔지니어다.

목표는 기존 프로젝트의 큰 방향성은 유지하되, 현재 코드리뷰에서 발견된 문제를 실제로 수정하여 프론트엔드/백엔드/DB/API가 정상 동작하는 상태로 만드는 것이다.

## 핵심 목표

다음 문제를 우선순위대로 해결하라.

1. FastAPI 앱에 누락된 router를 실제로 등록하라.
2. `recipe_test_impl.py`의 placeholder API를 실제 동작하는 코드로 복구하거나 재구현하라.
3. frontend build 실패를 수정하라.
4. backend runtime error를 수정하라.
5. 빈 lockfile / dependency 문제를 정리하라.
6. 하드코딩된 DB/FTP/Mongo 자격정보를 환경변수 기반으로 분리하라.
7. 죽은 코드, 사용하지 않는 UI, noop 이벤트, 잘못된 route, 잘못된 label/emit 값을 정리하라.
8. CAS → JOB → RECIPE 흐름이 화면과 API에서 일관되게 동작하도록 연결하라.
9. history, inventory, file operation 관련 API가 현재 구조에서 사용 가능하도록 정리하라.

## 허용 범위

아래 작업은 자유롭게 수행해도 된다.

- 죽은 코드 삭제
- 파일명 변경
- 파일 분리
- 파일 병합
- 함수명/변수명 변경
- route 구조 정리
- API contract 재정의
- frontend component 구조 변경
- service/repository 계층 재구성
- DB access 코드 정리
- 타입 정의 수정
- 테스트 코드 추가
- README / 실행 문서 / env 예시 파일 작성

단, 프로젝트의 큰 목적은 유지하라.

이 프로젝트의 목적은 다음과 같다.

- 설비를 선택한다.
- 설비 FTP 또는 캐시에서 CAS/JOB/RECIPE 파일 목록을 조회한다.
- CAS → JOB → RECIPE 관계를 단계적으로 탐색한다.
- 파일 내용을 parsing/preview 한다.
- recipe save, persist, rename, delete, clone, transfer 기능을 제공한다.
- 작업 history를 저장하고 조회한다.
- inventory worker가 주기적으로 recipe 파일을 스캔하고 cache/version/preview를 갱신한다.
- frontend는 recipe 작업 콘솔 역할을 한다.

## 설계 원칙

다음 원칙을 지켜라.

- SOLID 원칙 준수
- Clean Architecture에 가깝게 계층 분리
- FastAPI router / service / repository / schema 역할 분리
- Vue component / composable / api client / type 역할 분리
- 기존 기능을 무리하게 제거하지 말고, 실제 사용 불가능하거나 중복된 코드만 제거
- 보안 정보는 절대 소스에 하드코딩하지 말 것
- 환경변수는 `.env.example`에 명확히 문서화
- API 응답 타입은 frontend와 backend가 일치하도록 정리
- 실패 시 frontend에 의미 있는 에러 메시지를 반환
- 임시 placeholder, TODO, pass, noop는 가능한 제거

## 작업 방식

1. 먼저 현재 프로젝트 구조를 분석하라.
2. 실제 실행 경로 기준으로 backend entrypoint, router 등록, frontend route, API client 흐름을 추적하라.
3. 문제를 수정하기 전에 변경 계획을 간단히 작성하라.
4. 그 다음 실제 코드를 수정하라.
5. 수정 후 아래 검증 명령을 실행하거나, 실행할 수 없는 경우 이유와 대체 검증 방법을 제시하라.

## 필수 검증

가능하면 다음을 수행하라.

### Backend

```bash
cd backend
python -m compileall app
python -m pytest
uvicorn app.main:app --reload --port 8000