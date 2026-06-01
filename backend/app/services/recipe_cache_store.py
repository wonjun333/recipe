from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / '.env')
except Exception:
    pass

try:
    from app.services.temp_file_store import LOCAL_EDIT_BASE
    _BASE_DIR = Path(str(LOCAL_EDIT_BASE)) / 'recipe_cache'
except Exception:
    _BASE_DIR = Path('/tmp/recipe_cache')

_DB_PATH = _BASE_DIR / 'recipe_cache.sqlite3'
_RAW_DIR = _BASE_DIR / 'raw'
_SQLITE_TIMEOUT_SEC = 30.0
_DB_LOCK = threading.RLock()
_WAL_CONFIGURED = False

_RECIPE_CACHE_DB_URL = os.environ.get('RECIPE_CACHE_DB_URL', '').strip()
_USE_POSTGRES = _RECIPE_CACHE_DB_URL.startswith('postgresql')


def now_ts() -> str:
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def db_path() -> Path:
    _BASE_DIR.mkdir(parents=True, exist_ok=True)
    _RAW_DIR.mkdir(parents=True, exist_ok=True)
    return _DB_PATH


def _connect():
    if _USE_POSTGRES:
        import psycopg
        from psycopg.rows import dict_row
        conn = psycopg.connect(_RECIPE_CACHE_DB_URL, row_factory=dict_row, connect_timeout=10)
        conn.autocommit = False
        return conn
    conn = sqlite3.connect(str(db_path()), timeout=_SQLITE_TIMEOUT_SEC)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA synchronous=NORMAL')
    conn.execute(f'PRAGMA busy_timeout={int(_SQLITE_TIMEOUT_SEC * 1000)}')
    return conn


def _sql(sql: str) -> str:
    if _USE_POSTGRES:
        return sql.replace('?', '%s')
    return sql


def _begin(conn) -> None:
    if not _USE_POSTGRES:
        conn.execute('BEGIN IMMEDIATE')


_schema_initialized = False


def _configure_wal_once() -> None:
    global _WAL_CONFIGURED
    if _WAL_CONFIGURED or _USE_POSTGRES:
        return
    with _DB_LOCK:
        if _WAL_CONFIGURED:
            return
        conn = _connect()
        try:
            conn.execute('PRAGMA journal_mode=WAL')
            conn.execute('PRAGMA wal_autocheckpoint=1000')
            _WAL_CONFIGURED = True
        finally:
            conn.close()


def _pg_column_exists(conn, table: str, column: str) -> bool:
    cur = conn.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name=%s AND column_name=%s",
        (table, column),
    )
    return cur.fetchone() is not None


def ensure_schema() -> None:
    global _schema_initialized
    if _schema_initialized:
        return
    _configure_wal_once()
    with _DB_LOCK:
        if _schema_initialized:
            return
        conn = _connect()
        try:
            if _USE_POSTGRES:
                _ensure_schema_postgres(conn)
            else:
                _ensure_schema_sqlite(conn)
            _schema_initialized = True
        finally:
            conn.close()


def _ensure_schema_sqlite(conn) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS equipment_inventory (
            eqp_id TEXT NOT NULL,
            source_path TEXT NOT NULL,
            name TEXT NOT NULL,
            ext TEXT,
            modified_at TEXT,
            size TEXT,
            last_live_modified_at TEXT,
            last_live_size TEXT,
            last_cache_refresh_at TEXT,
            live_present INTEGER NOT NULL DEFAULT 1,
            first_seen_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL,
            deleted_at TEXT,
            latest_version_id INTEGER,
            cloud_protected INTEGER NOT NULL DEFAULT 0,
            retain_cached INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (eqp_id, source_path, name)
        );
        CREATE INDEX IF NOT EXISTS idx_inventory_eqp_path ON equipment_inventory (eqp_id, source_path);

        CREATE TABLE IF NOT EXISTS file_versions (
            version_id INTEGER PRIMARY KEY AUTOINCREMENT,
            eqp_id TEXT NOT NULL,
            source_path TEXT NOT NULL,
            name TEXT NOT NULL,
            ext TEXT,
            modified_at TEXT,
            size TEXT,
            captured_at TEXT NOT NULL,
            capture_reason TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            file_hash TEXT NOT NULL,
            preview_json TEXT,
            metadata_json TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_versions_lookup ON file_versions (eqp_id, source_path, name, modified_at);

        CREATE TABLE IF NOT EXISTS inventory_failures (
            failure_id INTEGER PRIMARY KEY AUTOINCREMENT,
            eqp_id TEXT NOT NULL,
            source_path TEXT,
            stage TEXT NOT NULL,
            reason TEXT NOT NULL,
            created_at TEXT NOT NULL,
            resolved INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_failures_eqp ON inventory_failures (eqp_id, resolved, created_at);

        CREATE TABLE IF NOT EXISTS inventory_state (
            eqp_id TEXT PRIMARY KEY,
            revision INTEGER NOT NULL DEFAULT 0,
            inventory_hash TEXT NOT NULL DEFAULT '',
            file_count INTEGER NOT NULL DEFAULT 0,
            last_sync_at TEXT,
            last_changed_at TEXT,
            last_error TEXT
        );

        CREATE TABLE IF NOT EXISTS user_preferences (
            login_id TEXT PRIMARY KEY,
            line TEXT NOT NULL DEFAULT '',
            team TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL
        );
        """
    )
    existing_cols = {str(row['name']) for row in conn.execute("PRAGMA table_info(equipment_inventory)").fetchall()}
    if 'cloud_protected' not in existing_cols:
        conn.execute("ALTER TABLE equipment_inventory ADD COLUMN cloud_protected INTEGER NOT NULL DEFAULT 0")
    if 'retain_cached' not in existing_cols:
        conn.execute("ALTER TABLE equipment_inventory ADD COLUMN retain_cached INTEGER NOT NULL DEFAULT 0")
    if 'last_live_modified_at' not in existing_cols:
        conn.execute("ALTER TABLE equipment_inventory ADD COLUMN last_live_modified_at TEXT")
    if 'last_live_size' not in existing_cols:
        conn.execute("ALTER TABLE equipment_inventory ADD COLUMN last_live_size TEXT")
    if 'last_cache_refresh_at' not in existing_cols:
        conn.execute("ALTER TABLE equipment_inventory ADD COLUMN last_cache_refresh_at TEXT")
    conn.commit()


def _ensure_schema_postgres(conn) -> None:
    stmts = [
        """
        CREATE TABLE IF NOT EXISTS equipment_inventory (
            eqp_id TEXT NOT NULL,
            source_path TEXT NOT NULL,
            name TEXT NOT NULL,
            ext TEXT,
            modified_at TEXT,
            size TEXT,
            last_live_modified_at TEXT,
            last_live_size TEXT,
            last_cache_refresh_at TEXT,
            live_present INTEGER NOT NULL DEFAULT 1,
            first_seen_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL,
            deleted_at TEXT,
            latest_version_id BIGINT,
            cloud_protected INTEGER NOT NULL DEFAULT 0,
            retain_cached INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (eqp_id, source_path, name)
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_inventory_eqp_path ON equipment_inventory (eqp_id, source_path)",
        """
        CREATE TABLE IF NOT EXISTS file_versions (
            version_id BIGSERIAL PRIMARY KEY,
            eqp_id TEXT NOT NULL,
            source_path TEXT NOT NULL,
            name TEXT NOT NULL,
            ext TEXT,
            modified_at TEXT,
            size TEXT,
            captured_at TEXT NOT NULL,
            capture_reason TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            file_hash TEXT NOT NULL,
            preview_json TEXT,
            metadata_json TEXT
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_versions_lookup ON file_versions (eqp_id, source_path, name, modified_at)",
        """
        CREATE TABLE IF NOT EXISTS inventory_failures (
            failure_id BIGSERIAL PRIMARY KEY,
            eqp_id TEXT NOT NULL,
            source_path TEXT,
            stage TEXT NOT NULL,
            reason TEXT NOT NULL,
            created_at TEXT NOT NULL,
            resolved INTEGER NOT NULL DEFAULT 0
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_failures_eqp ON inventory_failures (eqp_id, resolved, created_at)",
        """
        CREATE TABLE IF NOT EXISTS inventory_state (
            eqp_id TEXT PRIMARY KEY,
            revision INTEGER NOT NULL DEFAULT 0,
            inventory_hash TEXT NOT NULL DEFAULT '',
            file_count INTEGER NOT NULL DEFAULT 0,
            last_sync_at TEXT,
            last_changed_at TEXT,
            last_error TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS user_preferences (
            login_id TEXT PRIMARY KEY,
            line TEXT NOT NULL DEFAULT '',
            team TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL
        )
        """,
    ]
    for stmt in stmts:
        conn.execute(stmt)
    # ALTER TABLE for missing columns (idempotent via DO NOTHING pattern)
    for col, definition in [
        ('cloud_protected', 'INTEGER NOT NULL DEFAULT 0'),
        ('retain_cached', 'INTEGER NOT NULL DEFAULT 0'),
        ('last_live_modified_at', 'TEXT'),
        ('last_live_size', 'TEXT'),
        ('last_cache_refresh_at', 'TEXT'),
    ]:
        if not _pg_column_exists(conn, 'equipment_inventory', col):
            conn.execute(f'ALTER TABLE equipment_inventory ADD COLUMN {col} {definition}')
    conn.commit()


def _norm_path(path: str) -> str:
    return str(path or '').replace('\\', '/').strip().rstrip('/').lower()


def _infer_ext(name: str) -> str:
    text = str(name or '').strip()
    return ('.' + text.split('.')[-1].lower()) if '.' in text else ''


def _upsert_inventory_sql() -> str:
    if _USE_POSTGRES:
        return """
        INSERT INTO equipment_inventory
        (eqp_id, source_path, name, ext, modified_at, size, last_live_modified_at, last_live_size,
         last_cache_refresh_at, live_present, first_seen_at, last_seen_at, deleted_at,
         latest_version_id, cloud_protected, retain_cached)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1, %s, %s, NULL, %s, %s, %s)
        ON CONFLICT (eqp_id, source_path, name) DO UPDATE SET
          ext=EXCLUDED.ext, modified_at=EXCLUDED.modified_at, size=EXCLUDED.size,
          last_live_modified_at=EXCLUDED.last_live_modified_at,
          last_live_size=EXCLUDED.last_live_size,
          last_cache_refresh_at=EXCLUDED.last_cache_refresh_at,
          live_present=EXCLUDED.live_present, last_seen_at=EXCLUDED.last_seen_at,
          deleted_at=EXCLUDED.deleted_at, latest_version_id=EXCLUDED.latest_version_id,
          cloud_protected=EXCLUDED.cloud_protected, retain_cached=EXCLUDED.retain_cached
        """
    return """
    INSERT OR REPLACE INTO equipment_inventory
    (eqp_id, source_path, name, ext, modified_at, size, last_live_modified_at, last_live_size,
     last_cache_refresh_at, live_present, first_seen_at, last_seen_at, deleted_at,
     latest_version_id, cloud_protected, retain_cached)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL, ?, ?, ?)
    """


def reconcile_inventory_entries(eqp_id: str, source_path: str, entries: list[dict[str, Any]], protected_lookup: Any | None = None) -> None:
    ensure_schema()
    seen_at = now_ts()
    norm_source = _norm_path(source_path)
    current_names: set[str] = set()
    with _DB_LOCK:
        conn = _connect()
        try:
            _begin(conn)
            for item in entries or []:
                name = str(item.get('name') or '').strip()
                if not name:
                    continue
                current_names.add(name)
                ext = str(item.get('ext') or '').strip() or _infer_ext(name)
                modified_at = str(item.get('modifiedAt') or '').strip()
                size = str(item.get('size') or '').strip()
                row = conn.execute(
                    _sql('SELECT first_seen_at, latest_version_id, cloud_protected, retain_cached, last_cache_refresh_at FROM equipment_inventory WHERE eqp_id=? AND source_path=? AND name=?'),
                    (eqp_id, norm_source, name),
                ).fetchone()
                first_seen_at = str(row['first_seen_at']) if row else seen_at
                latest_version_id = row['latest_version_id'] if row else None
                prev_cloud = int(row['cloud_protected']) if row else 0
                prev_retain = int(row['retain_cached']) if row else 0
                prev_cache_refresh = str(row['last_cache_refresh_at'] or '') if row else ''
                protected = bool(protected_lookup(name) if callable(protected_lookup) else prev_cloud)
                retain_cached = 1 if (protected or prev_retain) else 0
                conn.execute(
                    _upsert_inventory_sql(),
                    (
                        eqp_id, norm_source, name, ext, modified_at, size,
                        modified_at, size, prev_cache_refresh,
                        first_seen_at, seen_at, latest_version_id,
                        1 if protected else 0, retain_cached,
                    ),
                )
            stale_rows = conn.execute(
                _sql('SELECT name, cloud_protected, retain_cached FROM equipment_inventory WHERE eqp_id=? AND source_path=?'),
                (eqp_id, norm_source),
            ).fetchall()
            for row in stale_rows:
                name = str(row['name'])
                if name not in current_names:
                    prev_was_cloud = bool(int(row['cloud_protected'] or 0))
                    protected = prev_was_cloud and bool(protected_lookup(name) if callable(protected_lookup) else prev_was_cloud)
                    if prev_was_cloud and not protected:
                        conn.execute(
                            _sql('DELETE FROM equipment_inventory WHERE eqp_id=? AND source_path=? AND name=?'),
                            (eqp_id, norm_source, name),
                        )
                        conn.execute(
                            _sql('DELETE FROM file_versions WHERE eqp_id=? AND source_path=? AND name=?'),
                            (eqp_id, norm_source, name),
                        )
                    else:
                        retain_cached = 1 if protected else int(row['retain_cached'] or 0)
                        if not protected:
                            retain_cached = 0
                        conn.execute(
                            _sql('UPDATE equipment_inventory SET live_present=0, last_seen_at=?, deleted_at=COALESCE(deleted_at, ?), cloud_protected=?, retain_cached=? WHERE eqp_id=? AND source_path=? AND name=?'),
                            (seen_at, seen_at, 1 if protected else 0, int(retain_cached), eqp_id, norm_source, name),
                        )
            conn.commit()
        finally:
            conn.close()


def upsert_live_inventory_entries(eqp_id: str, source_path: str, entries: list[dict[Any, Any]], protected_lookup: Any = None) -> None:
    """FTP 실시간 조회 결과를 DB에 upsert. 삭제/stale 처리는 하지 않음 (워커 담당)."""
    ensure_schema()
    seen_at = now_ts()
    norm_source = _norm_path(source_path)
    with _DB_LOCK:
        conn = _connect()
        try:
            _begin(conn)
            for item in entries or []:
                name = str(item.get('name') or '').strip()
                if not name:
                    continue
                ext = str(item.get('ext') or '').strip() or _infer_ext(name)
                modified_at = str(item.get('modifiedAt') or '').strip()
                size = str(item.get('size') or '').strip()
                row = conn.execute(
                    _sql('SELECT first_seen_at, latest_version_id, cloud_protected, retain_cached, last_cache_refresh_at FROM equipment_inventory WHERE eqp_id=? AND source_path=? AND name=?'),
                    (eqp_id, norm_source, name),
                ).fetchone()
                first_seen_at = str(row['first_seen_at']) if row else seen_at
                latest_version_id = row['latest_version_id'] if row else None
                prev_cloud = int(row['cloud_protected']) if row else 0
                prev_retain = int(row['retain_cached']) if row else 0
                prev_cache_refresh = str(row['last_cache_refresh_at'] or '') if row else ''
                protected = bool(protected_lookup(name) if callable(protected_lookup) else prev_cloud)
                retain_cached = 1 if (protected or prev_retain) else 0
                conn.execute(
                    _upsert_inventory_sql(),
                    (
                        eqp_id, norm_source, name, ext, modified_at, size,
                        modified_at, size, prev_cache_refresh,
                        first_seen_at, seen_at, latest_version_id,
                        1 if protected else 0, retain_cached,
                    ),
                )
            conn.commit()
        finally:
            conn.close()


def list_inventory_entries(eqp_id: str, source_path: str | None = None, exts: list[str] | None = None, include_absent: bool = True) -> list[dict[str, Any]]:
    ensure_schema()
    conn = _connect()
    try:
        sql = _sql('SELECT * FROM equipment_inventory WHERE eqp_id=?')
        params: list[Any] = [eqp_id]
        if source_path is not None:
            sql += _sql(' AND source_path=?')
            params.append(_norm_path(source_path))
        if not include_absent:
            sql += ' AND live_present=1'
        rows = conn.execute(sql, tuple(params)).fetchall()
        results: list[dict[str, Any]] = []
        allowed = {str(x).lower() for x in (exts or [])}
        for row in rows:
            ext = str(row['ext'] or '').lower()
            if allowed and ext not in allowed:
                continue
            results.append({
                'eqpId': row['eqp_id'],
                'sourcePath': row['source_path'],
                'name': row['name'],
                'ext': row['ext'] or '',
                'modifiedAt': row['modified_at'] or '',
                'size': row['size'] or '',
                'lastLiveModifiedAt': row['last_live_modified_at'] or row['modified_at'] or '',
                'lastLiveSize': row['last_live_size'] or row['size'] or '',
                'lastCacheRefreshAt': row['last_cache_refresh_at'] or '',
                'livePresent': bool(row['live_present']),
                'firstSeenAt': row['first_seen_at'] or '',
                'lastSeenAt': row['last_seen_at'] or '',
                'deletedAt': row['deleted_at'] or '',
                'latestVersionId': row['latest_version_id'],
                'cloudProtected': bool(row['cloud_protected']) if 'cloud_protected' in row.keys() else False,
                'retainCached': bool(row['retain_cached']) if 'retain_cached' in row.keys() else False,
            })
        return results
    finally:
        conn.close()


def get_inventory_entry(eqp_id: str, source_path: str, name: str) -> dict[str, Any] | None:
    ensure_schema()
    conn = _connect()
    try:
        row = conn.execute(
            _sql('SELECT * FROM equipment_inventory WHERE eqp_id=? AND source_path=? AND name=?'),
            (eqp_id, _norm_path(source_path), str(name or '').strip()),
        ).fetchone()
        if not row:
            return None
        return {
            'eqpId': row['eqp_id'],
            'sourcePath': row['source_path'],
            'name': row['name'],
            'ext': row['ext'] or '',
            'modifiedAt': row['modified_at'] or '',
            'size': row['size'] or '',
            'lastLiveModifiedAt': row['last_live_modified_at'] or row['modified_at'] or '',
            'lastLiveSize': row['last_live_size'] or row['size'] or '',
            'lastCacheRefreshAt': row['last_cache_refresh_at'] or '',
            'livePresent': bool(row['live_present']),
            'firstSeenAt': row['first_seen_at'] or '',
            'lastSeenAt': row['last_seen_at'] or '',
            'deletedAt': row['deleted_at'] or '',
            'latestVersionId': row['latest_version_id'],
            'cloudProtected': bool(row['cloud_protected']) if 'cloud_protected' in row.keys() else False,
            'retainCached': bool(row['retain_cached']) if 'retain_cached' in row.keys() else False,
        }
    finally:
        conn.close()


def _save_raw_bytes(eqp_id: str, source_path: str, name: str, modified_at: str, file_hash: str, data: bytes) -> str:
    ext = _infer_ext(name).lstrip('.') or 'bin'
    subdir = _RAW_DIR / eqp_id / hashlib.sha1(f'{_norm_path(source_path)}::{name}'.encode()).hexdigest()[:12]
    subdir.mkdir(parents=True, exist_ok=True)
    stamp = (modified_at or now_ts()).replace(':', '').replace(' ', '_').replace('/', '-')
    filename = f'{stamp}_{file_hash[:12]}.{ext}.bin'
    target = subdir / filename
    target.write_bytes(data)
    return str(target)


def store_file_version(
    eqp_id: str,
    source_path: str,
    name: str,
    modified_at: str,
    size: str,
    file_bytes: bytes,
    preview_payload: dict[str, Any] | None,
    capture_reason: str = 'worker',
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    ensure_schema()
    norm_source = _norm_path(source_path)
    digest = hashlib.sha1(file_bytes).hexdigest()
    storage_path = _save_raw_bytes(eqp_id, norm_source, name, modified_at, digest, file_bytes)
    captured_at = now_ts()
    ext = _infer_ext(name)
    preview_json = json.dumps(preview_payload, ensure_ascii=False) if preview_payload is not None else None
    metadata_json = json.dumps(metadata or {}, ensure_ascii=False)
    with _DB_LOCK:
        conn = _connect()
        try:
            _begin(conn)
            if _USE_POSTGRES:
                cur = conn.execute(
                    """
                    INSERT INTO file_versions
                    (eqp_id, source_path, name, ext, modified_at, size, captured_at, capture_reason,
                     storage_path, file_hash, preview_json, metadata_json)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING version_id
                    """,
                    (eqp_id, norm_source, name, ext, modified_at, size, captured_at, capture_reason,
                     storage_path, digest, preview_json, metadata_json),
                )
                version_id = int(cur.fetchone()['version_id'])
            else:
                conn.execute(
                    """
                    INSERT INTO file_versions
                    (eqp_id, source_path, name, ext, modified_at, size, captured_at, capture_reason,
                     storage_path, file_hash, preview_json, metadata_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (eqp_id, norm_source, name, ext, modified_at, size, captured_at, capture_reason,
                     storage_path, digest, preview_json, metadata_json),
                )
                version_id = int(conn.execute('SELECT last_insert_rowid()').fetchone()[0])
            row = conn.execute(
                _sql('SELECT first_seen_at, cloud_protected, retain_cached, last_live_modified_at, last_live_size FROM equipment_inventory WHERE eqp_id=? AND source_path=? AND name=?'),
                (eqp_id, norm_source, name),
            ).fetchone()
            first_seen_at = str(row['first_seen_at']) if row else captured_at
            prev_cloud = int(row['cloud_protected']) if row else 0
            prev_retain = int(row['retain_cached']) if row else 0
            prev_live_mod = str(row['last_live_modified_at'] or '') if row else ''
            prev_live_size = str(row['last_live_size'] or '') if row else ''
            meta = metadata or {}
            cloud_protected = 1 if bool(meta.get('cloudProtected')) else prev_cloud
            retain_cached = 1 if (cloud_protected or prev_retain) else 0
            new_live_mod = str(meta.get('liveModifiedAt') or modified_at or prev_live_mod or '').strip()
            new_live_size = str(meta.get('liveSize') or size or prev_live_size or '').strip()
            conn.execute(
                _upsert_inventory_sql(),
                (
                    eqp_id, norm_source, name, ext, modified_at, size,
                    new_live_mod, new_live_size, captured_at,
                    first_seen_at, captured_at, version_id,
                    cloud_protected, retain_cached,
                ),
            )
            conn.commit()
        finally:
            conn.close()
    return get_latest_version(eqp_id, source_path, name) or {}


def get_latest_version(eqp_id: str, source_path: str, name: str) -> dict[str, Any] | None:
    ensure_schema()
    conn = _connect()
    try:
        row = conn.execute(
            _sql('SELECT * FROM file_versions WHERE eqp_id=? AND source_path=? AND name=? ORDER BY version_id DESC LIMIT 1'),
            (eqp_id, _norm_path(source_path), str(name or '').strip()),
        ).fetchone()
        if not row:
            return None
        return {
            'versionId': row['version_id'],
            'eqpId': row['eqp_id'],
            'sourcePath': row['source_path'],
            'name': row['name'],
            'ext': row['ext'] or '',
            'modifiedAt': row['modified_at'] or '',
            'size': row['size'] or '',
            'capturedAt': row['captured_at'] or '',
            'captureReason': row['capture_reason'] or '',
            'storagePath': row['storage_path'] or '',
            'fileHash': row['file_hash'] or '',
            'preview': json.loads(row['preview_json']) if row['preview_json'] else None,
            'metadata': json.loads(row['metadata_json']) if row['metadata_json'] else {},
        }
    finally:
        conn.close()


def get_latest_version_bytes(eqp_id: str, source_path: str, name: str) -> bytes | None:
    latest = get_latest_version(eqp_id, source_path, name)
    if not latest:
        return None
    storage_path = str(latest.get('storagePath') or '').strip()
    if not storage_path:
        return None
    try:
        return Path(storage_path).read_bytes()
    except Exception:
        return None


def list_latest_versions(eqp_id: str, source_path: str | None = None, exts: list[str] | None = None) -> list[dict[str, Any]]:
    ensure_schema()
    conn = _connect()
    try:
        sql = _sql("""
        SELECT fv.*
        FROM file_versions fv
        INNER JOIN (
            SELECT eqp_id, source_path, name, MAX(version_id) AS max_version_id
            FROM file_versions
            WHERE eqp_id = ?
            GROUP BY eqp_id, source_path, name
        ) latest
          ON latest.eqp_id = fv.eqp_id
         AND latest.source_path = fv.source_path
         AND latest.name = fv.name
         AND latest.max_version_id = fv.version_id
        """)
        rows = conn.execute(sql, (eqp_id,)).fetchall()
        allowed = {str(x).lower() for x in (exts or [])}
        results: list[dict[str, Any]] = []
        target_path = _norm_path(source_path) if source_path is not None else None
        for row in rows:
            source_path_value = str(row['source_path'] or '')
            if target_path is not None and _norm_path(source_path_value) != target_path:
                continue
            ext = str(row['ext'] or '').lower()
            if allowed and ext not in allowed:
                continue
            results.append({
                'versionId': row['version_id'],
                'eqpId': row['eqp_id'],
                'sourcePath': source_path_value,
                'name': row['name'],
                'ext': row['ext'] or '',
                'modifiedAt': row['modified_at'] or '',
                'size': row['size'] or '',
                'capturedAt': row['captured_at'] or '',
                'captureReason': row['capture_reason'] or '',
                'storagePath': row['storage_path'] or '',
                'fileHash': row['file_hash'] or '',
                'preview': json.loads(row['preview_json']) if row['preview_json'] else None,
                'metadata': json.loads(row['metadata_json']) if row['metadata_json'] else {},
            })
        return results
    finally:
        conn.close()


def mark_inventory_failure(eqp_id: str, source_path: str, stage: str, reason: str) -> None:
    ensure_schema()
    with _DB_LOCK:
        conn = _connect()
        try:
            _begin(conn)
            conn.execute(
                _sql('INSERT INTO inventory_failures (eqp_id, source_path, stage, reason, created_at, resolved) VALUES (?, ?, ?, ?, ?, 0)'),
                (str(eqp_id or '').strip(), _norm_path(source_path), str(stage or '').strip(), str(reason or '').strip(), now_ts()),
            )
            conn.commit()
        finally:
            conn.close()


def resolve_inventory_failures(eqp_id: str, source_path: str | None = None) -> None:
    ensure_schema()
    with _DB_LOCK:
        conn = _connect()
        try:
            _begin(conn)
            if source_path is None:
                conn.execute(_sql('UPDATE inventory_failures SET resolved=1 WHERE eqp_id=? AND resolved=0'), (str(eqp_id or '').strip(),))
            else:
                conn.execute(_sql('UPDATE inventory_failures SET resolved=1 WHERE eqp_id=? AND source_path=? AND resolved=0'), (str(eqp_id or '').strip(), _norm_path(source_path)))
            conn.commit()
        finally:
            conn.close()


def list_open_failures(limit: int = 500) -> list[dict[str, Any]]:
    ensure_schema()
    conn = _connect()
    try:
        rows = conn.execute(
            _sql('SELECT * FROM inventory_failures WHERE resolved=0 ORDER BY created_at DESC, failure_id DESC LIMIT ?'),
            (max(1, int(limit or 500)),),
        ).fetchall()
        return [{
            'failureId': row['failure_id'],
            'eqpId': row['eqp_id'],
            'sourcePath': row['source_path'],
            'stage': row['stage'],
            'reason': row['reason'],
            'createdAt': row['created_at'],
            'resolved': bool(row['resolved']),
        } for row in rows]
    finally:
        conn.close()


def get_inventory_revision(eqp_id: str) -> int:
    ensure_schema()
    conn = _connect()
    try:
        row = conn.execute(_sql('SELECT revision FROM inventory_state WHERE eqp_id=?'), (eqp_id,)).fetchone()
        return int(row['revision']) if row else 0
    finally:
        conn.close()


def get_inventory_state(eqp_id: str) -> dict[str, Any]:
    ensure_schema()
    conn = _connect()
    try:
        row = conn.execute(
            _sql('SELECT eqp_id, revision, inventory_hash, file_count, last_sync_at, last_changed_at, last_error FROM inventory_state WHERE eqp_id=?'),
            (eqp_id,),
        ).fetchone()
        if not row:
            return {
                'eqpId': eqp_id, 'revision': 0, 'inventoryHash': '',
                'fileCount': 0, 'lastSyncAt': '', 'lastChangedAt': '', 'lastError': '',
            }
        return {
            'eqpId': str(row['eqp_id']),
            'revision': int(row['revision'] or 0),
            'inventoryHash': str(row['inventory_hash'] or ''),
            'fileCount': int(row['file_count'] or 0),
            'lastSyncAt': str(row['last_sync_at'] or ''),
            'lastChangedAt': str(row['last_changed_at'] or ''),
            'lastError': str(row['last_error'] or ''),
        }
    finally:
        conn.close()


def touch_inventory_state(
    eqp_id: str,
    changed: bool = False,
    error: str = '',
    inventory_hash: str = '',
    file_count: int = 0,
) -> dict[str, Any]:
    ensure_schema()
    sync_at = now_ts()
    with _DB_LOCK:
        conn = _connect()
        try:
            _begin(conn)
            row = conn.execute(
                _sql('SELECT revision, inventory_hash, file_count, last_changed_at FROM inventory_state WHERE eqp_id=?'),
                (eqp_id,),
            ).fetchone()
            prev_revision = int(row['revision']) if row else 0
            prev_hash = str(row['inventory_hash'] or '') if row else ''
            prev_count = int(row['file_count'] or 0) if row else 0
            effective_changed = bool(changed) or (inventory_hash and inventory_hash != prev_hash) or (int(file_count or 0) != prev_count)
            next_revision = prev_revision + 1 if effective_changed else prev_revision
            last_changed_at = sync_at if effective_changed else (str(row['last_changed_at'] or '') if row else '')
            conn.execute(
                _sql("""
                INSERT INTO inventory_state (eqp_id, revision, inventory_hash, file_count, last_sync_at, last_changed_at, last_error)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(eqp_id) DO UPDATE SET
                  revision=excluded.revision,
                  inventory_hash=excluded.inventory_hash,
                  file_count=excluded.file_count,
                  last_sync_at=excluded.last_sync_at,
                  last_changed_at=excluded.last_changed_at,
                  last_error=excluded.last_error
                """),
                (
                    eqp_id, next_revision, inventory_hash or prev_hash,
                    int(file_count or prev_count), sync_at, last_changed_at, str(error or ''),
                ),
            )
            conn.commit()
        finally:
            conn.close()
    return get_inventory_state(eqp_id)


def get_user_preferences(login_id: str) -> dict:
    ensure_schema()
    with _DB_LOCK:
        conn = _connect()
        try:
            row = conn.execute(
                _sql("SELECT line, team FROM user_preferences WHERE login_id = ?"),
                (login_id,),
            ).fetchone()
            if row:
                return {'line': row['line'] or '', 'team': row['team'] or ''}
            return {'line': '', 'team': ''}
        finally:
            conn.close()


def save_user_preferences(login_id: str, line: str, team: str) -> None:
    ensure_schema()
    ts = now_ts()
    with _DB_LOCK:
        conn = _connect()
        try:
            conn.execute(
                _sql("""
                INSERT INTO user_preferences (login_id, line, team, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(login_id) DO UPDATE SET
                  line=excluded.line,
                  team=excluded.team,
                  updated_at=excluded.updated_at
                """),
                (login_id, line or '', team or '', ts),
            )
            conn.commit()
        finally:
            conn.close()
