from __future__ import annotations

from typing import Any

from app.services.recipe_cache_store import get_all_history_comments, set_history_comment


def get_all_comments() -> dict[str, Any]:
    return get_all_history_comments()


def set_comment(group_key: str, comment: str, comment_author: str = '') -> None:
    set_history_comment(group_key, comment, comment_author)
