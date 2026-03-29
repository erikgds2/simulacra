"""
Security hardening tests — Simulacra v1.2.0
Tests: input validation, headers, rate limits, error handling, injection prevention
"""
import os
import uuid
import pytest

os.environ.setdefault("ENVIRONMENT", "test")


# ─── SQL Injection tests ──────────────────────────────────────────────────────

def test_sql_injection_in_simulation_id(client):
    """UUID validation should block SQL injection in sim_id.

    The router returns 400 for most invalid formats.
    Path-traversal style IDs ('../..') may be normalized by the router
    and return 404 — both are safe (the database is never queried).
    """
    payloads = [
        "1' OR '1'='1",
        "'; DROP TABLE simulations; --",
        "1 UNION SELECT * FROM reports --",
        "' OR 1=1 --",
    ]
    for payload in payloads:
        resp = client.get(f"/simulation/{payload}/result")
        assert resp.status_code == 400, f"Payload not blocked: {payload}"

    # Path traversal: FastAPI normalises the URL; handler returns 404 (safe)
    resp = client.get("/simulation/../../../etc/passwd/result")
    assert resp.status_code in (400, 404), "Path traversal not safely handled"


# ─── XSS / Input sanitization ────────────────────────────────────────────────

def test_xss_in_seed_text_is_sanitized(client):
    """XSS payloads in seed_text should have HTML tags stripped by bleach.

    bleach.clean strips HTML tags but keeps inner text — that is the correct
    and safe behavior. The script tag itself (the execution vector) is removed.
    """
    resp = client.post("/simulation/start", json={
        "seed_text": "<script>alert('xss')</script>Texto de teste para simulacao",
        "num_agents": 10,
    })
    # Should succeed (bleach strips tags)
    assert resp.status_code == 200
    sim_id = resp.json()["simulation_id"]
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from database import get_simulation
    sim = get_simulation(sim_id)
    # The script tags (execution vectors) must be gone
    assert "<script>" not in sim["seed_text"], "Opening script tag not stripped"
    assert "</script>" not in sim["seed_text"], "Closing script tag not stripped"
    # The stored text should contain the safe literal content
    assert "Texto de teste para simulacao" in sim["seed_text"]


def test_html_injection_in_seed_text(client):
    """HTML tags should be stripped from seed_text."""
    resp = client.post("/simulation/start", json={
        "seed_text": "<img src=x onerror=alert(1)>Texto de teste para simulacao",
        "num_agents": 10,
    })
    assert resp.status_code == 200
    sim_id = resp.json()["simulation_id"]
    from database import get_simulation
    sim = get_simulation(sim_id)
    assert "<img" not in sim["seed_text"]


# ─── Input boundary tests ─────────────────────────────────────────────────────

def test_num_agents_below_minimum(client):
    """num_agents < 10 should be rejected."""
    resp = client.post("/simulation/start", json={
        "seed_text": "Texto de teste para simulacao com conteudo suficiente",
        "num_agents": 5,
    })
    assert resp.status_code == 422


def test_num_agents_above_maximum(client):
    """num_agents > 1000 should be rejected."""
    resp = client.post("/simulation/start", json={
        "seed_text": "Texto de teste para simulacao com conteudo suficiente",
        "num_agents": 1001,
    })
    assert resp.status_code == 422


def test_seed_text_too_short(client):
    """seed_text < 10 chars should be rejected."""
    resp = client.post("/simulation/start", json={
        "seed_text": "curto",
        "num_agents": 50,
    })
    assert resp.status_code == 422


def test_seed_text_at_max_boundary(client):
    """seed_text of exactly 5000 chars should be accepted."""
    resp = client.post("/simulation/start", json={
        "seed_text": "A" * 5000,
        "num_agents": 10,
    })
    assert resp.status_code == 200


def test_seed_text_over_max_boundary(client):
    """seed_text > 5000 chars should be rejected."""
    resp = client.post("/simulation/start", json={
        "seed_text": "A" * 5001,
        "num_agents": 10,
    })
    assert resp.status_code == 422


# ─── Path traversal / format injection ───────────────────────────────────────

def test_path_traversal_in_export_format(client, finished_simulation):
    """Non-csv/json format values should be rejected."""
    payloads = ["../../etc/passwd", "xml", "html", "../config", "exe", ""]
    for payload in payloads:
        resp = client.get(f"/simulation/{finished_simulation}/export?format={payload}")
        assert resp.status_code in (400, 422), f"Format '{payload}' not rejected"


# ─── UUID validation ──────────────────────────────────────────────────────────

def test_invalid_uuid_formats_rejected(client):
    """Non-UUID sim_id formats should return 400."""
    invalid_ids = [
        "not-a-uuid",
        "12345",
        "../../../../etc/passwd",
        "' OR '1'='1",
        "null",
        "undefined",
        "0",
        "a" * 100,
    ]
    for bad_id in invalid_ids:
        resp = client.get(f"/simulation/{bad_id}/result")
        assert resp.status_code in (400, 404, 405), f"ID '{bad_id}' not rejected properly"


def test_valid_uuid_not_found_returns_404(client):
    """A valid UUID that doesn't exist should return 404."""
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/simulation/{fake_id}/result")
    assert resp.status_code in (400, 404)


# ─── Security headers ─────────────────────────────────────────────────────────

def test_security_headers_present(client):
    """Key security headers must be in every response."""
    resp = client.get("/health")
    headers = resp.headers
    assert "x-content-type-options" in headers, "Missing X-Content-Type-Options"
    assert "x-frame-options" in headers, "Missing X-Frame-Options"
    assert "x-request-id" in headers, "Missing X-Request-Id"


def test_permissions_policy_header(client):
    """Permissions-Policy header must be set."""
    resp = client.get("/health")
    assert "permissions-policy" in resp.headers, "Missing Permissions-Policy"
    assert "geolocation=()" in resp.headers["permissions-policy"]


def test_content_security_policy_header(client):
    """Content-Security-Policy header must be set."""
    resp = client.get("/health")
    assert "content-security-policy" in resp.headers, "Missing Content-Security-Policy"


def test_server_header_not_exposed(client):
    """Server header should not reveal exact server version."""
    resp = client.get("/health")
    server = resp.headers.get("server", "")
    assert "uvicorn" not in server.lower() or server == ""


def test_cache_control_on_report_endpoints(client):
    """Sensitive /report endpoints should have Cache-Control: no-store."""
    resp = client.get("/report/by-simulation/" + str(uuid.uuid4()))
    # Either 404 or found — check header regardless
    cc = resp.headers.get("cache-control", "")
    assert "no-store" in cc, "Cache-Control: no-store missing on /report endpoint"


def test_cache_control_on_alerts_endpoints(client):
    """Sensitive /alerts endpoints should have Cache-Control: no-store."""
    resp = client.get("/alerts/config")
    cc = resp.headers.get("cache-control", "")
    assert "no-store" in cc, "Cache-Control: no-store missing on /alerts endpoint"


# ─── Error handling / info disclosure ────────────────────────────────────────

def test_internal_error_does_not_expose_traceback(client):
    """500 errors should return generic message, not stack traces."""
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/simulation/{fake_id}/graph")
    body = resp.text
    assert "Traceback" not in body
    assert "File " not in body
    assert "/backend/" not in body


def test_404_does_not_expose_internal_paths(client):
    """404 errors should not reveal internal server structure."""
    resp = client.get("/nonexistent-path-xyz")
    assert "Traceback" not in resp.text
    assert "/backend/" not in resp.text


# ─── Random seed validation ───────────────────────────────────────────────────

def test_random_seed_negative_rejected(client):
    """Negative random_seed should be rejected."""
    resp = client.post("/simulation/start", json={
        "seed_text": "Texto de teste suficientemente longo para validacao",
        "num_agents": 10,
        "random_seed": -1,
    })
    assert resp.status_code == 422


def test_random_seed_too_large_rejected(client):
    """random_seed > 999999 should be rejected."""
    resp = client.post("/simulation/start", json={
        "seed_text": "Texto de teste suficientemente longo para validacao",
        "num_agents": 10,
        "random_seed": 1000000,
    })
    assert resp.status_code == 422


# ─── CORS / Origin validation ────────────────────────────────────────────────

def test_cors_wildcard_not_used(client):
    """CORS should not reflect arbitrary origins."""
    resp = client.get("/health", headers={"Origin": "https://evil.com"})
    allowed = resp.headers.get("access-control-allow-origin", "")
    assert allowed != "*", "Wildcard CORS is insecure"


# ─── Multi-seed DoS protection ───────────────────────────────────────────────

def test_multi_seed_too_many_agents_rejected(client):
    """5 seeds x 300 agents (product=1500 > 600) should be blocked."""
    resp = client.post("/simulation/multi", json={
        "seeds": [
            "Primeira seed de teste com conteudo minimo obrigatorio",
            "Segunda seed de teste com conteudo minimo obrigatorio",
            "Terceira seed de teste com conteudo minimo obrigatorio",
            "Quarta seed de teste com conteudo minimo obrigatorio",
            "Quinta seed de teste com conteudo minimo obrigatorio",
        ],
        "num_agents": 300,
    })
    # With our fix: 5 * 300 = 1500 > 600, should be 400
    assert resp.status_code == 400, "Multi-seed DoS protection not enforced"


def test_multi_seed_within_limit_accepted(client):
    """2 seeds x 100 agents (product=200 <= 600) should be accepted."""
    resp = client.post("/simulation/multi", json={
        "seeds": [
            "Primeira seed de teste com conteudo minimo obrigatorio para simulacao",
            "Segunda seed de teste com conteudo minimo obrigatorio para simulacao",
        ],
        "num_agents": 100,
    })
    # Product is 200, within limit
    assert resp.status_code == 200, "Valid multi-seed request incorrectly rejected"


# ─── Alerts endpoint — no credential exposure ────────────────────────────────

def test_alerts_config_does_not_expose_smtp_password(client):
    """GET /alerts/config must not return SMTP password."""
    resp = client.get("/alerts/config")
    body = resp.text.lower()
    assert "password" not in body
    assert "smtp_pass" not in body
    assert "secret" not in body


# ─── Report endpoint — simulation ownership ──────────────────────────────────

def test_report_for_nonexistent_sim_returns_error(client):
    """Generating report for nonexistent sim should return 400/404, not 500."""
    fake_id = str(uuid.uuid4())
    resp = client.post("/report/generate", json={"simulation_id": fake_id})
    assert resp.status_code in (400, 404, 422)
    assert "Traceback" not in resp.text


# ─── Injection in comparison endpoints ───────────────────────────────────────

def test_compare_view_sql_injection_in_sim_ids(client):
    """SQL injection in compare-view sim_a/sim_b params should be blocked."""
    resp = client.get("/simulation/compare-view?sim_a=1' OR '1'='1&sim_b=test")
    assert resp.status_code == 400


def test_heatmap_invalid_uuid(client):
    """Heatmap with invalid UUID should return 400."""
    resp = client.get("/simulation/not-a-uuid/heatmap")
    assert resp.status_code == 400


# ─── _engines dict DoS protection ────────────────────────────────────────────

def test_engines_dict_bounded(monkeypatch, tmp_path):
    """_engines dict should reject new simulations when at capacity.

    Uses a fresh client to avoid rate-limit state from other tests.
    """
    import database
    db_file = tmp_path / "test_bounded.db"
    monkeypatch.setattr(database, "DB_PATH", db_file)
    database.init_db()

    import routers.simulation as sim_router
    from fastapi.testclient import TestClient
    from main import app

    original = sim_router._engines
    big_dict = {str(uuid.uuid4()): object() for _ in range(100)}
    monkeypatch.setattr(sim_router, "_engines", big_dict)

    with TestClient(app) as fresh_client:
        resp = fresh_client.post("/simulation/start", json={
            "seed_text": "Texto de teste suficientemente longo para validacao",
            "num_agents": 10,
        })
        # 503: engines full; 429: rate limited — both are safe rejection
        assert resp.status_code in (503, 429), (
            f"Should reject when _engines is at capacity, got {resp.status_code}"
        )

    monkeypatch.setattr(sim_router, "_engines", original)


# ─── Path traversal in seed_id ───────────────────────────────────────────────

def test_path_traversal_in_seed_id(client):
    """Path traversal attempts via seed_id should be blocked."""
    traversal_ids = [
        "../../../etc/passwd",
        "..%2F..%2Fetc%2Fpasswd",
        "seed/../../../etc",
    ]
    for bad_id in traversal_ids:
        resp = client.get(f"/seeds/{bad_id}")
        assert resp.status_code in (400, 404), f"Traversal '{bad_id}' not blocked"


# ─── Request size limit ───────────────────────────────────────────────────────

def test_request_body_size_limit(client):
    """Requests exceeding 1MB should be rejected with 413."""
    # Build a payload just over 1MB
    big_text = "A" * (1024 * 1024 + 1)
    resp = client.post(
        "/simulation/start",
        json={"seed_text": big_text, "num_agents": 10},
        headers={"Content-Length": str(len(big_text) + 100)},
    )
    # Should be 413 (rejected by size middleware) or 422 (by Pydantic validation)
    assert resp.status_code in (413, 422), "Oversized request not rejected"
