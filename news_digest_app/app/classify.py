from __future__ import annotations

import re

from .types import Article, Category


_RE_FUNDRAISING = re.compile(
    r"\b("
    r"fundrais|funding|raises|raised|raise\b|seed round|seed funding|series [a-h]\b|"
    r"venture|vc\b|angel|term sheet|valuation|unicorn|ipo\b|"
    r"private equity|growth equity|round led by|backed by"
    r")\b",
    re.IGNORECASE,
)

_RE_MARKETS = re.compile(
    r"\b("
    r"stock|stocks|market|markets|nasdaq|dow|s&p|sp500|futures|"
    r"earnings|shares|equities|bond|bonds|yield|yields|treasury|"
    r"inflation|cpi\b|fed\b|rates|rate cut|rate hike|recession|"
    r"oil|brent|wti|gold|bitcoin|crypto"
    r")\b",
    re.IGNORECASE,
)

_RE_POLITICS = re.compile(
    r"\b("
    r"election|parliament|congress|senate|president|prime minister|"
    r"war|ceasefire|sanction|diplomac|treaty|un\b|nato\b|"
    r"ukraine|russia|china|taiwan|israel|gaza|iran|north korea|"
    r"coup|protest|border|immigration|tariff|trade war"
    r")\b",
    re.IGNORECASE,
)

_RE_TECH = re.compile(
    r"\b("
    r"ai\b|artificial intelligence|machine learning|chip|gpu\b|semiconductor|"
    r"software|cloud|saas\b|open source|cyber|security|ransomware|"
    r"iphone|android|robot|startup|platform|app\b|data center|"
    r"spacex|tesla|microsoft|google|amazon|meta\b|apple\b|nvidia\b"
    r")\b",
    re.IGNORECASE,
)


def classify(article: Article) -> Category:
    hay = " ".join(
        [
            article.title or "",
            article.raw_summary or "",
            article.category_hint or "",
        ]
    )

    hint = (article.category_hint or "").strip().lower()
    if hint in {"global_politics", "technology", "fundraising", "stock_market"}:
        # Treat "fundraising" and "stock_market" hints as soft hints.
        # Some publishers' section feeds include mixed topics.
        if hint == "fundraising" and not _RE_FUNDRAISING.search(hay):
            hint = ""
        elif hint == "stock_market" and not _RE_MARKETS.search(hay):
            hint = ""
        else:
            return hint  # type: ignore[return-value]

    # Priority: fundraising first (often overlaps with tech), then markets, then politics, then tech.
    if _RE_FUNDRAISING.search(hay):
        return "fundraising"
    if _RE_MARKETS.search(hay):
        return "stock_market"
    if _RE_POLITICS.search(hay):
        return "global_politics"
    if _RE_TECH.search(hay):
        return "technology"

    return "other"

