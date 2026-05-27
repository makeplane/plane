# Transport Tracking Module

> **Module ID:** TRANS-TRACK-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Flight, Maritime & Vehicle Tracking Intelligence

---

## 1. Overview

Transport tracking OSINT extracts real-time and historical movement intelligence from aircraft, vessels, and vehicles. Use when a target entity (person, organization, or asset) is linked to a registration number, callsign, tail number, MMSI, IMO, or VIN and you need to establish location patterns, ownership, or logistics.

**Key use cases:** Geopolitical analysis, sanctions enforcement, corporate intelligence, military activity monitoring, export control violations, private equity due diligence, and journalist investigations.

---

## 2. Tool Inventory

### Aviation

#### ADS-B Exchange

**URL:** https://globe.adsbexchange.com/

The gold standard for unfiltered aircraft tracking. Unlike FlightRadar24, ADS-B Exchange does **not** censor military, government, or sensitive operator aircraft — it shows everything the community-fed ADS-B receiver network picks up.

- **Key differentiator:** Displays military, law enforcement, and "blocked" aircraft that commercial trackers suppress
- **Usage:** Search by callsign, tail/registration number (N-number for US), or ICAO 24-bit hex code. Pan and zoom map for area-based monitoring.
- **Data source:** Community-fed ADS-B ground receivers; no filtering contracts

#### Flightradar24

**URL:** https://www.flightradar24.com/

Most widely used live flight tracker. Excellent UI, broad global ADS-B and MLAT coverage, and rich historical playback. Censors some military and government flights by agreement.

- **Usage:** Click aircraft on map or search by flight number, registration, or route
- **Strength:** Best for commercial aviation, charter flights, and general aviation

#### Icarus.flights

**URL:** https://icarus.flights/

Uncensored aircraft activity analysis and global tracking with pattern-of-life analysis focus.

- **Usage:** Search and analyze aircraft movement patterns, frequent routes, and operator behavior

#### FlightAware

**URL:** https://flightaware.com/

Flight tracking with route history, delay data, and gate information. Strong on US domestic coverage.

- **Usage:** Search by flight number, tail number, or city-pair route

#### LiveATC

**URL:** https://www.liveatc.net/

Live air traffic control audio feeds from airports worldwide. No account required.

- **Usage:** Select airport → listen to live ATC communications. Useful for confirming specific aircraft activity at a location by monitoring for callsign mentions.

### Maritime

#### Marine Traffic

**URL:** https://www.marinetraffic.com/

Primary live vessel tracking via AIS (Automatic Identification System) data. Shows ship positions, routes, port call history, and vessel particulars.

- **Usage:** Search by vessel name, MMSI number, or IMO number. Browse map for port activity. Filter by vessel type (tanker, container, bulk carrier, etc.)

#### VesselFinder

**URL:** https://www.vesselfinder.com/

Free AIS ship tracker providing vessel positions, port arrivals/departures, and voyage data. Useful as a second source when Marine Traffic data appears stale.

- **Usage:** Search vessel or browse map. Displays current speed, heading, and declared destination port.

### Vehicle

#### VIN Decoder (VINDecoderZ)

**URL:** http://www.vindecoderz.com/

Decodes 17-character Vehicle Identification Numbers. Returns make, model, year, engine type, transmission, and manufacturing plant.

- **Usage:** Enter 17-character VIN → full vehicle specification decode

#### VINCheck — NICB

**URL:** https://www.nicb.org/vincheck

Official National Insurance Crime Bureau theft and salvage database. No account required. Up to 5 free searches per day.

- **Usage:** Enter VIN → check if the vehicle has been reported stolen or declared salvage-titled

#### FAXVIN

**URL:** https://www.faxvin.com/

Free vehicle history reports. Returns accident records, title history, odometer readings, and reported damage.

- **Usage:** Enter VIN → retrieve available history data. Useful for confirming vehicle provenance.

---

## 3. Investigation Workflow

```
Aircraft Investigation:
Step 1: Identify aircraft identifier
  └─ Tail/registration number (e.g., N12345 for US, G-ABCD for UK)
  └─ ICAO 24-bit hex code (persistent across callsign changes)
  └─ Callsign (flight-specific; changes per mission/flight)

Step 2: Live position and recent activity
  └─ ADS-B Exchange → military, government, "blocked" aircraft (unfiltered)
  └─ Flightradar24 → commercial and general aviation (better UI)

Step 3: Historical movement analysis
  └─ Flightradar24 Playback mode for past 12 months of flight tracks
  └─ ADS-B Exchange historical data for unfiltered records
  └─ Note: ICAO hex code is persistent — use it when callsign is unknown

Step 4: ATC audio monitoring (optional, confirmatory)
  └─ LiveATC → select departure or arrival airport
  └─ Monitor for callsign mentions to confirm specific activity

Step 5: Ownership registry lookup
  └─ FAA N-number registry (US): https://registry.faa.gov/AircraftInquiry/
  └─ Returns registered owner, operator, address, certification status
  └─ Non-US: search "{country} aircraft registry" for national authority

Maritime Investigation:
Step 1: Identify vessel
  └─ Vessel name (may change — prefer IMO number)
  └─ MMSI: 9-digit maritime mobile service identity
  └─ IMO: 7-digit International Maritime Organization number (permanent)

Step 2: Live position and voyage data
  └─ Marine Traffic → AIS position, heading, speed, declared destination
  └─ VesselFinder → secondary confirmation; compare AIS timestamps

Step 3: Port call history and route patterns
  └─ Marine Traffic historical voyages → identify regular routes, unusual stops
  └─ Long AIS gaps (dark periods) are a key intelligence signal

Step 4: Flag state and ownership lookup
  └─ Marine Traffic vessel details → flag state, registered owner, manager
  └─ Cross-reference flag state with sanctions risk (Panama, Palau, Comoros = elevated)

Step 5: Sanctions screening
  └─ OFAC SDN list: https://sanctionssearch.ofac.treas.gov/
  └─ Search vessel name, IMO, and registered owner/operator names

Vehicle Investigation:
Step 1: Decode VIN for vehicle specification
  └─ VINDecoderZ → make, model, year, engine, plant of manufacture

Step 2: Theft and salvage status
  └─ NICB VINCheck → confirms if reported stolen or salvage-titled

Step 3: History and provenance
  └─ FAXVIN → accident history, title transfers, odometer readings

Step 4: Cross-reference with owner identity
  └─ State DMV records (varies by jurisdiction; many accessible via third-party aggregators)
  └─ License plate → VIN → owner chain in commercial data brokers
```

---

## 4. CLI Commands & Expected Output

### FAA N-Number Registry Lookup (US Aircraft)

```bash
# Retrieve FAA registration data for US aircraft
# Replace N12345 with target tail number
curl -s "https://registry.faa.gov/AircraftInquiry/Search/NNumberInquiry?nNumber=N12345" \
  | grep -oP '(?<=<td>)[^<]+' | head -30
```

### ADS-B Exchange API (Historical Track)

```bash
# Get recent track data for aircraft by ICAO hex code
# Replace ABCDEF with target ICAO hex
curl -s "https://globe.adsbexchange.com/re-api/?find=ABCDEF" \
  | python3 -m json.tool
```

**Expected output (abbreviated):**

```json
{
  "icao": "ABCDEF",
  "r": "N12345",
  "t": "B738",
  "lat": 40.6413,
  "lon": -73.7781,
  "alt_baro": 35000,
  "gs": 465,
  "track": 270,
  "flight": "UAL123"
}
```

### Marine Traffic Vessel Search (Web)

```bash
# No CLI — use browser or WebFetch
# URL pattern for vessel by MMSI:
# https://www.marinetraffic.com/en/ais/details/ships/mmsi:{MMSI}

# URL pattern for vessel by IMO:
# https://www.marinetraffic.com/en/ais/details/ships/imo:{IMO}
```

### NICB VINCheck (Web)

```bash
# Browser only — no API
# URL: https://www.nicb.org/vincheck
# Input: 17-character VIN
# Returns: "No theft/salvage record found" or "Record found" with type
```

### VIN Position Reference

```bash
# VIN structure decode (no tool needed):
# Position 1-3: World Manufacturer Identifier (WMI)
#   1HG = Honda USA, JT2 = Toyota Japan, WBA = BMW Germany
# Position 4-8: Vehicle Descriptor Section (model, body, engine)
# Position 9: Check digit
# Position 10: Model year
#   A=1980, B=1981 ... Y=2000, 1=2001 ... 9=2009, A=2010 (cycles)
# Position 11: Plant of manufacture
# Positions 12-17: Sequential production number

python3 -c "
vin = 'JH4DA3340HS000001'
model_year_map = {
    'A':'1980','B':'1981','C':'1982','D':'1983','E':'1984','F':'1985',
    'G':'1986','H':'1987','J':'1988','K':'1989','L':'1990','M':'1991',
    'N':'1992','P':'1993','R':'1994','S':'1995','T':'1996','V':'1997',
    'W':'1998','X':'1999','Y':'2000','1':'2001','2':'2002','3':'2003',
    '4':'2004','5':'2005','6':'2006','7':'2007','8':'2008','9':'2009',
    'A':'2010','B':'2011','C':'2012','D':'2013','E':'2014','F':'2015',
    'G':'2016','H':'2017','J':'2018','K':'2019','L':'2020','M':'2021',
    'N':'2022','P':'2023','R':'2024','S':'2025'
}
print(f'WMI: {vin[0:3]}')
print(f'Model Year Code: {vin[9]} → {model_year_map.get(vin[9], \"unknown\")}')
print(f'Plant: {vin[10]}')
print(f'Sequence: {vin[11:]}')
"
```

---

## 5. Analysis & Interpretation Guidance

### Aviation Intelligence Signals

```
ICAO hex code significance:
  - Persistent identifier — does NOT change when callsign changes
  - Military aircraft often use hex codes with specific country prefixes
  - US military: AE0000–AFFFFF range
  - Use hex code as the stable pivot identifier across all queries

Callsign interpretation:
  - Commercial airlines: IATA code + flight number (e.g., UAL123 = United 123)
  - Military: unit designators (e.g., REACH = USAF air mobility)
  - Government: agency codes (e.g., EXEC1F = Air Force One)
  - "BLOCKED" or no callsign: operator requested filter (visible on ADS-B Exchange)

Altitude and speed anomalies:
  - Aircraft holding at low altitude near a border = surveillance pattern
  - High-speed, high-altitude, no callsign = likely military
  - Repeated figure-8 patterns = ISR (intelligence/surveillance/reconnaissance)
```

### Maritime Intelligence Signals

```
AIS dark periods:
  - Vessels legally required to broadcast AIS; disabling it is a red flag
  - Common for: sanctions evasion, illegal fishing, smuggling operations
  - Check: did vessel reappear in different location inconsistent with last position?

Flag state risk scoring (informal):
  LOW RISK:  Norway, Marshall Islands, Bahamas (major maritime registries)
  MEDIUM:    Panama, Liberia (common legitimate flags of convenience)
  HIGH:      Comoros, Palau, Tuvalu, Belize (frequently used for sanctions evasion)
  CRITICAL:  Russia, Iran, North Korea flagged vessels

Ship name changes:
  - Use IMO number (permanent) to track vessels across name and flag changes
  - Sanctioned vessels frequently rename after each exposure
  - Marine Traffic shows full name history under "History" tab

STS (ship-to-ship) transfer indicators:
  - Two vessels in close proximity in open ocean (not a port)
  - Both vessels showing same GPS coordinates = AIS spoofing
  - Common in: Iranian oil transfers, Russian grain diversions
```

### Vehicle Intelligence Signals

```
VIN tampering indicators:
  - VIN check digit (position 9) fails mathematical validation = likely altered
  - Mismatched WMI and country of sale
  - Sequential number range anomaly for declared year

Cross-border vehicle trafficking:
  - VIN in US database with foreign plate photos
  - Salvage title in one state, clean title in another (title washing)
  - FAXVIN odometer rollback: reported mileage decreases over time
```

### Confidence Ratings

| Finding Type                    | Confidence | Notes                           |
| ------------------------------- | ---------- | ------------------------------- |
| Aircraft live position (ADS-B)  | HIGH       | Real-time receiver data         |
| Aircraft ICAO hex identity      | HIGH       | Hardcoded in transponder        |
| Aircraft registered owner (FAA) | HIGH       | Official registry               |
| Vessel live AIS position        | MEDIUM     | Can be spoofed or disabled      |
| Vessel IMO identity             | HIGH       | Permanent identifier            |
| Vessel beneficial owner         | LOW        | Often obscured via flags/shells |
| VIN vehicle specification       | HIGH       | Manufacturer-encoded            |
| VIN theft/salvage status        | HIGH       | NICB official database          |
| VIN registered owner            | LOW-MEDIUM | Varies by jurisdiction          |

---

## 6. Limitations

1. **ADS-B blind spots** — Aircraft flying at low altitude, in remote areas, or with transponder off produce no ADS-B signal
2. **AIS spoofing** — GPS coordinates in AIS broadcasts can be falsified; cross-check with satellite AIS (S-AIS) when available
3. **Vessel name changes** — Always anchor lookups on IMO (permanent), not vessel name
4. **VIN jurisdictions** — Non-US vehicles may use different identifier standards; this module is VIN/US-centric
5. **NICB VINCheck** — Limited to US-reported theft and salvage records; does not cover international databases
6. **FlightRadar24 censorship** — Some military and government operators pay to have their aircraft filtered; use ADS-B Exchange for complete picture
7. **Historical data depth** — Free tiers on all platforms limit historical track access; deep history requires paid subscriptions

---

## 7. Command Reference

| Command                        | Purpose                                  | Input                            |
| ------------------------------ | ---------------------------------------- | -------------------------------- |
| `/track-aircraft [identifier]` | Track aircraft by tail, hex, or callsign | N-number, ICAO hex, or callsign  |
| `/track-vessel [identifier]`   | Track vessel by name, MMSI, or IMO       | Vessel name, MMSI, or IMO number |
| `/decode-vin [vin]`            | Decode VIN and check theft/salvage       | 17-character VIN                 |

---

_Transport Tracking Module v1.0.0_
_Part of Free OSINT Expert Skill - Phase 5_
_For authorized investigation and educational purposes only_
