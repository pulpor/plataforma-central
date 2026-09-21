import asyncio
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Awaitable, Callable

PROGRESS_PATTERN = re.compile(r"^PROGRESS\s+(\{.*\})\s*$")

OnProgress = Callable[[dict], Awaitable[None]]
OnLog = Callable[[str, bool], Awaitable[None]]


async def run_system_process(
    command: str,
    cwd: Path,
    timeout_seconds: int,
    on_progress: OnProgress,
    on_log: OnLog,
) -> tuple[int, list[dict]]:
    """Run a system's command as a real subprocess and collect its output.

    Systems talk back to the backend through a tiny stdout protocol:
      - A line "PROGRESS {json}" (e.g. {"progress": 40, "message": "..."})
        updates the live progress shown in the UI.
      - The final list of result records must be written as a JSON array to
        the file path given in the PH_OUTPUT_FILE environment variable.

    Any other stdout/stderr line is kept as a raw log line (useful for
    debugging real systems that haven't adopted the protocol yet).
    """
    fd, output_path_str = tempfile.mkstemp(prefix="ph_output_", suffix=".json")
    os.close(fd)
    output_path = Path(output_path_str)
    output_path.write_text("[]", encoding="utf-8")

    env = os.environ.copy()
    env["PH_OUTPUT_FILE"] = str(output_path)
    env["PYTHONUNBUFFERED"] = "1"

    process = await asyncio.create_subprocess_shell(
        command,
        cwd=str(cwd),
        env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    async def read_stream(stream: asyncio.StreamReader | None, is_stderr: bool) -> None:
        if stream is None:
            return
        while True:
            line = await stream.readline()
            if not line:
                break
            text = line.decode("utf-8", errors="replace").rstrip()
            if not text:
                continue
            if not is_stderr:
                match = PROGRESS_PATTERN.match(text)
                if match:
                    try:
                        await on_progress(json.loads(match.group(1)))
                        continue
                    except json.JSONDecodeError:
                        pass
            await on_log(text, is_stderr)

    try:
        await asyncio.wait_for(
            asyncio.gather(
                read_stream(process.stdout, False),
                read_stream(process.stderr, True),
            ),
            timeout=timeout_seconds,
        )
        returncode = await asyncio.wait_for(process.wait(), timeout=15)
    except asyncio.TimeoutError as exc:
        process.kill()
        await process.wait()
        output_path.unlink(missing_ok=True)
        raise TimeoutError(f"Execução excedeu {timeout_seconds}s e foi encerrada.") from exc

    results: list[dict] = []
    if returncode == 0:
        try:
            raw = output_path.read_text(encoding="utf-8")
            parsed = json.loads(raw) if raw.strip() else []
            if isinstance(parsed, list):
                results = parsed
        except (json.JSONDecodeError, OSError):
            results = []

    output_path.unlink(missing_ok=True)
    return returncode, results
