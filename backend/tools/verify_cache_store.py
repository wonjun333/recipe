"""
recipe_cache_store.py 동작 검증 스크립트 (격리된 SQLite DB 사용)
운영 DB를 건드리지 않고 cache store 핵심 로직을 로컬 임시 DB에서 검증한다.

실행:
  cd backend
  PYTHONPATH=. python tools/verify_cache_store.py
"""
from __future__ import annotations

import os
import sys
import tempfile
import traceback
from pathlib import Path

# ── 반드시 import 전에 env 조작 ────────────────────────────────────────────────
os.environ.pop('RECIPE_CACHE_DB_URL', None)   # PostgreSQL 미사용 → SQLite fallback
_TMP = tempfile.mkdtemp(prefix='recipe_verify_')
os.environ['LOCAL_EDIT_BASE'] = _TMP          # 임시 디렉토리에 DB/raw 생성
# ──────────────────────────────────────────────────────────────────────────────

import app.services.recipe_cache_store as cs  # noqa: E402

# 모듈 경로가 임시 디렉토리를 바라보도록 패치
cs._BASE_DIR = Path(_TMP) / 'recipe_cache'
cs._DB_PATH  = cs._BASE_DIR / 'recipe_cache.sqlite3'
cs._RAW_DIR  = cs._BASE_DIR / 'raw'
cs._schema_initialized = False
cs._WAL_CONFIGURED = False
cs._USE_POSTGRES = False

# ── 유틸 ──────────────────────────────────────────────────────────────────────
_PASS = 0
_FAIL = 0

def ok(name: str):
    global _PASS
    _PASS += 1
    print(f'  [PASS] {name}')

def fail(name: str, detail: str = ''):
    global _FAIL
    _FAIL += 1
    print(f'  [FAIL] {name}' + (f': {detail}' if detail else ''))

def check(name: str, condition: bool, detail: str = ''):
    if condition:
        ok(name)
    else:
        fail(name, detail)

def section(title: str):
    print(f'\n=== {title} ===')

# ── 1. ensure_schema ──────────────────────────────────────────────────────────
section('1. ensure_schema')
try:
    cs.ensure_schema()
    ok('스키마 초기화')
    # 두 번 호출해도 무결
    cs.ensure_schema()
    ok('중복 호출 안전')
except Exception as e:
    fail('ensure_schema', str(e))
    traceback.print_exc()

# ── 2. touch_inventory_state / get_inventory_state ────────────────────────────
section('2. inventory_state')
try:
    state = cs.touch_inventory_state('EQP-01', changed=False, error='', inventory_hash='abc123', file_count=5)
    check('initial revision=1 (hash 변경)', state['revision'] == 1)
    check('fileCount=5', state['fileCount'] == 5)
    check('inventoryHash=abc123', state['inventoryHash'] == 'abc123')

    state2 = cs.touch_inventory_state('EQP-01', changed=False, inventory_hash='abc123', file_count=5)
    check('동일 hash → revision 불변', state2['revision'] == 1)

    state3 = cs.touch_inventory_state('EQP-01', changed=True)
    check('changed=True → revision 증가', state3['revision'] == 2)

    state4 = cs.get_inventory_state('EQP-99')
    check('미존재 설비 → revision=0', state4['revision'] == 0)
except Exception as e:
    fail('inventory_state', str(e))
    traceback.print_exc()

# ── 3. reconcile_inventory_entries ────────────────────────────────────────────
section('3. reconcile_inventory_entries')
EQP = 'EQP-A1'
SRC = '/recipe'
try:
    entries = [
        {'name': 'PARAM01.pol', 'ext': '.pol', 'modifiedAt': '2025-01-01 10:00:00', 'size': '1024'},
        {'name': 'PARAM02.con', 'ext': '.con', 'modifiedAt': '2025-01-02 11:00:00', 'size': '2048'},
        {'name': 'PARAM03.meg', 'ext': '.meg', 'modifiedAt': '2025-01-03 12:00:00', 'size': '512'},
    ]
    cs.reconcile_inventory_entries(EQP, SRC, entries)
    rows = cs.list_inventory_entries(EQP, SRC)
    check('3개 파일 등록', len(rows) == 3)
    check('모두 live_present=True', all(r['livePresent'] for r in rows))

    names = {r['name'] for r in rows}
    check('파일명 일치', names == {'PARAM01.pol', 'PARAM02.con', 'PARAM03.meg'})
except Exception as e:
    fail('reconcile_inventory_entries', str(e))
    traceback.print_exc()

# ── 4. 파일 삭제 시 live_present=False ───────────────────────────────────────
section('4. 파일 FTP 제거 → live_present=False')
try:
    reduced = [
        {'name': 'PARAM01.pol', 'ext': '.pol', 'modifiedAt': '2025-01-01 10:00:00', 'size': '1024'},
    ]
    cs.reconcile_inventory_entries(EQP, SRC, reduced)
    rows = cs.list_inventory_entries(EQP, SRC, include_absent=True)
    absent = [r for r in rows if not r['livePresent']]
    present = [r for r in rows if r['livePresent']]
    check('남은 파일 1개 live=True', len(present) == 1)
    check('삭제된 파일 2개 live=False', len(absent) == 2)
except Exception as e:
    fail('live_present 처리', str(e))
    traceback.print_exc()

# ── 5. cloud_protected 파일: FTP 제거 후에도 retain ──────────────────────────
section('5. cloud_protected 파일 보존')
EQP_C = 'EQP-C1'
SRC_C = '/recipe'
try:
    # cloud_protected 파일 등록
    entries_with_cloud = [
        {'name': 'SECRET.pol', 'ext': '.pol', 'modifiedAt': '2025-03-01 09:00:00', 'size': '999'},
        {'name': 'NORMAL.con', 'ext': '.con', 'modifiedAt': '2025-03-01 09:00:00', 'size': '888'},
    ]
    cs.reconcile_inventory_entries(EQP_C, SRC_C, entries_with_cloud,
                                   protected_lookup=lambda n: n == 'SECRET.pol')
    rows = cs.list_inventory_entries(EQP_C, SRC_C)
    secret_row = next((r for r in rows if r['name'] == 'SECRET.pol'), None)
    check('SECRET.pol cloud_protected=True', secret_row is not None and secret_row['cloudProtected'])
    check('NORMAL.con cloud_protected=False', any(r['name'] == 'NORMAL.con' and not r['cloudProtected'] for r in rows))

    # FTP에서 두 파일 모두 제거
    cs.reconcile_inventory_entries(EQP_C, SRC_C, [],
                                   protected_lookup=lambda n: n == 'SECRET.pol')
    rows_after = cs.list_inventory_entries(EQP_C, SRC_C, include_absent=True)
    secret_after = next((r for r in rows_after if r['name'] == 'SECRET.pol'), None)
    normal_after = next((r for r in rows_after if r['name'] == 'NORMAL.con'), None)
    check('SECRET.pol retain (live=False, retainCached=True)',
          secret_after is not None and not secret_after['livePresent'] and secret_after['retainCached'])
    check('NORMAL.con도 live=False', normal_after is None or not normal_after['livePresent'])
except Exception as e:
    fail('cloud_protected 보존', str(e))
    traceback.print_exc()

# ── 6. store_file_version / get_latest_version ───────────────────────────────
section('6. store_file_version / get_latest_version')
EQP_V = 'EQP-V1'
SRC_V = '/recipe'
try:
    raw_bytes = b'\x00\x01\x02RECIPE_DATA_SAMPLE'
    result = cs.store_file_version(
        eqp_id=EQP_V,
        source_path=SRC_V,
        name='RECIPE_A.pol',
        modified_at='2025-05-01 08:00:00',
        size='17',
        file_bytes=raw_bytes,
        preview_payload={'polData': [1, 2, 3]},
        capture_reason='worker',
        metadata={'cloudProtected': True, 'liveModifiedAt': '2025-05-01 08:00:00', 'liveSize': '17'},
    )
    check('store_file_version 반환값 존재', bool(result))
    check('versionId 존재', result.get('versionId') is not None)
    check('fileHash 존재', bool(result.get('fileHash')))
    check('preview 존재', result.get('preview') is not None)

    latest = cs.get_latest_version(EQP_V, SRC_V, 'RECIPE_A.pol')
    check('get_latest_version 조회', latest is not None)
    check('captureReason=worker', latest.get('captureReason') == 'worker')

    # 두 번째 버전 저장 → versionId 증가 확인
    result2 = cs.store_file_version(
        eqp_id=EQP_V, source_path=SRC_V, name='RECIPE_A.pol',
        modified_at='2025-05-02 09:00:00', size='20',
        file_bytes=b'UPDATED_RECIPE_DATA',
        preview_payload=None, capture_reason='manual',
    )
    check('2nd version id > 1st', result2.get('versionId', 0) > result.get('versionId', 0))

    # 실제 파일 내용 읽기
    data = cs.get_latest_version_bytes(EQP_V, SRC_V, 'RECIPE_A.pol')
    check('get_latest_version_bytes 내용 일치', data == b'UPDATED_RECIPE_DATA')
except Exception as e:
    fail('store_file_version', str(e))
    traceback.print_exc()

# ── 7. get_inventory_entry ────────────────────────────────────────────────────
section('7. get_inventory_entry')
try:
    entry = cs.get_inventory_entry(EQP_V, SRC_V, 'RECIPE_A.pol')
    check('get_inventory_entry 조회', entry is not None)
    check('cloudProtected=True', entry.get('cloudProtected') is True)

    none_entry = cs.get_inventory_entry(EQP_V, SRC_V, 'NOT_EXIST.pol')
    check('존재하지 않는 파일 → None', none_entry is None)
except Exception as e:
    fail('get_inventory_entry', str(e))
    traceback.print_exc()

# ── 8. mark_inventory_failure / resolve / list_open_failures ─────────────────
section('8. inventory_failures')
try:
    cs.mark_inventory_failure('EQP-F1', '/recipe', 'ftp', 'Connection refused')
    cs.mark_inventory_failure('EQP-F1', '/recipe', 'ftp', 'Timeout')
    cs.mark_inventory_failure('EQP-F2', '/recipe', 'parse', 'Invalid format')

    opens = cs.list_open_failures()
    check('미해결 실패 3건', len(opens) == 3)

    cs.resolve_inventory_failures('EQP-F1')
    opens_after = cs.list_open_failures()
    check('EQP-F1 해결 후 1건 남음', len(opens_after) == 1)
    check('남은건 EQP-F2', opens_after[0]['eqpId'] == 'EQP-F2')
except Exception as e:
    fail('inventory_failures', str(e))
    traceback.print_exc()

# ── 9. list_latest_versions ───────────────────────────────────────────────────
section('9. list_latest_versions')
try:
    versions = cs.list_latest_versions(EQP_V)
    check('최신 버전 1건 (RECIPE_A.pol)', len(versions) == 1)
    check('captureReason=manual (2nd 버전이 최신)', versions[0].get('captureReason') == 'manual')
except Exception as e:
    fail('list_latest_versions', str(e))
    traceback.print_exc()

# ── 결과 ──────────────────────────────────────────────────────────────────────
print(f'\n{"="*45}')
print(f'결과: PASS={_PASS}  FAIL={_FAIL}')
print('="*45')
if _FAIL > 0:
    sys.exit(1)
