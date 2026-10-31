from datetime import date

import pytest

from app.services.calendar_export import plan_to_ics
from app.services.scheduling import PlanningError, TopicInput, build_plan

TOPICS = [TopicInput(f"Topic {i}", w, [f"sub{i}a", f"sub{i}b", f"sub{i}c"]) for i, w in enumerate([3, 5, 2, 4, 3, 1])]


def make(**kw):
    args = dict(start=date(2026, 11, 2), exam=date(2026, 12, 28), days_per_week=3, pace="medium")
    args.update(kw)
    return build_plan(TOPICS, **args)


def test_every_topic_is_learned_before_revision_and_last_slot_is_mock():
    events, _ = make()
    kinds = [e["kind"] for e in events]
    assert events[-1]["kind"] == "mock"
    assert {e["topic"] for e in events if e["kind"] == "learn"} == {t.title for t in TOPICS}
    assert kinds.index("revise") > max(i for i, k in enumerate(kinds) if k == "learn")


def test_only_study_weekdays_and_before_exam():
    events, _ = make(study_days=["tue", "thu"])
    assert all(date.fromisoformat(e["date"]).weekday() in (1, 3) for e in events)
    assert all(e["date"] < "2026-12-28" for e in events)


def test_events_unique_per_day_and_sorted():
    events, _ = make()
    dates = [e["date"] for e in events]
    assert dates == sorted(dates) and len(dates) == len(set(dates))


def test_slow_pace_needs_more_sessions_than_fast():
    fast = sum(e["kind"] == "learn" for e in make(pace="fast")[0])
    slow = sum(e["kind"] == "learn" for e in make(pace="slow")[0])
    assert slow > fast


def test_compression_warning_when_time_is_short():
    events, warnings = make(exam=date(2026, 11, 30), pace="slow", days_per_week=3)
    assert warnings and sum(e["kind"] == "learn" for e in events) >= len(TOPICS)


def test_not_enough_sessions_raises():
    with pytest.raises(PlanningError):
        make(exam=date(2026, 11, 6), days_per_week=1)


def test_exam_before_start_raises():
    with pytest.raises(PlanningError):
        make(exam=date(2026, 11, 1))


def test_ics_export():
    events, _ = make()
    ics = plan_to_ics(events, calendar_name="Study, plan", plan_id="abc")
    assert ics.startswith("BEGIN:VCALENDAR") and ics.count("BEGIN:VEVENT") == len(events)
    assert "X-WR-CALNAME:Study\\, plan" in ics
