"""Deterministic study scheduler (pure functions, no I/O, easy to unit-test).

Inputs: weighted topics, study weekdays, pace, start/exam dates.
Output: one event per study session: learn sessions (in syllabus order), then
revision sessions, ending with a mock test on the last slot before the exam.
"""
import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta

WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
DEFAULT_STUDY_DAYS = {
    1: [0],
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 5, 6],
}
# hours of effort per weight point, and session length, by learning pace
PACE = {
    "fast": {"hours_per_weight": 1.0, "session_hours": 2.0},
    "medium": {"hours_per_weight": 1.5, "session_hours": 1.5},
    "slow": {"hours_per_weight": 2.0, "session_hours": 1.5},
}


class PlanningError(ValueError):
    pass


@dataclass
class TopicInput:
    title: str
    weight: int = 3
    subtopics: list[str] | None = None


def _allocate(needs: list[float], total: int) -> list[int]:
    """Split `total` sessions across topics proportionally to `needs`, min 1 each (requires total >= len(needs))."""
    n, s = len(needs), sum(needs)
    raw = [x / s * total for x in needs]
    alloc = [max(1, int(r)) for r in raw]
    while sum(alloc) > total:
        i = max((i for i in range(n) if alloc[i] > 1), key=lambda i: alloc[i] - raw[i])
        alloc[i] -= 1
    while sum(alloc) < total:
        i = max(range(n), key=lambda i: raw[i] - alloc[i])
        alloc[i] += 1
    return alloc


def _split(items: list[str], parts: int) -> list[list[str]]:
    size = max(1, math.ceil(len(items) / parts))
    return [items[i * size : (i + 1) * size] for i in range(parts)]


def build_plan(
    topics: list[TopicInput],
    *,
    start: date,
    exam: date,
    days_per_week: int,
    study_days: list[str] | None = None,
    pace: str = "medium",
    session_start: str = "18:00",
    revision_ratio: float = 0.2,
) -> tuple[list[dict], list[str]]:
    if not topics:
        raise PlanningError("The subject has no topics yet.")
    if exam <= start:
        raise PlanningError("The exam date must be after the start date.")
    cfg = PACE[pace]
    weekdays = sorted({WEEKDAYS.index(d) for d in study_days}) if study_days else DEFAULT_STUDY_DAYS[days_per_week]

    slots = [start + timedelta(days=i) for i in range((exam - start).days)]  # exam day itself excluded
    slots = [d for d in slots if d.weekday() in weekdays]
    t, n = len(topics), len(slots)
    if n < t:
        raise PlanningError(
            f"Only {n} study sessions are available before the exam but there are {t} topics. "
            "Add study days, extend the time frame, or merge topics."
        )

    warnings: list[str] = []
    budget = max(t, min(n, math.floor(n * (1 - revision_ratio))))  # sessions reserved for first-time learning
    efforts = [tp.weight * cfg["hours_per_weight"] for tp in topics]
    needed = [max(1, math.ceil(e / cfg["session_hours"])) for e in efforts]
    if sum(needed) <= budget:
        counts = needed
    else:
        counts = _allocate([float(x) for x in needed], budget)
        warnings.append(
            f"Not enough time to cover every topic at a '{pace}' pace: sessions were compressed "
            f"({sum(needed)} needed, {budget} available). Add study days or extend the time frame."
        )

    hh, mm = (int(x) for x in session_start.split(":"))
    duration = timedelta(hours=cfg["session_hours"])

    def event(day: date, title: str, topic: str, kind: str, description: str) -> dict:
        begin = datetime(day.year, day.month, day.day, hh, mm)
        return {
            "date": day.isoformat(),
            "start": begin.isoformat(),
            "end": (begin + duration).isoformat(),
            "title": title,
            "topic": topic,
            "kind": kind,
            "description": description,
        }

    events: list[dict] = []
    cursor = 0
    for tp, c in zip(topics, counts):
        parts = _split(tp.subtopics or [], c)
        for k in range(c):
            suffix = f" (part {k + 1}/{c})" if c > 1 else ""
            covered = parts[k] if k < len(parts) else []
            desc = ("Cover: " + ", ".join(covered)) if covered else "Study the topic with deep-learning notes and flashcards."
            events.append(event(slots[cursor], f"Learn: {tp.title}{suffix}", tp.title, "learn", desc))
            cursor += 1

    remaining = slots[cursor:]
    by_weight = sorted(topics, key=lambda x: -x.weight)
    for i, day in enumerate(remaining):
        if i == len(remaining) - 1:
            events.append(event(day, "Final review & mock test", "All topics", "mock", "Timed mock test, then revisit weak areas."))
        else:
            tp = by_weight[i % len(by_weight)]
            events.append(event(day, f"Revise: {tp.title}", tp.title, "revise", "Recall practice: flashcards + MCQ quiz on this topic."))
    return events, warnings
