from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

from .classify import classify
from .config import Settings, SourceConfig, load_settings, load_sources
from .fetch import bounded_gather, fetch_article_text, fetch_rss_articles
from .summarize import extractive_summary
from .types import ArticleSummary, Category


def _project_root() -> Path:
    # app/ is directly under project root
    return Path(__file__).resolve().parents[1]


def _today_utc_date() -> str:
    return datetime.now(tz=UTC).date().isoformat()


def _category_title(cat: Category) -> str:
    return {
        "global_politics": "Global politics",
        "technology": "Technology",
        "fundraising": "Fundraising activity",
        "stock_market": "Stock market activity",
        "other": "Other",
    }[cat]

def _select_with_required_sources(
    items: list[ArticleSummary],
    *,
    max_items: int,
    required_sources: list[str],
) -> list[ArticleSummary]:
    if not items:
        return []

    selected: list[ArticleSummary] = []
    selected_urls: set[str] = set()

    by_source: dict[str, list[ArticleSummary]] = {}
    for it in items:
        by_source.setdefault(it.article.source, []).append(it)

    # Ensure at least one from each required source (if present in this category).
    for src in required_sources:
        cand = by_source.get(src)
        if cand:
            it = cand[0]
            if it.article.url not in selected_urls:
                selected.append(it)
                selected_urls.add(it.article.url)
                if len(selected) >= max_items:
                    return selected

    # Fill remaining slots with newest items.
    for it in items:
        if it.article.url in selected_urls:
            continue
        selected.append(it)
        selected_urls.add(it.article.url)
        if len(selected) >= max_items:
            break

    return selected


async def build_digest_async(project_root: Path | None = None) -> dict[str, Any]:
    project_root = project_root or _project_root()
    settings: Settings = load_settings(project_root)
    sources: list[SourceConfig] = load_sources(project_root)

    headers = {"user-agent": settings.user_agent}
    timeout = httpx.Timeout(settings.timeout_seconds)

    async with httpx.AsyncClient(headers=headers, timeout=timeout) as client:
        feed_coros = []
        for src in sources:
            for feed in src.feeds:
                feed_coros.append(
                    fetch_rss_articles(
                        source_name=src.name,
                        feed_url=feed.url,
                        category_hint=feed.category_hint,
                        lookback_hours=settings.lookback_hours,
                        client=client,
                    )
                )
        feed_results = await bounded_gather(settings.max_concurrent_requests, feed_coros)

        articles = []
        errors: list[str] = []
        for r in feed_results:
            articles.extend(r.articles)
            errors.extend(r.errors)

        # de-dupe by URL
        seen = set()
        deduped = []
        for a in articles:
            if a.url in seen:
                continue
            seen.add(a.url)
            deduped.append(a)
        articles = deduped

        # fetch article text (best-effort) for higher quality summaries
        text_coros = [fetch_article_text(a.url, client) for a in articles]
        texts = await bounded_gather(settings.max_concurrent_requests, text_coros)

    summaries: list[ArticleSummary] = []
    for a, full_text in zip(articles, texts, strict=False):
        cat = classify(a)
        base_text = full_text or a.raw_summary or a.title
        summary, key_points = extractive_summary(base_text or "", max_sentences=2)
        summaries.append(
            ArticleSummary(
                article=a,
                category=cat,
                summary=summary or (a.raw_summary or ""),
                key_points=key_points,
                extracted_text_chars=len(full_text or ""),
            )
        )

    # order: newest first where possible
    def _sort_key(s: ArticleSummary):
        dt = s.article.published_at
        return dt.timestamp() if dt else 0.0

    summaries.sort(key=_sort_key, reverse=True)

    cats: list[Category] = ["global_politics", "technology", "fundraising", "stock_market"]
    grouped: dict[Category, list[ArticleSummary]] = {c: [] for c in cats}

    for s in summaries:
        if s.category in grouped:
            grouped[s.category].append(s)

    required_sources = ["NYTimes", "Forbes", "TechCrunch", "Wall Street Journal", "The Economist"]

    # cap items per category, while ensuring required sources appear when available
    for c in cats:
        grouped[c] = _select_with_required_sources(
            grouped[c],
            max_items=settings.max_items_per_category,
            required_sources=required_sources,
        )

    category_blocks = []
    for c in cats:
        items = grouped[c]
        # category summary: stitch the first sentence of up to 3 items
        stitched = " ".join([i.summary for i in items[:3] if i.summary])
        cat_summary, _ = extractive_summary(stitched, max_sentences=2, max_chars=420)

        category_blocks.append(
            {
                "key": c,
                "title": _category_title(c),
                "summary": cat_summary,
                "items": [
                    {
                        "source": i.article.source,
                        "title": i.article.title,
                        "url": i.article.url,
                        "published_at": i.article.published_at.isoformat() if i.article.published_at else None,
                        "summary": i.summary,
                        "key_points": i.key_points,
                    }
                    for i in items
                ],
                "key_links": [
                    {"title": i.article.title, "url": i.article.url, "source": i.article.source}
                    for i in items[: settings.key_links_per_category]
                ],
            }
        )

    created_at = datetime.now(tz=UTC)
    digest = {
        "date": _today_utc_date(),
        "created_at": created_at.isoformat(),
        "lookback_hours": settings.lookback_hours,
        "sources_included": [s.name for s in sources],
        "errors": errors,
        "categories": category_blocks,
    }
    return digest


def build_digest(project_root: Path | None = None) -> dict[str, Any]:
    return asyncio.run(build_digest_async(project_root=project_root))

