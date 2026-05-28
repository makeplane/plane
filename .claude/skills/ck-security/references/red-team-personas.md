# Red-Team Personas — ck:security Discovery Loop

Adapted from upstream `/autoresearch:security` adversarial lenses (uditgoenka/autoresearch, MIT).

Each persona represents a distinct attacker mindset. When `--red-team` mode is active, the discovery loop iterates over personas in order. Each iteration assumes the persona's threat model and probes from that lens before moving on.

---

## Persona Catalog (4 personas — faithful to upstream)

### 1. Security Adversary (Primary)

**Mindset:** "I'm a hacker trying to breach this system"

**Threat Model:**

- External attacker with no prior access
- Goal: authentication bypass, data exfiltration, remote code execution
- Assumes knowledge of the tech stack from public signals (headers, error messages, job listings)

**Typical Attack Vectors:**

- Auth bypass via JWT tampering, session fixation, missing CSRF
- Injection: SQL, NoSQL, command, template (SSTI)
- Privilege escalation: IDOR, broken access control, RBAC gaps
- Information disclosure: verbose errors, debug endpoints, PII in responses

**What to Probe:**

- Trace every input from entry point to sink — find missing validation
- Check every parameterized route for IDOR (`:id`, `:slug`, `:uuid`)
- Test JWT: algorithm confusion (`none`/`HS256`→`RS256`), missing expiry, weak secret
- Find unguarded admin routes; check middleware ordering for auth bypass

---

### 2. Supply Chain Attacker

**Mindset:** "I'm compromising dependencies or build pipeline"

**Threat Model:**

- Attacker who cannot breach the app directly but can poison an upstream artifact
- Goal: introduce malicious code via a dependency, CI script, or build artifact
- Assumes partial knowledge of the dependency tree (public package registries)

**Typical Attack Vectors:**

- Known CVEs in direct or transitive dependencies
- Typosquatting / dependency confusion attacks
- Malicious or unmaintained packages with hidden behavior
- Unsigned or unverified CI artifacts, missing integrity checks (SRI, checksums)
- Overly permissive CI/CD permissions (e.g., `write-all` on GitHub Actions)

**What to Probe:**

- Run `npm audit` / `pip audit` / `go vuln` — catalogue every CVE, triage by exploitability
- Check `package.json` / `requirements.txt` for unmaintained packages (last publish > 2 years)
- Review `.github/workflows/` for `permissions: write-all`, `pull_request_target` without trust gates
- Scan Dockerfile and CI scripts for `curl | sh`, unverified `apt-get`, missing checksum verification
- Look for prototype pollution vectors in JS dependency tree

---

### 3. Insider Threat

**Mindset:** "I'm a malicious employee or a compromised internal account"

**Threat Model:**

- Authenticated low-privilege user (e.g., viewer role, read-only API key)
- Goal: escalate privileges, exfiltrate bulk data, cover tracks
- Has legitimate credentials but exceeds authorized scope

**Typical Attack Vectors:**

- Horizontal privilege escalation: user A accessing user B's private resources
- Vertical privilege escalation: viewer→admin via missing role checks
- Bulk data export through legitimate endpoints (no pagination limits, no rate limiting)
- Audit trail gaps: actions that leave no log entry

**What to Probe:**

- Check every admin/privileged endpoint — is authorization enforced server-side or only in UI?
- Look for missing `WHERE user_id = current_user` guards in database queries
- Find any endpoint that returns unbounded lists (no `LIMIT`, no cursor pagination)
- Check audit log coverage: auth events, data exports, config changes — what goes unlogged?
- Test whether deleting or modifying another user's resource returns 403 or silently succeeds

---

### 4. Infrastructure Attacker

**Mindset:** "I'm attacking the deployment, not the application code"

**Threat Model:**

- Attacker who has gained a foothold in the runtime environment (container, VM, CI runner)
- Goal: escape container, pivot to adjacent services, harvest secrets from environment
- May start from a compromised low-privilege container process

**Typical Attack Vectors:**

- Secrets hardcoded in source, committed `.env` files, or leaked via build logs
- Overly permissive container configs: `--privileged`, mounted host paths, `CAP_SYS_ADMIN`
- Exposed internal services (metadata endpoints, health endpoints with sensitive data)
- Network segmentation failures: app container reaching DB directly without firewall
- SSRF enabling access to cloud metadata APIs (AWS `169.254.169.254`, GCP `metadata.google.internal`)

**What to Probe:**

- Scan all config files: `Dockerfile`, `docker-compose.yml`, Kubernetes manifests, Helm charts
- Search for secrets in environment variable handling — are they passed as build args (leaks in image layers)?
- Check for SSRF vectors: any server-side URL fetch without allowlist validation
- Look for `process.env` reads that expose raw env vars in API responses or error messages
- Verify no internal health/debug endpoints are reachable without authentication

---

## Discovery Loop Integration

When `--red-team` flag is active, the audit runs one persona per "phase" before the standard STRIDE/OWASP sweep:

```
Phase 0: Setup (codebase recon, asset map, attack surface — same as one-shot audit)

Phase 1: Security Adversary lens
  → Iterate: select attack vector from this persona's list, probe, log
  → Continue until no new vectors remain for this persona

Phase 2: Supply Chain Attacker lens
  → Focus: dependency tree, CI/CD pipeline, build artifacts

Phase 3: Insider Threat lens
  → Focus: access control gaps, data export paths, audit trails

Phase 4: Infrastructure Attacker lens
  → Focus: deployment config, secrets handling, SSRF, container security

Phase 5: STRIDE/OWASP sweep (standard one-shot audit logic)
  → Fill remaining coverage gaps across OWASP A01–A10 + STRIDE S/T/R/I/D/E

Phase 6: Finding Consolidation + Report
  → Deduplicate across phases, rank by severity, generate report
```

### Iteration Protocol per Persona Phase

Each iteration within a persona phase:

1. **Select** — pick next untested attack vector from persona's list
2. **Assume persona mindset** — reason as that attacker, not as a defender
3. **Probe** — read relevant code, trace data flows, find missing guards
4. **Validate** — construct proof (file:line, attack scenario, impact)
5. **Log** — append to `security-audit-results.tsv` with persona column
6. **Chain** — prior findings compound: if Phase 1 found open endpoint, Phase 3 tests insider bulk-export via that endpoint

### Results Log Extension

When `--red-team` is active, the TSV gains a `persona` column:

```tsv
iteration	persona	vector	severity	owasp	stride	confidence	location	description
1	security-adversary	IDOR	High	A01	EoP	Confirmed	src/api/users.ts:42	GET /api/users/:id no ownership check
2	supply-chain	CVE-2024-1234	High	A06	Tampering	Confirmed	package.json	lodash 4.17.15 prototype pollution
3	insider-threat	bulk-export	Medium	A01	EoP	Likely	src/api/users.ts:80	GET /api/users returns all users, no pagination limit
4	infra-attacker	SSRF	High	A10	T	Confirmed	src/lib/fetch.ts:22	fetch(userInput) no allowlist
```

### Coverage Summary Extension

```
=== Red-Team Coverage (iteration 15) ===
Personas: Security Adversary[✓] Supply Chain[✓] Insider[✓] Infrastructure[partial]
STRIDE Coverage: S[✓] T[✓] R[✗] I[✓] D[✓] E[✓] — 5/6
OWASP Coverage: A01[✓] A02[✗] A03[✓] A04[✗] A05[✓] A06[✓] A07[✓] A08[✗] A09[✗] A10[✓] — 6/10
Findings: 2 Critical, 4 High, 3 Medium, 1 Low
```

---

## Credential Hygiene (Mandatory in All Personas)

Regardless of persona, any finding that references a secret value MUST mask it before logging:

| Pattern                           | Mask Form                                         |
| --------------------------------- | ------------------------------------------------- |
| API keys, JWTs, OAuth tokens      | `<REDACTED_TOKEN>`                                |
| Connection strings with passwords | `protocol://user:<REDACTED_PASSWORD>@host/db`     |
| Environment variable values       | reference var name only: `$DATABASE_URL`          |
| Private keys, certs               | first 8 chars + `<...REDACTED...>` + last 8 chars |

Reject any draft finding containing: a JWT (`eyJ...`), 32+ char hex, AWS key prefixes (`AKIA`, `ASIA`), or known token formats. Re-mask before emitting.

---

## Attribution

Persona catalog and discovery loop pattern adapted from:

- uditgoenka/autoresearch `references/security-workflow.md` § "Red-Team Adversarial Lenses" (MIT License)
- Strix AI-powered security testing platform patterns (via upstream attribution)
