#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Three.js Skill Search - CLI for searching Three.js examples and API
Usage: python search.py "<query>" [--domain <domain>] [--max-results 5]
       python search.py "<query>" --use-case
       python search.py --category <category>
       python search.py --complexity <low|medium|high>

Domains: examples, categories, use-cases, api
"""

import argparse
import json
from core import (
    CSV_CONFIG, MAX_RESULTS, search,
    search_by_complexity, search_by_category, get_recommended_examples
)


def format_output(result):
    """Format results for Claude consumption (token-optimized)"""
    if "error" in result:
        return f"Error: {result['error']}"

    output = []
    output.append(f"## Three.js Search Results")
    output.append(f"**Domain:** {result['domain']} | **Query:** {result.get('query', result.get('category', result.get('complexity', 'N/A')))}")
    output.append(f"**Found:** {result['count']} results\n")

    for i, row in enumerate(result['results'], 1):
        output.append(f"### Result {i}")
        for key, value in row.items():
            value_str = str(value)
            if len(value_str) > 300:
                value_str = value_str[:300] + "..."
            output.append(f"- **{key}:** {value_str}")
        output.append("")

    return "\n".join(output)


def main():
    parser = argparse.ArgumentParser(description="Three.js Skill Search")
    parser.add_argument("query", nargs="?", help="Search query")
    parser.add_argument("--domain", "-d", choices=list(CSV_CONFIG.keys()), help="Search domain")
    parser.add_argument("--max-results", "-n", type=int, default=MAX_RESULTS, help="Max results (default: 5)")
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    # Special search modes
    parser.add_argument("--use-case", "-u", action="store_true", help="Get recommended examples for use case")
    parser.add_argument("--category", "-c", type=str, help="Filter by category")
    parser.add_argument("--complexity", "-x", choices=["low", "medium", "high"], help="Filter by complexity")

    args = parser.parse_args()

    # Handle special search modes
    if args.complexity:
        result = search_by_complexity(args.complexity, args.max_results)
    elif args.category:
        result = search_by_category(args.category, args.max_results)
    elif args.use_case and args.query:
        result = get_recommended_examples(args.query, args.max_results)
    elif args.query:
        result = search(args.query, args.domain, args.max_results)
    else:
        parser.print_help()
        return

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(format_output(result))


if __name__ == "__main__":
    main()
