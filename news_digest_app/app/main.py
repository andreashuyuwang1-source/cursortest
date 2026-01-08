from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .config import load_settings
from .db import get_digest_by_date, get_latest_digest, list_digests, upsert_digest
from .digest import build_digest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SETTINGS = load_settings(PROJECT_ROOT)
SQLITE_PATH = (PROJECT_ROOT / SETTINGS.sqlite_path).resolve()

app = FastAPI(title=SETTINGS.title)

templates = Jinja2Templates(directory=str(PROJECT_ROOT / "app" / "templates"))
app.mount("/static", StaticFiles(directory=str(PROJECT_ROOT / "app" / "static")), name="static")


@app.get("/", response_class=HTMLResponse)
def index(request: Request) -> HTMLResponse:
    row = get_latest_digest(SQLITE_PATH)
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "title": SETTINGS.title,
            "digest": row.data if row else None,
        },
    )


@app.get("/digests", response_class=HTMLResponse)
def digests(request: Request) -> HTMLResponse:
    rows = list_digests(SQLITE_PATH, limit=60)
    return templates.TemplateResponse(
        "digests.html",
        {"request": request, "title": SETTINGS.title, "digests": rows},
    )


@app.get("/digests/{date}", response_class=HTMLResponse)
def digest_by_date(date: str, request: Request) -> HTMLResponse:
    row = get_digest_by_date(SQLITE_PATH, date)
    if not row:
        raise HTTPException(status_code=404, detail="Digest not found")
    return templates.TemplateResponse(
        "digest.html",
        {"request": request, "title": SETTINGS.title, "digest": row.data},
    )


@app.get("/api/latest")
def api_latest() -> JSONResponse:
    row = get_latest_digest(SQLITE_PATH)
    if not row:
        return JSONResponse({"digest": None})
    return JSONResponse(row.data)


@app.post("/admin/run")
def admin_run() -> RedirectResponse:
    d: dict[str, Any] = build_digest(project_root=PROJECT_ROOT)
    upsert_digest(SQLITE_PATH, date=str(d["date"]), created_at=datetime.now(tz=UTC), data=d)
    return RedirectResponse(url="/", status_code=303)

