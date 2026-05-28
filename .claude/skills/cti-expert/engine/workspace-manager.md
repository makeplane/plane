# Workspace Manager

Handles workspace persistence, auto-save, locking, lifecycle transitions, and snapshot management. All state lives in `~/.osint-workspaces/` per the format spec in `engine/workspace-format.md`.

---

## Workspace Lifecycle

```
draft ──► active ──► paused ──► archived
  │          │
  │          └──► locked  (read-only; released with /workspace unlock)
  │
  └──► (discard, no save)
```

| State      | Description                                             |
| ---------- | ------------------------------------------------------- |
| `draft`    | Newly created, not yet saved to disk                    |
| `active`   | Open and accepting changes; auto-save running           |
| `paused`   | Saved to disk; auto-save suspended                      |
| `archived` | Read-only; excluded from active workspace list          |
| `locked`   | Write-protected while another process has exclusive use |

---

## Storage Layout

```
~/.osint-workspaces/
├── <case_id>.workspace.json       # Case workspace file
├── <case_id>.workspace.json.bak   # Pre-save backup
├── <case_id>.lock                 # Lock file (present only when locked)
└── index.json                     # Registry of all workspaces
```

---

## Configuration

```python
# ~/.osint-workspaces/config.json defaults
CONFIG = {
    "format_version":          "3.0.0",
    "auto_save_enabled":       True,
    "auto_save_interval_min":  3,
    "max_auto_saves":          8,
    "max_snapshots":           30,
    "default_encryption":      False,
    "compression_enabled":     True,
    "backup_on_save":          True,
}
```

---

## Initialization

```python
def init_workspace_manager():
    base = Path("~/.osint-workspaces").expanduser()
    base.mkdir(parents=True, exist_ok=True)

    config = load_config(base / "config.json")
    index  = load_index(base / "index.json")

    if config["auto_save_enabled"]:
        schedule_auto_save(config["auto_save_interval_min"])

    return {"config": config, "index": index, "base": base}
```

---

## Save

```python
# Command
/workspace save [label] [--encrypt] [--description <text>]

# Examples
/workspace save                         # quick save, no label
/workspace save "Post-DNS sweep"        # named snapshot
/workspace save "Sensitive phase" --encrypt
```

```python
def save_workspace(opts=None):
    opts    = opts or {}
    case    = get_active_case()
    base    = get_base_path()
    ws_path = base / f"{case['case_id']}.workspace.json"

    # Compute checksum before transforms
    checksum = sha256_of(case)

    payload = {"case": case, "saved_at": now(), "checksum": checksum}

    if CONFIG["compression_enabled"]:
        payload = compress_gzip(payload)

    if opts.get("encrypt"):
        password = prompt_password("Encryption passphrase: ")
        payload  = encrypt_chacha20(payload, password)   # Argon2id KDF

    # Backup existing file
    if ws_path.exists() and CONFIG["backup_on_save"]:
        ws_path.rename(str(ws_path) + ".bak")

    ws_path.write_text(json.dumps(payload, indent=2))

    # Optional named snapshot
    if opts.get("label"):
        create_snapshot(case, opts["label"], opts.get("description", ""), checksum)
        prune_snapshots(case["case_id"])

    update_index(case["case_id"], {
        "name":         case.get("name", ""),
        "last_saved":   now(),
        "subject_count": len(case["subjects"]),
        "encrypted":    bool(opts.get("encrypt")),
        "state":        "paused" if not get_lock(case["case_id"]) else "locked",
    })

    ledger("WORKSPACE_SAVED", details={"label": opts.get("label"), "encrypted": bool(opts.get("encrypt"))})
    return {"ok": True, "path": str(ws_path), "timestamp": now()}


def create_snapshot(case, label, description, checksum):
    snapshot = {
        "snapshot_id":      generate_uuid(),
        "label":            label,
        "description":      description,
        "created_at":       now(),
        "subject_count":    len(case["subjects"]),
        "connection_count": len(case["connections"]),
        "checksum":         checksum,
    }
    case.setdefault("snapshots", []).append(snapshot)
    case["snapshot_count"] = len(case["snapshots"])
    return snapshot


def prune_snapshots(case_id):
    case = get_case(case_id)
    snaps = sorted(case["snapshots"], key=lambda s: s["created_at"])
    if len(snaps) > CONFIG["max_snapshots"]:
        case["snapshots"] = snaps[len(snaps) - CONFIG["max_snapshots"]:]
    case["snapshot_count"] = len(case["snapshots"])
```

---

## Open

```python
# Command
/workspace open [name_or_id] [--snapshot <snapshot_id>]

# Examples
/workspace open                           # list available workspaces
/workspace open "Post-DNS sweep"          # open by name
/workspace open <case_id>                 # open by ID
/workspace open <case_id> --snapshot <id> # restore to named snapshot
```

```python
def open_workspace(identifier=None, opts=None):
    opts = opts or {}

    if not identifier:
        return list_workspaces()

    info = find_workspace(identifier)   # search index by ID or name
    if not info:
        raise NotFoundError(identifier)

    # Check for lock
    lock = get_lock(info["case_id"])
    if lock and lock["owner"] != current_process_id():
        raise WorkspaceLocked(f"Locked by PID {lock['owner']} since {lock['acquired_at']}")

    ws_path = get_ws_path(info["case_id"])
    payload = json.loads(ws_path.read_text())

    if payload.get("encrypted"):
        password = prompt_password("Passphrase: ")
        payload  = decrypt_chacha20(payload, password)

    if payload.get("compressed"):
        payload = decompress_gzip(payload)

    # Integrity check
    if sha256_of(payload["case"]) != payload["checksum"]:
        raise IntegrityError("Workspace checksum mismatch — file may be corrupt")

    case = payload["case"]

    # Snapshot restore
    if opts.get("snapshot"):
        case = restore_to_snapshot(case, opts["snapshot"])

    set_active_case(case)
    case["workspace_metadata"]["load_count"] = \
        case["workspace_metadata"].get("load_count", 0) + 1

    ledger("WORKSPACE_LOADED", details={"snapshot": opts.get("snapshot", "current")})
    return {"ok": True, "case": case}
```

---

## List

```python
# Command
/workspace list [--state <draft|active|paused|archived>]
```

```python
def list_workspaces(state_filter=None):
    index = load_index()

    rows = []
    for entry in index["workspaces"]:
        if state_filter and entry.get("state") != state_filter:
            continue
        rows.append({
            "case_id":        entry["case_id"],
            "name":           entry["name"],
            "state":          entry.get("state", "paused"),
            "last_saved":     entry.get("last_saved"),
            "subject_count":  entry.get("subject_count", 0),
            "encrypted":      entry.get("encrypted", False),
            "locked":         bool(get_lock(entry["case_id"])),
        })

    return rows
```

---

## Archive

```python
# Command
/workspace archive <name_or_id>
```

```python
def archive_workspace(identifier):
    info = find_workspace(identifier)
    if not info:
        raise NotFoundError(identifier)

    if get_lock(info["case_id"]):
        raise WorkspaceLocked("Cannot archive a locked workspace")

    update_index(info["case_id"], {"state": "archived"})
    return {"ok": True, "case_id": info["case_id"], "state": "archived"}
```

---

## Lock / Unlock

Locking prevents writes from other processes. Useful when exporting, merging, or handing off a workspace.

```python
# Commands
/workspace lock   <name_or_id> [--reason <text>]
/workspace unlock <name_or_id>
```

```python
def lock_workspace(identifier, reason=""):
    info = find_workspace(identifier)
    if not info:
        raise NotFoundError(identifier)

    lock_path = get_lock_path(info["case_id"])
    if lock_path.exists():
        existing = json.loads(lock_path.read_text())
        if existing["owner"] != current_process_id():
            raise WorkspaceLocked(f"Already locked by PID {existing['owner']}")
        return {"ok": True, "already_locked": True}

    lock_data = {
        "owner":       current_process_id(),
        "acquired_at": now(),
        "reason":      reason,
    }
    lock_path.write_text(json.dumps(lock_data))
    update_index(info["case_id"], {"state": "locked"})
    return {"ok": True, "lock": lock_data}


def unlock_workspace(identifier):
    info = find_workspace(identifier)
    if not info:
        raise NotFoundError(identifier)

    lock_path = get_lock_path(info["case_id"])
    if not lock_path.exists():
        return {"ok": True, "was_unlocked": True}

    existing = json.loads(lock_path.read_text())
    if existing["owner"] != current_process_id():
        raise PermissionError(f"Lock owned by PID {existing['owner']} — cannot release")

    lock_path.unlink()
    update_index(info["case_id"], {"state": "paused"})
    return {"ok": True, "released": True}


def get_lock(case_id):
    lock_path = get_lock_path(case_id)
    if lock_path.exists():
        return json.loads(lock_path.read_text())
    return None
```

---

## Auto-Save

```python
def schedule_auto_save(interval_minutes):
    """Called once at init. Fires auto_save() on interval."""
    interval_ms = interval_minutes * 60 * 1000
    set_recurring_timer(interval_ms, auto_save)


def auto_save():
    case = get_active_case()
    if not case:
        return {"saved": False, "reason": "no_active_case"}

    if not has_unsaved_changes(case):
        return {"saved": False, "reason": "no_changes"}

    # Skip if workspace is locked by external process
    lock = get_lock(case["case_id"])
    if lock and lock["owner"] != current_process_id():
        return {"saved": False, "reason": "locked"}

    ws_path = get_ws_path(case["case_id"])
    checksum = sha256_of(case)
    payload = {"case": case, "saved_at": now(), "checksum": checksum, "auto_save": True}

    if CONFIG["compression_enabled"]:
        payload = compress_gzip(payload)

    ws_path.write_text(json.dumps(payload, indent=2))

    case["workspace_metadata"]["last_auto_save"] = now()
    prune_embedded_auto_saves(case)

    notify("Workspace auto-saved")
    ledger("WORKSPACE_SAVED", details={"auto": True})
    return {"saved": True, "path": str(ws_path)}


def prune_embedded_auto_saves(case):
    """Keep only the N most recent auto-save markers in workspace_metadata."""
    meta = case.setdefault("workspace_metadata", {})
    saves = meta.get("auto_save_history", [])
    saves.append({"ts": now()})
    if len(saves) > CONFIG["max_auto_saves"]:
        saves = saves[len(saves) - CONFIG["max_auto_saves"]:]
    meta["auto_save_history"] = saves


def has_unsaved_changes(case):
    ws_path = get_ws_path(case["case_id"])
    if not ws_path.exists():
        return True
    try:
        saved = json.loads(ws_path.read_text())
        if saved.get("compressed"):
            saved = decompress_gzip(saved)
        return sha256_of(case) != saved.get("checksum")
    except Exception:
        return True
```

---

## Workspace Statistics

```python
# Command
/workspace stats
```

```python
def workspace_stats():
    case = get_active_case()
    meta = case.get("workspace_metadata", {})

    return {
        "duration":      format_duration(meta.get("duration_seconds", 0)),
        "subjects":      {"total": len(case["subjects"]),
                          "by_type": count_by(case["subjects"], "type")},
        "connections":   {"total": len(case["connections"]),
                          "by_type": count_by(case["connections"], "type")},
        "activity": {
            "queries":          meta.get("query_count", 0),
            "subjects_added":   meta.get("subject_add_count", 0),
            "subjects_updated": meta.get("subject_update_count", 0),
            "connections_added":meta.get("connection_add_count", 0),
        },
        "persistence": {
            "saves":          meta.get("save_count", 0),
            "loads":          meta.get("load_count", 0),
            "last_auto_save": meta.get("last_auto_save"),
            "snapshots":      case.get("snapshot_count", 0),
        },
    }
```

---

## Workspace Comparison

```python
# Command
/workspace diff [save1] [save2]

# Examples
/workspace diff                         # current vs last save
/workspace diff "Phase 1" "Phase 2"     # compare two named snapshots
```

```python
def compare_workspaces(label1, label2):
    snap1 = load_snapshot_by_label(label1)
    snap2 = load_snapshot_by_label(label2)

    diff = {
        "snapshots":   {"a": label1, "b": label2},
        "subjects":    {"added": [], "removed": [], "modified": [], "unchanged": []},
        "connections": {"added": [], "removed": [], "modified": []},
    }

    map1 = {s["id"]: s for s in snap1["subjects"]}
    map2 = {s["id"]: s for s in snap2["subjects"]}

    for sid, subj in map2.items():
        if sid not in map1:
            diff["subjects"]["added"].append(subj)

    for sid, subj in map1.items():
        if sid not in map2:
            diff["subjects"]["removed"].append(subj)
        elif map2[sid] != subj:
            diff["subjects"]["modified"].append({
                "subject": map2[sid],
                "changes": field_diff(subj, map2[sid]),
            })
        else:
            diff["subjects"]["unchanged"].append(subj)

    return diff
```

---

## Encryption Helpers

```python
def encrypt_chacha20(data, password):
    """ChaCha20-Poly1305 with Argon2id key derivation."""
    salt    = generate_random_bytes(32)
    key     = argon2id_derive(password, salt,
                              memory_kb=65536, iterations=3, parallelism=4)
    nonce   = generate_random_bytes(12)
    ct      = chacha20_poly1305_encrypt(json.dumps(data).encode(), key, nonce)

    return {
        "encrypted": True,
        "algorithm": "ChaCha20-Poly1305",
        "kdf":        "Argon2id",
        "kdf_params": {"memory_kb": 65536, "iterations": 3,
                       "parallelism": 4, "salt": b64(salt)},
        "nonce":      b64(nonce),
        "ciphertext": b64(ct),
    }


def decrypt_chacha20(payload, password):
    salt  = b64d(payload["kdf_params"]["salt"])
    p     = payload["kdf_params"]
    key   = argon2id_derive(password, salt,
                            memory_kb=p["memory_kb"],
                            iterations=p["iterations"],
                            parallelism=p["parallelism"])
    nonce = b64d(payload["nonce"])
    ct    = b64d(payload["ciphertext"])
    plain = chacha20_poly1305_decrypt(ct, key, nonce)
    return json.loads(plain)
```

---

## Session Comparison

Compare two named workspaces (or snapshots) to surface investigative deltas.

### Command

```
/workspace diff <name_1> <name_2>
```

### Behavior

1. Load both workspace JSON files by name (searches index by `name` field)
2. Diff subjects: identify added, removed, and modified entries by `subject_id`
3. Diff connections: identify added and removed edges by `(from_id, to_id, type)` tuple
4. Diff findings: identify added, removed, and modified findings by `finding_id`
5. Render ASCII output

### Implementation

```python
def diff_workspaces(name_1, name_2):
    ws1 = load_workspace_by_name(name_1)
    ws2 = load_workspace_by_name(name_2)

    subjects_a   = {s["id"]: s for s in ws1["subjects"]}
    subjects_b   = {s["id"]: s for s in ws2["subjects"]}
    findings_a   = {f["id"]: f for f in ws1.get("findings", [])}
    findings_b   = {f["id"]: f for f in ws2.get("findings", [])}
    conns_a      = {(c["from"], c["to"], c["type"]) for c in ws1.get("connections", [])}
    conns_b      = {(c["from"], c["to"], c["type"]) for c in ws2.get("connections", [])}

    return {
        "subjects": {
            "added":    [subjects_b[i] for i in subjects_b if i not in subjects_a],
            "removed":  [subjects_a[i] for i in subjects_a if i not in subjects_b],
            "modified": [subjects_b[i] for i in subjects_b
                         if i in subjects_a and subjects_b[i] != subjects_a[i]],
        },
        "connections": {
            "added":   list(conns_b - conns_a),
            "removed": list(conns_a - conns_b),
        },
        "findings": {
            "added":    [findings_b[i] for i in findings_b if i not in findings_a],
            "removed":  [findings_a[i] for i in findings_a if i not in findings_b],
            "modified": [findings_b[i] for i in findings_b
                         if i in findings_a and findings_b[i] != findings_a[i]],
        },
    }
```

### ASCII Output Template

```
━━━ WORKSPACE DIFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A: [name_1]   B: [name_2]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBJECTS
  + [count] added:    [id] [type] [label], ...
  - [count] removed:  [id] [type] [label], ...
  ~ [count] modified: [id] [field changed], ...

CONNECTIONS
  + [count] added:    [from] ──[type]──► [to], ...
  - [count] removed:  [from] ──[type]──► [to], ...

FINDINGS
  + [count] added:    [F-id] [type] trust:[score], ...
  - [count] removed:  [F-id] [type], ...
  ~ [count] modified: [F-id] [field changed], ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Command Reference

| Command                     | Description                               |
| --------------------------- | ----------------------------------------- |
| `/workspace save`           | Save active case to disk                  |
| `/workspace open`           | Open a saved workspace                    |
| `/workspace list`           | List all workspaces (filterable by state) |
| `/workspace archive`        | Move workspace to archived state          |
| `/workspace lock`           | Acquire write lock on workspace           |
| `/workspace unlock`         | Release write lock                        |
| `/workspace stats`          | Show active workspace statistics          |
| `/workspace diff`           | Compare two snapshots or saves            |
| `/workspace diff <n1> <n2>` | Cross-workspace session comparison        |
