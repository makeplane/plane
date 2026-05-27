# fx-leak-monitoring

## Purpose

Establish ongoing visibility into new credential exposures, config leaks, and data dumps targeting a specific subject, domain, or organization. Distinct from point-in-time discovery — this technique is about continuous alerting.

## Quick Reference

| Item       | Detail                                                                |
| ---------- | --------------------------------------------------------------------- |
| Command    | /leak-monitor                                                         |
| Input      | Domain, organization name, or email pattern                           |
| Output     | Alert configuration plan + immediate findings                         |
| Confidence | HIGH for confirmed indexed content; LOW for unverified paste snippets |

## Methodology

1. Run immediate baseline sweep (see [fx-breach-discovery.md](fx-breach-discovery.md) for procedure)
2. Configure Google Alerts for persistent surface monitoring:
   - `"domain.com" site:pastebin.com`
   - `"orgname" "database dump"`
   - `"orgname" "credentials"`
3. Set HIBP notification subscription for the subject's email domains
4. Configure GitHub code search saved alerts: `org:targetorg "password"`, `org:targetorg filename:.env`
5. Deploy automated scanner on known repositories using TruffleHog (continuous mode) or Gitleaks in CI hooks
6. Schedule weekly manual paste site sweeps (psbdmp.ws, pastebinsearch.com) for domain terms
7. On alert trigger: verify finding authenticity (check for test data, placeholders, revoked credentials)
8. For confirmed findings: log timestamp, source URL, data class, estimated exposure window; escalate per case protocol

## Alert Sources

| Source                           | Coverage                  | Setup Cost   | Latency                      |
| -------------------------------- | ------------------------- | ------------ | ---------------------------- |
| HIBP email notifications         | Breach databases          | Free signup  | Hours to days after indexing |
| Google Alerts                    | Paste sites, public web   | Free         | 1–24 hours                   |
| GitHub code search notifications | Public repos              | Free         | Near-real-time               |
| TruffleHog continuous            | Git commit streams        | Tool install | Per-commit                   |
| IntelligenceX alerts             | Dark web pastes           | Paid         | Hours                        |
| Shodan Monitor                   | Internet-exposed services | Paid         | Continuous                   |

## Tools & Fallbacks

| Priority | Tool               | Install                       | Notes                                             |
| -------- | ------------------ | ----------------------------- | ------------------------------------------------- |
| 1        | TruffleHog         | `pip3 install trufflehog`     | Best for repo scanning; validates secrets as live |
| 2        | Gitleaks           | `brew install gitleaks`       | Fast; CI-friendly                                 |
| 3        | HaveIBeenPwned API | haveibeenpwned.com/API        | Programmatic breach lookup                        |
| 4        | Google Alerts      | alerts.google.com             | No install; covers indexed paste sites            |
| 5        | detect-secrets     | `pip3 install detect-secrets` | High-entropy detection baseline                   |
| 6        | Shodan Monitor     | shodan.io/monitor             | Covers exposed services, not credential dumps     |

## False Positive Triage

Before escalating any finding, verify:

- Is the exposed value a placeholder (`your-api-key-here`, `CHANGEME`)?
- Is the file a test fixture or documentation example?
- Has the credential already been rotated (test API validity carefully and only with permission)?
- Is the paste date-stamped well before the subject's known involvement?

If any check passes → log as LOW, monitor for confirmation.

## Output Format

```
Monitor Target: acme-corp.com

Alert Configuration:
  HIBP: active (acme-corp.com domain)
  Google Alerts: 3 queries active
  GitHub: org:acmecorp saved search (password, .env, api_key)
  TruffleHog: scheduled nightly on github.com/acme-corp/*

Current Findings (baseline sweep):
  Source: pastebin.com/xYz123 (indexed 2025-02-14)
  Data:   acme-corp.com email list + MD5 hashes (127 records)
  Status: UNVERIFIED — pending hash sample check

Next Review: 2026-04-07
```

## Limitations

- Deleted paste content may not be archived; ephemeral findings require immediate capture
- GitHub private repositories are not accessible; only public commits are swept
- Automated scanners produce false positives — human triage required before escalation
- Dark web sources require paid tooling or direct access
- Alert latency means exposure may be hours or days old when notification arrives

## Related Techniques

- [fx-breach-discovery.md](fx-breach-discovery.md) — point-in-time breach sweep (run before monitoring setup)
- [fx-http-fingerprint.md](fx-http-fingerprint.md) — monitor for exposed version headers as attack surface
- [fx-network-mapping.md](fx-network-mapping.md) — correlate exposed infrastructure with network topology
