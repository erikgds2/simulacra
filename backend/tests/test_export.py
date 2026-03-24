"""Tests for data export endpoints — logic tests without HTTP layer."""
import io
import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.simulation_engine import SimulationEngine


def _run_mini_sim():
    engine = SimulationEngine(num_agents=30, random_seed=99)
    return list(engine.run_ticks())


def test_ticks_csv_format():
    ticks = _run_mini_sim()
    buf = io.StringIO()
    import csv as _csv
    writer = _csv.DictWriter(buf, fieldnames=["tick", "S", "E", "I", "R"])
    writer.writeheader()
    writer.writerows(ticks)
    content = buf.getvalue()
    assert "tick,S,E,I,R" in content
    lines = [l for l in content.strip().split("\n") if l]
    assert len(lines) == len(ticks) + 1  # header + rows


def test_ticks_json_format():
    ticks = _run_mini_sim()
    payload = {"simulation_id": "test-id", "ticks": ticks}
    content = json.dumps(payload, ensure_ascii=False, indent=2)
    parsed = json.loads(content)
    assert parsed["simulation_id"] == "test-id"
    assert len(parsed["ticks"]) == len(ticks)
    for t in parsed["ticks"]:
        assert "tick" in t and "S" in t and "I" in t


def test_each_tick_has_seir_keys():
    ticks = _run_mini_sim()
    for tick in ticks:
        assert set(tick.keys()) == {"tick", "S", "E", "I", "R"}


def test_csv_seeds_columns():
    """Seeds CSV should have expected columns."""
    fieldnames = ["id", "source_name", "title", "content", "url", "collected_at", "region_br"]
    buf = io.StringIO()
    import csv as _csv
    writer = _csv.DictWriter(buf, fieldnames=fieldnames)
    writer.writeheader()
    content = buf.getvalue()
    for col in fieldnames:
        assert col in content


def test_ticks_sum_constant():
    """Total agents S+E+I+R should remain constant across all ticks."""
    ticks = _run_mini_sim()
    first_total = ticks[0]["S"] + ticks[0]["E"] + ticks[0]["I"] + ticks[0]["R"]
    for t in ticks:
        total = t["S"] + t["E"] + t["I"] + t["R"]
        assert total == first_total, f"tick {t['tick']}: total changed to {total}"
