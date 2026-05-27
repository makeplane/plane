# fx-image-verification

## Purpose

Determine whether an image is authentic, original, or manipulated by running reverse search first (provenance), then EXIF cross-validation, then shadow/sun consistency analysis.

## Quick Reference

| Item       | Detail                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- |
| Command    | /verify-image                                                                            |
| Input      | Image file or URL                                                                        |
| Output     | Authenticity verdict with findings chain                                                 |
| Confidence | HIGH for exact reverse search match or EXIF/sun cross-validation; MEDIUM for visual-only |

## Methodology

### Step 1 — Reverse Search (Provenance First)

1. Upload full image to Google Images, TinEye, and Yandex Images simultaneously
2. Record earliest publication date found across all engines — this is the provenance anchor
3. Note all contexts in which the image appears; flag mismatched captions
4. If multiple versions exist, crop distinctive background features and re-search to identify original
5. If no match: image may be original, very recent, or sourced from non-indexed channels

### Step 2 — EXIF Cross-Validation

6. Run `exiftool -DateTimeOriginal -GPSLatitude -GPSLongitude -Make -Model -Software target.jpg`
7. Compare `DateTimeOriginal` to earliest reverse search publication date — EXIF should precede publication
8. Map GPS coordinates (if present) to claimed location; discrepancy = finding
9. Check `Software` field: presence of Photoshop, GIMP, or Affinity Photo indicates post-processing

### Step 3 — Shadow and Sun Analysis

10. Identify reference objects with known height (people, vehicles, poles)
11. Measure shadow azimuth using image editor angle tool
12. Calculate expected sun azimuth at the claimed location, date, and time using suncalc.org
13. Compare measured vs expected: >15° divergence warrants flagging
14. Verify all shadows in-frame share a consistent single vanishing point

## Reverse Search Engine Comparison

| Engine        | Strength                    | Best Use                          |
| ------------- | --------------------------- | --------------------------------- |
| TinEye        | Oldest-version tracking     | Finding original publication date |
| Google Images | Largest index               | Broadest match coverage           |
| Yandex        | Face and object recognition | Non-Western sources; faces        |
| Bing Visual   | Microsoft ecosystem         | Alternative index coverage        |
| Baidu         | Chinese-language web        | China-region content              |

## Tools & Fallbacks

| Priority | Tool          | Install                              | Notes                                                |
| -------- | ------------- | ------------------------------------ | ---------------------------------------------------- |
| 1        | TinEye        | tineye.com                           | Best for provenance dating                           |
| 2        | Google Images | images.google.com                    | Widest coverage                                      |
| 3        | Yandex Images | yandex.com/images                    | Strong face recognition                              |
| 4        | exiftool      | `apt install libimage-exiftool-perl` | EXIF extraction                                      |
| 5        | suncalc.org   | Browser                              | Solar position at claimed time/place                 |
| 6        | FotoForensics | fotoforensics.com                    | ELA (Error Level Analysis) for compression artifacts |

## Output Format

```
Image: photo_claim.jpg

Provenance (Reverse Search):
  Earliest match: 2023-08-14 via news.bbc.co.uk
  Context on source: Syrian conflict, Idlib, August 2023
  Claimed context: Ukraine, 2025
  Verdict: MISATTRIBUTED

EXIF Findings:
  DateTimeOriginal: 2023:08:14 11:30:00
  GPS:              ABSENT
  Software:         None detected
  Device:           Apple iPhone 13

Shadow Analysis: N/A — overcast conditions in image, no shadows

Final Verdict: NOT AUTHENTIC FOR CLAIMED CONTEXT
Confidence: HIGH (reverse search date predates claimed event by 18 months)
```

## Limitations

- No reverse search engine indexes the full web; absence of match does not confirm authenticity
- EXIF timestamps and GPS are erasable and forgeable; manipulated metadata passes tool checks
- Shadow analysis requires clear shadows and known reference dimensions — low-light or indoor images yield no data
- Expert-level AI compositing leaves no detectable EXIF anomalies
- Social media platforms strip EXIF on upload — downloaded images often lack GPS data

## Related Techniques

- [fx-metadata-parsing.md](fx-metadata-parsing.md) — full EXIF field reference and extraction
- [fx-geolocation.md](fx-geolocation.md) — convert extracted GPS coordinates to location finding
- [fx-document-forensics.md](fx-document-forensics.md) — verify images embedded within documents
