from __future__ import annotations

import re


_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")
_WS = re.compile(r"\s+")


def clean_text(text: str) -> str:
    text = text.strip()
    text = _WS.sub(" ", text)
    return text


def extractive_summary(text: str, max_sentences: int = 2, max_chars: int = 360) -> tuple[str, list[str]]:
    """
    Simple extractive summary:
    - split into sentences
    - return first N reasonably-long sentences
    """
    text = clean_text(text)
    if not text:
        return "", []

    sentences = [s.strip() for s in _SENT_SPLIT.split(text) if s.strip()]
    picked: list[str] = []
    for s in sentences:
        if len(s) < 40:
            continue
        picked.append(s)
        if len(picked) >= max_sentences:
            break

    if not picked:
        picked = sentences[:1]

    summary = " ".join(picked)
    if len(summary) > max_chars:
        summary = summary[: max_chars - 1].rstrip() + "…"

    key_points = []
    for s in picked[:3]:
        s2 = s
        if len(s2) > 180:
            s2 = s2[:179].rstrip() + "…"
        key_points.append(s2)

    return summary, key_points

