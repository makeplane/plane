# AgentFlow Enrichment Orchestration

> **Module ID:** AF-ENR-001
> **Version:** 1.0.0
> **Phase:** Enhancement Module
> **Classification:** Parallel Enrichment Orchestration

---

## 1. Overview

AgentFlow provides DAG-based orchestration for parallel enrichment of discovered identifiers. When `/case` or `/sweep` discovers multiple subjects, AgentFlow fans out enrichment commands and merges results.

**Scope:** Enrich phase ONLY. Acquire (sequential), Assess (mutable state), Deliver (sequential) remain unchanged.

---

## 2. When to Use

- 3+ subjects discovered during Acquire phase → auto-enable
- Multiple independent enrichment paths (email→breach, domain→subdomain, etc.)
- Single-subject cases: skip AgentFlow, run enrichment sequentially (overhead > gain)

---

## 3. Installation

```bash
pip3 install agentflow-py
# Deps: FastAPI, Pydantic, boto3 (lightweight, ~20MB total)
```

---

## 4. Enrichment DAG Pattern

```
                    ┌─ /email-deep email1 ──┐
   Acquired         │                       │
   Findings    ─────┼─ /breach-deep email2 ─┼──── Merge + Dedup ──── Enriched
   (subjects)       │                       │     Findings
                    ├─ /username handle1 ───┤
                    │                       │
                    └─ /subdomain domain1 ──┘
```

Conceptual flow for `/case` pipeline:

```python
# After Acquire phase discovers subjects:
subjects = [
    {"type": "email", "value": "target@domain.com", "enrich_with": "/email-deep"},
    {"type": "email", "value": "target@domain.com", "enrich_with": "/breach-deep"},
    {"type": "domain", "value": "target.com", "enrich_with": "/subdomain"},
    {"type": "username", "value": "targetuser", "enrich_with": "/username"},
]

# AgentFlow fans out:
# - /email-deep target@domain.com    ─┐
# - /breach-deep target@domain.com   ─┼─ run in parallel
# - /subdomain target.com            ─┤
# - /username targetuser             ─┘
#                                     │
#                              merge + dedup
#                                     │
#                              enriched findings
```

---

## 5. Integration with /case Command

**Current /case flow (sequential):**

```
Acquire → Enrich (one-by-one) → Assess → Deliver
```

**Enhanced /case flow (parallel enrichment):**

```
Acquire → [AgentFlow fanout enrichment] → Assess → Deliver
```

**Trigger conditions:**

- Auto-enable when Acquire phase discovers 3+ unique subjects
- Skip for single-subject investigations (overhead > benefit)
- User can force with `/case --parallel` or disable with `/case --sequential`

---

## 6. Enrichment Command Mapping

| Subject Type | Enrichment Commands                                 | Parallelizable    |
| ------------ | --------------------------------------------------- | ----------------- |
| Email        | /email-deep, /breach-deep, /proton-check            | Yes (independent) |
| Domain       | /subdomain, /dns-history, /cert-history, /techstack | Yes               |
| Username     | /username (maigret/sherlock)                        | Yes (I/O bound)   |
| Phone        | /phone                                              | Yes               |
| IP           | /threat-check                                       | Yes               |
| Person       | /query (Google dorks)                               | Yes               |

---

## 7. Merge Strategy

After parallel enrichment completes:

1. Collect all findings from parallel branches
2. Deduplicate by `(subject, finding_type, source)` tuple
3. Resolve conflicts: higher trust score wins
4. Feed merged findings into Assess phase (`/exposure`, `/validate`)

---

## 8. Concurrency Limits

| Environment        | Max Concurrent | Rationale                          |
| ------------------ | -------------- | ---------------------------------- |
| Local (default)    | 4              | Avoid rate limiting on free APIs   |
| With rate limiting | 8              | If per-API rate limits handled     |
| EC2 (future)       | 16             | Remote execution, higher bandwidth |

---

## 9. Where AgentFlow Fits (and Doesn't)

| AEAD Phase  | AgentFlow? | Reason                                                    |
| ----------- | ---------- | --------------------------------------------------------- |
| **Acquire** | NO         | Sequential user-driven collection; no parallelism benefit |
| **Enrich**  | **YES**    | Multiple independent pivot expansions can run in parallel |
| **Assess**  | NO         | Findings are mutable during scoring; merge logic fragile  |
| **Deliver** | NO         | Sequential report generation; no parallelism benefit      |

---

## 10. Limitations

- AgentFlow 0.1.0 — pre-stable, breaking changes possible
- Pin version: `agentflow-py==0.1.0`
- Enrichment commands must have deterministic outputs (no shared state mutation)
- Network-bound: parallelism gains capped by API rate limits
- Single-subject cases gain nothing — skip orchestration

---

## 11. Fallback

If AgentFlow unavailable or errors:

- Fall back to sequential enrichment (current behavior)
- Log: `[enrichment-sequential-fallback]` in collection method
- No investigation impact — just slower
