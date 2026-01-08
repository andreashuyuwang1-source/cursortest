from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class FeedConfig:
    url: str
    category_hint: str | None = None


@dataclass(frozen=True)
class SourceConfig:
    name: str
    homepage: str
    feeds: list[FeedConfig]


@dataclass(frozen=True)
class Settings:
    title: str
    lookback_hours: int
    max_items_per_category: int
    key_links_per_category: int
    timeout_seconds: int
    user_agent: str
    max_concurrent_requests: int
    sqlite_path: str


def _load_yaml(path: Path) -> dict[str, Any]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"Invalid YAML root in {path}")
    return data


def load_settings(project_root: Path) -> Settings:
    data = _load_yaml(project_root / "config" / "settings.yaml")

    app = data.get("app", {}) or {}
    digest = data.get("digest", {}) or {}
    fetch = data.get("fetch", {}) or {}
    storage = data.get("storage", {}) or {}

    return Settings(
        title=str(app.get("title", "Daily News Digest")),
        lookback_hours=int(digest.get("lookback_hours", 36)),
        max_items_per_category=int(digest.get("max_items_per_category", 10)),
        key_links_per_category=int(digest.get("key_links_per_category", 5)),
        timeout_seconds=int(fetch.get("timeout_seconds", 20)),
        user_agent=str(fetch.get("user_agent", "daily-news-digest/1.0")),
        max_concurrent_requests=int(fetch.get("max_concurrent_requests", 8)),
        sqlite_path=str(storage.get("sqlite_path", "data/digests.sqlite3")),
    )


def load_sources(project_root: Path) -> list[SourceConfig]:
    data = _load_yaml(project_root / "config" / "sources.yaml")
    sources_any = data.get("sources", [])
    if not isinstance(sources_any, list):
        raise ValueError("config/sources.yaml: sources must be a list")

    sources: list[SourceConfig] = []
    for src in sources_any:
        if not isinstance(src, dict):
            continue
        feeds_any = src.get("feeds", [])
        feeds: list[FeedConfig] = []
        if isinstance(feeds_any, list):
            for f in feeds_any:
                if not isinstance(f, dict) or "url" not in f:
                    continue
                feeds.append(FeedConfig(url=str(f["url"]), category_hint=f.get("category_hint")))

        sources.append(
            SourceConfig(
                name=str(src.get("name", "")),
                homepage=str(src.get("homepage", "")),
                feeds=feeds,
            )
        )
    return sources

