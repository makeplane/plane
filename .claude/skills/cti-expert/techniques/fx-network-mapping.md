# fx-network-mapping

## Purpose

Construct a node-edge map of infrastructure or social relationships associated with a subject. Output is graph-ready data suitable for visualization in tools like Gephi or Maltego.

## Quick Reference

| Item       | Detail                                                            |
| ---------- | ----------------------------------------------------------------- |
| Command    | /map-network                                                      |
| Input      | Seed identifier (domain, IP, username, or organization name)      |
| Output     | Node list, edge list, adjacency summary, visual-ready export      |
| Confidence | HIGH for directly observed connections; MEDIUM for inferred edges |

## Methodology

1. **Define the map boundary:** Set seed subject, hop depth (typically 2), and whether mapping infrastructure or social connections
2. **Infrastructure map path:**
   - Resolve all A/AAAA, MX, NS records for seed domain
   - Run ASN lookup for each IP (`whois -h whois.cymru.com " -v IP"`)
   - Enumerate subdomains via certificate transparency logs (crt.sh)
   - Map CDN/hosting relationships via reverse IP lookup
3. **Social map path:**
   - Collect follower/following lists for subject accounts
   - Extract co-mentions and replies from public posts
   - Identify shared group/organization memberships
4. For each connection found: record source node, target node, edge type, and first/last observed date
5. Deduplicate nodes (same subject, different handles) using cross-platform username matching
6. Assign edge weights: direct message (1.0), reply/mention (0.7), retweet (0.5), follow (0.2)
7. Export in edge-list CSV format; optionally convert to GEXF for Gephi

## Map Structure

```
Nodes:  subjects, organizations, IP blocks, domains
Edges:  follows, mentions, employs, hosts, resolves-to, registered-by

Example edge record:
  source:     user_A
  target:     user_B
  type:       mention
  weight:     0.7
  platform:   twitter
  first_seen: 2024-11-03
  last_seen:  2025-02-18
```

## Tools & Fallbacks

| Priority | Tool              | Install                   | Notes                                            |
| -------- | ----------------- | ------------------------- | ------------------------------------------------ |
| 1        | Maltego CE        | maltego.com               | Visual graph building; transforms for OSINT      |
| 2        | Gephi             | gephi.org                 | Post-collection visualization; layout algorithms |
| 3        | crt.sh            | crt.sh                    | Certificate transparency → subdomain nodes       |
| 4        | NetworkX (Python) | `pip3 install networkx`   | Scripted graph analysis; centrality metrics      |
| 5        | SpiderFoot        | `pip3 install spiderfoot` | Automated OSINT → graph data                     |
| 6        | Shodan            | shodan.io                 | Infrastructure node discovery                    |

## Graph Metrics Reference

| Metric                 | Meaning                   | High Value =                   |
| ---------------------- | ------------------------- | ------------------------------ |
| Degree centrality      | Direct connection count   | Popular / well-connected node  |
| Betweenness centrality | Bridge paths through node | Information broker, gatekeeper |
| Closeness centrality   | Average hops to all nodes | Rapid information spreader     |
| Clustering coefficient | Neighbor interconnection  | Tight-knit local cluster       |
| PageRank               | Weighted importance       | Authority node                 |

## Output Format

```
Seed: example.com

Infrastructure Nodes (8):
  93.184.216.34  (A record)      → AS15133 MCI Communications
  ns1.example.com                → nameserver node
  crt.sh: 14 subdomains found

Social Nodes (23):
  @example_official (Twitter, 14K followers)
  example-corp (LinkedIn, 342 employees)

Top Edges by Weight:
  @example_official → @partner_org   (mention ×47, weight 0.9)
  @exec_name        → @example_official (follow + mention ×12)

Betweenness: @exec_name ranks highest — single bridge between
             customer community and corporate account cluster
```

## Limitations

- Private accounts and internal communications produce invisible edges — map is always incomplete
- Cross-platform identity resolution is heuristic; false merges are possible
- Large graphs (>10K nodes) require layout algorithm tuning to remain readable
- Social graph is a time-frozen snapshot; relationships change faster than collection cycles
- Infrastructure maps reflect DNS TTL state; short TTLs may show stale data

## Related Techniques

- [fx-social-topology.md](fx-social-topology.md) — deeper graph metrics and community detection
- [fx-geolocation.md](fx-geolocation.md) — geolocate IP nodes onto physical map
- [fx-http-fingerprint.md](fx-http-fingerprint.md) — fingerprint infrastructure nodes after mapping
