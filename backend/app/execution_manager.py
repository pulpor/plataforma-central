import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import asyncio

from . import database
from .models import SystemConfig
from .process_runner import run_system_process


class ExecutionManager:
    """Owns background execution tasks and fans out live updates to SSE subscribers."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue]] = {}
        self._tasks: dict[str, asyncio.Task] = {}

    async def start_execution(self, system: SystemConfig, system_path: Path) -> str:
        if not system.command:
            raise ValueError("Sistema sem comando de execução configurado.")

        execution_id = str(uuid.uuid4())
        started_at = datetime.now(timezone.utc).isoformat()
        await database.create_execution(execution_id, system.id, started_at)

        task = asyncio.create_task(self._run(execution_id, system, system_path))
        self._tasks[execution_id] = task
        return execution_id

    async def _publish(self, execution_id: str) -> None:
        snapshot = await database.get_execution(execution_id)
        for queue in self._subscribers.get(execution_id, []):
            queue.put_nowait(snapshot)

    async def _run(self, execution_id: str, system: SystemConfig, system_path: Path) -> None:
        start_ts = time.monotonic()
        await database.update_execution(
            execution_id, status="running", progress=5, message="Iniciando sistema..."
        )
        await self._publish(execution_id)

        logs: list[str] = []

        async def on_progress(payload: dict) -> None:
            progress = max(0, min(100, int(payload.get("progress", 0))))
            message = str(payload.get("message", ""))
            await database.update_execution(
                execution_id, status="running", progress=progress, message=message
            )
            await self._publish(execution_id)

        async def on_log(text: str, is_stderr: bool) -> None:
            logs.append(f"{'ERR' if is_stderr else 'OUT'}: {text}")

        error: str | None = None
        results: list[dict] = []
        status = "completed"
        message = ""

        try:
            returncode, results = await run_system_process(
                command=system.command,
                cwd=system_path,
                timeout_seconds=system.timeout_seconds,
                on_progress=on_progress,
                on_log=on_log,
            )
            if returncode == 0:
                status = "completed"
                message = f"Encontrados {len(results)} registros."
            else:
                status = "failed"
                message = "Sistema finalizado com erro"
                error = "\n".join(logs[-20:]) or f"Processo saiu com código {returncode}."
        except TimeoutError as exc:
            status = "failed"
            message = "Tempo limite excedido"
            error = str(exc)
        except Exception as exc:  # noqa: BLE001 - surface any adapter failure to the UI
            status = "failed"
            message = "Erro inesperado na execução"
            error = str(exc)

        await database.update_execution(
            execution_id,
            status=status,
            progress=100,
            message=message,
            error=error,
            results=results,
            result_count=len(results),
            logs=logs,
            completed_at=datetime.now(timezone.utc).isoformat(),
            duration_seconds=round(time.monotonic() - start_ts, 2),
        )
        await self._publish(execution_id)
        self._tasks.pop(execution_id, None)

    def subscribe(self, execution_id: str) -> "asyncio.Queue":
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.setdefault(execution_id, []).append(queue)
        return queue

    def unsubscribe(self, execution_id: str, queue: "asyncio.Queue") -> None:
        subscribers = self._subscribers.get(execution_id, [])
        if queue in subscribers:
            subscribers.remove(queue)


manager = ExecutionManager()
