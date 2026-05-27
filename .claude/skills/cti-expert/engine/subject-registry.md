# Subject Registry

Manages the full lifecycle of case subjects: normalization, registration, querying, modification, archival, and graph traversal. All operations enforce deduplication before writing.

---

## Normalization

Values are normalized before any registry operation. Normalization is type-specific and idempotent.

```python
NORMALIZATION_RULES = {
    "EMAIL":        lambda v: v.lower().strip(),
    "DOMAIN":       lambda v: v.lower().strip().lstrip("www."),
    "USERNAME":     lambda v: v.lower().strip(),
    "NETWORK_ADDR": lambda v: v.strip(),           # IPv6 expansion handled separately
    "PHONE":        lambda v: re.sub(r'\D', '', v),
    "INDIVIDUAL":   lambda v: title_case(v.strip()),
    "URL":          lambda v: urlparse(v).geturl().lower(),
}

def normalize(subject_type, value):
    rule = NORMALIZATION_RULES.get(subject_type)
    return rule(value) if rule else value.strip()
```

---

## Registration

```python
# Command
/register <type> <value> [options]

# Options
--confidence  VERIFIED|STRONG|MODERATE|WEAK|TENTATIVE
--source      <description>
--alias       <name>
--attr        <key>=<value>
--note        <text>
--origin      <subject_id>

# Examples
/register EMAIL analyst@target.org --confidence STRONG --source "WHOIS record"
/register INDIVIDUAL "Maria Santos" --alias "msantos" --attr nationality=BR
```

```python
def register_subject(subject_type, value, opts):
    normalized = normalize(subject_type, value)

    # Deduplication gate
    dup = find_duplicate(subject_type, normalized, opts.get("aliases", []))
    if dup:
        return merge_or_flag(dup, normalized, opts)

    subject = {
        "id":             generate_uuid(),
        "type":           subject_type,
        "value":          normalized,
        "display_name":   opts.get("display_name", normalized),
        "aliases":        opts.get("aliases", []),
        "attributes":     opts.get("attrs", {}),
        "confidence":     opts.get("confidence", "MODERATE"),
        "findings":       [build_finding(opts)] if opts.get("source") else [],
        "status":         "ACTIVE",
        "first_observed": now(),
        "last_observed":  now(),
        "created_at":     now(),
        "modified_at":    now(),
        "revision":       1,
        "origin_subjects": opts.get("origins", []),
        "tags":           opts.get("tags", []),
    }

    case.subjects.append(subject)

    # Auto-form connections when origins provided
    for origin_id in subject["origin_subjects"]:
        form_connection(origin_id, subject["id"], "CITES",
                        findings=subject["findings"])

    ledger("SUBJECT_ADDED", subject_id=subject["id"])
    return subject
```

---

## Query

```python
# Commands
/lookup   <id_or_value>
/find     [filters]

# Filters for /find
--type        <type>
--confidence  <level>
--tag         <tag>
--status      <status>
--linked-to   <subject_id>
--has-finding
--no-finding

# Examples
/lookup analyst@target.org
/find --type DOMAIN --confidence STRONG
/find --linked-to <uuid> --type EMAIL
```

```python
def lookup_subject(id_or_value):
    # UUID match first
    result = case.find_subject(id=id_or_value)
    if result:
        return result

    # Exact value or alias match
    result = case.find_subject(
        lambda s: s["value"] == id_or_value
               or id_or_value in s["aliases"]
    )
    if result:
        return result

    # Fuzzy fallback
    return fuzzy_search(id_or_value)


def find_subjects(filters):
    results = list(case.subjects)

    if filters.get("type"):
        results = [s for s in results if s["type"] == filters["type"]]
    if filters.get("confidence"):
        results = [s for s in results if s["confidence"] == filters["confidence"]]
    if filters.get("tag"):
        results = [s for s in results if filters["tag"] in s["tags"]]
    if filters.get("status"):
        results = [s for s in results if s["status"] == filters["status"]]
    if filters.get("linked_to"):
        results = [s for s in results if is_connected(s["id"], filters["linked_to"])]
    if filters.get("has_finding"):
        results = [s for s in results if s["findings"]]
    if filters.get("no_finding"):
        results = [s for s in results if not s["findings"]]

    return results
```

---

## Update

```python
# Command
/modify <id_or_value> [changes]

# Change flags
--value         <new>
--add-alias     <alias>
--remove-alias  <alias>
--attr          <key>=<value>
--remove-attr   <key>
--confidence    <level>
--status        <status>
--note          <text>
--reason        <text>
--add-tag       <tag>
--remove-tag    <tag>

# Examples
/modify analyst@target.org --confidence VERIFIED --add-alias "m.santos"
/modify <uuid> --status VERIFIED
```

```python
def modify_subject(id_or_value, changes):
    subject = lookup_subject(id_or_value)
    if not subject:
        raise NotFoundError(id_or_value)

    # Snapshot prior revision
    prior = {
        "revision":      subject["revision"],
        "modified_at":   subject["modified_at"],
        "change_reason": changes.get("reason", ""),
        "changes":       []
    }
    subject.setdefault("prior_revisions", []).append(prior)

    changelog = []

    if "value" in changes:
        new_val = normalize(subject["type"], changes["value"])
        changelog.append({"field": "value", "old": subject["value"], "new": new_val})
        subject["value"] = new_val

    if "add_alias" in changes:
        alias = changes["add_alias"]
        if alias not in subject["aliases"]:
            subject["aliases"].append(alias)
            changelog.append({"field": "aliases", "action": "add", "value": alias})

    if "remove_alias" in changes:
        subject["aliases"] = [a for a in subject["aliases"] if a != changes["remove_alias"]]

    if "attr" in changes:
        k, v = changes["attr"].split("=", 1)
        old = subject["attributes"].get(k)
        subject["attributes"][k] = v
        changelog.append({"field": f"attributes.{k}", "old": old, "new": v})

    if "confidence" in changes:
        changelog.append({"field": "confidence", "old": subject["confidence"], "new": changes["confidence"]})
        subject["confidence"] = changes["confidence"]

    if "status" in changes:
        changelog.append({"field": "status", "old": subject["status"], "new": changes["status"]})
        subject["status"] = changes["status"]

    subject["modified_at"] = now()
    subject["revision"] += 1
    prior["changes"] = changelog

    ledger("SUBJECT_MODIFIED", subject_id=subject["id"], changes=changelog)
    return subject
```

---

## Archive

Archival is non-destructive. Subjects are marked ARCHIVED and optionally cascade to connections.

```python
# Command
/archive-subject <id_or_value> [--cascade]

# Examples
/archive-subject analyst@target.org
/archive-subject <uuid> --cascade    # also removes active connections
```

```python
def archive_subject(id_or_value, cascade=False):
    subject = lookup_subject(id_or_value)
    if not subject:
        raise NotFoundError(id_or_value)

    subject["status"] = "ARCHIVED"
    subject["modified_at"] = now()

    if cascade:
        case.connections = [
            c for c in case.connections
            if c["from_id"] != subject["id"] and c["to_id"] != subject["id"]
        ]
    else:
        # Unconfirm connections involving this subject
        for c in case.connections:
            if c["from_id"] == subject["id"] or c["to_id"] == subject["id"]:
                c["confirmed"] = False

    ledger("SUBJECT_ARCHIVED", subject_id=subject["id"], cascade=cascade)
    return {"ok": True, "subject_id": subject["id"]}
```

---

## Merge Detection

Deduplication thresholds:

| Score range  | Action          |
| ------------ | --------------- |
| >= 0.92      | Auto-merge      |
| 0.75 – <0.92 | Flag for review |
| < 0.75       | No action       |

```python
def find_duplicate(subject_type, value, aliases=None):
    aliases = aliases or []
    candidates = [s for s in case.subjects
                  if s["type"] == subject_type and s["status"] != "ARCHIVED"]

    for candidate in candidates:
        score = score_match(candidate, subject_type, value, aliases)
        if score >= 0.92:
            return {"subject": candidate, "score": score, "action": "MERGE"}
        if score >= 0.75:
            return {"subject": candidate, "score": score, "action": "REVIEW"}

    return None


def score_match(candidate, subject_type, value, aliases):
    score = 0.0

    if normalize(subject_type, candidate["value"]) == normalize(subject_type, value):
        score += 1.0

    all_aliases = candidate["aliases"] + aliases
    if normalize(subject_type, value) in [normalize(subject_type, a) for a in all_aliases]:
        score += 0.9

    # Type-specific boosts
    if subject_type == "EMAIL":
        local1 = candidate["value"].split("@")[0]
        local2 = value.split("@")[0]
        if local1 == local2:
            score += 0.5

    elif subject_type == "DOMAIN":
        if value.endswith(candidate["value"]) or candidate["value"].endswith(value):
            score += 0.7

    elif subject_type == "INDIVIDUAL":
        score += name_similarity(candidate["value"], value) * 0.8

    elif subject_type == "USERNAME":
        if candidate["value"].lower() == value.lower():
            score += 1.0

    return min(score, 1.0)


def merge_or_flag(dup_check, value, opts):
    subject, score, action = dup_check["subject"], dup_check["score"], dup_check["action"]

    if action == "MERGE":
        if subject["value"] != value and value not in subject["aliases"]:
            subject["aliases"].append(value)
            subject["modified_at"] = now()
            ledger("SUBJECT_MODIFIED", subject_id=subject["id"], note="alias merged")
        return subject

    # action == "REVIEW"
    return {
        "needs_review": True,
        "existing": subject,
        "proposed": {"value": value, "opts": opts},
        "match_score": score
    }
```

---

## Cross-Reference

```python
# Command
/crossref <id_or_value> [--depth <n>]

# Example
/crossref analyst@target.org --depth 2
```

```python
def cross_reference(subject_id):
    subject = lookup_subject(subject_id)
    report = {
        "exact_matches":      [],
        "near_matches":       [],
        "attribute_overlaps": [],
        "conflicts":          [],
    }

    for other in case.subjects:
        if other["id"] == subject["id"] or other["status"] == "ARCHIVED":
            continue

        shared = shared_attributes(subject, other)
        if shared:
            report["attribute_overlaps"].append({
                "subject": other,
                "overlap_type": "SHARED_ATTRIBUTE",
                "detail": shared
            })

        sim = value_similarity(subject["value"], other["value"])
        if sim > 0.8:
            report["near_matches"].append({"subject": other, "similarity": sim})

        found_conflicts = attribute_conflicts(subject, other)
        if found_conflicts:
            report["conflicts"].extend(found_conflicts)

    return report
```

---

## Pathfinding

Uses Dijkstra's algorithm with uniform edge weight. Returns the lowest-hop path between two subjects up to `max_hops`.

```python
# Command
/pathfind <from_id_or_value> <to_id_or_value> [--max-hops <n>]

# Example
/pathfind analyst@target.org 198.51.100.22 --max-hops 4
```

```python
def pathfind(from_id, to_id, max_hops=5):
    start  = lookup_subject(from_id)
    target = lookup_subject(to_id)
    if not start or not target:
        return None

    # Dijkstra: dist tracks min hops, prev tracks path
    dist = {start["id"]: 0}
    prev = {}
    unvisited = {start["id"]}

    while unvisited:
        current_id = min(unvisited, key=lambda nid: dist.get(nid, float("inf")))
        unvisited.discard(current_id)

        if dist[current_id] >= max_hops:
            continue
        if current_id == target["id"]:
            break

        for conn in connections_for(current_id):
            neighbor_id = conn["to_id"] if conn["from_id"] == current_id else conn["from_id"]
            new_dist = dist[current_id] + 1
            if new_dist < dist.get(neighbor_id, float("inf")):
                dist[neighbor_id] = new_dist
                prev[neighbor_id] = (current_id, conn)
                unvisited.add(neighbor_id)

    # Reconstruct path
    if target["id"] not in prev and target["id"] != start["id"]:
        return None

    path = []
    node = target["id"]
    while node in prev:
        parent_id, conn = prev[node]
        path.append({"from": parent_id, "connection": conn, "to": node})
        node = parent_id

    return list(reversed(path))
```

---

## Connection Operations

```python
# Commands
/link-subjects   <from> <to> <type> [options]
/show-connections <id_or_value> [--type <type>]

# Examples
/link-subjects analyst@target.org target.org REGISTERED --confidence STRONG
/show-connections target.org --type HOSTS
```

```python
def form_connection(from_id, to_id, conn_type, opts=None):
    opts = opts or {}
    s = lookup_subject(from_id)
    t = lookup_subject(to_id)
    if not s or not t:
        raise NotFoundError("from or to subject missing")

    # Deduplicate connections
    existing = next(
        (c for c in case.connections
         if c["from_id"] == s["id"] and c["to_id"] == t["id"] and c["type"] == conn_type),
        None
    )
    if existing:
        if opts.get("findings"):
            existing["findings"].extend(opts["findings"])
            existing["modified_at"] = now()
        return existing

    connection = {
        "id":          generate_uuid(),
        "from_id":     s["id"],
        "to_id":       t["id"],
        "type":        conn_type,
        "direction":   opts.get("direction", "DIRECTED"),
        "confidence":  opts.get("confidence", "MODERATE"),
        "findings":    opts.get("findings", []),
        "attributes":  opts.get("attributes", {}),
        "created_at":  now(),
        "modified_at": now(),
        "confirmed":   opts.get("confirmed", False),
    }

    case.connections.append(connection)
    ledger("CONNECTION_FORMED", connection_id=connection["id"])
    return connection
```

---

## Advanced Queries

```python
# Command
/query-subjects [spec]

# Examples
/query-subjects --type DOMAIN --confidence-min STRONG
/query-subjects --tag suspect --has-finding-type PRIMARY
/query-subjects --linked-to <uuid> --sort-by modified_at --order desc
```

```python
CONFIDENCE_ORDER = ["TENTATIVE", "WEAK", "MODERATE", "STRONG", "VERIFIED"]

def query_subjects(spec):
    results = list(case.subjects)

    if spec.get("types"):
        results = [s for s in results if s["type"] in spec["types"]]

    if spec.get("confidence_min"):
        min_idx = CONFIDENCE_ORDER.index(spec["confidence_min"])
        results = [s for s in results
                   if CONFIDENCE_ORDER.index(s["confidence"]) >= min_idx]

    if spec.get("tags"):
        results = [s for s in results
                   if all(t in s["tags"] for t in spec["tags"])]

    if spec.get("attributes"):
        results = [s for s in results
                   if all(s["attributes"].get(k) == v
                          for k, v in spec["attributes"].items())]

    if spec.get("linked_to"):
        results = [s for s in results if is_connected(s["id"], spec["linked_to"])]

    if spec.get("has_finding_type"):
        results = [s for s in results
                   if any(f["type"] in spec["has_finding_type"] for f in s["findings"])]

    if spec.get("sort_by"):
        reverse = spec.get("order", "asc") == "desc"
        results.sort(key=lambda s: s.get(spec["sort_by"], ""), reverse=reverse)

    if spec.get("limit"):
        offset = spec.get("offset", 0)
        results = results[offset: offset + spec["limit"]]

    return results
```

---

## Merge & Split

```python
# Commands
/merge-subjects <primary_id> <secondary_id>   # absorb secondary into primary
/split-subject  <id> --field <attr> --values <v1> <v2>
```

---

## Type-Specific Attributes

### INDIVIDUAL

`full_name`, `dob` (YYYY-MM-DD), `nationality`, `occupation`, `locale`, `gender`, `pob`

### DOMAIN

`registrar`, `creation_date`, `expiration_date`, `nameservers[]`, `status[]`, `dns_records{}`

### EMAIL

`domain`, `local_part`, `provider`, `disposable` (bool), `breached` (bool)

### NETWORK_ADDR

`version` (4/6), `asn`, `isp`, `geo{}`, `reverse_dns`, `open_ports[]`

### USERNAME

`platforms[]`, `variations[]`, `avatar_url`, `bio`, `account_created`

### ORG

`legal_name`, `reg_number`, `founded`, `jurisdiction`, `industry`, `headcount`, `revenue`

### PHONE

`country_code`, `national_format`, `carrier`, `line_type` (MOBILE/LANDLINE/VOIP), `valid` (bool), `whatsapp` (bool)

### LOCALE

`address`, `city`, `region`, `country`, `postal`, `coordinates{}`, `timezone`

---

## Output Formats

```python
def format_subject(subject, mode="summary"):
    if mode == "summary":
        return f"[{subject['type']}] {subject['display_name']} ({subject['confidence']})"

    if mode == "detail":
        return (
            f"Subject : {subject['display_name']}\n"
            f"Type    : {subject['type']}\n"
            f"ID      : {subject['id']}\n"
            f"Value   : {subject['value']}\n"
            f"Conf    : {subject['confidence']}\n"
            f"Status  : {subject['status']}\n"
            f"Aliases : {', '.join(subject['aliases']) or 'none'}\n"
            f"Findings: {len(subject['findings'])}\n"
            f"Revision: {subject['revision']}\n"
            f"Modified: {subject['modified_at']}\n"
            f"Notes   : {subject.get('notes', 'none')}"
        )

    if mode == "json":
        return json.dumps(subject, indent=2)
```

---

## Command Reference

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `/register`         | Add a new subject to the registry         |
| `/lookup`           | Retrieve a subject by ID or value         |
| `/find`             | Filter subjects by criteria               |
| `/modify`           | Update subject fields                     |
| `/archive-subject`  | Soft-archive subject (non-destructive)    |
| `/link-subjects`    | Form a connection between two subjects    |
| `/show-connections` | List connections for a subject            |
| `/pathfind`         | Shortest path (Dijkstra) between subjects |
| `/crossref`         | Cross-reference a subject against case    |
| `/query-subjects`   | Advanced filtered/sorted subject query    |
| `/merge-subjects`   | Merge duplicate subjects                  |
| `/split-subject`    | Split a multi-identity subject            |
