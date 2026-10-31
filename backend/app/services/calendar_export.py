"""iCalendar (.ics) export. Google Calendar, Apple Calendar and Outlook can all import .ics files."""
from datetime import datetime, timezone


def _esc(text: str) -> str:
    return text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def _fmt(value: str | datetime) -> str:
    dt = datetime.fromisoformat(value) if isinstance(value, str) else value
    return dt.strftime("%Y%m%dT%H%M%S")


def plan_to_ics(events: list[dict], *, calendar_name: str, plan_id: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Study Companion//Study Plan//EN",
        "CALSCALE:GREGORIAN",
        f"X-WR-CALNAME:{_esc(calendar_name)}",
    ]
    for i, e in enumerate(events):
        lines += [
            "BEGIN:VEVENT",
            f"UID:{plan_id}-{i}@study-companion",
            f"DTSTAMP:{stamp}",
            f"DTSTART:{_fmt(e['start'])}",  # floating local time
            f"DTEND:{_fmt(e['end'])}",
            f"SUMMARY:{_esc(e['title'])}",
            f"DESCRIPTION:{_esc(e.get('description', ''))}",
            "END:VEVENT",
        ]
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"
