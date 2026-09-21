import json
from pathlib import Path
from typing import Any, Optional

import aiosqlite

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "python_hub.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS executions (
    id TEXT PRIMARY KEY,
    system_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    progress INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_seconds REAL,
    result_count INTEGER,
    results_json TEXT,
    error TEXT,
    logs_json TEXT
);

CREATE TABLE IF NOT EXISTS favorites (
    system_id TEXT PRIMARY KEY
);
"""

# Lightweight column set used for lists/history (excludes heavy results/logs blobs).
SUMMARY_COLUMNS = (
    "id, system_id, status, progress, message, started_at, "
    "completed_at, duration_seconds, result_count, error"
)


async def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()


async def create_execution(execution_id: str, system_id: str, started_at: str) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO executions (id, system_id, status, progress, message, started_at) "
            "VALUES (?, ?, 'queued', 0, 'Na fila...', ?)",
            (execution_id, system_id, started_at),
        )
        await db.commit()


async def update_execution(execution_id: str, **fields: Any) -> None:
    columns: list[str] = []
    values: list[Any] = []
    for key, value in fields.items():
        if key in ("results", "logs"):
            columns.append(f"{key}_json = ?")
            values.append(json.dumps(value, ensure_ascii=False))
        else:
            columns.append(f"{key} = ?")
            values.append(value)
    values.append(execution_id)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(f"UPDATE executions SET {', '.join(columns)} WHERE id = ?", values)
        await db.commit()


def _row_to_dict(row: tuple, columns: list[str]) -> dict:
    return dict(zip(columns, row))


def _row_to_detail(row: tuple, columns: list[str]) -> dict:
    data = _row_to_dict(row, columns)
    data["results"] = json.loads(data.pop("results_json")) if data.get("results_json") else []
    data["logs"] = json.loads(data.pop("logs_json")) if data.get("logs_json") else []
    return data


async def get_execution(execution_id: str) -> Optional[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT * FROM executions WHERE id = ?", (execution_id,))
        row = await cursor.fetchone()
        if not row:
            return None
        columns = [d[0] for d in cursor.description]
        return _row_to_detail(row, columns)


async def list_executions(system_id: Optional[str] = None, limit: int = 100) -> list[dict]:
    query = f"SELECT {SUMMARY_COLUMNS} FROM executions"
    params: list[Any] = []
    if system_id:
        query += " WHERE system_id = ?"
        params.append(system_id)
    query += " ORDER BY started_at DESC LIMIT ?"
    params.append(limit)
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        columns = [d[0] for d in cursor.description]
        return [_row_to_dict(row, columns) for row in rows]


async def get_last_execution(system_id: str) -> Optional[dict]:
    executions = await list_executions(system_id=system_id, limit=1)
    return executions[0] if executions else None


async def count_running() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT COUNT(*) FROM executions WHERE status IN ('queued', 'running')"
        )
        row = await cursor.fetchone()
        return row[0] if row else 0


async def toggle_favorite(system_id: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT 1 FROM favorites WHERE system_id = ?", (system_id,))
        exists = await cursor.fetchone()
        if exists:
            await db.execute("DELETE FROM favorites WHERE system_id = ?", (system_id,))
            await db.commit()
            return False
        await db.execute("INSERT INTO favorites (system_id) VALUES (?)", (system_id,))
        await db.commit()
        return True


async def list_favorites() -> set[str]:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT system_id FROM favorites")
        rows = await cursor.fetchall()
        return {row[0] for row in rows}
