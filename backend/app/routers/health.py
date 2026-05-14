import subprocess

from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("")
def health():
    return {"status": "ok"}


@router.get("/grader")
def grader_health():
    if settings.grader_mode == "mock":
        return {
            "status": "ok",
            "mode": "mock",
            "version": "mock-grader",
        }
    try:
        result = subprocess.run(
            [settings.claude_bin, "--version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
    except FileNotFoundError:
        return {
            "status": "error",
            "mode": "claude_cli",
            "error": f"{settings.claude_bin!r} not found in PATH",
        }
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "mode": "claude_cli",
            "error": "claude --version timed out",
        }
    except Exception as exc:  # noqa: BLE001
        return {"status": "error", "mode": "claude_cli", "error": str(exc)}

    if result.returncode != 0:
        return {
            "status": "error",
            "mode": "claude_cli",
            "error": (result.stderr or result.stdout or "claude --version failed").strip(),
        }
    return {
        "status": "ok",
        "mode": "claude_cli",
        "version": result.stdout.strip() or "unknown",
    }
