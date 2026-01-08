from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class DigestRow:
    date: str  # YYYY-MM-DD
    created_at: str  # ISO
    data: dict[str, Any]


def _connect(sqlite_path: Path) -> sqlite3.Connection:
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(sqlite_path))
    conn.row_factory = sqlite3.Row
    return conn


def init_db(sqlite_path: Path) -> None:
    with _connect(sqlite_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS digests (
              date TEXT PRIMARY KEY,
              created_at TEXT NOT NULL,
              data_json TEXT NOT NULL
            )
            """
        )
        conn.commit()


def upsert_digest(sqlite_path: Path, *, date: str, created_at: datetime, data: dict[str, Any]) -> None:
    init_db(sqlite_path)
    with _connect(sqlite_path) as conn:
        conn.execute(
            """
            INSERT INTO digests(date, created_at, data_json)
            VALUES (?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
              created_at=excluded.created_at,
              data_json=excluded.data_json
            """,
            (date, created_at.isoformat(), json.dumps(data, ensure_ascii=False)),
        )
        conn.commit()


def get_latest_digest(sqlite_path: Path) -> DigestRow | None:
    init_db(sqlite_path)
    with _connect(sqlite_path) as conn:
        row = conn.execute(
            "SELECT date, created_at, data_json FROM digests ORDER BY date DESC LIMIT 1"
        ).fetchone()
        if not row:
            return None
        return DigestRow(date=row["date"], created_at=row["created_at"], data=json.loads(row["data_json"]))


def get_digest_by_date(sqlite_path: Path, date: str) -> DigestRow | None:
    init_db(sqlite_path)
    with _connect(sqlite_path) as conn:
        row = conn.execute(
            "SELECT date, created_at, data_json FROM digests WHERE date = ?",
            (date,),
        ).fetchone()
        if not row:
            return None
        return DigestRow(date=row["date"], created_at=row["created_at"], data=json.loads(row["data_json"]))


def list_digests(sqlite_path: Path, limit: int = 30) -> list[DigestRow]:
    init_db(sqlite_path)
    with _connect(sqlite_path) as conn:
        rows = conn.execute(
            "SELECT date, created_at, data_json FROM digests ORDER BY date DESC LIMIT ?",
            (int(limit),),
        ).fetchall()
        return [DigestRow(date=r["date"], created_at=r["created_at"], data=json.loads(r["data_json"])) for r in rows]

