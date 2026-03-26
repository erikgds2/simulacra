"""
Alert manager — envia e-mail quando score de risco ultrapassa limiar.

Credenciais SMTP exclusivamente via variáveis de ambiente:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
A configuração de alerta (threshold + email) é mantida em memória
(nunca persistida em banco) para proteger dados sensíveis.
"""
import logging
import os
import re
import smtplib
from dataclasses import dataclass, field
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger("simulacra.alerts")

_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")

# Armazenamento em memória — não persiste entre reinicializações
_config: dict = {
    "enabled": False,
    "recipient_email": None,
    "threshold": 70,
}


@dataclass
class AlertConfig:
    recipient_email: str
    threshold: int = 70  # 0-100
    enabled: bool = True


def set_alert_config(recipient_email: str, threshold: int) -> None:
    """Configura alerta em memória. Valida e-mail e limiar."""
    if not _EMAIL_RE.match(recipient_email):
        raise ValueError("E-mail inválido")
    if not (0 <= threshold <= 100):
        raise ValueError("threshold deve estar entre 0 e 100")
    _config["recipient_email"] = recipient_email
    _config["threshold"] = threshold
    _config["enabled"] = True
    logger.info(f"Alerta configurado: threshold={threshold}, destino={recipient_email}")


def get_alert_config() -> dict:
    return dict(_config)


def disable_alert() -> None:
    _config["enabled"] = False
    _config["recipient_email"] = None
    logger.info("Alerta desativado")


def _smtp_configured() -> bool:
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_USER") and os.getenv("SMTP_PASS"))


def send_alert_email(sim_id: str, seed_text: str, risk_score: int, risk_label: str) -> bool:
    """
    Envia e-mail de alerta se configurado e score >= threshold.
    Retorna True se e-mail foi enviado, False caso contrário.
    """
    if not _config.get("enabled") or not _config.get("recipient_email"):
        return False
    if risk_score < _config["threshold"]:
        return False
    if not _smtp_configured():
        logger.warning("SMTP não configurado — alerta ignorado (defina SMTP_HOST, SMTP_USER, SMTP_PASS)")
        return False

    recipient = _config["recipient_email"]
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASS", "")
    sender = os.getenv("SMTP_FROM", user)

    subject = f"[Simulacra] Alerta de risco {risk_label} (score {risk_score})"
    body_html = f"""
<html><body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto">
<h2 style="color:#dc2626">⚠️ Alerta de desinformação — Score {risk_score} ({risk_label})</h2>
<p>Uma simulação ultrapassou o limiar de risco configurado ({_config['threshold']}).</p>
<table style="border-collapse:collapse;width:100%">
  <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Simulação</td>
      <td style="padding:8px;border:1px solid #e5e7eb">{sim_id[:12]}...</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Score de risco</td>
      <td style="padding:8px;border:1px solid #e5e7eb;color:#dc2626;font-weight:700">{risk_score} / 100 — {risk_label}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600">Seed</td>
      <td style="padding:8px;border:1px solid #e5e7eb">{seed_text[:200]}</td></tr>
</table>
<p style="margin-top:24px;color:#6b7280;font-size:12px">
  Enviado por Simulacra · <a href="https://github.com/erikgds2/simulacra">github.com/erikgds2/simulacra</a>
</p>
</body></html>
"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = recipient
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        with smtplib.SMTP(host, port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(user, password)
            server.sendmail(sender, recipient, msg.as_string())

        logger.info(f"Alerta enviado para {recipient} — sim={sim_id[:8]}, score={risk_score}")
        return True
    except Exception as e:
        logger.error(f"Falha ao enviar alerta: {e}")
        return False
