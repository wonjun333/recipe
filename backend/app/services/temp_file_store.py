from __future__ import annotations

import os
import tempfile
from pathlib import Path

_data_dir = os.getenv('RECIPE_DATA_DIR', '')
if _data_dir:
    LOCAL_EDIT_BASE = Path(_data_dir) / 'recipe_test_edit'
else:
    LOCAL_EDIT_BASE = Path(tempfile.gettempdir()) / 'recipe_test_edit'
LOCAL_EDIT_BASE.mkdir(parents=True, exist_ok=True)


def write_local_shadow_file(file_name: str, data: bytes) -> str:
    shadow_path = LOCAL_EDIT_BASE / file_name
    shadow_path.parent.mkdir(parents=True, exist_ok=True)
    shadow_path.write_bytes(data)
    return str(shadow_path)
