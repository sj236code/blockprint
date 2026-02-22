"""ElevenLabs Speech-to-Text client for transcribing voice to text."""
import httpx
from app.config import get_settings

ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text"


async def transcribe_audio(audio_bytes: bytes, content_type: str | None = None) -> str:
    """
    Transcribe audio to text using ElevenLabs Speech-to-Text API.
    Returns the transcript text. Raises ValueError if API key is missing or request fails.
    """
    settings = get_settings()
    if not settings.elevenlabs_api_key:
        raise ValueError("ElevenLabs API key is not configured. Set ELEVENLABS_API_KEY in .env to use voice input.")

    # Determine filename extension for the API (some APIs use it for format detection)
    ext = "webm"
    if content_type:
        if "mpeg" in content_type or "mp3" in content_type:
            ext = "mp3"
        elif "wav" in content_type:
            ext = "wav"
        elif "ogg" in content_type:
            ext = "ogg"

    headers = {"xi-api-key": settings.elevenlabs_api_key}
    files = {"file": (f"audio.{ext}", audio_bytes, content_type or "audio/webm")}
    data = {"model_id": settings.elevenlabs_stt_model}

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            ELEVENLABS_STT_URL,
            headers=headers,
            files=files,
            data=data,
        )

    if response.status_code == 401:
        raise ValueError("Invalid ElevenLabs API key.")
    if response.status_code == 422:
        raise ValueError("Unsupported audio format or invalid request. Try recording again or use a different format.")
    if response.status_code >= 400:
        try:
            err = response.json()
            msg = err.get("detail", err.get("message", response.text))
        except Exception:
            msg = response.text or f"HTTP {response.status_code}"
        raise ValueError(f"Transcription failed: {msg}")

    body = response.json()
    # Sync response: single transcript has "text"; multi-channel has "transcripts" array
    if isinstance(body.get("text"), str):
        return body["text"].strip()
    if isinstance(body.get("transcripts"), list) and len(body["transcripts"]) > 0:
        first = body["transcripts"][0]
        if isinstance(first.get("text"), str):
            return first["text"].strip()
    raise ValueError("Unexpected transcription response format.")
