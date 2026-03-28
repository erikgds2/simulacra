import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

_DATA_DIR = Path(os.getenv("DATA_DIR", str(Path(__file__).parent)))
DB_PATH = _DATA_DIR / "simulacra.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS simulations (
                id TEXT PRIMARY KEY,
                seed_text TEXT NOT NULL,
                seed_id TEXT,
                num_agents INTEGER NOT NULL,
                intervention TEXT,
                random_seed INTEGER NOT NULL,
                region TEXT,
                status TEXT NOT NULL DEFAULT 'ready',
                created_at TEXT NOT NULL,
                finished_at TEXT,
                peak_infected INTEGER,
                time_to_peak INTEGER,
                total_reach REAL,
                total_ticks INTEGER
            );

            CREATE TABLE IF NOT EXISTS simulation_ticks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                simulation_id TEXT NOT NULL,
                tick INTEGER NOT NULL,
                s INTEGER NOT NULL,
                e INTEGER NOT NULL,
                i INTEGER NOT NULL,
                r INTEGER NOT NULL,
                FOREIGN KEY (simulation_id) REFERENCES simulations(id)
            );

            CREATE TABLE IF NOT EXISTS seeds (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                source_name TEXT NOT NULL,
                collected_at TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                url TEXT NOT NULL UNIQUE,
                tags TEXT NOT NULL DEFAULT '[]',
                region_br TEXT NOT NULL DEFAULT 'nacional'
            );

            CREATE INDEX IF NOT EXISTS idx_ticks_simulation
                ON simulation_ticks(simulation_id);

            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                simulation_id TEXT NOT NULL UNIQUE,
                markdown TEXT NOT NULL,
                model TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (simulation_id) REFERENCES simulations(id)
            );

            CREATE INDEX IF NOT EXISTS idx_simulations_created
                ON simulations(created_at DESC);
        """)
        # Migration: add region column to existing databases
        try:
            conn.execute("ALTER TABLE simulations ADD COLUMN region TEXT")
        except Exception:
            pass  # Column already exists


def save_simulation(sim_id: str, config: dict) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT OR IGNORE INTO simulations
                (id, seed_text, seed_id, num_agents, intervention, random_seed, region, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ready', ?)
            """,
            (
                sim_id,
                config.get("seed_text", ""),
                config.get("seed_id"),
                config.get("num_agents", 200),
                config.get("intervention"),
                config.get("random_seed", 42),
                config.get("region"),
                datetime.now(timezone.utc).isoformat(),
            ),
        )


def save_tick(sim_id: str, tick: dict) -> None:
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO simulation_ticks (simulation_id, tick, s, e, i, r) VALUES (?, ?, ?, ?, ?, ?)",
            (sim_id, tick["tick"], tick["S"], tick["E"], tick["I"], tick["R"]),
        )


def finish_simulation(sim_id: str, result: dict) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE simulations SET
                status = 'finished',
                finished_at = ?,
                peak_infected = ?,
                time_to_peak = ?,
                total_reach = ?,
                total_ticks = ?
            WHERE id = ?
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                result.get("peak_infected"),
                result.get("time_to_peak"),
                result.get("total_reach"),
                result.get("total_ticks"),
                sim_id,
            ),
        )


def get_simulation(sim_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM simulations WHERE id = ?", (sim_id,)
        ).fetchone()
        if not row:
            return None
        return dict(row)


def get_simulation_ticks(sim_id: str) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT tick, s, e, i, r FROM simulation_ticks WHERE simulation_id = ? ORDER BY tick",
            (sim_id,),
        ).fetchall()
        return [
            {"tick": r["tick"], "S": r["s"], "E": r["e"], "I": r["i"], "R": r["r"]}
            for r in rows
        ]


def list_simulations(limit: int = 20, offset: int = 0) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM simulations ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, offset)
        ).fetchall()
        return [dict(r) for r in rows]


def count_simulations() -> int:
    with get_connection() as conn:
        return conn.execute("SELECT COUNT(*) FROM simulations").fetchone()[0]


def save_seed_to_db(seed: dict) -> bool:
    try:
        with get_connection() as conn:
            conn.execute(
                """
                INSERT OR IGNORE INTO seeds
                    (id, source, source_name, collected_at, title, content, url, tags, region_br)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    seed["id"],
                    seed["source"],
                    seed["source_name"],
                    seed["collected_at"],
                    seed["title"],
                    seed["content"],
                    seed["url"],
                    json.dumps(seed.get("tags", []), ensure_ascii=False),
                    seed.get("region_br", "nacional"),
                ),
            )
        return True
    except Exception:
        return False


def list_seeds_from_db(limit: int = 50, offset: int = 0) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM seeds ORDER BY collected_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["tags"] = json.loads(d["tags"])
            result.append(d)
        return result


def count_seeds() -> int:
    with get_connection() as conn:
        return conn.execute("SELECT COUNT(*) FROM seeds").fetchone()[0]


def save_report(report_id: str, sim_id: str, markdown: str, model: str) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO reports (id, simulation_id, markdown, model, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (report_id, sim_id, markdown, model, datetime.now(timezone.utc).isoformat()),
        )


def get_report_by_simulation(sim_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM reports WHERE simulation_id = ?", (sim_id,)
        ).fetchone()
        return dict(row) if row else None


def get_report(report_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM reports WHERE id = ?", (report_id,)
        ).fetchone()
        return dict(row) if row else None
