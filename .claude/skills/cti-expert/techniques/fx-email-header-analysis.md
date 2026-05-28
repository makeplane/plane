# fx-email-header-analysis

## Purpose

Parse raw email headers to trace the routing path, verify sender authentication, and flag spoofing or manipulation. Scope is headers only — no body content analysis.

## Quick Reference

| Item       | Detail                                                          |
| ---------- | --------------------------------------------------------------- |
| Command    | /analyze-email                                                  |
| Input      | Pasted raw email header block                                   |
| Output     | Routing trace, auth verdict, anomaly list                       |
| Confidence | HIGH for server-generated fields; LOW for sender-claimed fields |

## Annotated Header Example

```
Received: from mail.attacker.io (HELO legit.bank.com [198.51.100.9])   ← HELO spoofed
        by mx.victim.com with ESMTPS id x7f;
        Mon, 15 Jan 2025 09:14:02 +0000

Received: from webmail.attacker.io ([10.0.0.5])                        ← private IP origin
        by mail.attacker.io with HTTP id y2c;
        Mon, 15 Jan 2025 09:13:55 +0000

Authentication-Results: mx.victim.com;
        spf=fail smtp.mailfrom=attacker.io;                             ← SPF failure
        dkim=none;                                                       ← no signature
        dmarc=fail header.from=legit.bank.com                          ← DMARC fail

From: "Legit Bank Security" <security@legit.bank.com>                  ← display name lie
Return-Path: <bounce@attacker.io>                                      ← mismatch
```

## Methodology

1. Read `Received` chain **bottom-to-top** — oldest hop first, newest (your server) at top
2. Extract originating IP from the lowest `Received` line's bracket value
3. Check HELO name matches the sending IP's reverse DNS — mismatch = suspicious
4. Parse `Authentication-Results` for SPF, DKIM, DMARC — record each as pass/fail/none
5. Compare `Return-Path` domain to `From` domain — divergence flags forwarding or spoofing
6. Calculate per-hop transit time; flag negative deltas or gaps exceeding 24 hours
7. Geolocate originating IP (ipinfo.io); verify timezone in `Date` header plausibly matches
8. Check `Message-ID` format matches claimed sending platform (Gmail IDs differ from Outlook)

## Auth Decision Matrix

| SPF  | DKIM | DMARC | Verdict        |
| ---- | ---- | ----- | -------------- |
| pass | pass | pass  | Authenticated  |
| pass | none | pass  | Acceptable     |
| fail | pass | pass  | Suspicious     |
| fail | fail | fail  | Likely spoofed |
| none | none | none  | Unverifiable   |

## Tools & Fallbacks

| Priority | Tool                      | Install                                   | Notes                             |
| -------- | ------------------------- | ----------------------------------------- | --------------------------------- |
| 1        | MXToolbox Header Analyzer | mxtoolbox.com/EmailHeaders                | Paste-and-parse; free             |
| 2        | Google Admin Toolbox      | toolbox.googleapps.com/apps/messageheader | Visualizes hop timing             |
| 3        | mailheader.org            | mailheader.org                            | Lightweight alternative           |
| 4        | dig / nslookup            | Built-in                                  | Manual SPF/DKIM DNS lookup        |
| 5        | ipinfo.io                 | ipinfo.io                                 | IP geolocation of originating hop |

## Output Format

```
Originating IP: 198.51.100.9 → AS64496 (OVH FR)
HELO Claim:     legit.bank.com [MISMATCH — no reverse DNS match]

Routing (oldest→newest):
  09:13:55Z  webmail.attacker.io (10.0.0.5)  → internal submit
  09:14:02Z  mail.attacker.io                 → +7s normal
  09:14:08Z  mx.victim.com                    → +6s normal

Auth: SPF=fail | DKIM=none | DMARC=fail

Anomalies:
  - From domain (legit.bank.com) ≠ Return-Path domain (attacker.io)
  - No DKIM signature present
  - HELO name does not resolve to sending IP

Verdict: HIGH CONFIDENCE SPOOFING
```

## Limitations

- Early `Received` headers are operator-controlled and can be forged entirely
- NAT hides true internal origin; private IPs reveal topology but not identity
- Greylisting causes legitimate delays that mimic suspicious timing patterns
- Clock skew across mail servers produces false anomalies in timing analysis
- ARC chains (forwarded mail) add complexity; treat preserved auth results cautiously

## Related Techniques

- [fx-http-fingerprint.md](fx-http-fingerprint.md) — server-side header analysis
- [fx-breach-discovery.md](fx-breach-discovery.md) — verify sender address against known exposures
- [fx-network-mapping.md](fx-network-mapping.md) — map sending infrastructure as network finding
