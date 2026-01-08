from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from email.utils import parsedate_to_datetime
from typing import Any

import feedparser
import httpx
from bs4 import BeautifulSoup
from readability import Document

from .types import Article


def _parse_dt(entry: dict[str, Any]) -> datetime | None:
    for k in ("published", "updated"):
        v = entry.get(k)
        if isinstance(v, str) and v.strip():
            try:
                dt = parsedate_to_datetime(v)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=UTC)
                dt = dt.astimezone(UTC)
                return dt
            except Exception:
                pass
    return None


def _text_from_entry(entry: dict[str, Any]) -> str | None:
    # feedparser provides summary/detail fields inconsistently across feeds
    for k in ("summary", "description"):
        v = entry.get(k)
        if isinstance(v, str) and v.strip():
            return v
    return None


def _strip_html(html: str) -> str:
    # Avoid BeautifulSoup warnings on plain-text strings/URLs.
    if "<" not in html and "&" not in html:
        return html.strip()
    soup = BeautifulSoup(html, "lxml")
    return soup.get_text(" ", strip=True)


@dataclass(frozen=True)
class FetchResult:
    articles: list[Article]
    errors: list[str]


async def fetch_rss_articles(
    *,
    source_name: str,
    feed_url: str,
    category_hint: str | None,
    lookback_hours: int,
    client: httpx.AsyncClient,
) -> FetchResult:
    errors: list[str] = []
    articles: list[Article] = []
    try:
        resp = await client.get(feed_url, follow_redirects=True)
        resp.raise_for_status()
        parsed = feedparser.parse(resp.content)
        if parsed.bozo and parsed.bozo_exception:
            errors.append(f"{source_name}: parse warning for {feed_url}: {parsed.bozo_exception}")
    except Exception as e:
        return FetchResult(articles=[], errors=[f"{source_name}: failed to fetch feed {feed_url}: {e}"])

    cutoff = datetime.now(tz=UTC) - timedelta(hours=lookback_hours)
    for entry in parsed.entries or []:
        try:
            link = entry.get("link")
            title = entry.get("title")
            if not link or not title:
                continue
            published_at = _parse_dt(entry)

            # WSJ RSS sometimes ships stale publish years; if it's clearly stale,
            # keep the item but treat it as "recent-ish" for ordering/filtering.
            if source_name.lower() in {"wall street journal", "wsj"} and published_at:
                if published_at < (datetime.now(tz=UTC) - timedelta(days=60)):
                    published_at = datetime.now(tz=UTC)

            if published_at and published_at < cutoff:
                continue

            raw_summary = _text_from_entry(entry)
            if raw_summary:
                raw_summary = _strip_html(raw_summary)

            articles.append(
                Article(
                    source=source_name,
                    title=str(title).strip(),
                    url=str(link).strip(),
                    published_at=published_at,
                    raw_summary=raw_summary,
                    category_hint=category_hint,
                )
            )
        except Exception as e:
            errors.append(f"{source_name}: failed to parse entry: {e}")

    return FetchResult(articles=articles, errors=errors)


async def fetch_article_text(url: str, client: httpx.AsyncClient) -> str | None:
    """
    Best-effort extraction of readable article text.
    Many publishers block full text; this is OK and we fallback to RSS summary.
    """
    try:
        resp = await client.get(url, follow_redirects=True)
        resp.raise_for_status()
    except Exception:
        return None

    ct = resp.headers.get("content-type", "")
    if "text/html" not in ct and "application/xhtml+xml" not in ct and ct:
        return None

    try:
        doc = Document(resp.text)
        html = doc.summary(html_partial=True)
        soup = BeautifulSoup(html, "lxml")
        text = soup.get_text(" ", strip=True)
        text = " ".join(text.split())
        if len(text) < 200:
            # fallback to whole page text
            soup2 = BeautifulSoup(resp.text, "lxml")
            text2 = soup2.get_text(" ", strip=True)
            text2 = " ".join(text2.split())
            if len(text2) > len(text):
                text = text2
        return text if text else None
    except Exception:
        return None


async def bounded_gather(limit: int, coros: list[asyncio.Future]) -> list[Any]:
    sem = asyncio.Semaphore(limit)

    async def _run(c):
        async with sem:
            return await c

    return await asyncio.gather(*[_run(c) for c in coros], return_exceptions=False)

