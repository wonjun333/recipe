# 배포 전 변경 항목

## 1. `backend/.env` — 필수 변경

현재 (개발):
```env
MOCK_MODE=true
POSTGRES_URL=
MONGO_URL=
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

배포용으로 변경:
```env
MOCK_MODE=false
POSTGRES_URL=postgresql+psycopg://<user>:<password>@<host>:<port>/<dbname>
MONGO_URL=mongodb://<host>:<port>/
CORS_ORIGINS=http://<실제서버IP>:<포트>
RECIPE_DATA_DIR=C:\ProgramData\RecipeRMS
```

---

## 2. `frontend/vite.config.ts` — proxy target 확인

현재 `/api` 요청이 `http://127.0.0.1:8000`으로 향함.

- 백엔드가 **같은 머신** 8000 포트에서 실행되면 변경 불필요
- 다른 서버라면 아래처럼 수정:

```typescript
proxy: {
  '/api': { target: 'http://<백엔드서버IP>:8000', changeOrigin: true },
},
```

---

## 3. 빌드 순서 (Windows 기준)

```bat
:: 1. backend/.env 수정

:: 2. 프론트엔드 빌드
cd frontend
npm install
npm run build

:: 3. 백엔드 실행
cd ..\backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 요약

| 항목 | 개발 | 배포 |
|------|------|------|
| `MOCK_MODE` | `true` | `false` |
| `POSTGRES_URL` | 비어있음 | 실제 DB URL |
| `MONGO_URL` | 비어있음 | 실제 DB URL |
| `CORS_ORIGINS` | localhost | 실제 서버 IP |
| `RECIPE_DATA_DIR` | 비어있음 | `C:\ProgramData\RecipeRMS` |
| 프론트엔드 코드 | - | 변경 없음, `npm run build`만 |
