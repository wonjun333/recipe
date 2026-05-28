from __future__ import annotations

import argparse
import logging
import logging.handlers
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.services.ftp_eqp_ip import load_eqp_ftp_credentials, load_lk_model_eqps
from app.services.recipe_cache_store import ensure_schema, touch_inventory_state
from app.services.recipe_inventory_sync import sync_equipment_inventory_once

log = logging.getLogger("inventory_worker")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Periodic FTP inventory + changed-only download worker')
    parser.add_argument('--interval-sec', type=int, default=30, help='한 cycle 완료 후 다음 cycle까지의 목표 간격(초)')
    parser.add_argument('--limit', type=int, default=0, help='테스트할 설비 수 제한. 0이면 lk_model 전체')
    parser.add_argument('--concurrency', type=int, default=20, help='동시에 몇 대 설비를 병렬 스캔할지')
    parser.add_argument('--once', action='store_true', help='한 번만 돌고 종료')
    parser.add_argument('--log-file', default='', help='로그 파일 경로. 미지정 시 stdout만 출력')
    parser.add_argument('--log-max-mb', type=int, default=10, help='로그 파일 최대 크기(MB). 초과 시 rotate')
    parser.add_argument('--log-backup', type=int, default=3, help='보관할 rotate 파일 수')
    parser.add_argument('--quiet', action='store_true', help='변화/에러 없는 장비는 출력 억제')
    parser.add_argument('--offline-cooldown-min', type=int, default=60, help='FTP 실패 설비 재시도 대기 시간(분)')
    return parser.parse_args()


def setup_logging(log_file: str, max_mb: int, backup: int) -> None:
    fmt = logging.Formatter('%(asctime)s %(levelname)s %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    ch = logging.StreamHandler()
    ch.setFormatter(fmt)
    root.addHandler(ch)

    if log_file:
        fh = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_mb * 1024 * 1024,
            backupCount=backup,
            encoding='utf-8',
        )
        fh.setFormatter(fmt)
        root.addHandler(fh)


def run_one(eqp_id: str) -> dict:
    touch_inventory_state(eqp_id, changed=False, error='')
    try:
        creds = load_eqp_ftp_credentials(eqp_id)
    except Exception as e:
        touch_inventory_state(eqp_id, changed=False, error=f'credential: {e}')
        raise
    try:
        return sync_equipment_inventory_once(eqp_id, creds['host'], creds['user'], creds['password'])
    except Exception as e:
        touch_inventory_state(eqp_id, changed=False, error=f'sync: {e}')
        raise


def main() -> None:
    """웹 백엔드와 분리해서 실행하는 inventory/download worker."""
    args = parse_args()
    setup_logging(args.log_file, args.log_max_mb, args.log_backup)
    ensure_schema()
    cooldown_sec = max(0, int(args.offline_cooldown_min or 0)) * 60
    failed_until: dict[str, float] = {}

    while True:
        eqps = load_lk_model_eqps(limit=args.limit or None)
        started = time.time()
        now = time.monotonic()
        runnable_eqps = []
        skipped_cooldown = 0
        for item in eqps:
            eqp_id = item['eqpId']
            retry_at = failed_until.get(eqp_id, 0.0)
            if cooldown_sec > 0 and retry_at > now:
                skipped_cooldown += 1
                continue
            runnable_eqps.append(item)

        log.info(
            f'start cycle eqps={len(eqps)} runnable={len(runnable_eqps)} '
            f'skipped_cooldown={skipped_cooldown} concurrency={args.concurrency}'
        )

        total_changed = 0
        total_errors = 0

        with ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as pool:
            futures = {pool.submit(run_one, item['eqpId']): item['eqpId'] for item in runnable_eqps}
            for fut in as_completed(futures):
                eqp_id = futures[fut]
                try:
                    summary = fut.result()
                    changed = summary.get('changedFiles') or 0
                    errors = len(summary.get('errors', []))
                    last_error = str(summary.get('lastError') or '').strip()
                    if last_error:
                        errors += 1
                        if cooldown_sec > 0:
                            failed_until[eqp_id] = time.monotonic() + cooldown_sec
                    else:
                        failed_until.pop(eqp_id, None)
                    total_changed += changed
                    total_errors  += errors
                    if not args.quiet or changed or errors:
                        log.info(
                            f'{eqp_id}: changed={changed} downloaded={summary.get("downloaded")} '
                            f'errors={errors}'
                        )
                except Exception as e:
                    total_errors += 1
                    if cooldown_sec > 0:
                        failed_until[eqp_id] = time.monotonic() + cooldown_sec
                    log.error(f'{eqp_id}: failed -> {e}')

        elapsed = time.time() - started
        log.info(f'cycle done elapsed={elapsed:.1f}s total_changed={total_changed} total_errors={total_errors}')

        if args.once:
            break
        sleep_for = max(0.0, float(args.interval_sec) - elapsed)
        if sleep_for > 0:
            time.sleep(sleep_for)


if __name__ == '__main__':
    main()
