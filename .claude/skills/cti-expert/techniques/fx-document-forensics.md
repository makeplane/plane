# fx-document-forensics

## Purpose

Extract authorship, creation chain, and hidden content from PDF and Office documents supplied by the operator. Findings reveal identity, software environment, and document lifecycle that subjects may not intend to disclose.

## Quick Reference

| Item       | Detail                                                          |
| ---------- | --------------------------------------------------------------- |
| Command    | /analyze-doc                                                    |
| Input      | Document file path or pasted metadata dump                      |
| Output     | Structured forensics finding report                             |
| Confidence | HIGH for direct metadata fields; MEDIUM for inferred authorship |

## Methodology

1. Identify format: PDF, DOCX/XLSX/PPTX, or legacy binary (.doc/.xls)
2. **PDF path:** Run `pdfinfo` for standard fields; run `exiftool -a` for XMP layer; run `pdfdetach -list` to surface embedded files
3. **Office path:** Unzip archive; parse `docProps/core.xml` (creator, lastModifiedBy, revision count, timestamps); parse `docProps/app.xml` (template, TotalTime, Company)
4. Compare `CreationDate` vs `ModDate` — gap indicates post-creation editing; check if author ≠ last modifier (multiple hands)
5. Check `Producer` field to reconstruct conversion chain (e.g., Word → PDF → re-saved in Acrobat)
6. Sweep for hidden content: run `pdftotext -layout` and compare character count to visible text; in DOCX check `word/revisions.xml` and `word/comments.xml`
7. Verify redactions: copy-paste test on black-box regions; if text extracts, redaction is cosmetic only
8. Merge findings into a timeline: creation → edits → conversions → final state

## Tools & Fallbacks

| Priority | Tool                 | Install                              | Notes                                     |
| -------- | -------------------- | ------------------------------------ | ----------------------------------------- |
| 1        | exiftool             | `apt install libimage-exiftool-perl` | Handles PDF + Office + images             |
| 2        | pdfinfo (Poppler)    | `apt install poppler-utils`          | Fast PDF metadata sweep                   |
| 3        | oletools             | `pip3 install oletools`              | OLE binary formats; macro detection       |
| 4        | qpdf                 | `apt install qpdf`                   | PDF structure inspection; unpack streams  |
| 5        | strings + grep       | Built-in                             | Fallback text extraction on corrupt files |
| 6        | LibreOffice headless | `apt install libreoffice`            | Convert to plain text for diff work       |

## Output Format

```
File: proposal.docx

Metadata Findings:
  Creator:          john.doe@corp.com
  Last Modified By: jane.smith@corp.com
  Revision:         14
  Created:          2025-11-03T09:12:00Z
  Modified:         2025-12-18T16:44:00Z
  Template:         CorpTemplate_v3.dotm
  Company:          Acme Corp
  TotalTime:        312 minutes

Anomalies:
  - Two distinct editors across 14 revisions
  - Template reveals internal naming convention
  - Redaction check: FAILED — 3 text spans selectable under black boxes
```

## Limitations

- Password-protected documents require cracking tools outside this technique's scope
- Metadata can be set to arbitrary values; treat as a finding to verify, not ground truth
- Stripped metadata (intentionally sanitized docs) yields minimal findings
- Legacy binary formats (.doc, .xls) require oletools; not all fields are recoverable
- Redaction verification only detects layer-based failures; pixel-level removal passes the test

## Related Techniques

- [fx-metadata-parsing.md](fx-metadata-parsing.md) — image EXIF and archive metadata
- [fx-image-verification.md](fx-image-verification.md) — verify embedded images within documents
- [fx-breach-discovery.md](fx-breach-discovery.md) — cross-reference author emails against known breaches
