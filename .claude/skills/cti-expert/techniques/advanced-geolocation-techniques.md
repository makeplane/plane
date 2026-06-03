# Advanced Geolocation Techniques Module

> **Module ID:** GEO-ADV-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Tactical Geolocation & Visual Intelligence

---

## 1. Overview

Advanced geolocation techniques beyond basic EXIF/GPS extraction. Covers coordinate systems (W3W, Plus Codes, MGRS), visual matching (Street View, road signs, architecture), spatial queries (Overpass Turbo), and specialized search techniques (Baidu, cropped regions, reflected text).

---

## 2. What3Words (W3W) Geolocation

Divides the world into 3m x 3m squares, each with a unique 3-word English address.

**Website:** https://what3words.com/

### Workflow

1. Identify location using standard techniques (reverse image search, landmarks, signs)
2. Get precise GPS coordinates from Google Maps satellite view
3. Convert coordinates to W3W on the website (enter coords in search bar)
4. Fine-tune — the exact 3m square matters; shift coordinates by small amounts to check adjacent squares

### Precision Pitfalls

- **3m precision matters:** Building entrance vs. parking lot = different W3W address
- **Camera position vs. subject:** W3W may refer to where the camera IS, not what it's pointed at
- **Satellite vs. street-level alignment:** Google Maps pin may not perfectly match W3W grid

### Pinpointing Tips

- Use Google Street View to match exact camera angle
- Cross-reference with OpenStreetMap for precise building footprints
- Try 5-10 adjacent W3W addresses around best guess
- **Micro-landmark matching:** Identify small features (utility poles, bollards, planters) and locate in Street View
- **Background building triangulation:** Match background buildings from challenge image angle in Street View

---

## 3. Google Plus Codes / Open Location Codes

Free alternative to street addresses, built into Google Maps.

**Format:** `XXXX+XX` (short/local) or `8FVC9G8F+6W` (full/global). Characters: `23456789CFGHJMPQRVWX`. The `+` separator is always present.

### How to Generate

1. Find location on Google Maps
2. Click map to drop pin at exact spot
3. Plus Code appears in location details panel (e.g., `H9G2+47X Handan, Hebei, China`)

**Precision:** Standard Plus Codes resolve to ~14m x 14m areas. Unlike W3W (proprietary, requires API key), Plus Codes are free.

**Reference:** https://maps.google.com/pluscodes/

---

## 4. MGRS (Military Grid Reference System)

Grid-based coordinate system used by military. Format: `4V FH 246 677`.

**Identification:** Grid format with zone designator + 100km square + numeric coordinates.

**Conversion:** Use online MGRS converter → lat/long → Google Maps.

---

## 5. Google Street View Panorama Matching

Match a challenge image to a specific Street View panorama.

### Approach

1. **Extract visual features:** Distinctive landmarks (road type, vehicles, mountain shapes, building styles)
2. **Narrow the region:** Use visual clues to identify country/region
3. **Compile candidate panoramas:** Use Street View coverage maps for the identified region
4. **Feature matching with OpenCV:**

```python
import cv2

challenge = cv2.imread('challenge.jpg')
candidate = cv2.imread('panorama.jpg')

orb = cv2.ORB_create(nfeatures=5000)
kp1, des1 = orb.detectAndCompute(challenge, None)
kp2, des2 = orb.detectAndCompute(candidate, None)

bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
matches = bf.match(des1, des2)
score = sum(1 for m in matches if m.distance < 50)
```

5. **Multi-metric ranking:** Combine feature match, color histogram, local patch comparison
6. **Verify:** Match panorama ID with coordinates

### Key Insights

- Challenge images are often crops — may lack horizon/sky
- Distinctive elements: road surface, vehicle makes, signage language, utility poles
- Limited coverage areas (Greenland, Iceland, Faroe Islands) — enumerate all panoramas
- Multiple scoring metrics more robust than any single method

---

## 6. Road Sign & Driving Side Analysis

### Country Identification Shortcuts

| Feature                      | Country/Region                    |
| ---------------------------- | --------------------------------- |
| Kanji + blue highway signs   | Japan                             |
| Cyrillic + wide boulevards   | Russia/CIS                        |
| White X-shape crossing signs | Canada                            |
| Yellow diamond warning signs | USA/Canada                        |
| Green autobahn signs         | Germany                           |
| Brown tourist signs          | France                            |
| Bollards with red reflectors | Netherlands                       |
| Left-hand traffic            | Japan, UK, Australia, India, etc. |

### Systematic Approach

1. **Driving side:** Left-hand traffic → right-hand drive countries
2. **Sign language/script:** Kanji → Japan; Cyrillic → Russia/CIS; Arabic → Middle East/North Africa
3. **Road sign style:** Color + text layout identifies specific highway systems
4. **Sign OCR:** Extract text from directional signs for town/city names
5. **Route tracing:** Search route number + town names for road corridor
6. **Terrain matching:** Match coastline, harbors, landmarks against satellite view

---

## 7. Post-Soviet Architecture & Brand Identification

### Visual Markers

- Panel apartment blocks (khrushchyovka/brezhnevka)
- Wide boulevards with central medians
- Concrete bus stops, Soviet-era monuments and mosaics
- Distinctive utility pole designs

### Restaurant/Brand Geolocation

1. Identify readable business name or brand logo
2. Search business + "locations" or "branches"
3. Cross-reference with other visual clues (coastline, terrain) to pinpoint exact branch
4. Google Maps business search is effective for named establishments

---

## 8. Google Lens Cropped Region Search

Google Lens performs significantly better on cropped regions than full-scene images.

### When to Crop

| Element            | Crop Strategy                          |
| ------------------ | -------------------------------------- |
| Shop fronts        | Just the storefront and signage        |
| Landmarks          | Distinctive architectural feature only |
| Signs              | Just the sign text                     |
| Churches/buildings | Unique facade portion                  |

### Workflow

1. Identify most distinctive element in image
2. Crop to isolate that element — remove surrounding noise
3. Search cropped region via Google Lens
4. Review results to identify specific location/business

---

## 9. Reflected & Mirrored Text Reading

### Technique

1. Identify reflected text (water reflections, glass surfaces, mirrors)
2. Flip image horizontally:

```bash
# ImageMagick
convert input.jpg -flop flipped.jpg

# Python/PIL
python3 -c "
from PIL import Image
img = Image.open('input.jpg')
img.transpose(Image.FLIP_LEFT_RIGHT).save('flipped.jpg')
"
```

3. If partially obscured, search readable portion as prefix:
   - `"Aguas de Lind"` → finds "Aguas de Lindoia"
4. Try both variants for ambiguous letters (e.g., "T" vs "I")

---

## 10. Monumental Letters / Letreiro Identification

Large 3D letters spelling city/location names — common tourist landmarks in Latin America.

**Clues:** Large colorful 3D block letters, main plaza or tourist area, reflection in decorative water pool.

**Search:** `"letras monumentales" [city]` or `"letreiro turístico" [city]`; Google Maps `[city] sign` or `[city] letters`.

---

## 11. Google Maps Crowd-Sourced Photo Verification

Verify a candidate location by matching against user-submitted Google Maps photos.

### Workflow

1. Identify candidate location from other OSINT clues
2. Search location name on Google Maps
3. Browse the **Photos** tab (user-submitted images)
4. Compare scene elements against challenge image
5. Match confirms location

**When to use:** After narrowing via non-visual OSINT (fitness routes, addresses, social connections). Especially useful for parks, plazas, landmarks where many tourists upload photos.

---

## 12. Overpass Turbo Spatial Queries

Query OpenStreetMap data to locate POIs by type within radius of other POIs.

**Tool:** https://overpass-turbo.eu/

### Example — Newsagents near metro entrances in Barcelona

```text
[out:json][timeout:25];
{{geocodeArea:Barcelona}}->.searchArea;

(
  node["railway"="subway_entrance"](area.searchArea);
)->.metros;

(
  node(around.metros:10)["shop"~"newsagent|kiosk"];
  way(around.metros:10)["shop"~"newsagent|kiosk"];
);

out body;
>;
out skel qt;
```

### Common Query Patterns

```text
# Cafes near train stations
{{geocodeArea:CityName}}->.a;
node["railway"="station"](area.a)->.stations;
node(around.stations:50)["amenity"="cafe"];

# Hotels near a coordinate
node(around:200,48.8566,2.3522)["tourism"="hotel"];
```

### Key OSM Tags

| Tag       | Values                                          |
| --------- | ----------------------------------------------- |
| `shop`    | `newsagent`, `kiosk`, `bakery`, `supermarket`   |
| `amenity` | `cafe`, `restaurant`, `bank`, `atm`, `pharmacy` |
| `tourism` | `hotel`, `attraction`, `museum`, `viewpoint`    |
| `railway` | `station`, `subway_entrance`, `halt`            |

The `around` operator (proximity filter) replaces hours of manual map browsing.

---

## 13. Reverse Image Search — Regional Engines

### Baidu Images for Chinese Locations

Best for Chinese locations — use when visual cues suggest China: blue license plates, simplified Chinese text, menlou gate architecture.

```
https://graph.baidu.com
```

### Engine Selection Guide

| Engine             | Best For                             |
| ------------------ | ------------------------------------ |
| Google Lens        | Landmarks, shops, signs (crop first) |
| TinEye             | Finding oldest/original version      |
| Yandex             | Faces, Eastern Europe                |
| Baidu              | Chinese locations                    |
| Bing Visual Search | Alternative results                  |

---

## 14. Confidence Ratings

| Technique                                 | Confidence | Notes                           |
| ----------------------------------------- | ---------- | ------------------------------- |
| W3W/Plus Code from verified location      | HIGH       | Depends on GPS precision        |
| MGRS conversion                           | HIGH       | Mathematical conversion         |
| Street View panorama match (multi-metric) | HIGH       | Multiple scoring methods        |
| Road sign country identification          | MEDIUM     | May have exceptions             |
| Overpass Turbo POI query                  | HIGH       | OSM data authoritative          |
| Google Lens cropped region match          | MEDIUM     | Depends on uniqueness           |
| Reflected text reading                    | MEDIUM     | Partial text, ambiguous letters |

---

_Advanced Geolocation Techniques Module v1.0.0_
_Part of Free OSINT Expert Skill - Phase 5_
