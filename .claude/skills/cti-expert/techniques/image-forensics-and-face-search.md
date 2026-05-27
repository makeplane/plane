# Image Forensics & Face Search Module

> **Module ID:** IMG-FORENS-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Image Forensics, Face Recognition & Photo Geolocation

---

## 1. Overview

Image forensics and face recognition for OSINT investigations. Covers reverse image search, face matching across social platforms, manipulation detection via error level analysis, EXIF GPS extraction, and AI-powered photo geolocation. Use when an image is the primary evidence artifact and you need to establish authenticity, origin, subject identity, or capture location.

**Key use cases:** Verifying media authenticity, identifying persons from photographs, geolocating images to physical coordinates, detecting photo manipulation in disinformation campaigns, tracing image provenance.

---

## 2. Tool Inventory

All tools below are free to use with no API key or account required for basic searches.

### 2.1 FaceCheck.id — Face-to-Profile Search

**URL:** https://facecheck.id/

Upload a face photo to find matching social profiles, blogs, and news articles. Best free face search engine as of 2025 — indexes social media, personal sites, and news sources. Web-based, no install required.

- **Usage:** Upload image via browser or paste URL → results list matching faces with source URLs
- **Strength:** Cross-platform identity correlation from a single face crop
- **Limitation:** Requires a clear, front-facing face crop for highest match rate

### 2.2 FotoForensics — Error Level Analysis

**URL:** https://fotoforensics.com/

Detects image manipulation by analyzing compression artifact inconsistencies (ELA). Web-based, no install.

- **Usage:** Upload image → view ELA heatmap; edited regions show higher error levels than surrounding areas
- **Strength:** Reliable for detecting JPEG re-saves and pixel-level edits
- **Limitation:** Only meaningful on JPEG; lossless PNG/BMP require noise analysis instead

### 2.3 Forensically — Digital Forensics Suite

**URL:** https://29a.ch/photo-forensics/

Browser-based suite providing: clone detection, noise analysis, ELA, luminance gradient, JPEG analysis, magnifier, and metadata viewer. No install, drag-and-drop interface.

- **Usage:** Open in browser → drag image onto canvas → select analysis tool from left panel
- **Strength:** Clone detection catches copy-paste manipulation that ELA misses
- **Limitation:** Browser processes locally; large images may be slow on low-spec hardware

### 2.4 picarta.ai — AI Photo Geolocation

**URL:** https://www.picarta.ai/

AI model predicts where a photo was taken using visual clues (architecture, vegetation, signage, terrain, lighting). Returns predicted GPS coordinates with confidence score.

- **Usage:** Upload photo → receive predicted latitude/longitude + confidence percentage
- **Strength:** Works on outdoor scenes with distinctive environmental features
- **Limitation:** Low confidence on indoor, featureless, or heavily cropped images

### 2.5 GeoSpy — AI Location Prediction

**URL:** https://geospy.web.app/

Alternative AI-powered photo geolocation. Independent model from picarta — run both for cross-validation.

- **Usage:** Upload photo → receive location estimate with map pin
- **Strength:** Good on urban environments; cross-validates picarta results
- **Limitation:** Accuracy degrades sharply on rural or non-Western locations

### 2.6 Pic2Map — EXIF GPS Extractor

**URL:** https://www.pic2map.com/

Extracts GPS coordinates from photo EXIF metadata and displays the result on an interactive map. No install.

- **Usage:** Upload photo → if EXIF GPS data is present, shows exact capture location on map
- **Strength:** Authoritative if GPS is present — direct device-recorded coordinates
- **Limitation:** Social media platforms strip EXIF on upload; downloaded images often have no GPS

### 2.7 TinEye — Reverse Image Search

**URL:** https://tineye.com/

Reverse image search engine. Finds all indexed instances of an image across the web, tracks modifications, and identifies the oldest known publication.

- **Usage:** Upload image or paste URL → results list matching pages sortable by date or image size
- **Strength:** Best tool for provenance dating — "Oldest" sort finds first appearance
- **Limitation:** Does not index all web content; absence of result does not confirm originality

---

## 3. Investigation Workflow

```
Step 1: EXIF extraction — establish metadata baseline
  └─ Upload to Pic2Map or run exiftool locally
  └─ If GPS present → geolocate immediately, record coordinates
  └─ Check DateTimeOriginal, Make/Model, Software fields
  └─ If Software shows Photoshop/GIMP → flag as post-processed; proceed to Step 5

Step 2: Reverse image search — establish provenance
  └─ Submit to TinEye; sort results by "Oldest" to find first publication
  └─ Record earliest date and source URL as provenance anchor
  └─ If multiple versions exist → crop distinctive background region and re-search

Step 3: Face search — identify subjects (if face visible)
  └─ Crop face region tightly (eyes/nose/mouth visible)
  └─ Upload to FaceCheck.id → review matched profiles
  └─ Cross-reference matched identities with other OSINT subjects in case model

Step 4: AI geolocation — locate capture scene (if location unknown)
  └─ Submit full image to picarta.ai → record predicted coordinates + confidence
  └─ Cross-validate with GeoSpy → note agreement or divergence
  └─ Verify predicted location against Google Street View or Mapillary
  └─ Low confidence (<50%) → flag as unverified; do not treat as confirmed

Step 5: Manipulation detection — assess authenticity (if authenticity questioned)
  └─ FotoForensics ELA → bright irregular regions indicate editing
  └─ Forensically clone detection → repeated texture patches indicate copy-paste
  └─ Forensically noise analysis → inconsistent noise grain indicates splicing
  └─ Document each finding with screenshot of analysis output
```

---

## 4. CLI Commands & Expected Output

```bash
# EXIF extraction — local (requires exiftool)
# Install: apt install libimage-exiftool-perl
exiftool -GPSLatitude -GPSLongitude -GPSAltitude -DateTimeOriginal -Make -Model -Software target.jpg

# Expected output (GPS present):
# GPS Latitude                    : 48 deg 51' 29.95" N
# GPS Longitude                   : 2 deg 17' 40.73" E
# GPS Altitude                    : 35.1 m Above Sea Level
# Date/Time Original              : 2024:03:15 14:22:07
# Make                            : Apple
# Model                           : iPhone 15 Pro
# Software                        : 17.3.1

# Expected output (GPS stripped):
# Date/Time Original              : 2024:03:15 14:22:07
# Make                            : samsung
# Model                           : SM-G998B
# Software                        : Adobe Photoshop 25.0 (Windows)
# (No GPS fields — stripped on upload or disabled at capture)

# Full EXIF dump to JSON
exiftool -json target.jpg > target_exif.json

# Strip EXIF before sharing (privacy)
exiftool -all= -o clean_output.jpg target.jpg

# Batch process a directory
exiftool -r -GPSLatitude -GPSLongitude /path/to/images/
```

---

## 5. Analysis & Interpretation Guidance

### ELA Interpretation

Error Level Analysis re-saves the image at a known compression level and computes the difference from the original. Regions that were edited (then re-saved) show higher residual error — appearing brighter in the ELA heatmap.

| ELA Pattern                                    | Interpretation                         |
| ---------------------------------------------- | -------------------------------------- |
| Uniform brightness across entire image         | Likely original, single-save           |
| Isolated bright patches on faces/objects       | Probable element insertion or removal  |
| Bright rectangular block                       | Cropped and re-pasted region           |
| Uniform bright overlay on whole image          | Heavy re-compression; ELA inconclusive |
| Text with different brightness from background | Text added in post-processing          |

**Caution:** ELA is not definitive proof. Multiple JPEG saves (WhatsApp, social media re-upload) produce bright regions without manipulation. Combine with clone detection and provenance for a confident verdict.

### Clone Detection Interpretation

Clone detection finds copy-pasted regions within the same image — a technique used to add, remove, or duplicate objects.

- Highlighted overlapping regions with connecting lines = copy-paste detected
- Common use: duplicating crowd to appear larger, removing objects, filling gaps after deletion

### AI Geolocation Confidence Tiers

| Confidence                   | Action                                             |
| ---------------------------- | -------------------------------------------------- |
| >80%                         | Treat as probable location; verify via Street View |
| 50–80%                       | Cross-validate with second tool (GeoSpy)           |
| <50%                         | Flag as unverified; note in findings               |
| Both tools agree within 10km | Elevate to HIGH confidence                         |
| Tools diverge >50km          | Treat as unresolved; note both estimates           |

### EXIF Software Field Indicators

| Software Value                 | Interpretation                                         |
| ------------------------------ | ------------------------------------------------------ |
| Camera firmware (e.g., `v1.4`) | Likely unmodified                                      |
| `Adobe Photoshop`              | Post-processed                                         |
| `GIMP`                         | Post-processed (open source)                           |
| `Affinity Photo`               | Post-processed                                         |
| `WhatsApp`                     | Re-encoded by app; EXIF likely stripped                |
| Absent                         | Stripped — could be intentional or social media upload |

---

## 6. Confidence Ratings

| Finding                   | Confidence  | Notes                                        |
| ------------------------- | ----------- | -------------------------------------------- |
| EXIF GPS coordinates      | HIGH        | Device-recorded; verify not spoofed          |
| TinEye provenance date    | HIGH        | Indexed crawl timestamp                      |
| FaceCheck.id match        | MEDIUM-HIGH | Depends on face quality and index coverage   |
| ELA manipulation evidence | MEDIUM      | Inconclusive without corroboration           |
| AI geolocation >80%       | MEDIUM      | Visual inference; verify against Street View |
| AI geolocation <50%       | LOW         | Directional only; do not treat as confirmed  |
| Clone detection finding   | HIGH        | Mathematical pattern match                   |

---

## 7. Related Techniques

- [fx-image-verification.md](fx-image-verification.md) — Sun/shadow analysis and reverse search provenance workflow
- [fx-metadata-parsing.md](fx-metadata-parsing.md) — Full EXIF field reference and extraction
- [fx-geolocation.md](fx-geolocation.md) — Convert extracted GPS coordinates to location intelligence
- [advanced-geolocation-techniques.md](advanced-geolocation-techniques.md) — Landmark-based manual geolocation

---

_Image Forensics & Face Search Module v1.0.0_
_Part of CTI Expert Skill - Phase 5 Enhancement Modules_
