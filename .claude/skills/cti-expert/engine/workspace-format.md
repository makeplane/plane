# Workspace Format Specification

Defines the on-disk structure and encoding rules for OSINT case workspaces. All workspaces conform to this spec for portability and forward migration.

---

## Version History

| Version | Status  | Notes                                              |
| ------- | ------- | -------------------------------------------------- |
| 1.0.0   | Legacy  | Single flat JSON, no versioning                    |
| 2.0.0   | Legacy  | Nested directory layout, versioned snapshots       |
| 3.0.0   | Current | Single `.workspace.json` file, Argon2id encryption |

---

## Storage Layout

```
~/.osint-workspaces/
├── <case_id>.workspace.json        # Active workspace file
├── <case_id>.workspace.json.bak    # Last-save backup
└── index.json                      # Master registry of all workspaces
```

One file per case. No subdirectories. Snapshots are embedded inside the workspace file under `snapshots[]`.

---

## Top-Level Structure

```json
{
    "format_version": "3.0.0",
    "case_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Target Infrastructure Sweep",
    "description": "Tracing hosting infrastructure behind target.org",
    "classification": "CONFIDENTIAL",
    "created_at": "2026-01-10T09:00:00Z",
    "modified_at": "2026-01-10T14:30:00Z",
    "snapshot_count": 4,
    "snapshots": [...],
    "subjects": [...],
    "connections": [...],
    "finding_trails": [...],
    "activity_ledger": [...],
    "workspace_metadata": {...},
    "tags": ["infrastructure", "domain-analysis"]
}
```

---

## Required Fields

| Field            | Type    | Description                          |
| ---------------- | ------- | ------------------------------------ |
| `format_version` | string  | Must be "3.0.0"                      |
| `case_id`        | UUID    | Unique case identifier               |
| `created_at`     | ISO8601 | Case creation timestamp              |
| `subjects`       | array   | All subjects registered to this case |
| `connections`    | array   | All connections between subjects     |

---

## Optional Fields

| Field                | Type    | Default    | Description                                  |
| -------------------- | ------- | ---------- | -------------------------------------------- |
| `name`               | string  | ""         | Human-readable label (max 256)               |
| `description`        | string  | ""         | Case summary (max 4000)                      |
| `classification`     | enum    | "OPEN"     | OPEN / CONFIDENTIAL / SENSITIVE / RESTRICTED |
| `modified_at`        | ISO8601 | created_at | Last write timestamp                         |
| `snapshot_count`     | integer | 0          | Number of stored snapshots                   |
| `snapshots`          | array   | []         | Embedded named snapshots                     |
| `finding_trails`     | array   | []         | Reasoning trail records                      |
| `activity_ledger`    | array   | []         | Chronological action log                     |
| `workspace_metadata` | object  | {}         | Runtime tracking data                        |
| `tags`               | array   | []         | Freeform labels                              |

---

## Subject Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "DOMAIN",
  "value": "target.org",
  "display_name": "target.org",
  "aliases": ["www.target.org"],
  "attributes": {
    "registrar": "Registrar Inc.",
    "creation_date": "2021-03-10",
    "nameservers": ["ns1.registrar.net", "ns2.registrar.net"]
  },
  "confidence": "STRONG",
  "findings": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "type": "PRIMARY",
      "source": "WHOIS lookup",
      "source_url": "https://whois.iana.org/target.org",
      "trust_score": 5,
      "content": "Domain Name: TARGET.ORG | Created: 2021-03-10",
      "content_hash": "a3f5c8d2e9b1f4a7c6d8e2b5...",
      "recorded_at": "2026-01-10T09:15:00Z",
      "confirmed_by": []
    }
  ],
  "origin_subjects": [],
  "status": "ACTIVE",
  "notes": "Primary investigation target",
  "first_observed": "2026-01-10T09:15:00Z",
  "last_observed": "2026-01-10T09:15:00Z",
  "created_at": "2026-01-10T09:15:00Z",
  "modified_at": "2026-01-10T09:15:00Z",
  "revision": 1,
  "prior_revisions": [],
  "tags": ["target", "primary"]
}
```

### Subject Fields

| Field             | Required | Type    | Description                               |
| ----------------- | -------- | ------- | ----------------------------------------- |
| `id`              | Yes      | UUID    | Unique subject identifier                 |
| `type`            | Yes      | enum    | Subject type (INDIVIDUAL, DOMAIN, …)      |
| `value`           | Yes      | string  | Normalized primary value                  |
| `display_name`    | No       | string  | Human-readable label                      |
| `aliases`         | No       | array   | Alternative identifiers                   |
| `attributes`      | No       | object  | Type-specific data                        |
| `confidence`      | No       | enum    | VERIFIED…CHALLENGED (default MODERATE)    |
| `findings`        | No       | array   | Supporting findings                       |
| `origin_subjects` | No       | array   | UUIDs of parent subjects                  |
| `status`          | No       | enum    | ACTIVE/VERIFIED/CHALLENGED/STALE/ARCHIVED |
| `notes`           | No       | string  | Free-form notes (max 10000)               |
| `first_observed`  | No       | ISO8601 | Earliest observation                      |
| `last_observed`   | No       | ISO8601 | Most recent observation                   |
| `created_at`      | Yes      | ISO8601 | Registration timestamp                    |
| `modified_at`     | No       | ISO8601 | Last modification                         |
| `revision`        | No       | integer | Revision counter (default 1)              |
| `prior_revisions` | No       | array   | Revision history                          |
| `tags`            | No       | array   | Freeform labels                           |

---

## Connection Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "from_id": "550e8400-e29b-41d4-a716-446655440001",
  "to_id": "550e8400-e29b-41d4-a716-446655440005",
  "type": "REGISTERED",
  "direction": "DIRECTED",
  "confidence": "STRONG",
  "findings": [],
  "attributes": {
    "start_date": "2021-03-10",
    "registrar": "Registrar Inc."
  },
  "created_at": "2026-01-10T09:30:00Z",
  "modified_at": "2026-01-10T09:30:00Z",
  "confirmed": true
}
```

### Connection Fields

| Field         | Required | Type    | Description                  |
| ------------- | -------- | ------- | ---------------------------- |
| `id`          | Yes      | UUID    | Unique connection identifier |
| `from_id`     | Yes      | UUID    | Source subject ID            |
| `to_id`       | Yes      | UUID    | Target subject ID            |
| `type`        | Yes      | enum    | Connection type              |
| `direction`   | No       | enum    | DIRECTED / BIDIRECTIONAL     |
| `confidence`  | No       | enum    | Confidence level             |
| `findings`    | No       | array   | Supporting findings          |
| `attributes`  | No       | object  | Connection-specific metadata |
| `created_at`  | Yes      | ISO8601 | Creation timestamp           |
| `modified_at` | No       | ISO8601 | Last modification            |
| `confirmed`   | No       | boolean | Manual confirmation flag     |

---

## Finding Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "type": "PRIMARY",
  "source": "WHOIS lookup",
  "source_url": "https://whois.iana.org/target.org",
  "trust_score": 5,
  "content": "Domain Name: TARGET.ORG...",
  "content_hash": "a3f5c8d2e9b1f4a7c6d8e2b5f9c3a7d1e4b8f2c5a9d3e7b1f4c8a2d6e9b3f5c7",
  "recorded_at": "2026-01-10T09:15:00Z",
  "archived_copy": "./archives/target.org_whois_20260110.html",
  "confirmed_by": ["550e8400-e29b-41d4-a716-446655440006"]
}
```

### Finding Fields

| Field           | Required | Type    | Description                                   |
| --------------- | -------- | ------- | --------------------------------------------- |
| `id`            | Yes      | UUID    | Unique finding identifier                     |
| `type`          | Yes      | enum    | PRIMARY/DERIVED/CONFIRMED/CONTESTED/ANECDOTAL |
| `source`        | Yes      | string  | Source description                            |
| `source_url`    | No       | URI     | Source URL                                    |
| `trust_score`   | No       | integer | 1–5 trust score                               |
| `content`       | No       | string  | Content excerpt                               |
| `content_hash`  | No       | string  | SHA-256 hex for integrity                     |
| `recorded_at`   | Yes      | ISO8601 | Capture timestamp                             |
| `archived_copy` | No       | string  | Path to local snapshot                        |
| `confirmed_by`  | No       | array   | Confirming finding IDs                        |

---

## Finding Trail Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440007",
  "conclusion_subject_id": "550e8400-e29b-41d4-a716-446655440008",
  "trail_strength": 6.12,
  "steps": [
    {
      "step_number": 1,
      "subject_id": "550e8400-e29b-41d4-a716-446655440001",
      "connection_id": "550e8400-e29b-41d4-a716-446655440004",
      "reasoning": "Domain registered to this email",
      "finding_id": "550e8400-e29b-41d4-a716-446655440002",
      "strength_at_step": 9.0
    },
    {
      "step_number": 2,
      "subject_id": "550e8400-e29b-41d4-a716-446655440005",
      "connection_id": "550e8400-e29b-41d4-a716-446655440009",
      "reasoning": "Email appears on linked social profile",
      "finding_id": "550e8400-e29b-41d4-a716-446655440010",
      "strength_at_step": 6.12
    }
  ],
  "created_at": "2026-01-10T11:00:00Z"
}
```

---

## Activity Ledger Record

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440011",
  "timestamp": "2026-01-10T09:15:00Z",
  "action": "SUBJECT_ADDED",
  "subject_id": "550e8400-e29b-41d4-a716-446655440001",
  "details": {
    "type": "DOMAIN",
    "value": "target.org"
  }
}
```

### Ledger Actions

| Action                | Trigger                        |
| --------------------- | ------------------------------ |
| `SUBJECT_ADDED`       | New subject registered         |
| `SUBJECT_MODIFIED`    | Subject fields updated         |
| `SUBJECT_ARCHIVED`    | Subject status set to ARCHIVED |
| `CONNECTION_FORMED`   | New connection created         |
| `CONNECTION_MODIFIED` | Connection fields updated      |
| `CONNECTION_REMOVED`  | Connection deleted             |
| `FINDING_RECORDED`    | Finding attached to subject    |
| `QUERY_RUN`           | Operator query executed        |
| `WORKSPACE_SAVED`     | Workspace written to disk      |
| `WORKSPACE_LOADED`    | Workspace read from disk       |
| `EXPORTED`            | Case exported to file          |
| `IMPORTED`            | Case imported from file        |
| `MERGED`              | Two subjects merged            |

---

## Snapshot Record

Embedded in `snapshots[]` array. Max 30 snapshots retained; oldest pruned.

```json
{
  "snapshot_id": "550e8400-e29b-41d4-a716-446655440012",
  "label": "Post-WHOIS sweep",
  "description": "After initial domain and registrant sweep",
  "created_at": "2026-01-10T11:00:00Z",
  "subject_count": 4,
  "connection_count": 3,
  "checksum": "e5f6a7b8c9d0e1f2..."
}
```

Full case state is not duplicated in each snapshot — snapshots are lightweight metadata markers. Use `/workspace save` with a label to create one; restore with `/workspace open --snapshot <id>`.

---

## Workspace Metadata

```json
{
  "workspace_metadata": {
    "started_at": "2026-01-10T09:00:00Z",
    "last_activity": "2026-01-10T14:30:00Z",
    "duration_seconds": 19800,
    "query_count": 14,
    "subject_add_count": 6,
    "subject_update_count": 2,
    "connection_add_count": 5,
    "save_count": 4,
    "load_count": 1,
    "auto_save_enabled": true,
    "last_auto_save": "2026-01-10T14:27:00Z",
    "commands_run": [
      {
        "command": "/register DOMAIN target.org",
        "timestamp": "2026-01-10T09:15:00Z",
        "duration_ms": 85
      }
    ]
  }
}
```

---

## Auto-Save

- Interval: every **3 minutes** when changes are detected
- Max retained auto-saves embedded in workspace: **8** (oldest dropped)
- Auto-save does not create a named snapshot; it updates `workspace_metadata.last_auto_save`

---

## Compression

When compressed, the workspace file is wrapped:

```json
{
  "compressed": true,
  "algorithm": "gzip",
  "original_format_version": "3.0.0",
  "data": "<base64-encoded-gzip-data>"
}
```

---

## Encryption

Encrypted workspaces use ChaCha20-Poly1305 with Argon2id key derivation:

```json
{
  "encrypted": true,
  "algorithm": "ChaCha20-Poly1305",
  "kdf": "Argon2id",
  "kdf_params": {
    "memory_kb": 65536,
    "iterations": 3,
    "parallelism": 4,
    "salt": "<base64>"
  },
  "nonce": "<base64>",
  "ciphertext": "<base64>",
  "hint": {
    "case_name": "<optional plaintext hint>",
    "created_at": "2026-01-10T09:00:00Z"
  }
}
```

---

## File Naming

```
<case_id>_<sanitized_name>_<timestamp>[_encrypted].workspace.json

Examples:
550e8400-e29b-41d4-a716-446655440000_target_infrastructure_20260110T0900.workspace.json
550e8400-e29b-41d4-a716-446655440000_target_infrastructure_20260110T1430_encrypted.workspace.json
```

---

## Schema Validation

Validate against `engine/case-schema.json`:

```python
import jsonschema, json

schema  = json.load(open("engine/case-schema.json"))
case    = json.load(open("<case_id>.workspace.json"))

jsonschema.validate(instance=case, schema=schema)
```

---

## Migration from v2.0.0

| Aspect                   | v2.0.0                    | v3.0.0                       |
| ------------------------ | ------------------------- | ---------------------------- |
| Storage                  | Nested dirs + versions/   | Single `.workspace.json`     |
| Encryption               | AES-256-GCM + PBKDF2      | ChaCha20-Poly1305 + Argon2id |
| Compression              | deflate                   | gzip                         |
| Trust scoring            | A-F letter grades         | 1–5 integer scale            |
| Confidence labels        | CERTAIN/HIGH/MEDIUM/LOW/… | VERIFIED/STRONG/MODERATE/…   |
| Subject terminology      | entity                    | subject                      |
| Relationship terminology | relationship              | connection                   |
| Finding terminology      | evidence                  | finding                      |
| Audit log                | audit_log                 | activity_ledger              |
| Max snapshots            | 50                        | 30                           |
| Max auto-saves           | 10                        | 8                            |
| Auto-save interval       | 5 min                     | 3 min                        |

```python
def migrate_v2_to_v3(v2_data):
    return {
        "format_version": "3.0.0",
        "case_id":        v2_data["investigation_id"],
        "name":           v2_data.get("name", "Migrated Case"),
        "description":    v2_data.get("description", ""),
        "classification": v2_data.get("classification", "OPEN"),
        "created_at":     v2_data["created_at"],
        "modified_at":    now(),
        "subjects":       [migrate_subject(e) for e in v2_data.get("entities", [])],
        "connections":    [migrate_connection(r) for r in v2_data.get("relationships", [])],
        "finding_trails": [migrate_trail(c) for c in v2_data.get("evidence_chains", [])],
        "activity_ledger":[migrate_ledger(a) for a in v2_data.get("audit_log", [])],
        "workspace_metadata": {},
        "tags":           v2_data.get("tags", []),
    }
```
