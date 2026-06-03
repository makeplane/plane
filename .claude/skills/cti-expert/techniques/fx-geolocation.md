# fx-geolocation

## Purpose

Convert location artifacts (GPS coordinates, IP addresses, visual cues) into a confidence-tiered geographic finding. Structured from coarse city-level down to building-level resolution.

## Quick Reference

| Item       | Detail                                                                      |
| ---------- | --------------------------------------------------------------------------- |
| Command    | /geo-locate                                                                 |
| Input      | GPS coordinates, IP address, or image with location context                 |
| Output     | Location finding with accuracy tier and verification status                 |
| Confidence | HIGH for EXIF GPS; MEDIUM for IP geolocation; VARIABLE for visual inference |

## Accuracy Tiers

| Tier     | Resolution     | Source                  | Typical Accuracy                            |
| -------- | -------------- | ----------------------- | ------------------------------------------- |
| City     | ~10 km radius  | IP geolocation          | 80–90% correct country, 60–70% correct city |
| District | ~1 km radius   | Cell tower / WiFi       | Varies by urban density                     |
| Street   | ~50 m radius   | Network-assisted GPS    | Common for mobile photos                    |
| Building | ~3–10 m radius | Smartphone GPS hardware | Reliable in open sky                        |

## Methodology

1. **City tier — IP source:** Extract IP from available artifacts (email headers, access logs); query ipinfo.io or ip-api.com; record country, city, ASN
2. **Street tier — EXIF GPS:** Run `exiftool -GPSLatitude -GPSLongitude -GPSAltitude -GPSDateStamp` on image; convert DMS to decimal degrees if needed
3. Convert coordinates: `DD = Degrees + Minutes/60 + Seconds/3600`; apply N/S and E/W sign
4. Reverse geocode: `curl "https://nominatim.openstreetmap.org/reverse?format=json&lat=LAT&lon=LON&zoom=18"`
5. **Building tier — verification:** Open coordinates in Google Maps satellite view; confirm visible features match photo content
6. Cross-check sun position against claimed timestamp using suncalc.org — solar angle inconsistency invalidates claimed time/place
7. If EXIF absent, apply visual geolocation: identify landmarks, signage language, architectural style, vegetation type
8. Record accuracy tier, verification method, and any anomalies found

## Tools & Fallbacks

| Priority | Tool                  | Install                              | Notes                             |
| -------- | --------------------- | ------------------------------------ | --------------------------------- |
| 1        | exiftool              | `apt install libimage-exiftool-perl` | GPS extraction from images        |
| 2        | Nominatim (OSM)       | nominatim.openstreetmap.org          | Free reverse geocoding            |
| 3        | ipinfo.io             | ipinfo.io                            | IP → city/ASN                     |
| 4        | suncalc.org           | Browser                              | Sun position verification         |
| 5        | Google Maps satellite | maps.google.com                      | Visual building-tier confirmation |
| 6        | Sentinel Hub          | sentinel-hub.com                     | Historical satellite imagery      |

## Output Format

```
Subject location finding:

Tier Achieved: Street (±15 m)
Coordinates:   48.8584°N, 2.2945°E
Address:       Champ de Mars, 5 Av. Anatole France, Paris, FR
Source:        EXIF GPSLatitude/GPSLongitude
Timestamp:     2025-04-12T14:22:00+02:00

Verification:
  Satellite match: YES — Eiffel Tower base visible
  Sun angle at 14:22 local: 42° elevation, 218° azimuth
  Shadow check: CONSISTENT with photo content

Accuracy Tier: Building (landmark confirmed)
```

## Limitations

- GPS coordinates are hardware-generated but can be spoofed with SDR tools or software overrides
- IP geolocation accuracy degrades significantly for mobile carriers and VPN exit nodes
- Rural reverse geocoding returns approximate addresses; urban addresses are more reliable
- Visual geolocation depends on distinctive features — featureless environments yield low confidence
- Historical satellite imagery may not match the date of the subject's visit

## Related Techniques

- [fx-metadata-parsing.md](fx-metadata-parsing.md) — full EXIF field extraction procedure
- [fx-image-verification.md](fx-image-verification.md) — shadow/sun cross-validation of claimed location
- [fx-network-mapping.md](fx-network-mapping.md) — map IP-derived locations to infrastructure topology
