"""Register new tools here; agents pick the subset they need by name."""
from app.ai.tools.base import Tool
from app.ai.tools.retrieve_notes import retrieve_notes_tool
from app.ai.tools.web_search import web_search_tool

ALL_TOOLS: dict[str, Tool] = {t.name: t for t in (retrieve_notes_tool, web_search_tool)}


def get_tools(names: list[str]) -> list[Tool]:
    return [ALL_TOOLS[n] for n in names]
