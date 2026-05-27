# IOC Export

Spec for exporting Indicators of Compromise (IOCs) from a case in machine-readable formats for threat intel sharing and tooling ingestion.

---

## Command

```
/report ioc [--format stix|flat|csv]
```

**Options:**

| Option          | Default | Description                         |
| --------------- | ------- | ----------------------------------- |
| `--format stix` | —       | STIX 2.1 JSON bundle                |
| `--format flat` | —       | One IOC per line with type prefix   |
| `--format csv`  | —       | Structured CSV with metadata fields |

Default format when `--format` is omitted: `flat`.

---

## IOC Type Mapping

Subjects and findings are mapped to STIX 2.1 SCO (Cyber Observable) types:

| Internal Type    | STIX 2.1 Type           | Flat Prefix | Notes                                                 |
| ---------------- | ----------------------- | ----------- | ----------------------------------------------------- |
| NETWORK_ADDR     | `ipv4-addr`             | `ip:`       | IPv6 maps to `ipv6-addr`                              |
| DOMAIN           | `domain-name`           | `domain:`   |                                                       |
| URL              | `url`                   | `url:`      |                                                       |
| EMAIL            | `email-addr`            | `email:`    |                                                       |
| FILE_HASH_MD5    | `file` (hashes.MD5)     | `md5:`      |                                                       |
| FILE_HASH_SHA1   | `file` (hashes.SHA-1)   | `sha1:`     |                                                       |
| FILE_HASH_SHA256 | `file` (hashes.SHA-256) | `sha256:`   |                                                       |
| USERNAME         | — (custom)              | `handle:`   | Not a native STIX SCO; use `x-osint-handle` extension |

Only subjects with `confidence >= 60` and `verified = true` are included by default. Pass `--min-confidence <n>` to override.

---

## STIX 2.1 Bundle Template

```json
{
  "type": "bundle",
  "id": "bundle--{uuid4}",
  "spec_version": "2.1",
  "objects": [
    {
      "type": "identity",
      "spec_version": "2.1",
      "id": "identity--{uuid4}",
      "created": "{ISO-8601}",
      "modified": "{ISO-8601}",
      "name": "cti-expert case {CASE_ID}",
      "identity_class": "system"
    },
    {
      "type": "ipv4-addr",
      "spec_version": "2.1",
      "id": "ipv4-addr--{uuid4}",
      "value": "{ip_address}"
    },
    {
      "type": "domain-name",
      "spec_version": "2.1",
      "id": "domain-name--{uuid4}",
      "value": "{domain}"
    },
    {
      "type": "url",
      "spec_version": "2.1",
      "id": "url--{uuid4}",
      "value": "{url}"
    },
    {
      "type": "email-addr",
      "spec_version": "2.1",
      "id": "email-addr--{uuid4}",
      "value": "{email}"
    },
    {
      "type": "file",
      "spec_version": "2.1",
      "id": "file--{uuid4}",
      "hashes": {
        "SHA-256": "{hash_value}"
      },
      "name": "{filename_if_known}"
    },
    {
      "type": "indicator",
      "spec_version": "2.1",
      "id": "indicator--{uuid4}",
      "created": "{ISO-8601}",
      "modified": "{ISO-8601}",
      "created_by_ref": "identity--{identity_uuid}",
      "name": "{indicator_label}",
      "pattern": "[{stix_type}:value = '{ioc_value}']",
      "pattern_type": "stix",
      "valid_from": "{first_seen_ISO}",
      "confidence": {confidence_0_100},
      "labels": ["{finding_type}", "{weight_lower}"]
    }
  ]
}
```

One `indicator` object is generated per IOC, referencing the corresponding SCO via `pattern`.

---

## Flat IOC List Template

One IOC per line. Format: `{prefix}:{value}` — compatible with most SIEM ingest pipelines.

```
# cti-expert IOC export — Case: {CASE_ID} — {YYYY-MM-DD}
# Fields: type:value
ip:203.0.113.45
ip:198.51.100.12
domain:malicious-example.net
domain:c2.attacker-infra.io
url:https://malicious-example.net/payload.php
email:phishing@spoofed-domain.com
md5:d41d8cd98f00b204e9800998ecf8427e
sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
handle:threat_actor_handle
```

---

## CSV Template

```csv
type,value,first_seen,last_seen,confidence,source
ip,203.0.113.45,2026-01-15T08:00Z,2026-03-20T14:30Z,85,FND-012
domain,malicious-example.net,2026-01-10T00:00Z,,90,FND-008
url,https://malicious-example.net/payload.php,2026-02-01T12:00Z,,75,FND-015
email,phishing@spoofed-domain.com,2026-01-20T09:00Z,2026-03-01T00:00Z,80,FND-003
sha256,e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,2026-02-14T00:00Z,,70,FND-021
```

**Column definitions:**

| Column       | Source                                     | Notes                      |
| ------------ | ------------------------------------------ | -------------------------- |
| `type`       | IOC type mapping table above               | flat prefix value          |
| `value`      | subject.value                              | normalized                 |
| `first_seen` | finding.collected_at or subject.first_seen | ISO-8601                   |
| `last_seen`  | most recent finding using this IOC         | ISO-8601; blank if unknown |
| `confidence` | subject.confidence                         | 0–100                      |
| `source`     | finding.id that introduced this IOC        | `FND-NNN`                  |

---

## Output Files

Auto-saved alongside the case report per `output/reports/export-specs.md` auto-save rule:

```
IOC-{CASE_ID}-{YYYY-MM-DD}.stix.json   # STIX bundle
IOC-{CASE_ID}-{YYYY-MM-DD}.txt         # flat list
IOC-{CASE_ID}-{YYYY-MM-DD}.csv         # CSV
```

---

## Cross-References

- `output/reports/export-specs.md` — IOC format row in format options table
- `engine/subject-registry.md` — subject type definitions and confidence fields
- `engine/finding-framework.md` — finding types used as STIX indicator labels
