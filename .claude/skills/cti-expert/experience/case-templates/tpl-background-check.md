# Person Background Check Template

A comprehensive investigation workflow for researching individuals.

---

## Template Overview

**Purpose:** Verify identity and background of an individual  
**Use Cases:** Hiring verification, dating safety, tenant screening, professional networking  
**Duration:** 20-30 minutes  
**Complexity:** Intermediate to Advanced  
**Output:** Identity verification report with timeline

### Required Information

- Full name (required)
- Location (city/state or country - highly recommended)
- Age range or birth year (optional)
- Email or phone (optional, accelerates search)
- Known aliases (optional)

---

## Step-by-Step Workflow

### Step 1: Identity Verification

**Objective:** Confirm the person exists and basic details match

**Verification Points:**

- Name spelling variations
- Age/date of birth consistency
- Location history
- Basic digital footprint existence

**Search Queries:**

```
/scan "{{full_name}}" {{location}}
/dorking "{{full_name}}" {{location}} (profile OR directory)
/dorking "{{full_name}}" intitle:"{{location}}"
/verify identity "{{full_name}}" --location {{location}}
```

**Expected Findings:**

| Finding                            | Verification Value                                      |
| ---------------------------------- | ------------------------------------------------------- |
| Multiple people with same name     | Need additional identifiers                             |
| Unique name + location match       | Strong initial match                                    |
| No results                         | Name may be false, very private, or spelled differently |
| Consistent location across sources | Increases confidence                                    |

**Identity Resolution:**

```
If multiple matches found:
  → Ask user: "I found 3 Jane Smiths in Boston:
      1. Teacher, age 34, Jamaica Plain
      2. Marketing manager, age 29, Back Bay
      3. Consultant, age 41, Cambridge
     Which person are you investigating?"

If no matches found:
  → Suggest: "Try alternate spellings or previous locations"
  → Check: "Is this a nickname? Try full legal name"
  → Expand: "Search nationally instead of locally"
```

---

### Step 2: Platform Discovery Sequence

**Objective:** Find all online profiles and accounts

**Search Priority (in order):**

1. **Professional Networks**

```
/dorking "{{full_name}}" LinkedIn
/dorking "{{full_name}}" {{location}} site:linkedin.com/in
/scan "{{full_name}}" --platform linkedin
```

2. **Social Media**

```
/dorking "{{full_name}}" (Twitter OR X) {{location}}
/dorking "{{full_name}}" Facebook profile
/dorking "{{full_name}}" Instagram {{location}}
/dorking "@{{full_name}}" - site:twitter.com
```

3. **Specialized Platforms**

```
/dorking "{{full_name}}" GitHub OR Stack Overflow
/dorking "{{full_name}}" Medium OR Substack
/dorking "{{full_name}}" YouTube channel
/dorking "{{full_name}}" Pinterest OR TikTok
```

4. **Forum/Community Presence**

```
/dorking "{{full_name}}" OR "{{username}}" (forum OR reddit)
/dorking "{{full_name}}" site:quora.com
```

**Expected Findings:**

| Platform  | Finding              | Significance            |
| --------- | -------------------- | ----------------------- |
| LinkedIn  | Professional profile | Employment verification |
| Twitter/X | Active account       | Personality, opinions   |
| Facebook  | Personal profile     | Social connections      |
| Instagram | Photo sharing        | Lifestyle, location     |
| GitHub    | Code repository      | Technical skills        |
| Forums    | Discussion posts     | Interests, expertise    |

**Platform Verification:**

```
For each profile found, check:
  ✓ Profile completeness
  ✓ Activity consistency (regular posts)
  ✓ Connection to other profiles (cross-links)
  ✓ Photo consistency across platforms
  ✓ Timeline consistency (accounts created when claimed)
```

---

### Step 3: Credential Verification

**Objective:** Verify employment, education, and professional claims

**Employment Verification:**

```
/dorking "{{full_name}}" "{{claimed_employer}}"
/dorking "{{full_name}}" {{location}} "worked at" OR "employed"
/scan "{{full_name}}" --employment-history
/follow "{{full_name}}" --colleagues {{claimed_employer}}
```

**Education Verification:**

```
/dorking "{{full_name}}" "{{claimed_school}}" alumni OR graduate
/dorking "{{full_name}}" site:alumni.{{school_domain}}
/dorking "{{full_name}}" "class of" {{graduation_year}}
```

**Professional Credentials:**

```
/dorking "{{full_name}}" "{{certification}}" license OR certified
/dorking "{{full_name}}" site:{{professional_association}}.org
/scan "{{full_name}}" --certifications
```

**Credential Red Flags:**

| Claim                | Verification Method            | Red Flag                      |
| -------------------- | ------------------------------ | ----------------------------- |
| Specific degree      | Alumni database check          | Not listed, different degree  |
| Current employment   | Company directory              | Not employed there            |
| Professional license | State licensing board          | No record, expired, suspended |
| Published works      | Google Scholar, journal search | No publications found         |
| Awards/recognition   | Awarding organization          | No record of award            |

---

### Step 4: Digital Footprint Analysis

**Objective:** Map complete online presence and activity patterns

**Search Strategy:**

```
# Comprehensive search
/scan "{{full_name}}" --comprehensive

# Timeline reconstruction
/chrono "{{full_name}}" --from {{earliest_year}}

# Connection mapping
/follow "{{full_name}}" --discover-connections

# Content analysis
/dorking "{{full_name}}" (blog OR article OR interview)
```

**Footprint Components:**

| Component   | What to Find              | Tools                |
| ----------- | ------------------------- | -------------------- |
| Profiles    | All social accounts       | /scan, /dorking      |
| Content     | Posts, articles, comments | /dorking, /chrono    |
| Photos      | Public images             | Reverse image search |
| Connections | Associates, colleagues    | /follow              |
| Interests   | Groups, forums, topics    | Content analysis     |
| Timeline    | Activity over time        | /chrono              |

**Privacy Assessment:**

```
Privacy Score Evaluation:

High Exposure (concerning for security):
  • Home address visible
  • Phone number public
  • Family members identified
  • Daily routines apparent
  • Location check-ins frequent

Medium Exposure:
  • Professional profiles public
  • Photos with location data
  • Work history detailed

Low Exposure (privacy-conscious):
  • Minimal online presence
  • Private profiles
  • No location data
```

---

### Step 5: Reputation and Background

**Objective:** Identify any concerning history or red flags

**Public Records Search:**

```
/dorking "{{full_name}}" {{location}} court OR lawsuit
/dorking "{{full_name}}" arrest OR charged OR indictment
/dorking "{{full_name}}" "sex offender" OR "criminal record"
/scan "{{full_name}}" --public-records
```

**News and Media:**

```
/news "{{full_name}}" {{location}} --years 10
/dorking "{{full_name}}" {{location}} news OR article
```

**Professional Standing:**

```
/dorking "{{full_name}}" "disciplinary action" OR "sanctioned"
/dorking "{{full_name}}" "barred" OR "suspended" OR "disbarred"
/scan "{{full_name}}" --professional-standing
```

**Red Flag Categories:**

| Category     | Indicators                              | Severity |
| ------------ | --------------------------------------- | -------- |
| Criminal     | Arrests, convictions, charges           | High     |
| Financial    | Bankruptcies, liens, judgments          | Medium   |
| Professional | License sanctions, disciplinary actions | High     |
| Civil        | Lawsuits, restraining orders            | Medium   |
| Reputational | Scandals, controversies, negative press | Variable |

---

### Step 6: Timeline Construction

**Objective:** Build chronological history of person's life and activities

**Timeline Data Sources:**

```
/chrono "{{full_name}}" --auto-build

Sources analyzed:
  • Social media post dates
  • Employment dates from LinkedIn
  • Education graduation years
  • Public record dates
  • Forum post history
  • Photo metadata dates
```

**Timeline Elements:**

```
Timeline Structure:

Year | Age | Event Type | Details | Source
-----|-----|-----------|---------|-------
1985 | 0   | Birth      | Born in {{location}} | Public record
2003 | 18  | Education  | Started at {{university}} | Alumni DB
2007 | 22  | Education  | Graduated {{degree}} | Alumni DB
2007 | 22  | Employment | Started at {{company1}} | LinkedIn
2010 | 25  | Employment | Moved to {{company2}} | LinkedIn
2012 | 27  | Location   | Moved to {{new_city}} | Posts
2015 | 30  | Employment | Promoted to {{title}} | LinkedIn
2018 | 33  | Marriage   | Married {{spouse}} | Announcement
2020 | 35  | Employment | Joined {{current_company}} | LinkedIn
2024 | 39  | Present    | {{current_title}} | LinkedIn
```

**Timeline Verification:**

```
Consistency Checks:
  ✓ Employment dates don't overlap impossibly
  ✓ Education before employment (usually)
  ✓ Location changes match employment
  ✓ Age consistent across sources
  ✓ Photos match timeline age

Gaps to Investigate:
  ⚠ Missing years in employment
  ⚠ Unexplained location changes
  ⚠ Education without graduation
  ⚠ Age inconsistencies
```

---

### Step 7: Final Report Generation

**Objective:** Synthesize all findings into comprehensive report

**Report Components:**

```
1. Identity Verification Summary
   ✓ Confirmed real person: Yes/No
   ✓ Name variations found: [list]
   ✓ Confidence level: High/Medium/Low

2. Digital Presence Overview
   Platforms found: [count]
   Active profiles: [list]
   Privacy level: High/Medium/Low

3. Credential Verification
   Employment claims: [verified/partial/unverified]
   Education claims: [verified/partial/unverified]
   Professional licenses: [status]

4. Timeline Summary
   Key life events: [count]
   Consistency status: [consistent/missing found]
   Notable patterns: [summary]

5. Red Flags (if any)
   [List of concerns with severity]

6. Overall Assessment
   Reliability score: 1-10
   Verification level: Comprehensive/Partial/Limited
   Recommendations: [action items]
```

**Confidence Scoring:**

| Score | Level     | Meaning                                 |
| ----- | --------- | --------------------------------------- |
| 9-10  | Very High | Extensive verification, consistent data |
| 7-8   | High      | Good verification, minor gaps           |
| 5-6   | Medium    | Some verification, notable gaps         |
| 3-4   | Low       | Limited verification, many gaps         |
| 1-2   | Very Low  | Minimal data, unverified claims         |

---

## Report Generation

### Report Export Options

```
/intel-report generate background-check

Formats available:
  /intel-report export summary     → 1-page overview
  /intel-report export detailed    → Full report (5-10 pages)
  /intel-report export complete    → All raw data included
  /intel-report export timeline    → Chronological view only
  /intel-report export csv         → Spreadsheet format
  /intel-report export pdf         → Professional PDF

Privacy options:
  /intel-report --redact-sensitive → Remove PII for sharing
  /intel-report --legal-review     → Format for legal use
```

### Report Sections

**Summary Report (1 page):**

```
BACKGROUND CHECK SUMMARY
Subject: {{full_name}}
Date: {{current_date}}
Investigator: {{user}}

IDENTITY VERIFICATION: ✓ CONFIRMED
  Real person verified through multiple sources
  Location: {{location}}
  Approximate age: {{age_range}}

DIGITAL FOOTPRINT: {{profile_count}} PROFILES
  LinkedIn: ✓ Active, {{connection_count}} connections
  Twitter: ✓ Active since {{year}}
  Facebook: ✓ [visibility status]
  Additional: {{other_platforms}}

CREDENTIAL VERIFICATION: {{verification_status}}
  Employment: {{employment_verification}}
  Education: {{education_verification}}
  Licenses: {{license_status}}

TIMELINE: CONSISTENT
  No major inconsistencies detected
  {{timeline_summary}}

RED FLAGS: {{red_flag_count}}
  [List or "None identified"]

OVERALL RATING: {{score}}/10 - {{rating_text}}
```

---

## Ethical Considerations

### Privacy Warnings

```
⚠️ IMPORTANT PRIVACY NOTICE

This investigation accesses publicly available information only.
You are responsible for:
  • Using findings legally and ethically
  • Complying with FCRA if for employment/tenant screening
  • Not stalking or harassing individuals
  • Securing collected information
  • Disposing of data properly when done

For employment/tenant decisions:
  ⚠️ You may need written consent
  ⚠️ You may need to provide disclosure
  ⚠️ Consult legal counsel for compliance

Continue? (yes/no)
```

### Data Handling

```
Recommended practices:
  • Save reports securely
  • Limit distribution to need-to-know
  • Set expiration/deletion dates
  • Document purpose of investigation
  • Comply with data retention laws
```

---

## Template Execution

### Run Command

```
/preset run background-check

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Person Background Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This template investigates an individual's background,
identity, and online presence.

⚠️ IMPORTANT: Ensure you have legal right to investigate
    this person and will use information ethically.

Required:
  • Full name: _

Highly recommended:
  • Location (city/state): _
  • Approximate age: _

Optional (improves results):
  • Email address: _
  • Phone number: _
  • Known aliases: _

Estimated time: 20-30 minutes

[/ ethical-guidelines ] [/ cancel ]
```

### Execution Flow

```
Step by step execution:

[1/7] Identity Verification        [████████░░] 80%
[2/7] Platform Discovery           [░░░░░░░░░░] 0%
[3/7] Credential Verification      [░░░░░░░░░░] 0%
[4/7] Digital Footprint Analysis   [░░░░░░░░░░] 0%
[5/7] Reputation & Background      [░░░░░░░░░░] 0%
[6/7] Timeline Construction        [░░░░░░░░░░] 0%
[7/7] Report Generation            [░░░░░░░░░░] 0%
```
