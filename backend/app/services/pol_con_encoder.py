from __future__ import annotations

from typing import Any


def update_param_values_from_grid(
    original_param_values: dict[str, list[Any]],
    edited_rows: list[dict[str, Any]],
    dynamic_zones: list[int] | None = None,
) -> dict[str, list[Any]]:
    dynamic_zones = dynamic_zones or []
    param_values = {key: list(value) for key, value in (original_param_values or {}).items()}

    def ensure_len(key: str, idx: int) -> None:
        values = param_values.setdefault(key, [])
        while len(values) <= idx:
            values.append(0)

    for idx, row in enumerate(edited_rows):
        ensure_len('MAIN_STEP', idx)
        ensure_len('RTPC_STEP', idx)
        ensure_len('PLATEN_RPM', idx)
        ensure_len('HEAD_RPM', idx)
        ensure_len('END_BY_MAX/TIME', idx)
        ensure_len('HPR_STEP', idx)
        ensure_len('HEAD_RINSE', idx)
        ensure_len('L1_FLOW_RATE', idx)
        ensure_len('L2_FLOW_RATE', idx)
        ensure_len('L3_FLOW_RATE', idx)
        ensure_len('L4_FLOW_RATE', idx)
        ensure_len('RR_STATE', idx)
        ensure_len('Z1_STATE', idx)
        ensure_len('Z2_STATE', idx)
        ensure_len('Z3_STATE', idx)
        ensure_len('Z4_STATE', idx)
        ensure_len('Z5_STATE', idx)
        for zone in dynamic_zones:
            ensure_len(f'Z{zone}_STATE', idx)

    return param_values


def encode_pol_con_bytes(
    original_hex: str,
    original_param_values: dict[str, list[Any]],
    edited_rows: list[dict[str, Any]],
    dynamic_zones: list[int] | None = None,
) -> bytes:
    _ = update_param_values_from_grid(original_param_values, edited_rows, dynamic_zones)
    raise NotImplementedError(
        '역인코딩은 원본 block header / payload length / step별 binary layout 보존 규칙이 확정된 뒤 구현하는 것이 안전합니다.'
    )
