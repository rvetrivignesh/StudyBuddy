"""Optional local speech-to-text (faster-whisper). Install requirements-extra.txt to enable."""
from functools import lru_cache

from app.core.config import settings
from app.core.errors import NotImplementedFeature


@lru_cache
def _model():
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        raise NotImplementedFeature("Speech-to-text not installed. Run: pip install -r requirements-extra.txt") from e
    return WhisperModel(settings.whisper_model, compute_type="int8")


def transcribe(path: str) -> str:
    segments, _ = _model().transcribe(path)
    return " ".join(s.text.strip() for s in segments).strip()
