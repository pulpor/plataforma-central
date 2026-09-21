from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from .. import database
from ..excel_export import build_excel
from ..execution_manager import manager
from ..systems_registry import get_system_path, load_systems

router = APIRouter(prefix="/api", tags=["systems"])


@router.get("/systems")
async def list_systems() -> list[dict]:
    systems = load_systems()
    favorites = await database.list_favorites()
    result = []
    for system_id, config in systems.items():
        result.append(
            {
                "id": system_id,
                "name": config.name,
                "description": config.description,
                "icon": config.icon,
                "category": config.category,
                "status": config.status,
                "repository": config.repository,
                "is_configured": bool(config.command) and config.status == "ready",
                "favorite": system_id in favorites,
                "last_execution": await database.get_last_execution(system_id),
            }
        )
    return result


@router.get("/systems/{system_id}")
async def get_system(system_id: str) -> dict:
    config = load_systems().get(system_id)
    if not config:
        raise HTTPException(404, "Sistema não encontrado.")
    favorites = await database.list_favorites()
    return {
        "id": system_id,
        "name": config.name,
        "description": config.description,
        "icon": config.icon,
        "category": config.category,
        "status": config.status,
        "repository": config.repository,
        "is_configured": bool(config.command) and config.status == "ready",
        "favorite": system_id in favorites,
        "columns": [column.model_dump() for column in config.output.columns],
        "last_execution": await database.get_last_execution(system_id),
        "executions": await database.list_executions(system_id=system_id, limit=20),
    }


@router.post("/systems/{system_id}/run")
async def run_system(system_id: str) -> dict:
    config = load_systems().get(system_id)
    if not config:
        raise HTTPException(404, "Sistema não encontrado.")
    if config.status != "ready" or not config.command:
        raise HTTPException(400, "Este sistema ainda não está configurado para execução.")

    try:
        execution_id = await manager.start_execution(config, get_system_path(system_id))
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    return {"execution_id": execution_id, "status": "running"}


@router.post("/systems/{system_id}/favorite")
async def toggle_favorite(system_id: str) -> dict:
    if system_id not in load_systems():
        raise HTTPException(404, "Sistema não encontrado.")
    favorite = await database.toggle_favorite(system_id)
    return {"favorite": favorite}


@router.get("/systems/{system_id}/export")
async def export_system(system_id: str, execution_id: str | None = Query(default=None)):
    config = load_systems().get(system_id)
    if not config:
        raise HTTPException(404, "Sistema não encontrado.")

    execution = (
        await database.get_execution(execution_id)
        if execution_id
        else await database.get_last_execution(system_id)
    )
    if not execution or execution["status"] != "completed":
        raise HTTPException(400, "Nenhum resultado concluído disponível para exportação.")

    full_execution = execution if execution_id else await database.get_execution(execution["id"])

    buffer, filename = build_excel(config, full_execution["results"])
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/stats")
async def stats() -> dict:
    systems = load_systems()
    return {
        "total_systems": len(systems),
        "ready_systems": sum(1 for system in systems.values() if system.status == "ready"),
        "running_executions": await database.count_running(),
    }
