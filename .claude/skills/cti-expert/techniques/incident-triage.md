# Incident Triage Module

> **Module ID:** INC-TRI-001
> **Version:** 1.0.0
> **Phase:** 5 - Enhancement Modules
> **Classification:** Security Incident Response & Evidence Preservation

---

## 1. Overview

Guides rapid triage and initial response to security incidents following NIST SP 800-61 methodology. Covers classification, containment, evidence preservation (order of volatility), initial analysis, and IOC extraction.

**When to use:** Active security incident, breach investigation, compromised system analysis, malware detection, or suspicious activity requiring immediate response.

**Ethical boundary:** Focus on defense and containment. Never recommend counter-attacks or evidence tampering.

---

## 2. Tool Inventory

| Priority  | Tool                                | Purpose                             | Install                                           |
| --------- | ----------------------------------- | ----------------------------------- | ------------------------------------------------- |
| Primary   | `ps`, `ss`, `who`, `lsof`           | Volatile evidence capture (Linux)   | Built-in                                          |
| Primary   | `journalctl`                        | System log analysis                 | Built-in (systemd)                                |
| Primary   | `tasklist`, `netstat`, `query user` | Volatile evidence capture (Windows) | Built-in                                          |
| Secondary | LiME                                | Linux memory dump                   | `git clone https://github.com/504ensicsLabs/LiME` |
| Secondary | WinPmem                             | Windows memory dump                 | Download from GitHub releases                     |
| Tertiary  | YARA                                | IOC pattern matching                | `apt install -y yara`                             |

---

## 3. Priorities (Strict Order)

1. **Preserve human safety**
2. **Contain the incident** to prevent further damage
3. **Preserve evidence** for investigation
4. **Identify root cause** and scope
5. **Document everything**

**CRITICAL: Do NOT power off systems.** Volatile memory contains evidence.

---

## 4. Investigation Workflow

```
1. Classify — determine incident type and severity
2. Contain — network block, host isolation, account disable (NOT power off)
3. Preserve — capture volatile evidence in order of volatility
4. Analyze — process trees, network indicators, file indicators, logs, persistence
5. Extract IOCs — IPs, domains, hashes, file paths, emails, URLs, user agents
6. Document — structured triage report with timeline
7. Escalate — management, legal, law enforcement if applicable
```

---

## 5. Incident Classification

### Type

| Type                          | Examples                              |
| ----------------------------- | ------------------------------------- |
| Malware                       | Ransomware, trojan, worm, cryptominer |
| Unauthorized access           | Compromised credentials, exploitation |
| Data exfiltration             | Data theft, insider threat            |
| Denial of service             | DDoS, resource exhaustion             |
| Web compromise                | Defacement, skimming, backdoor        |
| Phishing / social engineering | Credential harvesting, BEC            |

### Severity

| Level    | Criteria                                                                   |
| -------- | -------------------------------------------------------------------------- |
| Critical | Active data exfiltration, ransomware spreading, critical system compromise |
| High     | Confirmed compromise, malware detected, unauthorized access                |
| Medium   | Suspicious activity, potential indicators, failed attacks                  |
| Low      | Policy violation, reconnaissance detected, likely false positive           |

---

## 6. Containment Actions

| Vector      | Action                                                      |
| ----------- | ----------------------------------------------------------- |
| Network     | Block suspicious IPs/domains at firewall                    |
| Host        | Isolate affected system (network disconnect, NOT power off) |
| Account     | Disable compromised accounts, force password resets         |
| Application | Disable affected service if safe to do so                   |

---

## 7. Evidence Preservation (Order of Volatility)

Capture most volatile first:

```bash
# 1. Running processes
ps auxf                         # Linux
tasklist /v                     # Windows

# 2. Network connections
ss -tupn                        # Linux
netstat -anob                   # Windows

# 3. Logged-in users
who -a                          # Linux
query user                      # Windows

# 4. Open files
lsof -nP                        # Linux

# 5. System logs
journalctl --since "1 hour ago" # Linux/systemd
# Windows: Event Viewer export
```

If memory forensics tools available (LiME, WinPmem), capture memory dump **before anything else**.

---

## 8. Analysis Checklist

| Area         | What to Check                                                             |
| ------------ | ------------------------------------------------------------------------- |
| Process tree | Unusual process names, paths, parent-child relationships                  |
| Network      | Unusual outbound connections, suspicious DNS, beaconing patterns          |
| Files        | Recently modified in unusual locations, hidden files, new executables     |
| Logs         | Auth failures, privilege escalation, service changes, cleared logs        |
| Persistence  | Crontab, systemd units, registry Run keys, scheduled tasks, startup items |

---

## 9. IOC Extraction

| IOC Type        | Examples                               |
| --------------- | -------------------------------------- |
| IP addresses    | Source and destination IPs             |
| Domains         | C2 domains, phishing domains           |
| File hashes     | MD5 and SHA256 of suspicious files     |
| File paths      | Malware locations, dropped files       |
| Email addresses | Phishing sender addresses              |
| URLs            | Malicious URLs, C2 endpoints           |
| User agents     | Unusual or known-malicious user agents |

---

## 10. Output Format

```markdown
# Incident Triage Report

## Incident ID: [ID]

## Date/Time: [UTC]

## Severity: [Critical/High/Medium/Low]

## Classification: [incident type]

## Status: [Triage/Contained/Analyzing/Resolved]

### Summary

[2-3 sentence overview]

### Affected Systems

| Hostname | IP  | Role | Status |
| -------- | --- | ---- | ------ |

### Timeline

| Time (UTC) | Event | Source | Notes |
| ---------- | ----- | ------ | ----- |

### Indicators of Compromise

| Type | Value | Context | Confidence |
| ---- | ----- | ------- | ---------- |

### Containment Actions Taken

- [ ] [Action and result]

### Evidence Preserved

| Type | Location | Hash | Notes |
| ---- | -------- | ---- | ----- |

### Recommended Next Steps

1. [Immediate priority]
2. [Short-term action]
3. [Follow-up investigation]

### Escalation Checklist

- [ ] Management notified
- [ ] Legal notified (if data breach)
- [ ] Law enforcement (if applicable)
- [ ] Affected parties notified (if data breach)
```

---

## 11. References

- NIST SP 800-61r2: Computer Security Incident Handling Guide
- SANS Incident Handler's Handbook
- MITRE ATT&CK Framework
