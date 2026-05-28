# Attack Path Diagram

Spec for rendering threat-path visualizations from case graph data. Traces attacker routes from entry points through lateral movement to internal targets.

---

## Command

```
/render threat-path [--scope <subject>] [--depth <n>]
```

**Options:**

| Option              | Default      | Description                                                |
| ------------------- | ------------ | ---------------------------------------------------------- |
| `--scope <subject>` | all subjects | Restrict to paths involving a specific subject ID or label |
| `--depth <n>`       | 4            | Maximum hop count from entry point to target               |

---

## Algorithm

### Step 1 — Identify Entry Points

Entry points are subjects matching these types that face externally:

```
ENTRY_POINT_TYPES = [DOMAIN, URL, EMAIL, NETWORK_ADDR, USERNAME]
```

Score each candidate:

- DOMAIN with open ports → base score 60
- URL resolving to login/admin panel → base score 75
- EMAIL in breach dump → base score 55
- NETWORK_ADDR with high INFRASTRUCTURE_EXPOSURE → base score 70
- USERNAME active on 10+ platforms → base score 45

### Step 2 — Trace Connections

Walk the subject connection graph up to `--depth` hops:

```python
def trace_path(entry_point, depth, visited=None):
    if visited is None:
        visited = set()
    if depth == 0 or entry_point.id in visited:
        return []
    visited.add(entry_point.id)
    edges = get_connections(entry_point.id)
    paths = []
    for edge in edges:
        next_node = resolve_subject(edge.to_id)
        sub_paths = trace_path(next_node, depth - 1, visited)
        paths.append(PathSegment(
            from_node=entry_point,
            edge=edge,
            to_node=next_node,
            sub_paths=sub_paths
        ))
    return paths
```

### Step 3 — Score Path Risk

Cumulative trust score degrades along each hop. Each edge multiplies the current path score by its strength factor:

| Edge Strength | Multiplier |
| ------------- | ---------- |
| confirmed     | 1.0        |
| probable      | 0.75       |
| possible      | 0.50       |

Path risk label based on final cumulative score × entry point base score:

| Score Range | Label    |
| ----------- | -------- |
| 75–100      | CRITICAL |
| 50–74       | HIGH     |
| 25–49       | MEDIUM   |
| 0–24        | LOW      |

### Step 4 — Filter and Sort

- Deduplicate paths that share the same node sequence
- Sort descending by cumulative score
- Limit output to top 5 paths unless `--scope` is set (then show all matching)

---

## ASCII Template

```
ATTACK PATH ANALYSIS — Case: {CASE_ID}
Depth: {depth}  |  Entry Points: {n_entry}  |  Paths Found: {n_paths}
════════════════════════════════════════════════════════════════

PATH-01 [CRITICAL]  Score: {score}
┌──────────────────────┐
│  ENTRY POINT         │
│  {entry_type}        │  ← {entry_label}
│  Score: {base_score} │
└──────────────┬───────┘
               │  confirmed ═══▶  relationship: {rel_type}
               ▼
┌──────────────────────┐
│  LATERAL MOVEMENT    │
│  {node_type}         │  ← {node_label}
│  Hop 1               │
└──────────────┬───────┘
               │  probable  ═══▶  relationship: {rel_type}
               ▼
┌──────────────────────┐
│  LATERAL MOVEMENT    │
│  {node_type}         │  ← {node_label}
│  Hop 2               │
└──────────────┬───────┘
               │  confirmed ═══▶  relationship: {rel_type}
               ▼
╔══════════════════════╗
║  TARGET              ║
║  {target_type}       ║  ← {target_label}
║  [CRITICAL]          ║
╚══════════════════════╝

────────────────────────────────────────────────────────────────
PATH-02 [HIGH]  Score: {score}
┌──────────────────────┐
│  ENTRY POINT         │
│  {entry_type}        │  ← {entry_label}
└──────────────┬───────┘
               │  possible  ───▶  relationship: {rel_type}
               ▼
┌──────────────────────┐
│  LATERAL MOVEMENT    │
│  {node_type}         │  ← {node_label}
└──────────────┬───────┘
               │  confirmed ═══▶  relationship: {rel_type}
               ▼
╔══════════════════════╗
║  TARGET              ║
║  {target_type}       ║  ← {target_label}
║  [HIGH]              ║
╚══════════════════════╝

────────────────────────────────────────────────────────────────
RISK SUMMARY
  CRITICAL paths : {n_critical}
  HIGH paths     : {n_high}
  MEDIUM paths   : {n_medium}
  LOW paths      : {n_low}
════════════════════════════════════════════════════════════════
```

**Box styles:**

- `┌──┐` / `└──┘` — confirmed subjects (verified=true in subject registry)
- `╔══╗` / `╚══╝` — target/high-risk terminal nodes
- `═══▶` — confirmed or probable edge
- `───▶` — possible edge

---

## Integration

Reads from:

- **Case subjects** — `engine/subject-registry.md` — source of node types, labels, confidence
- **Case connections** — `engine/workspace-format.md` — edge strength and relationship type
- **Exposure scores** — `analysis/exposure-model.md` — used to weight target severity

Command registered in: `output/visuals/render-engine.md`

---

## Cross-References

- `output/visuals/attack-surface-map.md` — complementary surface enumeration view
- `engine/subject-registry.md` — subject type definitions
- `analysis/exposure-model.md` — exposure scoring used in path risk
