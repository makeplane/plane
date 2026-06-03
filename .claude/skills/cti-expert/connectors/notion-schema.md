# Notion Database Schema

## Overview

Notion provides a flexible workspace for collaborative OSINT investigations. This schema creates a structured system for tracking entities, managing investigations, and visualizing relationships across your team.

---

## Workspace Structure

```
OSINT Workspace/
├── 🎯 Investigations (Database)
├── 👤 People (Database)
├── 🏢 Organizations (Database)
├── 🌐 Domains (Database)
├── 📧 Email Addresses (Database)
├── 👤 Usernames (Database)
├── 📍 IP Addresses (Database)
├── 📎 Evidence (Database)
├── 📊 Analysis (Database)
├── ✅ Tasks (Database)
└── 📚 Resources (Wiki)
```

---

## Database Schema Definitions

### 1. Investigations Database

**Purpose:** Track all ongoing and completed investigations

| Property             | Type         | Options/Description                        |
| -------------------- | ------------ | ------------------------------------------ |
| **Name**             | Title        | Investigation name/title                   |
| **Investigation ID** | Text         | INV-YYYYMM-001 format                      |
| **Status**           | Select       | Active, Paused, Completed, Archived        |
| **Priority**         | Select       | Critical, High, Medium, Low                |
| **Type**             | Select       | Person, Domain, Organization, Event, Other |
| **Objective**        | Text         | Investigation goal                         |
| **Subject**          | Relation     | Links to People/Orgs/Domains               |
| **Lead Analyst**     | Person       | Notion user assigned                       |
| **Start Date**       | Date         | Investigation began                        |
| **Due Date**         | Date         | Target completion                          |
| **Progress**         | Number       | Percentage complete (0-100)                |
| **Confidence**       | Select       | High, Medium, Low, Mixed                   |
| **Key Findings**     | Text         | Brief summary                              |
| **Related Entities** | Relation     | Links to all related entities              |
| **Evidence**         | Relation     | Linked evidence items                      |
| **Tasks**            | Relation     | Linked tasks                               |
| **Reports**          | Files        | Attached report documents                  |
| **Tags**             | Multi-select | Case-specific tags                         |

**Views:**

- Table: All investigations with key details
- Board: Grouped by status
- Calendar: By due date
- Gallery: Investigation cards with images
- Filtered: My Active Investigations

---

### 2. People Database

**Purpose:** Track individuals identified in investigations

| Property             | Type             | Options/Description                      |
| -------------------- | ---------------- | ---------------------------------------- |
| **Name**             | Title            | Full legal name                          |
| **Aliases**          | Text             | Known aliases, nicknames                 |
| **Entity Type**      | Select           | Person (for filtering)                   |
| **Status**           | Select           | Active, Confirmed, Unverified, Duplicate |
| **Date of Birth**    | Date             | Birth date                               |
| **Age**              | Formula          | Calculate from DOB                       |
| **Gender**           | Select           | Male, Female, Unknown                    |
| **Nationality**      | Select           | Country list                             |
| **Current Location** | Text             | City, State/Region, Country              |
| **Occupation**       | Text             | Job title/role                           |
| **Employer**         | Relation         | Link to Organizations                    |
| **Email Addresses**  | Relation         | Link to Emails database                  |
| **Usernames**        | Relation         | Link to Usernames database               |
| **Domains**          | Relation         | Associated domains                       |
| **Confidence**       | Select           | High, Medium, Low                        |
| **Photo**            | Files            | Profile image                            |
| **Social Media**     | URL              | Links to profiles                        |
| **Notes**            | Text             | Additional information                   |
| **Source**           | Text             | Where info was found                     |
| **Investigations**   | Relation         | Linked investigations                    |
| **Related People**   | Relation         | Self-referential (family, associates)    |
| **Created**          | Created Time     | Auto-generated                           |
| **Last Updated**     | Last Edited Time | Auto-generated                           |

**Views:**

- Table: All people with key details
- Gallery: Photo cards
- Board: Grouped by confidence level
- Filtered: By investigation

---

### 3. Organizations Database

**Purpose:** Track companies, groups, and institutions

| Property                | Type         | Options/Description                                 |
| ----------------------- | ------------ | --------------------------------------------------- |
| **Name**                | Title        | Organization name                                   |
| **Entity Type**         | Select       | Organization                                        |
| **Type**                | Select       | Company, Non-profit, Government, Educational, Other |
| **Status**              | Select       | Active, Inactive, Dissolved                         |
| **Industry**            | Select       | Sector classification                               |
| **Registration Number** | Text         | Business registration                               |
| **Founded Date**        | Date         | When established                                    |
| **Headquarters**        | Text         | Primary address                                     |
| **Website**             | URL          | Primary domain                                      |
| **Domains**             | Relation     | Link to Domains database                            |
| **Employees**           | Relation     | Link to People database                             |
| **Parent Organization** | Relation     | Self-referential (subsidiary relationships)         |
| **Confidence**          | Select       | High, Medium, Low                                   |
| **Notes**               | Text         | Additional information                              |
| **Investigations**      | Relation     | Linked investigations                               |
| **Created**             | Created Time | Auto-generated                                      |

**Views:**

- Table: All organizations
- Board: Grouped by type
- Tree: Parent-child relationships

---

### 4. Domains Database

**Purpose:** Track domain names and DNS information

| Property              | Type         | Options/Description                |
| --------------------- | ------------ | ---------------------------------- |
| **Domain**            | Title        | Domain name                        |
| **Entity Type**       | Select       | Domain                             |
| **Status**            | Select       | Active, Suspended, Expired, Parked |
| **IP Address**        | Relation     | Link to IPs database               |
| **Registrar**         | Text         | Domain registrar                   |
| **Registration Date** | Date         | First registered                   |
| **Expiration Date**   | Date         | When it expires                    |
| **Nameservers**       | Text         | NS records                         |
| **MX Records**        | Text         | Mail servers                       |
| **Subdomains**        | Text         | Known subdomains                   |
| **Registrant**        | Relation     | Link to People/Organizations       |
| **Hosting Provider**  | Text         | Web host                           |
| **SSL Certificate**   | Checkbox     | Has SSL?                           |
| **Technologies**      | Multi-select | CMS, frameworks detected           |
| **Confidence**        | Select       | High, Medium, Low                  |
| **Threat Level**      | Select       | Critical, High, Medium, Low, Safe  |
| **Notes**             | Text         | Additional information             |
| **Investigations**    | Relation     | Linked investigations              |
| **Created**           | Created Time | Auto-generated                     |

**Views:**

- Table: All domains
- Board: Grouped by status
- Calendar: Expiration dates
- Filtered: High-threat domains

---

### 5. Email Addresses Database

**Purpose:** Track email addresses and their associations

| Property           | Type         | Options/Description                       |
| ------------------ | ------------ | ----------------------------------------- |
| **Email**          | Title        | Email address                             |
| **Entity Type**    | Select       | Email                                     |
| **Status**         | Select       | Active, Inactive, Suspicious, Unknown     |
| **Domain**         | Relation     | Link to Domains                           |
| **Owner**          | Relation     | Link to People                            |
| **Provider**       | Select       | Gmail, Outlook, ProtonMail, Custom, Other |
| **Purpose**        | Select       | Personal, Work, Role, Suspicious          |
| **First Seen**     | Date         | When discovered                           |
| **Last Seen**      | Date         | Most recent activity                      |
| **Breach History** | Checkbox     | Known data breaches?                      |
| **Confidence**     | Select       | High, Medium, Low                         |
| **Notes**          | Text         | Additional information                    |
| **Investigations** | Relation     | Linked investigations                     |
| **Created**        | Created Time | Auto-generated                            |

---

### 6. Usernames Database

**Purpose:** Track online handles and aliases

| Property            | Type         | Options/Description                                |
| ------------------- | ------------ | -------------------------------------------------- |
| **Username**        | Title        | Handle/alias                                       |
| **Entity Type**     | Select       | Username                                           |
| **Platform**        | Multi-select | Twitter, GitHub, Reddit, Instagram, LinkedIn, etc. |
| **Owner**           | Relation     | Link to People                                     |
| **Status**          | Select       | Active, Suspended, Deleted, Unknown                |
| **Profile URL**     | URL          | Direct link to profile                             |
| **First Seen**      | Date         | When discovered                                    |
| **Last Activity**   | Date         | Most recent post/activity                          |
| **Followers**       | Number       | Count if available                                 |
| **Bio/Description** | Text         | Profile description                                |
| **Confidence**      | Select       | High, Medium, Low                                  |
| **Notes**           | Text         | Additional information                             |
| **Investigations**  | Relation     | Linked investigations                              |
| **Created**         | Created Time | Auto-generated                                     |

---

### 7. IP Addresses Database

**Purpose:** Track IP addresses and network information

| Property             | Type         | Options/Description                     |
| -------------------- | ------------ | --------------------------------------- |
| **IP Address**       | Title        | IPv4 or IPv6                            |
| **Entity Type**      | Select       | IP Address                              |
| **Type**             | Select       | IPv4, IPv6                              |
| **Status**           | Select       | Active, Suspicious, Blocked, Historical |
| **Domain**           | Relation     | Link to Domains                         |
| **ASN**              | Text         | Autonomous System Number                |
| **ISP/Organization** | Text         | Hosting provider                        |
| **Location**         | Text         | City, Country                           |
| **Threat Level**     | Select       | Critical, High, Medium, Low, Safe       |
| **Blacklist Status** | Multi-select | Listed on: Spamhaus, Barracuda, etc.    |
| **Open Ports**       | Text         | Discovered ports                        |
| **Services**         | Text         | Running services                        |
| **Confidence**       | Select       | High, Medium, Low                       |
| **Notes**            | Text         | Additional information                  |
| **Investigations**   | Relation     | Linked investigations                   |
| **Created**          | Created Time | Auto-generated                          |

---

### 8. Evidence Database

**Purpose:** Track evidence and source materials

| Property             | Type         | Options/Description                                           |
| -------------------- | ------------ | ------------------------------------------------------------- |
| **Title**            | Title        | Description of evidence                                       |
| **Entity Type**      | Select       | Evidence                                                      |
| **Type**             | Select       | Screenshot, Document, Photo, Video, Audio, Web Archive, Other |
| **Format**           | Select       | PDF, PNG, JPG, MP4, MP3, HTML, etc.                           |
| **Status**           | Select       | Verified, Unverified, Processing, Archived                    |
| **Investigation**    | Relation     | Link to Investigations                                        |
| **Related Entities** | Relation     | Link to People/Orgs/Domains                                   |
| **Source URL**       | URL          | Original location                                             |
| **Date Obtained**    | Date         | When collected                                                |
| **Date Created**     | Date         | Original creation date                                        |
| **File**             | Files        | Attached evidence file                                        |
| **Hash (SHA256)**    | Text         | File hash for integrity                                       |
| **Confidence**       | Select       | High, Medium, Low                                             |
| **Analyst**          | Person       | Who collected it                                              |
| **Notes**            | Text         | Analysis and context                                          |
| **Tags**             | Multi-select | Evidence-specific tags                                        |
| **Created**          | Created Time | Auto-generated                                                |

---

### 9. Analysis Database

**Purpose:** Store analysis findings, patterns, and assessments

| Property             | Type         | Options/Description                                             |
| -------------------- | ------------ | --------------------------------------------------------------- |
| **Title**            | Title        | Analysis title                                                  |
| **Entity Type**      | Select       | Analysis                                                        |
| **Type**             | Select       | Pattern, Anomaly, Risk Assessment, Timeline, Attribution, Other |
| **Investigation**    | Relation     | Link to Investigations                                          |
| **Related Entities** | Relation     | Entities analyzed                                               |
| **Findings**         | Text         | Key discoveries                                                 |
| **Methodology**      | Text         | How analysis was conducted                                      |
| **Confidence**       | Select       | High, Medium, Low                                               |
| **Evidence**         | Relation     | Supporting evidence                                             |
| **Analyst**          | Person       | Who performed analysis                                          |
| **Date**             | Date         | When analysis completed                                         |
| **Status**           | Select       | Draft, Review, Final                                            |
| **Tags**             | Multi-select | Analysis tags                                                   |
| **Created**          | Created Time | Auto-generated                                                  |

---

### 10. Tasks Database

**Purpose:** Track investigation tasks and workflow

| Property            | Type         | Options/Description                          |
| ------------------- | ------------ | -------------------------------------------- |
| **Task**            | Title        | Description                                  |
| **Status**          | Select       | Not Started, In Progress, Blocked, Completed |
| **Priority**        | Select       | Critical, High, Medium, Low                  |
| **Investigation**   | Relation     | Link to Investigations                       |
| **Related Entity**  | Relation     | Link to specific entity                      |
| **Assignee**        | Person       | Who's responsible                            |
| **Due Date**        | Date         | Deadline                                     |
| **Estimated Hours** | Number       | Time estimate                                |
| **Actual Hours**    | Number       | Time spent                                   |
| **Description**     | Text         | Detailed instructions                        |
| **Checklist**       | Text         | Subtasks                                     |
| **Tags**            | Multi-select | Task categories                              |
| **Created**         | Created Time | Auto-generated                               |

---

## Relation Setups

### Bidirectional Relations

**Investigations ↔ Entities:**

```
Investigations → Related Entities → People
Investigations → Related Entities → Organizations
Investigations → Related Entities → Domains
People → Investigations (automatic back-link)
```

**Entities ↔ Evidence:**

```
Evidence → Related Entities → [Any entity type]
People → Evidence (automatic back-link)
```

**Self-Referential Relations:**

```
People → Related People (family, associates)
Organizations → Parent Organization (corporate structure)
Domains → Subdomains (domain hierarchy)
```

---

## View Configurations

### Investigation Dashboard View

**Filters:** Status = Active
**Group By:** Priority
**Sort:** Due Date (Ascending)
**Properties Shown:**

- Name
- Priority
- Progress
- Lead Analyst
- Due Date
- Related Entities (count)

### Entity Network View

**Database:** People
**View Type:** Board
**Group By:** Investigation
**Card Preview:** Photo, Name, Confidence, Location

### Evidence Gallery View

**Database:** Evidence
**View Type:** Gallery
**Card Preview:** File preview
**Filter:** Status = Verified

### Task Board View

**Database:** Tasks
**View Type:** Board
**Group By:** Status
**Filter:** Assignee = [Current User]

---

## Template Pages

### Investigation Template

```markdown
# Investigation: {{Name}}

**ID:** {{Investigation ID}}
**Status:** {{Status}}
**Priority:** {{Priority}}
**Lead:** {{Lead Analyst}}
**Dates:** {{Start Date}} - {{Due Date}}

## Objective

{{Objective}}

## Key Findings

-
-
-

## Entity Map

{{Related Entities}}

## Timeline

[View Timeline](link to analysis)

## Evidence

{{Evidence}}

## Tasks

{{Tasks}}

## Notes

---

## Quick Links

- [Dashboard](link)
- [People](link)
- [Evidence](link)
```

### Person Profile Template

```markdown
# {{Name}}

![Photo]({{Photo}})

**Aliases:** {{Aliases}}
**DOB:** {{Date of Birth}} (Age: {{Age}})
**Location:** {{Current Location}}
**Occupation:** {{Occupation}}

## Digital Presence

**Email:** {{Email Addresses}}
**Usernames:** {{Usernames}}
**Social:** {{Social Media}}

## Relationships

{{Related People}}

## Investigation Links

{{Investigations}}

## Notes

{{Notes}}
```

---

## Rollup & Formula Examples

### Investigation Progress Calculation

```javascript
// Formula for completion percentage
(prop("Tasks Completed") / prop("Total Tasks")) * 100;
```

### Entity Count Rollup

```
Investigations Database:
- Related Entities → Rollup → Count
- Evidence → Rollup → Count
- Tasks → Rollup → Count (with filter: Status = Completed)
```

### Days Since Last Update

```javascript
// Formula property
dateBetween(now(), prop("Last Updated"), "days");
```

### Age Calculation

```javascript
// Formula property for People
floor(dateBetween(now(), prop("Date of Birth"), "years"));
```

---

## Automation Suggestions

### Using Notion API

**Automated Workflows:**

1. New evidence → Notify investigation lead
2. Task due date approaching → Send reminder
3. Domain expiring soon → Create renewal task
4. New person added → Search for related entities
5. Investigation completed → Archive all related items

### Integration Points

**Import From:**

- CSV exports from OSINT tools
- Maltego graph exports
- Spreadsheet data
- Web clipper for online sources

**Export To:**

- PDF reports
- CSV for analysis
- API for dashboards
- Shared pages for clients

---

## Best Practices

1. **Consistent Naming** - Use standard formats for IDs and names
2. **Link Everything** - Create relations liberally
3. **Source Attribution** - Always note where information came from
4. **Regular Updates** - Keep status and confidence current
5. **Access Control** - Share appropriately, protect sensitive data
6. **Backup Regularly** - Export data periodically
7. **Templates** - Use templates for consistency
8. **Views** - Create custom views for different workflows
9. **Comments** - Use comments for collaboration
10. **Version History** - Leverage Notion's history for audit trail
