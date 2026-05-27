# microsoft-tenant-recon

## Purpose

Unauthenticated Microsoft 365 / Azure tenant enumeration from a bare domain. Surfaces tenant ID, federation posture, SharePoint/Azure App Service presence, and Microsoft Defender for Identity (MDI) footprint — identity-layer intel that DNS/WHOIS recon misses.

## Quick Reference

| Item                    | Detail                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Command                 | `/msftrecon [domain]`                                                                                            |
| Input                   | Domain hosted (even partially) on Microsoft 365                                                                  |
| Output                  | Tenant name + ID (GUID), federation type, brand, cloud instance, MDI/SharePoint/Azure flags                      |
| Confidence              | HIGH for server-returned fields (tenant ID, openid-configuration); MEDIUM for heuristic checks (MDI, SharePoint) |
| Auto-fires (in `/case`) | When domain MX ends in `protection.outlook.com` OR SPF contains `spf.protection.outlook.com`                     |
| Severity                | MEDIUM (tenant intel) · HIGH if MDI absent (indicates weaker identity-threat detection posture)                  |

## Methodology

1. Pre-check MX + SPF to confirm M365 hosting; skip tool if no match (no wasted calls).
2. Run `msftrecon -d {domain} -j` — JSON output for easy parsing into the finding registry.
3. Enumerate the 7 endpoints below; record success/failure per endpoint as evidence chain entries.
4. Derive cloud instance: commercial (`microsoftonline.com`) / US gov (`microsoftonline.us`) / China (`microsoftonline.cn`).
5. Capture tenant ID (GUID) — pivot seed for `/branch` in Enrich phase (map other domains under the same tenant).
6. Log federation type; if `Federated`, flag the federation provider (AD FS, Okta, Ping, etc.) as a SAML/IdP attack surface for `/threat-model`.
7. Flag MDI absence as elevated risk; tenant without Defender for Identity → weaker credential-theft detection.

## Endpoints Queried

| #   | Endpoint                                                                           | Purpose                                                                                     |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | `https://login.microsoftonline.com/getuserrealm.srf?login=user@{domain}&json=1`    | Federation type (Managed / Federated / Unknown), brand name, federation provider            |
| 2   | `https://login.microsoftonline.com/{domain}/v2.0/.well-known/openid-configuration` | Tenant ID (GUID) via `issuer` field, authorization/token endpoints, cloud instance          |
| 3   | `https://{tenant}.sharepoint.com`                                                  | SharePoint tenant existence (401/403 = present, 404 = absent)                               |
| 4   | `https://{tenant}.azurewebsites.net`                                               | Azure App Service tenant existence                                                          |
| 5   | DNS MX / TXT                                                                       | M365 indicators (`protection.outlook.com`, `spf.protection.outlook.com`, `MS=ms…`)          |
| 6   | Autodiscover CNAME (`autodiscover.{domain}`)                                       | Exchange config trail; often points to `autodiscover.outlook.com` for M365                  |
| 7   | MDI heuristic (tenant DNS probe)                                                   | Microsoft Defender for Identity instance — looks up `{tenant}.atp.azure.com` / sensor names |

## Output Fields to Capture

- **Tenant name** — friendly tenant prefix (e.g., `contoso`)
- **Tenant ID (GUID)** — unique Azure identifier
- **Federation type** — `Managed` · `Federated` · `Unknown`
- **Federation provider** — if Federated (AD FS / Okta / Ping / …)
- **Brand name** — tenant display name
- **Cloud instance** — `microsoftonline.com` · `microsoftonline.us` (gov) · `microsoftonline.cn`
- **MDI present** — Yes / No (heuristic)
- **SharePoint accessible** — Yes / No
- **Azure App Service exists** — Yes / No
- **Autodiscover CNAME target** — hostname string

## Tools & Fallbacks

1. **Primary:** `msftrecon -d {domain} -j` (JSON; auto-installed via `pip install git+https://github.com/Arcanum-Sec/msftrecon.git`).
2. **Fallback 1 — direct curl (trivial to script):**
   ```bash
   curl -s "https://login.microsoftonline.com/getuserrealm.srf?login=user@{domain}&json=1"
   curl -s "https://login.microsoftonline.com/{domain}/v2.0/.well-known/openid-configuration"
   curl -I "https://{tenant}.sharepoint.com"
   curl -I "https://{tenant}.azurewebsites.net"
   ```
3. **Fallback 2 — manual DNS:** `dig MX {domain}`, `dig TXT {domain}`, `dig CNAME autodiscover.{domain}`.

## CLI Variants

| Flag          | Purpose                                     |
| ------------- | ------------------------------------------- |
| `-d {domain}` | Target domain                               |
| `-j`          | JSON output (mandatory for `/case` parsing) |
| `--gov`       | US government cloud (`microsoftonline.us`)  |
| `--cn`        | China cloud (`microsoftonline.cn`)          |

## Integration into `/case`

- **Trigger:** Acquire phase. Auto-fires when domain MX ends in `protection.outlook.com` OR SPF TXT contains `spf.protection.outlook.com`. No user flag required.
- **Finding type:** `infrastructure`.
- **Severity:** MEDIUM by default. Escalate to HIGH when `MDI present = No` (weaker detection posture) or federation provider is an unpatched / EOL IdP.
- **Pivots fed to Enrich phase:**
  - **Tenant ID → `/branch`** — query for other domains under the same tenant (shared org footprint).
  - **Federation provider → `/threat-model`** — maps IdP as SSO attack surface.
  - **SharePoint URL → `/sweep`** — can surface public sites/documents.

## Limitations

- Only covers M365-hosted domains — roughly 50% of enterprise, but 0% of Google Workspace / self-hosted mail.
- Federation detection can be obscured by tenant-side config (home realm discovery policies, conditional access).
- MDI detection is heuristic — false negatives are possible when tenants use non-default sensor naming.
- No auth = no deep IAM / Entra ID graph data; pair with `techniques/cloud-audit.md` if target engagement has authorized access.

## Related Techniques

- `techniques/cloud-audit.md` — account-level AWS/GCP/Azure audit (complementary, needs creds).
- `techniques/fx-email-header-analysis.md` — SPF/DKIM/DMARC overlap; the same MX/SPF signals that trigger msftrecon also drive email-auth verdicts.
- `techniques/domain-advanced.md` — subdomain enumeration; SharePoint/Azure subdomains often surface here too.
- `techniques/fx-dns-cert-history.md` — historical MX/TXT changes reveal M365 migration events and prior tenant IDs.
