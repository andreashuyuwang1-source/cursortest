from __future__ import annotations

import argparse
from datetime import UTC, datetime
from pathlib import Path

from .config import load_settings
from .db import upsert_digest
from .digest import build_digest


def _project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _sqlite_path(project_root: Path) -> Path:
    settings = load_settings(project_root)
    return (project_root / settings.sqlite_path).resolve()


def _print_digest(d: dict) -> None:
    print(f"Daily News Digest — {d.get('date')} (lookback {d.get('lookback_hours')}h)")
    print(f"Generated: {d.get('created_at')}")
    print()

    errors = d.get("errors") or []
    if errors:
        print("Feed/parse warnings (non-fatal):")
        for e in errors[:10]:
            print(f"- {e}")
        if len(errors) > 10:
            print(f"- … {len(errors) - 10} more")
        print()

    for cat in d.get("categories", []):
        print(f"== {cat.get('title')} ==")
        if cat.get("summary"):
            print(cat["summary"])
        print()
        for it in cat.get("items", [])[:10]:
            src = it.get("source")
            title = it.get("title")
            url = it.get("url")
            print(f"- [{src}] {title}")
            print(f"  {url}")
            if it.get("summary"):
                print(f"  {it['summary']}")
        print()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="news-digest")
    sub = parser.add_subparsers(dest="cmd", required=True)

    runp = sub.add_parser("run", help="Fetch feeds and generate/store today's digest")
    runp.add_argument("--no-store", action="store_true", help="Don't write to sqlite")
    runp.add_argument("--quiet", action="store_true", help="Don't print digest to stdout")

    args = parser.parse_args(argv)
    project_root = _project_root()

    if args.cmd == "run":
        digest = build_digest(project_root=project_root)
        if not args.no_store:
            sqlite_path = _sqlite_path(project_root)
            upsert_digest(
                sqlite_path,
                date=str(digest["date"]),
                created_at=datetime.now(tz=UTC),
                data=digest,
            )
        if not args.quiet:
            _print_digest(digest)
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())

