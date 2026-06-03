# Conflict Resolver

Detects, categorizes, and resolves contradictions between findings in a case. Every CONTESTED finding is routed through this module before its subject can reach VERIFIED confidence.

---

## Conflict Types

| Type                  | Description                                             |
| --------------------- | ------------------------------------------------------- |
| `VALUE_MISMATCH`      | Same attribute has irreconcilable values across sources |
| `TIME_IMPOSSIBLE`     | Timeline events cannot coexist chronologically          |
| `EXISTENCE_DISPUTE`   | One source asserts existence; another asserts absence   |
| `CONNECTION_PARADOX`  | Two connections of the same pair are mutually exclusive |
| `LOCATION_IMPOSSIBLE` | Subject cannot occupy two locations within elapsed time |

---

## Severity Levels

| Severity   | Meaning                                                           | Auto-resolve? |
| ---------- | ----------------------------------------------------------------- | ------------- |
| `CRITICAL` | Both conflicting sources have trust_score >= 4; no obvious winner | No            |
| `HIGH`     | Both sources have trust_score >= 3; significant disagreement      | No            |
| `NOTABLE`  | Trust scores differ; lower-trust source is likely wrong           | Possible      |
| `MINOR`    | One source is clearly low-quality (trust_score <= 2)              | Yes           |

---

## Detection

```python
def detect_conflicts(case):
    conflicts = []

    for subject in case["subjects"]:
        conflicts += check_subject_conflicts(subject)

    conflicts += check_connection_paradoxes(case["subjects"], case["connections"])
    conflicts += check_temporal_conflicts(case)
    conflicts += check_location_conflicts(case)

    return [
        {**c, "id": generate_uuid(), "detected_at": now(), "status": "OPEN"}
        for c in conflicts
    ]


def check_subject_conflicts(subject):
    conflicts = []
    attr_map = {}   # attr_name -> list of {finding, value}

    for fnd in subject["findings"]:
        attr = extract_attr(fnd["content"])
        if attr:
            attr_map.setdefault(attr["name"], []).append({"finding": fnd, "value": attr["value"]})

    for attr_name, items in attr_map.items():
        unique_vals = set(normalize_val(i["value"]) for i in items)
        if len(unique_vals) > 1:
            severity = grade_severity(items)
            conflicts.append({
                "type":       "VALUE_MISMATCH",
                "severity":   severity,
                "subject_id": subject["id"],
                "attribute":  attr_name,
                "contested_values": [
                    {
                        "value": v,
                        "sources": [
                            {"finding_id": i["finding"]["id"],
                             "source": i["finding"]["source"],
                             "trust_score": i["finding"].get("trust_score", 1)}
                            for i in items if normalize_val(i["value"]) == v
                        ]
                    }
                    for v in unique_vals
                ],
                "suggestion": suggest_resolution(items),
            })

    return conflicts


def check_connection_paradoxes(subjects, connections):
    conflicts = []

    # Mutually exclusive connection pairs
    MUTEX = {
        "PARENT_OF":  ["CHILD_OF", "PEER_OF"],
        "CONTROLS":   ["WORKS_AT"],   # unusual to both control and work_at same target
    }

    for i, c1 in enumerate(connections):
        exclusions = MUTEX.get(c1["type"], [])
        for c2 in connections[i+1:]:
            if c2["type"] not in exclusions:
                continue
            same_pair = (
                (c1["from_id"] == c2["from_id"] and c1["to_id"] == c2["to_id"]) or
                (c1["from_id"] == c2["to_id"]   and c1["to_id"] == c2["from_id"])
            )
            if same_pair:
                conflicts.append({
                    "type":                "CONNECTION_PARADOX",
                    "severity":            "NOTABLE",
                    "connection_ids":      [c1["id"], c2["id"]],
                    "connection_types":    [c1["type"], c2["type"]],
                    "subjects_involved":   [c1["from_id"], c1["to_id"]],
                    "suggestion": "Verify which connection is accurate; both cannot hold simultaneously",
                })

    return conflicts


def check_temporal_conflicts(case):
    conflicts = []
    events = extract_temporal_events(case)
    events.sort(key=lambda e: e["timestamp"])

    for i, e1 in enumerate(events):
        for e2 in events[i+1:]:
            if e1["subject_id"] != e2["subject_id"]:
                continue
            impossible = is_impossible_sequence(e1, e2)
            if impossible:
                conflicts.append({
                    "type":        "TIME_IMPOSSIBLE",
                    "severity":    "CRITICAL",
                    "subject_id":  e1["subject_id"],
                    "event_a":     {"description": e1["description"], "timestamp": e1["timestamp"],
                                    "finding_id":  e1["finding_id"]},
                    "event_b":     {"description": e2["description"], "timestamp": e2["timestamp"],
                                    "finding_id":  e2["finding_id"]},
                    "reason":      impossible["reason"],
                    "suggestion":  "Verify timestamps; at least one event carries an incorrect date",
                })

    return conflicts


def check_location_conflicts(case):
    conflicts = []
    geo_events = extract_location_events(case)
    geo_events.sort(key=lambda e: e["timestamp"])

    for i, loc1 in enumerate(geo_events):
        for loc2 in geo_events[i+1:]:
            if loc1["subject_id"] != loc2["subject_id"]:
                continue
            elapsed_min = (parse_iso(loc2["timestamp"]) - parse_iso(loc1["timestamp"])).total_seconds() / 60
            travel_min  = min_travel_time(loc1["location"], loc2["location"])
            if elapsed_min < travel_min:
                conflicts.append({
                    "type":       "LOCATION_IMPOSSIBLE",
                    "severity":   "NOTABLE",
                    "subject_id": loc1["subject_id"],
                    "location_a": loc1,
                    "location_b": loc2,
                    "elapsed_min":  elapsed_min,
                    "required_min": travel_min,
                    "suggestion": "One location may be a scheduled post, VPN, or fabricated geotag",
                })

    return conflicts
```

---

## Severity Grading

```python
def grade_severity(items):
    trust_scores = [i["finding"].get("trust_score", 1) for i in items]

    high_trust = [t for t in trust_scores if t >= 4]
    low_trust  = [t for t in trust_scores if t <= 2]

    if len(high_trust) >= 2:
        return "CRITICAL"   # Two strong sources disagree
    mid_trust = [t for t in trust_scores if t >= 3]
    if len(mid_trust) >= 2 and not high_trust:
        return "HIGH"       # Two moderate sources disagree
    if high_trust and low_trust:
        return "MINOR"      # Clear winner from trust differential
    return "NOTABLE"


def suggest_resolution(items):
    trust_scores = [(i["finding"].get("trust_score", 1), i) for i in items]
    best_score, best_item = max(trust_scores, key=lambda x: x[0])
    return (
        f"Prefer value from '{best_item['finding']['source']}' "
        f"(trust_score: {best_score})"
    )
```

---

## Resolution Workflow

```
OPEN ──► assess severity
            │
            ├─► MINOR    ──► auto_resolve()    ──► RESOLVED
            │
            ├─► NOTABLE  ──► propose_resolution() ──► analyst accepts? ──► RESOLVED
            │                                                └─► no ──► ESCALATED
            │
            ├─► HIGH     ──► require_verification() ──► PENDING_VERIFICATION ──► RESOLVED
            │
            └─► CRITICAL ──► require_verification() ──► PENDING_VERIFICATION ──► RESOLVED
```

```python
def route_conflict(conflict):
    if conflict["severity"] == "MINOR":
        return auto_resolve(conflict)
    if conflict["severity"] == "NOTABLE":
        return propose_resolution(conflict)
    return require_verification(conflict)   # CRITICAL or HIGH


def auto_resolve(conflict):
    """For MINOR conflicts: trust score differential is decisive."""
    all_sources = []
    for cv in conflict.get("contested_values", []):
        for s in cv["sources"]:
            all_sources.append({"value": cv["value"], **s})

    best = max(all_sources, key=lambda s: s["trust_score"])

    return {
        **conflict,
        "status":         "RESOLVED",
        "resolution":     "PREFER_TRUST",
        "accepted_value": best["value"],
        "rationale":      f"Auto-resolved: source '{best['source']}' trust_score={best['trust_score']} is decisive",
        "resolved_at":    now(),
    }


def propose_resolution(conflict):
    """For NOTABLE: present ranked options for analyst decision."""
    suggestions = rank_contested_values(conflict["contested_values"])
    return {
        **conflict,
        "status":      "PENDING_ANALYST",
        "suggestions": suggestions,
        "resolved_at": None,
    }


def require_verification(conflict):
    """For CRITICAL: both sources have high trust; external verification required."""
    return {
        **conflict,
        "status":      "PENDING_VERIFICATION",
        "resolution":  "REQUIRES_EXTERNAL_VERIFICATION",
        "rationale":   "Conflicting sources both carry trust_score >= 4; cannot auto-resolve",
        "action":      "Locate primary-source record or contact authoritative body directly",
        "resolved_at": None,
    }


def accept_resolution(conflict_id, accepted_value, rationale):
    conflict = get_conflict(conflict_id)
    conflict["status"]         = "RESOLVED"
    conflict["resolution"]     = "ANALYST_ACCEPTED"
    conflict["accepted_value"] = accepted_value
    conflict["rationale"]      = rationale
    conflict["resolved_at"]    = now()
    apply_resolution(conflict)
    return conflict


def apply_resolution(conflict):
    """Update the subject/finding with the accepted value."""
    if conflict["type"] == "VALUE_MISMATCH":
        subject = get_subject(conflict["subject_id"])
        subject["attributes"][conflict["attribute"]] = conflict["accepted_value"]
        subject["modified_at"] = now()
    # Additional handlers per conflict type...
```

---

## Confidence Adjustment

Unresolved conflicts depress subject confidence. Resolved conflicts may restore or hold it.

```python
RESOLUTION_ADJUSTMENTS = {
    "PREFER_TRUST":                0.0,    # No penalty — trust-based choice is clean
    "ANALYST_ACCEPTED":            0.0,    # Analyst confirmed — clean
    "REQUIRES_EXTERNAL_VERIFICATION": -2.0,  # Strength units: pending verification
    "FLAG_CHALLENGED":             -4.0,   # Explicit challenge marker
}

UNRESOLVED_PENALTIES = {
    "CRITICAL": -3.0,
    "HIGH":     -2.0,
    "NOTABLE":  -1.5,
    "MINOR":    -0.5,
}

def adjust_subject_confidence(subject_id):
    subject   = get_subject(subject_id)
    conflicts = get_conflicts_for(subject_id)

    base_strength = max(
        (compute_strength(f) for f in subject["findings"]),
        default=0.0
    )

    resolved   = [c for c in conflicts if c["status"] == "RESOLVED"]
    unresolved = [c for c in conflicts if c["status"] in ("OPEN", "PENDING_ANALYST",
                                                           "PENDING_VERIFICATION")]

    for c in resolved:
        adj = RESOLUTION_ADJUSTMENTS.get(c.get("resolution", ""), -1.0)
        base_strength += adj

    for c in unresolved:
        penalty = UNRESOLVED_PENALTIES.get(c["severity"], -1.0)
        base_strength += penalty

    base_strength = max(0.0, min(base_strength, 10.0))
    subject["confidence"] = strength_to_confidence(base_strength)
    return subject["confidence"]
```

---

## Commands

```python
/detect-conflicts     [--subject <id>] [--severity CRITICAL|NOTABLE|MINOR]
/show-conflicts       [--status open|resolved|pending]
/show-conflict        <conflict_id>
/resolve-conflict     <conflict_id> --value <accepted> --rationale <text>
/flag-conflict        <finding_id> --contests <other_finding_id>
/ignore-conflict      <conflict_id> --reason <text>
/recheck-conflicts
/export-conflicts     [filename]
```

### Examples

```python
/detect-conflicts --severity CRITICAL
/show-conflicts --status open
/resolve-conflict cfl-001 --value "1982-04-17" --rationale "Birth certificate obtained"
/ignore-conflict cfl-007 --reason "False positive — both values represent different time periods"
/flag-conflict fnd-012 --contests fnd-003
/recheck-conflicts
```

---

## Conflict Report

```python
def build_conflict_report(case):
    conflicts = detect_conflicts(case)

    return {
        "generated_at":    now(),
        "case_id":         case["case_id"],
        "summary": {
            "total":          len(conflicts),
            "by_type":        count_by(conflicts, "type"),
            "by_severity":    count_by(conflicts, "severity"),
            "by_status":      count_by(conflicts, "status"),
            "open_count":     sum(1 for c in conflicts if c["status"] == "OPEN"),
            "critical_count": sum(1 for c in conflicts if c["severity"] == "CRITICAL"),
        },
        "open_conflicts":     [c for c in conflicts if c["status"] == "OPEN"],
        "recent_resolutions": [c for c in conflicts
                               if c["status"] == "RESOLVED"
                               and hours_since(c.get("resolved_at","")) < 24],
        "recommendations":    build_recommendations(conflicts),
    }


def build_recommendations(conflicts):
    open_c = [c for c in conflicts if c["status"] == "OPEN"]
    recs   = []

    if not open_c:
        recs.append("No open conflicts — case consistency is sound")
        return recs

    critical = [c for c in open_c if c["severity"] == "CRITICAL"]
    if critical:
        recs.append(f"Address {len(critical)} CRITICAL conflict(s) before finalizing case")

    temporal = [c for c in open_c if c["type"] == "TIME_IMPOSSIBLE"]
    if temporal:
        recs.append(f"{len(temporal)} timeline conflict(s) require timestamp verification")

    location = [c for c in open_c if c["type"] == "LOCATION_IMPOSSIBLE"]
    if location:
        recs.append(f"{len(location)} location conflict(s): consider VPN/proxy or scheduled posts")

    return recs
```

---

## Visual Output

```
Conflict Report — Target Infrastructure Sweep
═══════════════════════════════════════════════════════════════

Summary:
  Total: 4  |  Open: 2  |  Resolved: 2
  By Severity: CRITICAL: 1  NOTABLE: 2  MINOR: 1
  By Type: VALUE_MISMATCH: 2  TIME_IMPOSSIBLE: 1  LOCATION_IMPOSSIBLE: 1

OPEN CONFLICTS:
──────────────────────────────────────────────────────────────

[CRITICAL] cfl-001 — VALUE_MISMATCH
Subject : org-007 (Target Corp)
Attribute: registration_number
  Value A: 12345678  (Source: Registry A, trust_score: 5)
  Value B: 87654321  (Source: Registry B, trust_score: 5)
Action  : /resolve-conflict cfl-001 after contacting Registry directly

[NOTABLE] cfl-003 — TIME_IMPOSSIBLE
Subject : person-002
  Event A: "Started at Target Corp"   2021-06-01  (fnd-018)
  Event B: "University graduation"    2022-05-20  (fnd-019)
  Claim  : "3 years experience" in 2023 post
Action  : /show-conflict cfl-003 | /resolve-conflict cfl-003

──────────────────────────────────────────────────────────────

RECOMMENDATIONS:
  - Address 1 CRITICAL conflict before reporting
  - 1 timeline conflict needs timestamp verification
  - Run /recheck-conflicts after adding new findings
```
