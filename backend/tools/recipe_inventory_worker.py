from __future__ import annotations

import argparse
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.services.ftp_eqp_ip import load_eqp_ftp_credentials, load_lk_model_eqps
from app.services.recipe_cache_store import ensure_schema, touch_inventory_state
from app.services.recipe_inventory_sync import sync_equipment_inventory_once


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Periodic FTP inventory + changed-only download worker')
    parser.add_argument('--interval-sec', type=int, default=5, help='한 cycle 완료 후 다음 cycle까지의 목표 간격(초)')
    parser.add_argument('--limit', type=int, default=0, help='테스트할 설비 수 제한. 0이면 lk_model 전체')
    parser.add_argument('--concurrency', type=int, default=10, help='동시에 몇 대 설비를 병렬 스캔할지')
    parser.add_argument('--once', action='store_true', help='한 번만 돌고 종료')
    return parser.parse_args()


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
    args = parse_args()
    ensure_schema()
    while True:
        eqps = load_lk_model_eqps(limit=args.limit or None)
        started = time.time()
        print(f'[recipe_inventory_worker] start cycle eqps={len(eqps)} concurrency={args.concurrency}')
        with ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as pool:
            futures = {pool.submit(run_one, item['eqpId']): item['eqpId'] for item in eqps}
            for fut in as_completed(futures):
                eqp_id = futures[fut]
                try:
                    summary = fut.result()
                    print(f"[recipe_inventory_worker] {eqp_id}: changed={summary.get('changedFiles')} downloaded={summary.get('downloaded')} errors={len(summary.get('errors', []))}")
                except Exception as e:
                    print(f'[recipe_inventory_worker] {eqp_id}: failed -> {e}')
        elapsed = time.time() - started
        print(f'[recipe_inventory_worker] cycle done elapsed={elapsed:.1f}s')
        if args.once:
            break
        sleep_for = max(0.0, float(args.interval_sec) - elapsed)
        if sleep_for > 0:
            time.sleep(sleep_for)


if __name__ == '__main__':
    main()
