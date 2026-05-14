from __future__ import annotations

import argparse
import json
from pathlib import Path

from app.services.pol_con_decoder import build_pol_con_preview_from_bytes


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('file', help='local .pol or .con path')
    args = parser.parse_args()

    path = Path(args.file)
    data = path.read_bytes()
    preview = build_pol_con_preview_from_bytes(
        recipe_id='LOCAL_DEBUG',
        recipe_name=path.name,
        modified_at='',
        source_kind='recipe',
        bytes_data=data,
    )
    print(json.dumps(preview, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
