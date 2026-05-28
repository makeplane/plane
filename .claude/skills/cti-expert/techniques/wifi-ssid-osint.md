# WiFi / SSID OSINT Module

> **Module ID:** WIFI-OSINT-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Wireless Network Intelligence & Geolocation
> **Source:** Adapted from [illwill/osint](https://gitlab.com/illwill/osint)

---

## 1. Overview

WiFi/SSID OSINT maps wireless networks to physical locations using the Wigle.net wardriving database. Given a network name (SSID) or MAC address (BSSID), it returns GPS coordinates, encryption type, channel, timestamps, and surrounding infrastructure — enabling geolocation without GPS metadata.

**Key use cases:** Physical location correlation, travel pattern analysis, rogue AP detection, proximity verification, device tracking through WiFi probe requests.

---

## 2. Tool Inventory

### Primary — Wigle.net API v2 (free tier: 50 queries/day)

```bash
# Register free account at https://wigle.net/account
# Get API name + token from https://wigle.net/account

# Search by SSID
curl -s -H "Authorization: Basic $(echo -n 'API_NAME:API_TOKEN' | base64)" \
  "https://api.wigle.net/api/v2/network/search?ssid=TARGET_SSID"

# Search by BSSID (MAC address)
curl -s -H "Authorization: Basic $(echo -n 'API_NAME:API_TOKEN' | base64)" \
  "https://api.wigle.net/api/v2/network/search?netid=AA:BB:CC:DD:EE:FF"

# Search by location (bounding box)
curl -s -H "Authorization: Basic $(echo -n 'API_NAME:API_TOKEN' | base64)" \
  "https://api.wigle.net/api/v2/network/search?latrange1=37.7&latrange2=37.8&longrange1=-122.5&longrange2=-122.4"
```

### Secondary — Wigle Web UI (no API key needed for basic search)

```
https://wigle.net/search
Manual browser search — limited results without account
```

### Tertiary — Google Geolocation API Fallback

```bash
# If BSSIDs known, Google can geolocate from WiFi access points
curl -s -X POST "https://www.googleapis.com/geolocation/v1/geolocate?key=API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"wifiAccessPoints":[{"macAddress":"AA:BB:CC:DD:EE:FF","signalStrength":-65}]}'
```

### Web Fallback — Search Engine Dorks

```
"TARGET_SSID" site:wigle.net
"TARGET_SSID" wifi location OR coordinates
"TARGET_BSSID" geolocation
```

---

## 3. Investigation Workflow

```
Step 1: Identify target SSID or BSSID
  └─ Source: device logs, packet captures, metadata, interview data
  └─ Normalize BSSID to AA:BB:CC:DD:EE:FF format (uppercase, colon-separated)

Step 2: Query Wigle.net API for matching networks
  └─ Search by SSID first (may return multiple matches)
  └─ Search by BSSID for exact AP match (unique per device)

Step 3: Extract location data from results
  └─ GPS coordinates (trilat/trilong)
  └─ Address (country, region, city, road, postal code)
  └─ Generate Google Maps link: https://maps.google.com/maps?q={lat},{long}

Step 4: Analyze network metadata
  └─ Encryption type reveals security posture (WPA3 vs WEP vs Open)
  └─ Channel and frequency band (2.4GHz vs 5GHz)
  └─ First/last seen timestamps reveal operational period

Step 5: Cross-reference with other OSINT findings
  └─ Match coordinates against known subject addresses
  └─ Compare SSID naming patterns (corporate naming conventions, personal names)
  └─ Check if same SSID appears at multiple locations (mobile hotspot indicator)

Step 6: Assess confidence and document
  └─ Multiple BSSID matches at same location = HIGH confidence
  └─ Common SSID name with many matches = LOW confidence (e.g., "linksys")
  └─ Single unique SSID match = MEDIUM confidence
```

---

## 4. API Response Fields

```json
{
  "trilat": 37.7749, // GPS latitude
  "trilong": -122.4194, // GPS longitude
  "ssid": "TargetNetwork", // Network name
  "netid": "AA:BB:CC:DD:EE:FF", // MAC/BSSID
  "encryption": "wpa2", // Security type
  "channel": 6, // WiFi channel
  "country": "US",
  "region": "California",
  "city": "San Francisco",
  "road": "Market St",
  "housenumber": "100",
  "postalcode": "94105",
  "firsttime": "2023-01-15T10:30:00", // First observed
  "lasttime": "2024-06-20T14:15:00" // Last observed
}
```

---

## 5. Fallback Cascade

```
Wigle API key not configured?
  └─> Use Wigle web UI (manual, limited results)
  └─> Google dork: "SSID_NAME" site:wigle.net

Wigle quota exhausted (50/day free)?
  └─> Google Geolocation API (if BSSIDs known)
  └─> Search: "BSSID" wifi geolocation

SSID too common (100+ results)?
  └─> Narrow by BSSID instead
  └─> Filter by geographic region if approximate area known
  └─> Cross-reference with other findings to disambiguate

No results found?
  └─> Network may not be wardrived yet (rural, private, new)
  └─> Try vendor OUI lookup on first 3 octets of BSSID
       https://api.macvendors.com/AA:BB:CC
```

---

## 6. Output Interpretation

### Encryption Significance

```
open      → No password; public hotspot or misconfigured AP
wep       → Deprecated encryption; trivially broken; likely legacy device
wpa       → Older WPA; vulnerable to dictionary attacks
wpa2      → Standard enterprise/home security; common
wpa3      → Latest standard; security-conscious deployment
wpa2-ent  → Enterprise with RADIUS auth; corporate environment
```

### SSID Pattern Analysis

```
Corporate naming:     "ACME-Corp-5G", "Guest-ACME" → organizational affiliation
Personal naming:      "John's iPhone", "SmithFamily" → identity leakage
Default naming:       "NETGEAR-5G", "TP-Link_ABCD" → router vendor identification
Hidden/no broadcast:  Empty SSID → security-aware operator
Mobile hotspot:       Same SSID at multiple distant locations → device travels with owner
```

### Temporal Analysis

```
firsttime + lasttime close together → temporary deployment or brief observation
firsttime old + lasttime recent → persistent installation
firsttime recent + no lasttime → newly deployed
Multiple entries, different locations → mobile AP (phone hotspot, vehicle)
```

---

## 7. Confidence Ratings

| Finding Type                       | Confidence | Notes                                       |
| ---------------------------------- | ---------- | ------------------------------------------- |
| BSSID-matched location             | HIGH       | MAC address is unique per device            |
| Unique SSID location               | MEDIUM     | Unique names likely match one network       |
| Common SSID location               | LOW        | "linksys", "default" match thousands        |
| Encryption type                    | HIGH       | Directly reported by scanner                |
| Owner identity from SSID           | MEDIUM     | SSID may contain names but could be spoofed |
| Travel pattern from multi-location | MEDIUM     | Requires BSSID match, not just SSID         |
| Vendor from OUI                    | HIGH       | First 3 MAC octets = manufacturer           |

---

## 8. Limitations

1. **Coverage gaps** — Wigle depends on wardrivers; rural/private areas may have no data
2. **API quota** — Free tier: 50 queries/day; register at wigle.net for account
3. **SSID collisions** — Common network names produce many false positives
4. **MAC randomization** — Modern devices randomize probe request MACs; AP BSSIDs are stable
5. **Temporal decay** — Networks get replaced; old data may not reflect current state
6. **Legal considerations** — Wardriving legality varies by jurisdiction; Wigle data is contributed voluntarily
7. **GPS accuracy** — Coordinates reflect the wardriver's position, not the exact AP location (typically within 50m)

---

## 9. OPSEC Considerations

- Wigle API queries are logged; your search patterns reveal investigative interest
- Consider using Tor or VPN when querying Wigle API for sensitive investigations
- SSID probing from your own device can expose your MAC address to nearby monitors
- Registered Wigle accounts tie queries to your identity; use investigation-specific accounts

---

## 10. Command Reference

| Command                          | Purpose                            | Input                |
| -------------------------------- | ---------------------------------- | -------------------- |
| `/wifi [ssid]`                   | Search Wigle for SSID geolocation  | Network name         |
| `/wifi --bssid [mac]`            | Search by exact MAC address        | AA:BB:CC:DD:EE:FF    |
| `/wifi --area [lat,long,radius]` | Search networks in geographic area | Coordinates + radius |

---

_WiFi/SSID OSINT Module v1.0.0_
_Part of CTI Expert Skill — adapted from illwill/osint (gitlab.com/illwill/osint)_
_For authorized investigation and educational purposes only_
