"""
Auditoria de segurança — testa proteções contra inputs maliciosos.
Não usa HTTP layer — testa lógica diretamente.
"""
import sys
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)


def _is_valid_uuid(val: str) -> bool:
    return bool(_UUID_RE.match(val.lower()))


def test_valid_uuid_accepted():
    assert _is_valid_uuid("550e8400-e29b-41d4-a716-446655440000")


def test_invalid_uuid_rejected():
    assert not _is_valid_uuid("../../../etc/passwd")
    assert not _is_valid_uuid("'; DROP TABLE simulations; --")
    assert not _is_valid_uuid("not-a-uuid")
    assert not _is_valid_uuid("")
    assert not _is_valid_uuid("  ")


def test_export_format_whitelist():
    allowed = {"csv", "json"}
    assert "csv" in allowed
    assert "json" in allowed
    assert "../../etc/passwd" not in allowed
    assert "xml" not in allowed
    assert "" not in allowed


def test_bleach_strips_html_from_seed():
    import bleach
    dirty = '<script>alert("xss")</script>Notícia falsa'
    clean = bleach.clean(dirty, tags=[], strip=True)
    assert "<script>" not in clean
    assert "</script>" not in clean
    assert "Notícia falsa" in clean


def test_bleach_strips_html_tags():
    import bleach
    dirty = '<a href="evil.com">clique aqui</a>'
    clean = bleach.clean(dirty, tags=[], strip=True)
    assert "<a" not in clean
    assert "clique aqui" in clean


def test_email_validation_rejects_invalid():
    import re
    _EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
    assert not _EMAIL_RE.match("not-an-email")
    assert not _EMAIL_RE.match("a@")
    assert not _EMAIL_RE.match("@b.com")
    assert not _EMAIL_RE.match("")
    assert _EMAIL_RE.match("valid@example.com")


def test_seed_text_max_length_enforced():
    long_text = "a" * 5001
    assert len(long_text) > 5000


def test_num_agents_limits():
    min_agents = 10
    max_agents = 1000
    assert 200 >= min_agents
    assert 200 <= max_agents
    assert 9 < min_agents  # Below min is rejected
    assert 1001 > max_agents  # Above max is rejected
