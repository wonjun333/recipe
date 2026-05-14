from __future__ import annotations

import math
import re
import struct
from typing import Any

from app.services.pol_con_maps import CON_MAP, POL_MAP

NONE_LABEL = '(None)'

POL_END_BY_LABELS = {
    0: 'Time',
    1: 'RPM',
    2: 'Pressure',
    3: 'Endpoint',
    4: 'Time/EP',
    5: 'All Hds Rdy',
    6: 'Rate',
    7: 'Rate/EP',
    8: '%OP(EP)',
}

SWEEP_OPTION_LABELS = {
    529: 'No Sweep',
    785: 'Sine',
    1041: 'Custom Sweep',
    1102: 'No Sweep',
    1103: 'Sine',
    1104: 'Custom Sweep',
}


def get_hex_string_from_bytes(bytes_data: bytes) -> str:
    return ''.join(f'{b:02X}' for b in bytes_data)


def find_pos_param(param: str, result: str) -> int | None:
    pattern = fr'{re.escape(param)}..000000'
    match = re.search(pattern, result)
    return match.start() if match else None


def match_byte(txt: str, step_num: int) -> int:
    reversed_txt = ''.join(reversed([txt[i:i + 2] for i in range(0, len(txt), 2)]))
    try:
        value = int(reversed_txt, 16)
    except Exception:
        return 0

    if step_num > 0:
        if value / 2 == step_num:
            return 2
        elif value / 4 == step_num:
            return 4
        elif value / 8 == step_num:
            return 8
        elif value / 16 == step_num:
            return 16

    if value == 4:
        return 1
    elif value == 2:
        return 0
    return value


def _flatten_scalar(value: Any) -> Any:
    if isinstance(value, list):
        if len(value) == 1:
            return value[0]
        return value
    return value


def _to_float(value: Any) -> float | None:
    value = _flatten_scalar(value)
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if isinstance(value, float) and math.isnan(value):
            return None
        return float(value)
    try:
        return float(str(value).strip())
    except Exception:
        return None


def _to_int(value: Any) -> int | None:
    num = _to_float(value)
    return None if num is None else int(round(num))


def _fmt_num(value: Any, digits: int = 1) -> str:
    num = _to_float(value)
    if num is None:
        return NONE_LABEL
    return f'{num:.{digits}f}'


def decode_ieee754(block: list[Any], step_num: int) -> list[Any]:
    if len(block) < 3:
        return block

    param_id, header = block[0], block[1]
    data_length = match_byte(str(header)[:4], step_num)
    decoded: list[Any] = [param_id, header]

    for hex_payload in block[2:]:
        try:
            b = bytes.fromhex(hex_payload) if isinstance(hex_payload, str) else b''
        except Exception:
            b = b''
        if data_length in (0, 2):
            decoded.append(struct.unpack('<h', b[:2])[0] if len(b) >= 2 else 0)
        elif data_length in (1, 4):
            decoded.append(struct.unpack('<f', b[:4])[0] if len(b) >= 4 else 0.0)
        elif data_length == 8:
            decoded.append(list(struct.unpack('<ff', b[:8])) if len(b) >= 8 else [0.0, 0.0])
        elif data_length == 16:
            decoded.append(list(struct.unpack('<ffff', b[:16])) if len(b) >= 16 else [0.0, 0.0, 0.0, 0.0])
        else:
            decoded.append(struct.unpack('<f', b[:4])[0] if len(b) >= 4 else 0.0)

    return decoded


def decode_rcp_data(hex_string: str, is_con_file: bool) -> tuple[list[list[Any]], str]:
    total_count = len(hex_string)
    try:
        step_num = int(hex_string[20:22], 16)
    except Exception:
        step_num = 1

    param_anchor = '0010' if is_con_file else 'C003'
    point = find_pos_param(param_anchor, hex_string)
    if point is None:
        return [], hex_string

    all_data: list[list[str]] = []
    while True:
        try:
            if point >= total_count - 4:
                break

            param_id = hex_string[point:point + 4]
            data_length = match_byte(hex_string[point + 4:point + 8], step_num)

            if data_length == 0:
                data = [param_id, hex_string[point + 4:point + 12], hex_string[point + 12:point + 16]]
            elif data_length == 1:
                data = [param_id, hex_string[point + 4:point + 12], hex_string[point + 12:point + 20]]
            elif data_length in [2, 4, 8, 16]:
                data = [param_id, hex_string[point + 4:point + 12]] + [
                    hex_string[point + 12 + (i * data_length * 2): point + 12 + data_length * 2 + (i * data_length * 2)]
                    for i in range(step_num)
                ]
            else:
                chunk_count = max(1, int(data_length / 4)) if isinstance(data_length, int) and data_length else 1
                data = [param_id, hex_string[point + 4:point + 12]] + [
                    hex_string[point + 12 + (i * 8): point + 20 + (i * 8)]
                    for i in range(chunk_count)
                ]

            block_hex_len = len(''.join(data))
            all_data.append(data)
            point += block_hex_len
        except Exception:
            break

    decoded_data = [decode_ieee754(row, step_num) for row in all_data]
    return decoded_data, hex_string


def _param_rows(decoded_data: list[list[Any]], param_map: dict[str, str]) -> tuple[dict[str, list[Any]], int]:
    rows: dict[str, list[Any]] = {}
    max_steps = 0
    param_exclude = 'F901'
    for row in decoded_data:
        if len(row) < 3:
            continue
        raw_id = str(row[0]).upper()
        mapped = param_map.get(raw_id, raw_id)
        values = row[2:]
        if raw_id != param_exclude:
            max_steps = max(max_steps, len(values))
        if mapped not in rows or not rows[mapped]:
            rows[mapped] = values
        else:
            rows[f'{mapped}__{raw_id}'] = values
    return rows, max_steps


def _step_dataframe_pol(byte_data: bytes) -> dict[str, str]:
    results: dict[str, str] = {}
    parts = byte_data.split(b'---')

    if len(parts) > 0:
        pre_dash_data = parts[0]
        pre_dash_parts = pre_dash_data.split(b'\x00')
        if len(pre_dash_parts) > 1 and pre_dash_parts[-2]:
            results['STEP 1'] = pre_dash_parts[-2].decode('utf-8', errors='ignore').strip()

    if len(parts) > 1:
        post_dash_data = parts[1].lstrip(b'\x00')
        end_of_steps_index = post_dash_data.find(b'\x00\x00')
        steps_data_to_parse = post_dash_data[:end_of_steps_index] if end_of_steps_index != -1 else post_dash_data
        steps_data_to_parse = steps_data_to_parse.replace(b'\x00\x00', b'\x00')
        steps_list = steps_data_to_parse.split(b'\x00')
        step_number = 2
        for step_data in steps_list:
            if step_data:
                step_name = step_data.decode('utf-8', errors='ignore').strip()
                if step_name:
                    results[f'STEP {step_number}'] = step_name
                    step_number += 1
    return results


def _step_dataframe_con(byte_data: bytes) -> dict[str, str]:
    step_num = byte_data[10] if len(byte_data) > 10 else 1
    results: dict[str, str] = {}
    parts = byte_data.split(b'\x00\x00\x10\x02')
    if len(parts) > 0:
        pre_anchor = parts[0]
        pre_parts = pre_anchor.split(b'\x00')
        if len(pre_parts) > step_num:
            for i in range(step_num):
                step_index = -(step_num - i)
                step_data = pre_parts[step_index]
                if step_data:
                    results[f'STEP {i + 1}'] = step_data.decode('utf-8', errors='ignore').strip()
    return results


def extract_step_descriptions(bytes_data: bytes, step_count: int, is_con: bool) -> list[str]:
    if step_count <= 0:
        return []
    mapping = _step_dataframe_con(bytes_data) if is_con else _step_dataframe_pol(bytes_data)
    descs = [mapping.get(f'STEP {i}', '').strip() for i in range(1, step_count + 1)]
    return [d if d else f'STEP {idx + 1}' for idx, d in enumerate(descs)]


def _get_step_count(bytes_data: bytes, decoded_rows: list[list[Any]], param_values: dict[str, list[Any]], is_con: bool, hex_string: str) -> int:
    try:
        raw = int(hex_string[20:22], 16)
        if raw > 0:
            return raw
    except Exception:
        pass

    if is_con and len(bytes_data) > 10 and bytes_data[10] > 0:
        return int(bytes_data[10])

    for key in ('STEP_COUNT', 'SYHNCHRONIZE_COND'):
        values = param_values.get(key) or []
        if values:
            value = _to_int(values[0])
            if value and value > 0:
                return value

    return max((len(row[2:]) for row in decoded_rows if len(row) > 2), default=1) or 1


def _get_step_value(param_values: dict[str, list[Any]], key: str, idx: int) -> Any:
    values = param_values.get(key) or []
    if idx < len(values):
        return values[idx]
    return values[-1] if values else None


def _get_any_step_value(param_values: dict[str, list[Any]], keys: list[str], idx: int) -> Any:
    for key in keys:
        value = _get_step_value(param_values, key, idx)
        if value is not None:
            if isinstance(value, str) and not value.strip():
                continue
            return value
    return None


def _ui_checkbox(checked: bool, tone: str = 'white', enabled: bool = True) -> dict[str, Any]:
    return {'kind': 'checkbox', 'checked': checked, 'tone': tone, 'enabled': enabled}


def _ui_text(tone: str = 'white', align: str = 'left') -> dict[str, Any]:
    return {'tone': tone, 'align': align}


def _should_include_zone(param_values: dict[str, list[Any]], zone_index: int) -> bool:
    for value in (param_values.get(f'Z{zone_index}_STATE') or []) + (param_values.get(f'Z{zone_index}_STATE_PRESSURE') or []):
        num = _to_float(value)
        if num is not None and num > 0:
            return True
    return False


def _fmt_pol_end_by(end_idx: int | None, max_value: Any, min_value: Any) -> tuple[str, dict[str, Any]]:
    idx = 0 if end_idx is None else end_idx
    label = POL_END_BY_LABELS.get(idx, f'#{idx}')
    if idx == 3:
        text = f'{label}\nmin {_fmt_num(min_value, 1)} s\nmax {_fmt_num(max_value, 1)} s'
    else:
        text = f'{label}\n{_fmt_num(max_value, 1)} s'
    tone = 'white' if idx == 0 else 'yellow'
    return text, _ui_text(tone)


def _fmt_head_sweep_pol(param_values: dict[str, list[Any]], idx: int) -> str:
    option_num = _to_int(_get_any_step_value(param_values, ['HEAD SWEEP_OPTION'], idx))
    zones = _to_int(_get_any_step_value(param_values, ['HEAD_SWEEP_NUM_OF_ZONE', 'SWEEP_NUM_OF_ZONES'], idx))
    vel = _get_any_step_value(param_values, ['HEAD_SWEEP_VELOCITY'], idx)
    start = _get_any_step_value(param_values, ['HEAD_SWEEP_START_POINT'], idx)
    end = _get_any_step_value(param_values, ['HEAD_SWEEP_END_POINT'], idx)
    if option_num in (785, 1103):
        return f'Sine {zones if zones is not None else NONE_LABEL} zones\n{_fmt_num(vel, 1)} swps/min\n{_fmt_num(start, 2)} - {_fmt_num(end, 2)} in'
    label = SWEEP_OPTION_LABELS.get(option_num, _fmt_num(option_num, 0) if option_num is not None else NONE_LABEL)
    if label == 'No Sweep':
        return label
    return f'{label}\n{_fmt_num(vel, 1)} swps/min\n{_fmt_num(start, 2)} - {_fmt_num(end, 2)} in'


def _vac_tone(seq_idx: int) -> str:
    return 'cyan' if seq_idx % 2 == 0 else 'white'


def _build_pol_zone_state(state_value: Any, pressure_value: Any, seq_idx: int) -> tuple[str, dict[str, Any]]:
    state_num = _to_int(state_value)
    pressure_num = _to_float(pressure_value)
    if state_num == 2:
        return f'Press\n{_fmt_num(pressure_num if pressure_num is not None else 0.0, 2)}\npsi', _ui_text('green', 'center')
    if state_num == 1:
        return 'Vent', _ui_text('yellow', 'center')
    if state_num == 0:
        return 'Vac', _ui_text(_vac_tone(seq_idx), 'center')
    return NONE_LABEL, _ui_text('white', 'center')


def _infer_platen_index(recipe_name: str, preview_context: dict[str, Any] | None) -> int | None:
    if isinstance(preview_context, dict):
        platen = preview_context.get('platenIndex')
        if isinstance(platen, int) and platen in (1, 2, 3):
            return platen
    match = re.search(r'(?:^|[_\-\s])P([123])(?:$|[_\-.\s])', str(recipe_name or ''), re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def _build_slurry_display(preview_context: dict[str, Any] | None, recipe_name: str, lane_no: int, matter_value: Any, rate_value: Any) -> tuple[str, dict[str, Any]]:
    platen_index = _infer_platen_index(recipe_name, preview_context)
    slurry_cfg = (preview_context or {}).get('slurryConfig') if isinstance(preview_context, dict) else None
    matter_num = _to_int(matter_value) or 0
    rate_num = _to_float(rate_value)

    platen_info = None
    if isinstance(slurry_cfg, dict) and platen_index:
        platen_info = ((slurry_cfg.get('platen') or {}).get(platen_index) or {}).get(lane_no)

    if platen_info and isinstance(platen_info, dict) and platen_info.get('chemIndex', 0) > 0 and str(platen_info.get('name') or '').strip() and str(platen_info.get('name')) != '[NONE]':
        if matter_num > 0:
            return f"{platen_info.get('letter', '?')}: {platen_info.get('name')}\n{_fmt_num(rate_num if rate_num is not None else 0.0, 1)} ml/min", _ui_text('green')
        return 'None(Off)', _ui_text('cyan', 'center')

    if matter_num > 0:
        return f'No Slurry\n{_fmt_num(rate_num if rate_num is not None else 0.0, 1)} ml/min', _ui_text('error')
    return 'N/A', _ui_text('disabled', 'center')


def _build_pol_row(param_values: dict[str, list[Any]], idx: int, descriptions: list[str], dynamic_zone_indices: list[int], recipe_name: str, preview_context: dict[str, Any] | None) -> dict[str, Any]:
    end_idx = _to_int(_get_any_step_value(param_values, ['EPD_END_STEPOPTION'], idx))
    end_text, end_ui = _fmt_pol_end_by(end_idx, _get_any_step_value(param_values, ['END_BY_MAX/TIME'], idx), _get_any_step_value(param_values, ['END_BY_MIN'], idx))
    main_checked = (_to_float(_get_any_step_value(param_values, ['MAIN_STEP'], idx)) or 0) > 0
    hpr_checked = (_to_float(_get_any_step_value(param_values, ['HPR_STEP', 'HPR'], idx)) or 0) > 0
    rinse_checked = (_to_float(_get_any_step_value(param_values, ['HEAD_RINSE'], idx)) or 0) > 0
    rtpc_checked = (_to_float(_get_any_step_value(param_values, ['RTPC_STEP'], idx)) or 0) > 0
    rtpc_enabled = end_idx in (3, 4)

    row: dict[str, Any] = {
        'Description': descriptions[idx] if idx < len(descriptions) else f'STEP {idx + 1}',
        'Main': 'On' if main_checked else 'Off',
        'End By': end_text,
        'RTPC': 'On' if rtpc_checked else 'Off',
        'Platen RPM': f"{_fmt_num(_get_any_step_value(param_values, ['PLATEN_RPM'], idx), 1)}\n({_fmt_num(_get_any_step_value(param_values, ['PLATEN_ACCEL'], idx), 1)})",
        'Head RPM': f"{_fmt_num(_get_any_step_value(param_values, ['HEAD_RPM'], idx), 1)}\n({_fmt_num(_get_any_step_value(param_values, ['HEAD_ACCEL_DECEL'], idx), 1)})",
        'Head Sweep': _fmt_head_sweep_pol(param_values, idx),
        'HPR': 'On' if hpr_checked else 'Off',
        'Head Rinse': 'On' if rinse_checked else 'Off',
    }
    ui: dict[str, Any] = {
        'Main': _ui_checkbox(main_checked, 'yellow' if main_checked else 'white', True),
        'RTPC': _ui_checkbox(rtpc_checked, 'yellow' if rtpc_checked else ('white' if rtpc_enabled else 'disabled'), rtpc_enabled),
        'HPR': _ui_checkbox(hpr_checked, 'yellow' if hpr_checked else 'white', True),
        'Head Rinse': _ui_checkbox(rinse_checked, 'yellow' if rinse_checked else 'white', True),
        'End By': end_ui,
        'Platen RPM': _ui_text('cyan', 'center'),
        'Head RPM': _ui_text('white', 'center'),
    }

    zone_pairs = [
        ('RR State', 'RR_STATE', 'RR_STATE_PRESSURE'),
        ('Z1 State', 'Z1_STATE', 'Z1_STATE_PRESSURE'),
        ('Z2 State', 'Z2_STATE', 'Z2_STATE_PRESSURE'),
        ('Z3 State', 'Z3_STATE', 'Z3_STATE_PRESSURE'),
        ('Z4 State', 'Z4_STATE', 'Z4_STATE_PRESSURE'),
        ('Z5 State', 'Z5_STATE', 'Z5_STATE_PRESSURE'),
    ] + [(f'Z{zone} State', f'Z{zone}_STATE', f'Z{zone}_STATE_PRESSURE') for zone in dynamic_zone_indices]

    for seq_idx, (label, state_key, pressure_key) in enumerate(zone_pairs):
        text, zui = _build_pol_zone_state(_get_step_value(param_values, state_key, idx), _get_step_value(param_values, pressure_key, idx), seq_idx)
        row[label] = text
        ui[label] = zui

    for lane_no, matter_key, rate_key in [(1, 'L1_FLOW_MATTER', 'L1_FLOW_RATE'), (2, 'L2_FLOW_MATTER', 'L2_FLOW_RATE'), (3, 'L3_FLOW_MATTER', 'L3_FLOW_RATE'), (4, 'L4_FLOW_MATTER', 'L4_FLOW_RATE')]:
        label = f'L{lane_no}'
        text, lui = _build_slurry_display(preview_context, recipe_name, lane_no, _get_any_step_value(param_values, [matter_key], idx), _get_any_step_value(param_values, [rate_key], idx))
        row[label] = text
        ui[label] = lui

    row['__ui__'] = ui
    return row


def _build_con_row(param_values: dict[str, list[Any]], idx: int, descriptions: list[str]) -> dict[str, Any]:
    row: dict[str, Any] = {
        'Description': descriptions[idx] if idx < len(descriptions) else f'STEP {idx + 1}',
        'End By': _fmt_num(_get_any_step_value(param_values, ['END_STEP_CITRIA_MAX_TIME','END_BY_MAX/TIME'], idx), 1),
        'Platen RPM': _fmt_num(_get_any_step_value(param_values, ['PLATEN_RPM'], idx), 1),
        'Head RPM': _fmt_num(_get_any_step_value(param_values, ['HEAD_RPM'], idx), 1),
        'Pad Cond Sweep': _fmt_head_sweep_pol(param_values, idx),
        'Sync': 'On' if (_to_float(_get_any_step_value(param_values, ['SYHNCHRONIZE_COND'], idx)) or 0) > 0 else 'Off',
        'Pad Cond Downforce': _fmt_num(_get_any_step_value(param_values, ['COND_HEAD_LBF'], idx), 1),
        'HPR': 'On' if (_to_float(_get_any_step_value(param_values, ['HPR'], idx)) or 0) > 0 else 'Off',
        'Rinse': 'On' if (_to_float(_get_any_step_value(param_values, ['HEAD_RINSE'], idx)) or 0) > 0 else 'Off',
        'L1': _fmt_num(_get_any_step_value(param_values, ['DEILIV_1_FLOW_RATE'], idx), 3),
        'L2': _fmt_num(_get_any_step_value(param_values, ['DEILIV_2_FLOW_RATE'], idx), 3),
        'L3': _fmt_num(_get_any_step_value(param_values, ['DEILIV_3_FLOW_RATE'], idx), 3),
        'L4': _fmt_num(_get_any_step_value(param_values, ['DEILIV_4_FLOW_RATE'], idx), 3),
    }
    ui = {
        'Platen RPM': _ui_text('cyan', 'center'),
        'Head RPM': _ui_text('white', 'center'),
        'Pad Cond Sweep': _ui_text('white', 'left'),
        'Sync': _ui_checkbox(row['Sync'] == 'On', 'yellow' if row['Sync'] == 'On' else 'white', True),
        'HPR': _ui_checkbox(row['HPR'] == 'On', 'yellow' if row['HPR'] == 'On' else 'white', True),
        'Rinse': _ui_checkbox(row['Rinse'] == 'On', 'yellow' if row['Rinse'] == 'On' else 'white', True),
        'Pad Cond Downforce': _ui_text('white', 'center'),
    }
    for lane in ('L1','L2','L3','L4'):
        ui[lane] = {'tone': 'green' if (_to_float(row[lane]) or 0) > 0 else 'white'}
    row['__ui__'] = ui
    return row


def build_pol_con_preview_from_bytes(recipe_id: str, recipe_name: str, modified_at: str, source_kind: str, bytes_data: bytes, preview_context: dict[str, Any] | None = None) -> dict[str, Any]:
    is_con = recipe_name.lower().endswith('.con')
    param_map = CON_MAP if is_con else POL_MAP
    hex_string = get_hex_string_from_bytes(bytes_data)
    decoded_rows, original_hex = decode_rcp_data(hex_string, is_con)
    param_values, max_steps = _param_rows(decoded_rows, param_map)
    step_count = _get_step_count(bytes_data, decoded_rows, param_values, is_con, original_hex)
    descriptions = extract_step_descriptions(bytes_data, step_count, is_con)

    base_zone_columns = ['RR State', 'Z1 State', 'Z2 State', 'Z3 State', 'Z4 State', 'Z5 State']
    dynamic_zone_indices = [zone for zone in range(6, 12) if _should_include_zone(param_values, zone)]
    zone_columns = base_zone_columns + [f'Z{zone} State' for zone in dynamic_zone_indices]

    if is_con:
        columns = ['Description', 'End By', 'Platen RPM', 'Head RPM', 'Pad Cond Sweep', 'Sync', 'Pad Cond Downforce', 'HPR', 'Rinse', 'L1', 'L2', 'L3', 'L4']
    else:
        columns = ['Description', 'Main', 'End By', 'RTPC', 'Platen RPM', 'Head RPM', 'Head Sweep', *zone_columns, 'HPR', 'Head Rinse', 'L1', 'L2', 'L3', 'L4']

    rows: list[dict[str, Any]] = []
    for idx in range(step_count):
        if is_con:
            row = _build_con_row(param_values, idx, descriptions)
        else:
            row = _build_pol_row(param_values, idx, descriptions, dynamic_zone_indices, recipe_name, preview_context)
        rows.append(row)

    return {
        'recipe': {
            'id': recipe_id,
            'name': recipe_name,
            'modifiedAt': modified_at,
            'sourceKind': source_kind,
            'columns': columns,
            'rows': rows,
            'meta': {
                'sourceType': 'con' if is_con else 'pol',
                'stepCount': step_count,
                'stepNames': {str(i + 1): descriptions[i] for i in range(len(descriptions))},
                'editableModel': {
                    'paramValues': param_values,
                    'dynamicZones': dynamic_zone_indices,
                    'platenIndex': _infer_platen_index(recipe_name, preview_context),
                },
                'debug': {
                    'decodedParamCount': len(param_values),
                    'anchor': '0010' if is_con else 'C003',
                },
            },
        }
    }
