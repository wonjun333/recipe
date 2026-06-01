#!/bin/bash
# 좀비 프로세스 정리 및 서비스 재시작 스크립트

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
SAML_DIR="$PROJECT_DIR/Nodejs_SAML"
LOG_DIR="$BACKEND_DIR/logs"

# ── 1. 기존 프로세스 종료 ─────────────────────────────────────────
echo "[1/4] 기존 프로세스 종료 중..."

pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "vite preview"         2>/dev/null
pkill -f "recipe_inventory_worker" 2>/dev/null
pkill -f "node.*Nodejs_SAML"    2>/dev/null

sleep 2

# 포트가 남아있으면 강제 종료
for PORT in 8000 8282 44364; do
    PID=$(lsof -ti :$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "  포트 $PORT 강제 종료 (PID: $PID)"
        kill -9 $PID 2>/dev/null
    fi
done

echo "  완료"

# kill만 하고 재시작 없이 종료하는 옵션
if [ "$1" = "--kill-only" ]; then
    echo "프로세스 정리 완료 (재시작 안 함)"
    exit 0
fi

# ── 2. 로그 디렉토리 생성 ────────────────────────────────────────
mkdir -p "$LOG_DIR"

# ── 3. 백엔드 시작 ───────────────────────────────────────────────
echo "[2/4] 백엔드 시작 중..."
cd "$BACKEND_DIR"
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 \
    > "$LOG_DIR/backend.log" 2>&1 &
echo "  PID: $!"

# ── 4. 워커 시작 ─────────────────────────────────────────────────
echo "[3/4] 워커 시작 중..."
cd "$BACKEND_DIR"
nohup python tools/recipe_inventory_worker.py \
    --offline-cooldown-min 60 \
    --concurrency 10 \
    --quiet \
    --log-file "$LOG_DIR/inventory.log" \
    > "$LOG_DIR/worker.log" 2>&1 &
echo "  PID: $!"

# ── 5. 프론트엔드 시작 ───────────────────────────────────────────
echo "[4/4] 프론트엔드 시작 중..."
cd "$FRONTEND_DIR"
nohup npm run preview \
    > "$LOG_DIR/frontend.log" 2>&1 &
echo "  PID: $!"

# ── 완료 ─────────────────────────────────────────────────────────
sleep 2
echo ""
echo "=== 서비스 상태 ==="
for PORT in 8000 8282; do
    PID=$(lsof -ti :$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "  포트 $PORT: 실행 중 (PID: $PID)"
    else
        echo "  포트 $PORT: 시작 실패"
    fi
done
echo ""
echo "로그 확인:"
echo "  백엔드  : tail -f $LOG_DIR/backend.log"
echo "  워커    : tail -f $LOG_DIR/inventory.log"
echo "  프론트  : tail -f $LOG_DIR/frontend.log"
