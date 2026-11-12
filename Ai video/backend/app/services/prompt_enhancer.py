import json
import urllib.error
import urllib.request

from app.config import settings


def enhance_prompt(prompt: str) -> str:
    """Call a local Ollama-compatible API, or improve the prompt with a simple local template."""
    endpoint = settings.prompt_enhancer_url.strip()
    if not endpoint:
        enhanced = (
            f"{prompt.rstrip('. ')}, cinematic composition, clear subject and deliberate motion, "
            "rich natural lighting, detailed environment, smooth camera movement"
        )
        return enhanced[: settings.max_prompt_length]

    payload = json.dumps({
        "model": "llama3.2",
        "prompt": (
            "Improve this text-to-video prompt. Preserve its subject and intent. "
            "Add concise visual details, lighting, and camera motion. Return only the improved prompt.\n\n"
            f"{prompt}"
        ),
        "stream": False,
    }).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Local prompt enhancer failed: {error}") from error
    enhanced = result.get("response")
    if not isinstance(enhanced, str) or not enhanced.strip():
        raise RuntimeError("Local prompt enhancer returned an empty response.")
    return enhanced.strip()[: settings.max_prompt_length]
