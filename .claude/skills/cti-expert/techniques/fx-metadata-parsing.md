# fx-metadata-parsing

## Purpose

Systematically extract and tabulate embedded metadata from files to surface authorship, device identity, timestamps, and location data without inspecting file content.

## Quick Reference

| Item       | Detail                                                         |
| ---------- | -------------------------------------------------------------- |
| Command    | /extract-meta                                                  |
| Input      | File path (image, PDF, Office doc, archive)                    |
| Output     | Normalized metadata table with confidence ratings              |
| Confidence | HIGH for hardware-generated fields; MEDIUM for user-set fields |

## Field Reference by Format

### Image (EXIF)

| Field                      | Category   | Forensic Value           | Forgeable |
| -------------------------- | ---------- | ------------------------ | --------- |
| GPSLatitude / GPSLongitude | Location   | Primary location finding | Difficult |
| DateTimeOriginal           | Time       | Capture timestamp anchor | Yes       |
| GPSTimeStamp               | Time       | UTC atomic clock reading | Difficult |
| Make / Model               | Device     | Hardware fingerprint     | Yes       |
| Software                   | Processing | Edit detection           | Yes       |
| BodySerialNumber           | Device     | Device tracking          | Yes       |
| OffsetTime                 | Time       | Timezone offset          | Yes       |

### PDF

| Field                     | Category | Forensic Value   | Forgeable |
| ------------------------- | -------- | ---------------- | --------- |
| Author / dc:creator       | Identity | Attribution      | Yes       |
| CreationDate              | Time     | Document origin  | Yes       |
| ModDate                   | Time     | Edit detection   | Yes       |
| Producer                  | Software | Conversion chain | Yes       |
| Creator (xmp:CreatorTool) | Software | Authoring app    | Yes       |

### Office (DOCX/XLSX)

| Field             | Source File | Forensic Value           |
| ----------------- | ----------- | ------------------------ |
| dc:creator        | core.xml    | Original author          |
| cp:lastModifiedBy | core.xml    | Most recent editor       |
| cp:revision       | core.xml    | Edit count               |
| dcterms:created   | core.xml    | Creation timestamp       |
| Template          | app.xml     | Internal template name   |
| Company           | app.xml     | Organization affiliation |
| TotalTime         | app.xml     | Cumulative edit duration |

## Methodology

1. Determine file type: `file target` (do not trust extension alone)
2. Run full extraction: `exiftool -a -u -g1 target > meta.txt`
3. For PDF additionally: `pdfinfo target.pdf` and `pdfdetach -list target.pdf`
4. For Office: `unzip -p target.docx docProps/core.xml` and `unzip -p target.docx docProps/app.xml`
5. Normalize all timestamps to ISO 8601 UTC
6. Flag inconsistencies: GPS UTC vs local DateTimeOriginal offset mismatch; Creator ≠ LastModifiedBy; CreationDate after ModDate
7. Cross-reference device serial numbers across multiple files in the same case
8. Rate each field confidence (HIGH/MEDIUM/LOW) based on forgability and source

## Tools & Fallbacks

| Priority | Tool            | Install                              | Notes                             |
| -------- | --------------- | ------------------------------------ | --------------------------------- |
| 1        | exiftool        | `apt install libimage-exiftool-perl` | Universal; handles all formats    |
| 2        | pdfinfo         | `apt install poppler-utils`          | PDF-specific; fast                |
| 3        | exiv2           | `apt install exiv2`                  | Image EXIF alternative            |
| 4        | oletools        | `pip3 install oletools`              | Legacy binary Office formats      |
| 5        | unzip + xmllint | Built-in                             | Manual Office XML parse           |
| 6        | mat2            | `apt install mat2`                   | Shows what metadata is strippable |

## Output Format

```
File: report_final.pdf

Field                  Value                           Confidence
─────────────────────────────────────────────────────────────────
Author                 j.harris@corp-internal.com      MEDIUM
Creator Tool           Microsoft Word for Mac 16.89    MEDIUM
PDF Producer           macOS Quartz PDFContext          HIGH
CreationDate           2025-10-04T11:32:00-04:00        HIGH
ModDate                2025-11-18T09:15:00-05:00        HIGH
Timezone Offset Change -04:00 → -05:00 (DST transition) HIGH

Anomalies:
  - Author email reveals internal domain (corp-internal.com)
  - Created on macOS, produced via Quartz (not Adobe)
  - Timezone shift consistent with US Eastern DST change
```

## Limitations

- All metadata fields accept arbitrary strings; values are findings, not facts
- Stripped files (mat2, Document Inspector) yield empty output — absence is informative
- Timezone fields absent from many older images; GPS UTC is the reliable anchor
- Camera serial numbers uniquely identify hardware but require a reference database to attribute
- Archive timestamps reflect the archiving system's clock, not the original file creation

## Related Techniques

- [fx-document-forensics.md](fx-document-forensics.md) — hidden content and redaction verification
- [fx-geolocation.md](fx-geolocation.md) — convert GPS fields into location findings
- [fx-image-verification.md](fx-image-verification.md) — cross-validate metadata against visual content
