# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.2.x   | ✅ |
| < 1.2   | ❌ |

## Reporting a Vulnerability

**Do NOT open public GitHub issues for security vulnerabilities.**

To report a vulnerability:
1. Go to the **Security** tab of this repository
2. Click **"Report a vulnerability"** (GitHub private advisory)
3. Provide: description, reproduction steps, impact assessment, suggested fix (if any)

We will respond within **72 hours** and aim to patch critical vulnerabilities within **7 days**.

## Security Design

- All inputs sanitized with `bleach` (XSS prevention)
- Parameterized SQL queries only (no string formatting in queries)
- Rate limiting on all endpoints via `slowapi`
- UUID validation on all resource identifiers
- CORS restricted to known frontend origin
- Security headers on all responses (CSP, HSTS, X-Frame-Options, etc.)
- No credentials stored in database
- No authentication system — all simulations are public by design (open research tool)

## Known Limitations

- **No authentication**: Any UUID-bearing request can access any simulation. This is by design for an open research tool.
- **Free tier deployment**: Backend may hibernate between requests (Render free plan).
