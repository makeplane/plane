# Maltego Export Integration

## Overview

Maltego is a powerful visual link analysis tool used by investigators and security professionals. This guide enables export of OSINT investigation data into Maltego-compatible formats for advanced visualization and analysis.

---

## Supported Maltego Entity Types

### Core Entities

| Maltego Entity         | OSINT Equivalent  | Properties     |
| ---------------------- | ----------------- | -------------- |
| `maltego.Domain`       | Domain names      | Name, DNS info |
| `maltego.IPv4Address`  | IP addresses      | Address, ASN   |
| `maltego.URL`          | Web addresses     | URL, Title     |
| `maltego.EmailAddress` | Email addresses   | Email, Domain  |
| `maltego.Person`       | Individuals       | Name, Details  |
| `maltego.PhoneNumber`  | Phone numbers     | Number, Type   |
| `maltego.Alias`        | Usernames/handles | Username       |
| `maltego.Organization` | Companies/groups  | Name, Type     |

### Custom OSINT Entities

For investigation-specific entities:

```
osint.SocialMediaProfile
├── Platform (Twitter, LinkedIn, etc.)
├── Username
├── Profile URL
├── Bio/Description
└── Activity Status

osint.Asset
├── Asset Type (Property, Vehicle, etc.)
├── Description
├── Value (if known)
└── Location

osint.Incident
├── Incident Type
├── Date
├── Description
├── Severity
└── Source
```

---

## Export Formats

### 1. Maltego GraphML Export

GraphML is the native XML format for Maltego graphs.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="type" for="node" attr.name="Entity Type" attr.type="string"/>
  <key id="label" for="node" attr.name="Label" attr.type="string"/>
  <key id="notes" for="node" attr.name="Notes" attr.type="string"/>
  <key id="confidence" for="node" attr.name="Confidence" attr.type="string"/>

  <graph id="osint-investigation" edgedefault="directed">

    <!-- Example Domain Entity -->
    <node id="domain1">
      <data key="type">maltego.Domain</data>
      <data key="label">example.com</data>
      <data key="notes">Primary domain for target</data>
      <data key="confidence">High</data>
    </node>

    <!-- Example IP Entity -->
    <node id="ip1">
      <data key="type">maltego.IPv4Address</data>
      <data key="label">192.168.1.1</data>
      <data key="notes">Hosting IP</data>
      <data key="confidence">High</data>
    </node>

    <!-- Example Person Entity -->
    <node id="person1">
      <data key="type">maltego.Person</data>
      <data key="label">John Doe</data>
      <data key="notes">Target individual</data>
      <data key="confidence">Medium</data>
    </node>

    <!-- Example Email Entity -->
    <node id="email1">
      <data key="type">maltego.EmailAddress</data>
      <data key="label">john@example.com</data>
      <data key="notes">Primary email</data>
      <data key="confidence">High</data>
    </node>

    <!-- Example Username Entity -->
    <node id="alias1">
      <data key="type">maltego.Alias</data>
      <data key="label">johndoe123</data>
      <data key="notes">Twitter handle</data>
      <data key="confidence">Medium</data>
    </node>

    <!-- Relationships (Edges) -->
    <edge source="domain1" target="ip1">
      <data key="label">Resolves to</data>
    </edge>

    <edge source="person1" target="email1">
      <data key="label">Owns</data>
    </edge>

    <edge source="email1" target="domain1">
      <data key="label">Domain</data>
    </edge>

    <edge source="person1" target="alias1">
      <data key="label">Uses</data>
    </edge>

  </graph>
</graphml>
```

### 2. CSV Import Format

For importing entities and relationships separately:

**Entities CSV:**

```csv
Entity Type,Label,Notes,Confidence,Additional Properties
maltego.Domain,example.com,Primary domain,High,"{\"registrar\":\"GoDaddy\",\"created\":\"2020-01-01\"}"
maltego.IPv4Address,192.168.1.1,Hosting IP,High,"{\"asn\":\"AS12345\",\"location\":\"US\"}"
maltego.Person,John Doe,Target individual,Medium,"{\"age\":\"35\",\"location\":\"NYC\"}"
maltego.EmailAddress,john@example.com,Primary email,High,
maltego.Alias,johndoe123,Twitter handle,Medium,"{\"platform\":\"Twitter\"}"
```

**Relationships CSV:**

```csv
Source Entity,Relationship Type,Target Entity,Notes
example.com,Resolves to,192.168.1.1,A record
John Doe,Owns,john@example.com,Personal email
john@example.com,Domain,example.com,Domain portion
John Doe,Uses,johndoe123,Social media
```

### 3. Maltego Table (MTZ) Format

For complex investigations with multiple tables:

```
Table: Entities
| ID | Type | Value | Notes | Confidence |
|----|------|-------|-------|------------|
| 1 | Domain | example.com | Primary | High |
| 2 | IPv4Address | 192.168.1.1 | Hosting | High |
| 3 | Person | John Doe | Target | Medium |

Table: Relationships
| From_ID | Relationship | To_ID | Notes |
|---------|--------------|-------|-------|
| 1 | Resolves to | 2 | A record |
| 3 | Owns | 4 | Email |
```

---

## Relationship Mapping

### Standard Relationships

| Source Type  | Relationship | Target Type  | Description       |
| ------------ | ------------ | ------------ | ----------------- |
| Domain       | Resolves to  | IPv4Address  | DNS A record      |
| Domain       | MX record    | Domain       | Mail server       |
| Domain       | NS record    | Domain       | Nameserver        |
| EmailAddress | Domain       | Domain       | Email domain      |
| Person       | Owns         | EmailAddress | Personal email    |
| Person       | Uses         | Alias        | Username/handle   |
| Person       | Works at     | Organization | Employment        |
| Person       | Located at   | Location     | Address           |
| Alias        | On platform  | SocialMedia  | Platform presence |
| IPv4Address  | ASN          | AS           | Network block     |
| Organization | Owns         | Domain       | Corporate domain  |
| Organization | Located at   | Location     | Office address    |

### Investigation-Specific Relationships

```
OSINT Investigation Relationships:

Person → [Family member] → Person
Person → [Associate] → Person
Person → [Communicated with] → Person
Person → [Visited] → Location
Person → [Owns] → Asset
Person → [Mentioned in] → Document
Person → [Tagged in] → Photo

Domain → [Subdomain] → Domain
Domain → [Referenced by] → Document
Domain → [Hosts] → URL

EmailAddress → [Received from] → EmailAddress
EmailAddress → [Sent to] → EmailAddress
EmailAddress → [Appears in] → Document

Alias → [Also known as] → Alias
Alias → [Linked to] → Person

Document → [Contains] → IOC
Document → [Published by] → Organization
Document → [Mentions] → Person

IOC → [Related to] → ThreatActor
IOC → [Observed in] → Incident
```

---

## Export Instructions

### Export from OSINT Investigation

**Step 1: Prepare Entity Data**

```bash
# Export tracked entities to intermediate format
/osint-export --format=maltego --target=investigation-name

# Output: investigation-name-maltego.graphml
```

**Step 2: Validate Export**

```bash
# Check XML validity
xmllint --noout investigation-name-maltego.graphml

# Verify entities count
grep -c '<node' investigation-name-maltego.graphml

# Verify relationships count
grep -c '<edge' investigation-name-maltego.graphml
```

**Step 3: Import to Maltego**

1. Open Maltego XL/Classic
2. File → Import → Import Graph
3. Select the .graphml file
4. Map entity types if prompted
5. Review imported entities
6. Apply layout algorithm

### Custom Entity Import

**Create Custom Entities in Maltego:**

1. Entities → Manage Entities
2. Click "New Entity"
3. Define properties:
   - Name: OSINT Investigation
   - Icon: [Select appropriate]
   - Properties:
     - Investigation Name
     - Date Created
     - Analyst
     - Case Number

---

## Example Export File

### Complete Investigation Export

```xml
<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">

  <!-- Property Keys -->
  <key id="entity_type" for="node" attr.name="Entity Type" attr.type="string"/>
  <key id="label" for="node" attr.name="Label" attr.type="string"/>
  <key id="notes" for="node" attr.name="Notes" attr.type="string"/>
  <key id="confidence" for="node" attr.name="Confidence" attr.type="string"/>
  <key id="first_seen" for="node" attr.name="First Seen" attr.type="string"/>
  <key id="source" for="node" attr.name="Source" attr.type="string"/>

  <key id="relationship" for="edge" attr.name="Relationship" attr.type="string"/>
  <key id="evidence" for="edge" attr.name="Evidence" attr.type="string"/>

  <graph id="osint-case-2024-001" edgedefault="directed">

    <!-- Investigation Metadata -->
    <node id="investigation">
      <data key="entity_type">osint.Investigation</data>
      <data key="label">Case 2024-001: Corporate Espionage</data>
      <data key="notes">Investigation into data theft from TechCorp</data>
      <data key="date">2024-01-15</data>
    </node>

    <!-- Primary Target -->
    <node id="target">
      <data key="entity_type">maltego.Person</data>
      <data key="label">Alex Smith</data>
      <data key="notes">Former employee, suspect in data theft</data>
      <data key="confidence">High</data>
      <data key="first_seen">2024-01-15</data>
    </node>

    <!-- Digital Presence -->
    <node id="email">
      <data key="entity_type">maltego.EmailAddress</data>
      <data key="label">alex.smith@example.com</data>
      <data key="notes">Personal email</data>
      <data key="confidence">High</data>
    </node>

    <node id="alias">
      <data key="entity_type">maltego.Alias</data>
      <data key="label">asmith_dev</data>
      <data key="notes">GitHub and Twitter username</data>
      <data key="confidence">Medium</data>
      <data key="source">GitHub profile</data>
    </node>

    <node id="domain">
      <data key="entity_type">maltego.Domain</data>
      <data key="label">asmith-consulting.com</data>
      <data key="notes">Domain registered 2 weeks after termination</data>
      <data key="confidence">High</data>
      <data key="source">WHOIS lookup</data>
    </node>

    <node id="ip">
      <data key="entity_type">maltego.IPv4Address</data>
      <data key="label">203.0.113.45</data>
      <data key="notes">Hosting IP for suspect domain</data>
      <data key="confidence">High</data>
    </node>

    <!-- Infrastructure -->
    <node id="hosting">
      <data key="entity_type">maltego.Organization</data>
      <data key="label">Offshore Hosting Ltd</data>
      <data key="notes">Bulletproof hosting provider</data>
      <data key="confidence">High</data>
    </node>

    <!-- Related Entity -->
    <node id="associate">
      <data key="entity_type">maltego.Person</data>
      <data key="label">Jordan Lee</data>
      <data key="notes">Competitor employee, contacted suspect</data>
      <data key="confidence">Medium</data>
    </node>

    <!-- Relationships -->
    <edge source="investigation" target="target">
      <data key="relationship">Primary Subject</data>
    </edge>

    <edge source="target" target="email">
      <data key="relationship">Owns</data>
      <data key="evidence">Email signature on documents</data>
    </edge>

    <edge source="target" target="alias">
      <data key="relationship">Uses</data>
      <data key="evidence">Profile photos match</data>
    </edge>

    <edge source="email" target="domain">
      <data key="relationship">Registered</data>
      <data key="evidence">WHOIS registration email</data>
    </edge>

    <edge source="domain" target="ip">
      <data key="relationship">Resolves to</data>
      <data key="evidence">DNS A record</data>
    </edge>

    <edge source="ip" target="hosting">
      <data key="relationship">Hosted by</data>
      <data key="evidence">IP WHOIS lookup</data>
    </edge>

    <edge source="target" target="associate">
      <data key="relationship">Communicated with</data>
      <data key="evidence">Email headers show correspondence</data>
    </edge>

  </graph>
</graphml>
```

---

## Import to Maltego

### Step-by-Step Import

1. **Open Maltego**
   - Launch Maltego XL or Classic
   - Create new graph or open existing

2. **Import GraphML**
   - File → Import → Import Graph
   - Select your .graphml file
   - Choose import options:
     - Create new entities: Yes
     - Update existing: Yes/No
     - Import layout: Optional

3. **Entity Mapping**
   - If custom entities don't exist, Maltego will prompt
   - Choose to create new entity types or map to existing
   - For OSINT entities, create custom transforms if needed

4. **Layout and Visualization**
   - Apply layout algorithm:
     - Organic: Good for relationship visualization
     - Hierarchical: Good for organizational structures
     - Circular: Good for hub-and-spoke patterns
   - Adjust entity sizes by importance
   - Color-code by entity type or confidence

5. **Enhancement**
   - Run Maltego transforms on imported entities
   - Expand the graph with additional OSINT data
   - Save as Maltego native format (.mtgx)

### Post-Import Transform Suggestions

**For Domains:**

- DNS transforms (To DNS Name [MX], To IP Address)
- WHOIS transforms
- Certificate transparency logs

**For IP Addresses:**

- To Netblock [Whois]
- To AS Number
- To Geolocation

**For Persons:**

- Social media transforms
- Email to social profiles
- Name to location correlations

**For Email Addresses:**

- To Domain
- To social profiles
- Breach database checks

---

## Best Practices

1. **Consistent Entity Naming** - Use standard formats
2. **Confidence Labeling** - Tag all entities with confidence
3. **Source Attribution** - Note where data came from
4. **Regular Exports** - Export at investigation milestones
5. **Backup Graphs** - Save different versions
6. **Clean Data** - Remove duplicates before import
7. **Document Relationships** - Clear relationship labels
8. **Use Custom Icons** - Visual distinction for entity types

---

## Troubleshooting

### Common Issues

**Import Fails:**

- Check XML validity
- Verify encoding (UTF-8)
- Ensure proper GraphML namespace

**Entities Don't Display:**

- Check entity type names match Maltego
- Verify custom entities are created
- Check for special characters in labels

**Relationships Missing:**

- Verify edge source/target IDs exist
- Check for self-referencing edges
- Ensure edge direction is correct

**Large Graphs Slow:**

- Split into multiple exports
- Filter by confidence level
- Use aggregation for dense areas

---

## Automation

### Script Example (Python)

```python
import xml.etree.ElementTree as ET

def export_to_maltego(entities, relationships, filename):
    """Export OSINT data to Maltego GraphML format."""

    # Create GraphML structure
    root = ET.Element('graphml')
    root.set('xmlns', 'http://graphml.graphdrawing.org/xmlns')

    # Add property keys
    key_type = ET.SubElement(root, 'key')
    key_type.set('id', 'type')
    key_type.set('for', 'node')
    key_type.set('attr.name', 'Entity Type')
    key_type.set('attr.type', 'string')

    # Create graph
    graph = ET.SubElement(root, 'graph')
    graph.set('id', 'osint-export')
    graph.set('edgedefault', 'directed')

    # Add nodes (entities)
    for entity in entities:
        node = ET.SubElement(graph, 'node')
        node.set('id', entity['id'])

        data_type = ET.SubElement(node, 'data')
        data_type.set('key', 'type')
        data_type.text = entity['type']

        data_label = ET.SubElement(node, 'data')
        data_label.set('key', 'label')
        data_label.text = entity['label']

    # Add edges (relationships)
    for rel in relationships:
        edge = ET.SubElement(graph, 'edge')
        edge.set('source', rel['source'])
        edge.set('target', rel['target'])

        data_rel = ET.SubElement(edge, 'data')
        data_rel.set('key', 'relationship')
        data_rel.text = rel['type']

    # Write to file
    tree = ET.ElementTree(root)
    tree.write(filename, encoding='utf-8', xml_declaration=True)

    print(f"Exported {len(entities)} entities and {len(relationships)} relationships to {filename}")

# Example usage
entities = [
    {'id': 'e1', 'type': 'maltego.Person', 'label': 'John Doe'},
    {'id': 'e2', 'type': 'maltego.Domain', 'label': 'example.com'},
]

relationships = [
    {'source': 'e1', 'target': 'e2', 'type': 'Owns'},
]

export_to_maltego(entities, relationships, 'investigation.graphml')
```
