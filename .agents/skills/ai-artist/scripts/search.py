#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Artist Search - BM25 search engine for prompt engineering resources
Usage: python search.py "<query>" [--domain <domain>] [--max-results 3]
       python search.py "<query>" --prompt-system [--platform <platform>]

Domains: use-case, style, platform, technique, lighting
Platforms: midjourney, dalle, sd, flux, nano-banana
"""

import argparse
import sys
from core import CSV_CONFIG, MAX_RESULTS, search, search_all_domains

# Fix Windows cp1252 encoding: hardcoded emojis can't encode on Windows.
# Reconfigure stdout to UTF-8 with replacement (Python 3.7+).
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def format_output(result):
    """Format results for Claude consumption (token-optimized)"""
    if "error" in result:
        return f"Error: {result['error']}"

    output = []
    output.append(f"## AI Artist Search Results")
    output.append(f"**Domain:** {result['domain']} | **Query:** {result['query']}")
    output.append(f"**Source:** {result['file']} | **Found:** {result['count']} results\n")

    for i, row in enumerate(result['results'], 1):
        output.append(f"### Result {i}")
        for key, value in row.items():
            value_str = str(value)
            if len(value_str) > 400:
                value_str = value_str[:400] + "..."
            output.append(f"- **{key}:** {value_str}")
        output.append("")

    return "\n".join(output)


def generate_prompt_system(query, platform=None):
    """Generate a comprehensive prompt system for a given concept"""
    output = []
    output.append(f"## 🎨 AI Artist Prompt System")
    output.append(f"**Concept:** {query}")
    if platform:
        output.append(f"**Target Platform:** {platform}")
    output.append("")

    # Search relevant domains
    use_case = search(query, "use-case", 1)
    style = search(query, "style", 2)
    lighting = search(query, "lighting", 1)
    technique = search(query, "technique", 2)

    # Use case / Template
    if use_case.get("count", 0) > 0:
        uc = use_case["results"][0]
        output.append("### 📋 Use Case Match")
        output.append(f"**{uc.get('Use Case', 'N/A')}** ({uc.get('Category', '')})")
        if uc.get("Prompt Template"):
            output.append(f"**Template:** `{uc.get('Prompt Template')}`")
        if uc.get("Key Elements"):
            output.append(f"**Key Elements:** {uc.get('Key Elements')}")
        if uc.get("Tips"):
            output.append(f"**Tips:** {uc.get('Tips')}")
        output.append("")

    # Styles
    if style.get("count", 0) > 0:
        output.append("### 🎭 Recommended Styles")
        for s in style["results"]:
            output.append(f"**{s.get('Style Name', 'N/A')}** - {s.get('Description', '')}")
            if s.get("Prompt Keywords"):
                output.append(f"  Keywords: `{s.get('Prompt Keywords')}`")
        output.append("")

    # Lighting
    if lighting.get("count", 0) > 0:
        lt = lighting["results"][0]
        output.append("### 💡 Lighting Suggestion")
        output.append(f"**{lt.get('Lighting Type', 'N/A')}** - {lt.get('Description', '')}")
        output.append(f"  Mood: {lt.get('Mood', '')} | Keywords: `{lt.get('Prompt Keywords', '')}`")
        output.append("")

    # Techniques
    if technique.get("count", 0) > 0:
        output.append("### 🔧 Relevant Techniques")
        for t in technique["results"]:
            output.append(f"**{t.get('Technique', 'N/A')}**: {t.get('Description', '')}")
            if t.get("Syntax Example"):
                output.append(f"  Example: `{t.get('Syntax Example')}`")
        output.append("")

    # Platform-specific tips
    if platform:
        plat = search(platform, "platform", 1)
        if plat.get("count", 0) > 0:
            p = plat["results"][0]
            output.append(f"### 🖥️ {p.get('Platform', '')} Tips")
            output.append(f"**Prompt Style:** {p.get('Prompt Style', '')}")
            output.append(f"**Key Parameters:** {p.get('Key Parameters', '')}")
            output.append(f"**Best Practices:** {p.get('Best Practices', '')}")
            output.append("")

    return "\n".join(output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Artist Search")
    parser.add_argument("query", help="Search query")
    parser.add_argument("--domain", "-d", choices=list(CSV_CONFIG.keys()), help="Search domain")
    parser.add_argument("--max-results", "-n", type=int, default=MAX_RESULTS, help="Max results (default: 3)")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    # Prompt system generation
    parser.add_argument("--prompt-system", "-ps", action="store_true", help="Generate comprehensive prompt system")
    parser.add_argument("--platform", "-p", type=str, default=None, help="Target platform for prompt system")
    parser.add_argument("--all", "-a", action="store_true", help="Search all domains")

    args = parser.parse_args()

    # Prompt system generation
    if args.prompt_system:
        result = generate_prompt_system(args.query, args.platform)
        print(result)
    # Search all domains
    elif args.all:
        results = search_all_domains(args.query, args.max_results)
        if args.json:
            import json
            print(json.dumps(results, indent=2, ensure_ascii=False))
        else:
            for domain, result in results.items():
                print(format_output(result))
                print("---\n")
    # Domain search
    else:
        result = search(args.query, args.domain, args.max_results)
        if args.json:
            import json
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(format_output(result))
