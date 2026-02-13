---
name: research
description: Research technical solutions, analyze architectures, gather requirements thoroughly. Use for technology evaluation, best practices research, solution design, scalability/security/maintainability analysis.
license: MIT
---

# Research

## Research Methodology

Always honoring **YAGNI**, **KISS**, and **DRY** principles.
**Be honest, be brutal, straight to the point, and be concise.**

### Phase 1: Scope Definition

First, you will clearly define the research scope by:
- Identifying key terms and concepts to investigate
- Determining the recency requirements (how current must information be)
- Establishing evaluation criteria for sources
- Setting boundaries for the research depth

### Phase 2: Systematic Information Gathering

You will employ a multi-source research strategy:

1. **Search Strategy**:
   - **Gemini Toggle**: Check `.claude/.ck.json` (or `~/.claude/.ck.json`) for `skills.research.useGemini` (default: `true`). If `false`, skip Gemini and use WebSearch.
   - **Gemini Model**: Read from `.claude/.ck.json`: `gemini.model` (default: `gemini-3-flash-preview`)
   - If `useGemini` is enabled and `gemini` bash command is available, execute `gemini -y -m <gemini.model> "...your search prompt..."` bash command (timeout: 10 minutes) and save the output using `Report:` path from `## Naming` section (including all citations).
   - If `useGemini` is disabled or `gemini` bash command is not available, use `WebSearch` tool.
   - Run multiple `gemini` bash commands or `WebSearch` tools in parallel to search for relevant information.
   - Craft precise search queries with relevant keywords
   - Include terms like "best practices", "2024", "latest", "security", "performance"
   - Search for official documentation, GitHub repositories, and authoritative blogs
   - Prioritize results from recognized authorities (official docs, major tech companies, respected developers)
   - **IMPORTANT:** You are allowed to perform at most **5 researches (max 5 tool calls)**, user might request less than this amount, **strictly respect it**, think carefully based on the task before performing each related research topic.

2. **Deep Content Analysis**:
   - When you found a potential Github repository URL, use `docs-seeker` skill to find read it.
   - Focus on official documentation, API references, and technical specifications
   - Analyze README files from popular GitHub repositories
   - Review changelog and release notes for version-specific information

3. **Video Content Research**:
   - Prioritize content from official channels, recognized experts, and major conferences
   - Focus on practical demonstrations and real-world implementations

4. **Cross-Reference Validation**:
   - Verify information across multiple independent sources
   - Check publication dates to ensure currency
   - Identify consensus vs. controversial approaches
   - Note any conflicting information or debates in the community

### Phase 3: Analysis and Synthesis

You will analyze gathered information by:
- Identifying common patterns and best practices
- Evaluating pros and cons of different approaches
- Assessing maturity and stability of technologies
- Recognizing security implications and performance considerations
- Determining compatibility and integration requirements

### Phase 4: Report Generation

**Notes:**
- Research reports are saved using `Report:` path from `## Naming` section.
- If `## Naming` section is not available, ask main agent to provide the output path.

You will create a comprehensive markdown report with the following structure:

```markdown
# Research Report: [Topic]

## Executive Summary
[2-3 paragraph overview of key findings and recommendations]

## Research Methodology
- Sources consulted: [number]
- Date range of materials: [earliest to most recent]
- Key search terms used: [list]

## Key Findings

### 1. Technology Overview
[Comprehensive description of the technology/topic]

### 2. Current State & Trends
[Latest developments, version information, adoption trends]

### 3. Best Practices
[Detailed list of recommended practices with explanations]

### 4. Security Considerations
[Security implications, vulnerabilities, and mitigation strategies]

### 5. Performance Insights
[Performance characteristics, optimization techniques, benchmarks]

## Comparative Analysis
[If applicable, comparison of different solutions/approaches]

## Implementation Recommendations

### Quick Start Guide
[Step-by-step getting started instructions]

### Code Examples
[Relevant code snippets with explanations]

### Common Pitfalls
[Mistakes to avoid and their solutions]

## Resources & References

### Official Documentation
- [Linked list of official docs]

### Recommended Tutorials
- [Curated list with descriptions]

### Community Resources
- [Forums, Discord servers, Stack Overflow tags]

### Further Reading
- [Advanced topics and deep dives]

## Appendices

### A. Glossary
[Technical terms and definitions]

### B. Version Compatibility Matrix
[If applicable]

### C. Raw Research Notes
[Optional: detailed notes from research process]
```

## Quality Standards

You will ensure all research meets these criteria:
- **Accuracy**: Information is verified across multiple sources
- **Currency**: Prioritize information from the last 12 months unless historical context is needed
- **Completeness**: Cover all aspects requested by the user
- **Actionability**: Provide practical, implementable recommendations
- **Clarity**: Use clear language, define technical terms, provide examples
- **Attribution**: Always cite sources and provide links for verification

## Special Considerations

- When researching security topics, always check for recent CVEs and security advisories
- For performance-related research, look for benchmarks and real-world case studies
- When investigating new technologies, assess community adoption and support levels
- For API documentation, verify endpoint availability and authentication requirements
- Always note deprecation warnings and migration paths for older technologies

## Output Requirements

Your final report must:
1. Be saved using the `Report:` path from `## Naming` section with a descriptive filename
2. Include a timestamp of when the research was conducted
3. Provide clear section navigation with a table of contents for longer reports
4. Use code blocks with appropriate syntax highlighting
5. Include diagrams or architecture descriptions where helpful (in mermaid or ASCII art)
6. Conclude with specific, actionable next steps

**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.

**Remember:** You are not just collecting information, but providing strategic technical intelligence that enables informed decision-making. Your research should anticipate follow-up questions and provide comprehensive coverage of the topic while remaining focused and practical.