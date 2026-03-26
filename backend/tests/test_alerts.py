"""Tests for alert_manager — without actual SMTP calls."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import agents.alert_manager as am


def setup_function():
    """Reset config before each test."""
    am._config["enabled"] = False
    am._config["recipient_email"] = None
    am._config["threshold"] = 70


def test_set_valid_config():
    am.set_alert_config("test@example.com", 60)
    cfg = am.get_alert_config()
    assert cfg["enabled"] is True
    assert cfg["recipient_email"] == "test@example.com"
    assert cfg["threshold"] == 60


def test_invalid_email_raises():
    try:
        am.set_alert_config("not-an-email", 50)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "inválido" in str(e).lower() or "invalid" in str(e).lower()


def test_threshold_out_of_range():
    try:
        am.set_alert_config("a@b.com", 150)
        assert False, "Should have raised ValueError"
    except ValueError:
        pass


def test_disable_alert():
    am.set_alert_config("a@b.com", 50)
    am.disable_alert()
    cfg = am.get_alert_config()
    assert cfg["enabled"] is False
    assert cfg["recipient_email"] is None


def test_no_email_when_score_below_threshold():
    am.set_alert_config("a@b.com", 80)
    # Score 40 < threshold 80 — should return False without trying SMTP
    result = am.send_alert_email("sim-id", "seed text here", 40, "Baixo")
    assert result is False


def test_no_email_when_disabled():
    am._config["enabled"] = False
    result = am.send_alert_email("sim-id", "seed text here", 95, "Crítico")
    assert result is False
