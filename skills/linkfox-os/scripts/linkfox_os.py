#!/usr/bin/env python3
"""linkfox-os CLI - Linkfox synchronous query proxy.

Submits a prompt to the Linkfox proxy and writes its response directly to stdout.
The proxy accepts the existing payload shape: {"prompt", "modelId"}.

Usage:
    linkfox_os.py "<task>"
    linkfox_os.py --model default --stdin

Environment:
    ZINIAO_API_KEY          Optional API key override. Otherwise uses zn-open-eco auth get.
    LINKFOXAGENT_BASE_URL   Base URL. Default: https://agent-swarm-test.ziniao.com/
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def _configure_utf8_stdio() -> None:
    """Use UTF-8 for text streams when the runtime supports reconfiguration."""
    for stream in (sys.stdin, sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure:
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except (OSError, ValueError):
                pass


LINKFOXAGENT_BASE_URL = os.environ.get(
    "LINKFOXAGENT_BASE_URL", "https://agent-swarm-test.ziniao.com/"
)
SUBMIT_ENDPOINT = "api/v1/claw/cli-proxy/open-api/linkfox"
DEFAULT_MODEL_ID = "default"
PROXY_REQUEST_TIMEOUT_SECONDS = 1230


def get_api_key() -> str:
    """Get the API key from the environment or the CLI credential store."""
    key = (os.environ.get("ZINIAO_API_KEY") or "").strip()
    if key:
        return key

    command = shutil.which("zn-open-eco")
    if command:
        try:
            result = subprocess.run(
                [command, "auth", "get"], capture_output=True, text=True, check=False
            )
        except OSError:
            result = None
    else:
        result = None

    if result is not None and result.returncode == 0:
        key = result.stdout.strip()
        if key:
            return key

    print(
        "Error: no Linkfox API key is configured.\n"
        "Install zn-open-eco and run:\n"
        "  zn-open-eco auth set <AUTH_KEY>",
        file=sys.stderr,
    )
    sys.exit(1)


def api_request(endpoint: str, payload: dict) -> dict:
    """Send a JSON POST request to the Linkfox proxy."""
    url = f"{LINKFOXAGENT_BASE_URL.rstrip('/')}/{endpoint.lstrip('/')}"
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": get_api_key(),
            "Content-Type": "application/json",
            "Cli-Type": "zn-eco-user",
            "User-Agent": "linkfox-os-skill/1.0",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=PROXY_REQUEST_TIMEOUT_SECONDS) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        body = error.read().decode("utf-8") if error.fp else ""
        return {"error": f"HTTP {error.code}: {error.reason}", "details": body}
    except URLError as error:
        return {"error": f"Connection failed: {error.reason}"}
    except Exception as error:
        return {"error": str(error)}

    if isinstance(result, dict):
        errcode = result.get("errcode")
        if errcode is not None and errcode not in (200, 0, "200", "0"):
            errmsg = result.get("errmsg") or result.get("message") or "未知错误"
            return {"error": f"业务错误 errcode={errcode}: {errmsg}", "details": result}
    return result


def submit_task(prompt: str, model_id: str = DEFAULT_MODEL_ID) -> dict:
    """Submit a synchronous Linkfox query and return its direct response."""
    return api_request(SUBMIT_ENDPOINT, {"prompt": prompt, "modelId": model_id})


def main() -> None:
    _configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="linkfox-os synchronous query proxy")
    parser.add_argument("task", nargs="?", help="Prompt / task description to submit")
    parser.add_argument(
        "--stdin", action="store_true", help="Read task from stdin (UTF-8 without BOM)"
    )
    parser.add_argument("--model", dest="model_id", default=DEFAULT_MODEL_ID)
    parser.add_argument("--format", choices=("json",), default="json")
    args = parser.parse_args()

    if args.stdin:
        task_text = sys.stdin.read().strip()
        if not task_text:
            parser.error("stdin was empty")
    elif args.task:
        task_text = args.task
    else:
        parser.error("task is required (or use --stdin)")

    result = submit_task(task_text, args.model_id)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if isinstance(result, dict) and "error" in result:
        sys.exit(1)


if __name__ == "__main__":
    main()
