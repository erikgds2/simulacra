"""Tests for the TTL cache module."""
import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.cache import cache_get, cache_set, cache_invalidate, cache_stats


def setup_function():
    cache_invalidate("")  # Clear all


def test_cache_miss_returns_none():
    assert cache_get("nonexistent_key_xyz") is None


def test_cache_set_and_get():
    cache_set("test_key", {"value": 42}, ttl=30)
    result = cache_get("test_key")
    assert result == {"value": 42}


def test_cache_expired_returns_none():
    cache_set("expire_test", "data", ttl=1)
    time.sleep(1.1)
    assert cache_get("expire_test") is None


def test_cache_invalidate_by_prefix():
    cache_set("sim_list:10:0", [1, 2, 3], ttl=60)
    cache_set("sim_list:20:0", [4, 5, 6], ttl=60)
    cache_set("sim_result:abc", {"ok": True}, ttl=60)
    cache_invalidate("sim_list:")
    assert cache_get("sim_list:10:0") is None
    assert cache_get("sim_list:20:0") is None
    assert cache_get("sim_result:abc") == {"ok": True}


def test_cache_stats():
    cache_set("stat_key", "x", ttl=60)
    stats = cache_stats()
    assert stats["valid_entries"] >= 1
    assert stats["total_entries"] >= 1


def test_overwrite_existing_key():
    cache_set("dup_key", "first", ttl=60)
    cache_set("dup_key", "second", ttl=60)
    assert cache_get("dup_key") == "second"
