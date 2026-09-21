import asyncio
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from .. import database
from ..execution_manager import manager

router = APIRouter(prefix="/api", tags=["executions"])

TERMINAL_STATUSES = {"completed", "failed", "cancelled"}


@router.get("/executions")
async def list_executions(system_id: str | None = None, limit: int = 50) -> list[dict]:
    return await database.list_executions(system_id=system_id, limit=limit)


@router.get("/executions/{execution_id}")
async def get_execution(execution_id: str) -> dict:
    execution = await database.get_execution(execution_id)
    if not execution:
        raise HTTPException(404, "Execução não encontrada.")
    return execution


@router.get("/executions/{execution_id}/stream")
async def stream_execution(execution_id: str) -> StreamingResponse:
    execution = await database.get_execution(execution_id)
    if not execution:
        raise HTTPException(404, "Execução não encontrada.")

    async def event_generator():
        yield f"data: {json.dumps(execution, ensure_ascii=False)}\n\n"
        if execution["status"] in TERMINAL_STATUSES:
            return

        queue = manager.subscribe(execution_id)
        try:
            while True:
                try:
                    snapshot = await asyncio.wait_for(queue.get(), timeout=15)
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
                    continue
                yield f"data: {json.dumps(snapshot, ensure_ascii=False)}\n\n"
                if snapshot["status"] in TERMINAL_STATUSES:
                    break
        finally:
            manager.unsubscribe(execution_id, queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
