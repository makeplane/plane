# fx-http-fingerprint

## Purpose

Identify web server software, CDN provider, WAF presence, and security posture from HTTP response headers. Findings reveal infrastructure stack without active exploitation.

## Quick Reference

| Item       | Detail                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Command    | /http-fingerprint                                                      |
| Input      | Target domain or IP address                                            |
| Output     | Server fingerprint report with WAF detection and security header audit |
| Confidence | HIGH for direct header values; MEDIUM for inferred stack versions      |

## Fingerprint Signal Map

| Header                     | What It Reveals                               | Forgeable |
| -------------------------- | --------------------------------------------- | --------- |
| `Server`                   | Web server type and version                   | Yes       |
| `X-Powered-By`             | Backend language/framework                    | Yes       |
| `Via`                      | Proxy or CDN hop chain                        | Partial   |
| `X-Cache`                  | CDN cache status (HIT/MISS)                   | Partial   |
| `X-Forwarded-For`          | Original client IP through proxy              | Yes       |
| `Set-Cookie` name patterns | Application framework (PHPSESSID, JSESSIONID) | Yes       |
| `X-AspNet-Version`         | ASP.NET version                               | Yes       |
| `CF-Ray`                   | Cloudflare presence                           | No        |
| `X-Amz-Cf-Id`              | AWS CloudFront presence                       | No        |
| `x-ms-request-id`          | Azure presence                                | No        |

## WAF Detection Indicators

| Vendor            | Header Signature                           |
| ----------------- | ------------------------------------------ |
| Cloudflare        | `CF-Ray`, `cf-cache-status`                |
| AWS WAF           | `X-Amzn-RequestId` + 403 body              |
| Imperva Incapsula | `X-Iinfo`, `visid_incap_` cookie           |
| Akamai            | `X-Check-Cacheable`, `X-Akamai-Request-ID` |
| F5 BIG-IP         | `X-Cnection`, `BIGipServer` cookie         |
| Sucuri            | `X-Sucuri-ID`, `x-sucuri-cache`            |

## Methodology

1. Fetch headers with verbose output: `curl -sI -A "Mozilla/5.0" https://target.com`
2. Record all response headers — note both presence and absence
3. Check `Server` and `X-Powered-By` for software and version strings
4. Inspect cookie names in `Set-Cookie` — map to known framework patterns
5. Cross-reference WAF indicator table above; if WAF present, note vendor
6. Audit security header presence: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
7. Probe error responses (non-existent path) — different servers produce distinct 404 formats; WAFs often return 403 with vendor body
8. Record TTL/cache headers for CDN confirmation; check `Age` and `X-Cache` consistency

## Tools & Fallbacks

| Priority | Tool                | Install                                        | Notes                                         |
| -------- | ------------------- | ---------------------------------------------- | --------------------------------------------- |
| 1        | curl                | Built-in                                       | `curl -sI` for header-only sweep              |
| 2        | whatweb             | `apt install whatweb`                          | Fingerprints CMS, server, frameworks          |
| 3        | wafw00f             | `pip3 install wafw00f`                         | Dedicated WAF detection                       |
| 4        | httpx               | `go install github.com/projectdiscovery/httpx` | Bulk header sweep                             |
| 5        | Shodan              | shodan.io                                      | Historical banner data without direct contact |
| 6        | securityheaders.com | Browser                                        | Security header audit with grading            |

## Output Format

```
Target: https://example.com

Server Stack:
  Server:        nginx/1.24.0
  X-Powered-By:  PHP/8.2.1
  Framework:     Laravel (laravel_session cookie)

CDN / WAF:
  WAF Detected:  Cloudflare (CF-Ray: 8a3f2b1c4d5e6f70-IAD)
  CDN:           Cloudflare (cf-cache-status: HIT)

Security Headers:
  HSTS:          present (max-age=31536000)
  CSP:           ABSENT
  X-Frame-Options: present (SAMEORIGIN)
  X-Content-Type: present
  Referrer-Policy: ABSENT

Error Page Fingerprint: nginx default 404 (not WAF-intercepted)
```

## Limitations

- Headers are operator-configurable; `Server` and `X-Powered-By` are routinely falsified or suppressed
- WAF detection by headers alone misses transparent in-line WAFs with no header injection
- CDN presence obscures true origin server location and real IP
- Version numbers in headers may lag actual patched version
- Rate limiting or IP blocking may prevent sweep completion on hardened targets

## Related Techniques

- [fx-email-header-analysis.md](fx-email-header-analysis.md) — email header analysis (different protocol layer)
- [fx-network-mapping.md](fx-network-mapping.md) — build infrastructure map from fingerprint findings
- [fx-leak-monitoring.md](fx-leak-monitoring.md) — monitor for version exposure in public commits
