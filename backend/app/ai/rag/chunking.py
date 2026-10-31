import re
from dataclasses import dataclass


@dataclass
class Chunk:
    text: str
    page: int | None = None


def _split_long(text: str, size: int, overlap: int) -> list[str]:
    step = max(1, size - overlap)
    return [text[i : i + size] for i in range(0, len(text), step)]


def chunk_text(text: str, size: int = 1800, overlap: int = 250) -> list[str]:
    """Paragraph-aware character chunking (~450 tokens) with overlap. `size` is a soft limit."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[str] = []
    buf = ""
    for p in paragraphs:
        if len(p) > size:
            if buf:
                chunks.append(buf)
                buf = ""
            chunks.extend(_split_long(p, size, overlap))
        elif buf and len(buf) + len(p) + 2 > size:
            chunks.append(buf)
            tail = buf[-overlap:] if overlap else ""
            buf = f"{tail}\n\n{p}" if tail else p
        else:
            buf = f"{buf}\n\n{p}" if buf else p
    if buf:
        chunks.append(buf)
    return chunks


def chunk_pages(pages: list[tuple[int | None, str]], size: int = 1800, overlap: int = 250) -> list[Chunk]:
    out: list[Chunk] = []
    for page, text in pages:
        out.extend(Chunk(text=c, page=page) for c in chunk_text(text, size, overlap))
    return out
