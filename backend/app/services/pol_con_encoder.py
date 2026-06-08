from __future__ import annotations

import struct
from typing import Any

from app.services.pol_con_decoder import (
    _to_float,
    find_pos_param,
    get_hex_string_from_bytes,
    match_byte,
)
from app.services.pol_con_maps import CON_MAP, POL_MAP


def encode_pol_con_bytes(
    original_bytes: bytes,
    updated_param_values: dict[str, list[Any]],
    is_con: bool,
) -> bytes:
    """Patch-in-place: replaces only the value bytes of each param block.

    The file structure (headers, param IDs, block layout) is preserved exactly.
    Only the data payload bytes corresponding to keys in updated_param_values
    are overwritten.
    """
    param_map = CON_MAP if is_con else POL_MAP
    updates = _normalize_updates(updated_param_values)
    hex_string = get_hex_string_from_bytes(original_bytes)
    total_count = len(hex_string)

    try:
        step_num = int(hex_string[20:22], 16)
    except Exception:
        step_num = 1
    if step_num <= 0:
        step_num = 1

    param_anchor = '0010' if is_con else 'C003'
    point = find_pos_param(param_anchor, hex_string)
    if point is None:
        raise ValueError(f'Anchor {param_anchor} not found in file')

    hex_chars = list(hex_string)

    while True:
        if point >= total_count - 4:
            break

        param_id = hex_string[point:point + 4].upper()
        data_length = match_byte(hex_string[point + 4:point + 8], step_num)

        if data_length == 0:
            block_hex_len = 16
            values_start = point + 12
            step_count = 1
        elif data_length == 1:
            block_hex_len = 20
            values_start = point + 12
            step_count = 1
        elif data_length in (2, 4, 8, 16):
            block_hex_len = 4 + 8 + step_num * data_length * 2
            values_start = point + 12
            step_count = step_num
        else:
            chunk_count = max(1, int(data_length / 4)) if data_length else 1
            point += 4 + 8 + chunk_count * 8
            continue

        mapped = param_map.get(param_id, param_id)
        new_values = _find_update_values(updates, mapped, param_id)

        if new_values is not None:
            _patch_values(hex_chars, values_start, step_count, data_length, new_values)

        point += block_hex_len

    return bytes.fromhex(''.join(hex_chars))


def _normalize_updates(updated_param_values: dict[str, list[Any]]) -> dict[str, list[Any]]:
    """Normalize client keys while preserving decoder duplicate-key suffixes.

    Decoder exposes duplicate mapped params as NAME__RAWID.  Those exact keys
    must win over the common NAME key for the matching raw param block.
    """
    out: dict[str, list[Any]] = {}
    for key, value in (updated_param_values or {}).items():
        clean_key = str(key or '').strip()
        if not clean_key:
            continue
        if not isinstance(value, list):
            value = [value]
        out[clean_key] = value
        out[clean_key.upper()] = value
    return out


def _find_update_values(updates: dict[str, list[Any]], mapped: str, param_id: str) -> list[Any] | None:
    raw_id = str(param_id or '').upper()
    mapped_key = str(mapped or '').strip()
    exact_keys = [
        f'{mapped_key}__{raw_id}',
        f'{mapped_key.upper()}__{raw_id}',
        raw_id,
    ]
    for key in exact_keys:
        if key in updates:
            return updates[key]
    return updates.get(mapped_key) or updates.get(mapped_key.upper())


def _patch_values(
    hex_chars: list[str],
    values_start: int,
    step_count: int,
    data_length: int,
    new_values: list[Any],
) -> None:
    for i in range(step_count):
        val = new_values[i] if i < len(new_values) else (new_values[-1] if new_values else 0)

        if data_length in (0, 2):
            pos = values_start + i * 4
            packed = struct.pack('<h', max(-32768, min(32767, int(round(_to_float(val) or 0.0)))))
            _write_hex(hex_chars, pos, packed)
        elif data_length in (1, 4):
            pos = values_start + i * 8
            packed = struct.pack('<f', float(_to_float(val) or 0.0))
            _write_hex(hex_chars, pos, packed)
        elif data_length == 8:
            pos = values_start + i * 16
            v = val if isinstance(val, list) else [val, 0.0]
            while len(v) < 2:
                v.append(0.0)
            packed = struct.pack('<ff', float(_to_float(v[0]) or 0.0), float(_to_float(v[1]) or 0.0))
            _write_hex(hex_chars, pos, packed)
        elif data_length == 16:
            pos = values_start + i * 32
            v = val if isinstance(val, list) else [val, 0.0, 0.0, 0.0]
            while len(v) < 4:
                v.append(0.0)
            packed = struct.pack('<ffff', *[float(_to_float(x) or 0.0) for x in v[:4]])
            _write_hex(hex_chars, pos, packed)


def _write_hex(hex_chars: list[str], pos: int, packed: bytes) -> None:
    encoded = packed.hex().upper()
    for j, ch in enumerate(encoded):
        if pos + j < len(hex_chars):
            hex_chars[pos + j] = ch
