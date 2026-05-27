# Auto-Branch Rules

Rules governing when the workspace should automatically expand to a new subject or connection.

---

## Rule Format

All rules follow: WHEN [condition] THEN [action] BECAUSE [rationale]

---

## 1. Identity Branch Rules

**IBR-01: Leet-Encoded Handle**

```
WHEN subject.handle CONTAINS leet_substitution (0,1,3,4,5,7,@,$)
AND normalized_handle EXISTS on >=1 additional platform
THEN branch(type=HANDLE_VARIANT, target=normalized_handle, priority=HIGH)
BECAUSE leet encoding is a low-effort evasion tactic indicating
         the subject is aware of cross-platform linking
confidence = 83%
```

**IBR-02: Sequential Handle Suffix**

```
WHEN subject.handle MATCHES regex [a-z]+\d{1,3}$
AND handle_minus_suffix EXISTS on same or other platform
THEN branch(type=HANDLE_SERIES, target=base_handle, priority=MEDIUM)
BECAUSE numbered suffixes indicate account iteration after
         suspension, ban, or deactivation
confidence = 60%
```

**IBR-03: Platform Gap**

```
WHEN subject ACTIVE on platform_A
AND similar_handle INACTIVE on platform_A
AND similar_handle ACTIVE on platform_B
THEN branch(type=PLATFORM_MIGRATION, target=platform_B_handle, priority=MEDIUM)
BECAUSE subjects often migrate while preserving identity signals
confidence = 68%
```

---

## 2. Credential Branch Rules

**CBR-01: Display Name / Email Mismatch**

```
WHEN subject.display_name = "Name_A"
AND subject.email CONTAINS name_token NOT IN known_aliases
THEN branch(type=ALIAS_INVESTIGATION, target=name_token, priority=HIGH)
BECAUSE email name token predates current display name and may
         reflect the subject's primary identity
confidence = 74%
```

**CBR-02: Disposable Email on Verified Platform**

```
WHEN subject.email_domain IN disposable_provider_list
AND platform.verification_tier = "professional"
THEN branch(type=EMAIL_PREFIX_TRACE, target=email_prefix, priority=HIGH)
BECAUSE using throwaway email on a trust-requiring platform
         indicates deliberate identity compartmentalization
confidence = 79%
```

**CBR-03: Domain Affiliation Mismatch**

```
WHEN subject.email_domain != subject.stated_employer_domain
AND subject.email_domain NOT IN personal_provider_list
THEN branch(type=DOMAIN_INVESTIGATION, target=email_domain, priority=MEDIUM)
BECAUSE unusual domain affiliation may indicate undisclosed
         organizational ties or role
confidence = 67%
```

---

## 3. Social Graph Branch Rules

**SBR-01: High Co-mention Frequency**

```
WHEN subject_A mentions subject_B >= 6 times
AND subject_B mentions subject_A >= 3 times
AND window = last_60_days
THEN branch(type=CO_SUBJECT_EXPANSION, target=subject_B, priority=MEDIUM)
BECAUSE bidirectional mention volume above threshold signals
         an active operational or personal connection
confidence = 73%
```

**SBR-02: Photo Tag Cluster**

```
WHEN subject_A tagged_with subject_B in images >= 3 times
THEN branch(type=PHYSICAL_CO_PRESENCE, target=subject_B, priority=HIGH)
BECAUSE repeated photo co-tagging implies physical proximity
         and direct relationship
confidence = 84%
```

**SBR-03: Coordinated Follower Overlap**

```
WHEN follower_set_A ∩ follower_set_B >= 50 accounts
AND quality_score(intersection) < 35
THEN branch(type=COORDINATION_INVESTIGATION, target="shared_follower_cluster", priority=HIGH)
BECAUSE low-quality shared followers are a signature of
         coordinated inauthentic behavior
confidence = 78%
```

**SBR-04: Shared Niche Community Membership**

```
WHEN subject_A.communities ∩ subject_B.communities >= 3
AND all_communities.specificity = "niche"
THEN branch(type=COMMUNITY_AFFILIATION, target=subject_B, priority=LOW)
BECAUSE niche community overlap provides weak but accumulative
         finding of shared interests or associations
confidence = 58%
```

---

## 4. Geographic Branch Rules

**GBR-01: Location Impossibility**

```
WHEN two_posts FROM same_subject
AND location_distance > 500km
AND time_between < 90_minutes
THEN branch(type=GEO_ANOMALY_INVESTIGATION, target="VPN/proxy or account sharing", priority=HIGH)
BECAUSE physics rules out legitimate travel; account may be
         shared or proxied
confidence = 89%
```

---

## 5. Branch Priority Matrix

| Branch Type                         | Confidence Threshold | Priority | Max Expansion Per Session |
| ----------------------------------- | -------------------- | -------- | ------------------------- |
| Handle exact match (other platform) | ≥95%                 | CRITICAL | Unlimited                 |
| Email exact match                   | ≥95%                 | CRITICAL | Unlimited                 |
| Profile image match                 | ≥90%                 | HIGH     | 5                         |
| Handle variant (leet/series)        | ≥83%                 | HIGH     | 5                         |
| Geographic impossibility            | ≥89%                 | HIGH     | 3                         |
| Coordinated follower overlap        | ≥78%                 | HIGH     | 3                         |
| Co-mention bidirectional            | ≥73%                 | MEDIUM   | 5                         |
| Domain mismatch                     | ≥67%                 | MEDIUM   | 3                         |
| Niche community overlap             | ≥58%                 | LOW      | 2                         |

---

## 6. Branch Suppression

```
WHEN confidence < 50%
AND corroborating_findings < 2
THEN suppress_branch
LOG = "suppressed: below minimum finding threshold"

WHEN branch_target IN workspace.already_expanded
THEN suppress_branch
LOG = "suppressed: target already in scope"

WHEN branch_target.privacy_tier = "protected"
AND case.authorization != "confirmed"
THEN suppress_branch
LOG = "suppressed: authorization not confirmed for target"
```

---

## 7. Dorks for Branch Validation

```
# Validate handle variant
"[base_handle]" OR "[leet_variant]" site:twitter.com OR site:instagram.com

# Validate email prefix as alias
"[email_prefix]" -site:[original_platform]

# Validate photo co-presence
site:instagram.com "[subject_A]" "[subject_B]"

# Validate coordinated following
site:twitter.com/[subjectA]/following  (compare against subjectB manually)
```

---

## Cross-References

- `analysis/cross-reference-engine.md` — scoring connections between branched subjects
- `analysis/deviation-detector.md` — IDENTITY_DRIFT triggers that may initiate branches
- `techniques/username-enumeration.md` — handle variant generation
