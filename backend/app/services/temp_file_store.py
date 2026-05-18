from __future__ import annotations

import tempfile
from pathlib import Path

LOCAL_EDIT_BASE = Path(tempfile.gettempdir()) / "recipe_test_edit"
LOCAL_EDIT_BASE.mkdir(parents=True, exist_ok=True)

def write_local_shadow_file(file_name: str, data: bytes) -> str:
    shadow_path = LOCAL_EDIT_BASE / file_name
    shadow_path.parent.mkdir(parents=True, exist_ok=True)
    shadow_path.write_bytes(data)
    return str(shadow_path)