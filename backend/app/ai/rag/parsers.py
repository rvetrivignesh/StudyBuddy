"""File -> list of (page_number | None, text)."""
from pathlib import Path

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".txt", ".md"}


def parse_file(path: str | Path) -> list[tuple[int | None, str]]:
    path = Path(path)
    ext = path.suffix.lower()
    if ext == ".pdf":
        import pymupdf  # PyMuPDF

        pages: list[tuple[int | None, str]] = []
        with pymupdf.open(path) as doc:
            for i, page in enumerate(doc):
                text = page.get_text()
                if text.strip():
                    pages.append((i + 1, text))
        return pages
    if ext == ".docx":
        from docx import Document

        d = Document(str(path))
        parts = [p.text for p in d.paragraphs if p.text.strip()]
        for table in d.tables:
            for row in table.rows:
                parts.append(" | ".join(c.text.strip() for c in row.cells))
        return [(None, "\n\n".join(parts))] if parts else []
    if ext == ".pptx":
        from pptx import Presentation

        out: list[tuple[int | None, str]] = []
        for i, slide in enumerate(Presentation(str(path)).slides, start=1):
            texts = [s.text_frame.text for s in slide.shapes if s.has_text_frame and s.text_frame.text.strip()]
            if texts:
                out.append((i, "\n".join(texts)))
        return out
    if ext in {".txt", ".md"}:
        text = path.read_text(encoding="utf-8", errors="ignore")
        return [(None, text)] if text.strip() else []
    raise ValueError(f"Unsupported file type: {ext}")


def extract_text(path: str | Path) -> str:
    return "\n\n".join(text for _, text in parse_file(path))
