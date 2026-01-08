from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal


Category = Literal["global_politics", "technology", "fundraising", "stock_market", "other"]


@dataclass(frozen=True)
class Article:
    source: str
    title: str
    url: str
    published_at: datetime | None
    raw_summary: str | None
    category_hint: str | None = None


@dataclass(frozen=True)
class ArticleSummary:
    article: Article
    category: Category
    summary: str
    key_points: list[str]
    extracted_text_chars: int

