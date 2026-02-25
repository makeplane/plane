#!/usr/bin/env python3
"""Integration tests for ck-help.py using real user queries and edge cases."""

import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).parent / "ck-help.py"


def run_ck_help(query: str) -> str:
    """Run ck-help.py with query and return output."""
    result = subprocess.run(
        [sys.executable, str(SCRIPT)] + query.split(),
        capture_output=True,
        text=True
    )
    return result.stdout


def test_routes_to_category(query: str, expected_category: str) -> bool:
    """Check if query routes to expected category via keywords in output."""
    output = run_ck_help(query).lower()
    # Check various markers that indicate the category
    markers = {
        "notifications": ["discord", "telegram", "slack", "webhook", "notify", "session notifications"],
        "git": ["commit", "push", "pr", "merge", "/git:", "git workflow"],
        "test": ["/test", "run tests", "fix failures", "testing"],
        "fix": ["/fix", "/debug", "fixing issues"],
        "bootstrap": ["/bootstrap", "project setup", "quick start"],
        "config": [".ck.json", "global", "local", "configuration"],
        "plan": ["/plan", "planning", "research"],
        "cook": ["/cook", "implementation", "implement"],
        "review": ["/review", "code review", "audit"],
        "design": ["/design", "ui", "ux"],
    }

    expected_markers = markers.get(expected_category, [expected_category])
    return any(marker in output for marker in expected_markers)


# Real user queries - typos
TYPO_TESTS = [
    ("notificatons setup", "notifications"),  # missing 'i'
    ("notifcations", "notifications"),  # transposition
    ("discrod webhook", "notifications"),  # discord typo
    ("tset my code", "test"),  # test typo - 'tset'
    ("comit changes", "git"),  # commit typo
    ("configre discord", "notifications"),  # configure typo
]

# Synonym tests
SYNONYM_TESTS = [
    ("setup alerts", "notifications"),  # alerts → notifications
    ("run specs", "test"),  # specs → tests
    ("create pr", "git"),  # pr → pull request
    ("check deps", "fix"),  # deps → dependencies, check → verify
]

# Descriptive phrase tests
PHRASE_TESTS = [
    ("how do I send discord notifications", "notifications"),
    ("I want to commit my changes", "git"),
    ("need to test my login page", "test"),
    ("fix broken authentication", "fix"),
    ("start a new react project", "bootstrap"),
]

# Edge cases
EDGE_TESTS = [
    ("configure discord", "notifications"),  # service-specific
    ("telegram bot", "notifications"),  # service-specific
    ("slack webhook", "notifications"),  # service-specific
    ("discord webhook", "notifications"),  # explicit compound
]


def run_test_suite(name: str, tests: list) -> tuple:
    """Run a test suite and return (passed, failed) counts."""
    print(f"\n## {name}\n")
    passed = 0
    failed = 0

    for query, expected in tests:
        result = test_routes_to_category(query, expected)
        status = "✅" if result else "❌"
        print(f"{status} '{query}' → {expected}")
        if result:
            passed += 1
        else:
            failed += 1
            # Show actual output for debugging
            output = run_ck_help(query)
            print(f"   Actual output preview: {output[:100]}...")

    return passed, failed


def main():
    print("=" * 60)
    print("ck-help.py Integration Tests")
    print("=" * 60)

    total_passed = 0
    total_failed = 0

    # Run all test suites
    for name, tests in [
        ("Typo Tolerance", TYPO_TESTS),
        ("Synonym Expansion", SYNONYM_TESTS),
        ("Descriptive Phrases", PHRASE_TESTS),
        ("Edge Cases", EDGE_TESTS),
    ]:
        passed, failed = run_test_suite(name, tests)
        total_passed += passed
        total_failed += failed

    print()
    print("=" * 60)
    print(f"SUMMARY: {total_passed} passed, {total_failed} failed")
    print("=" * 60)

    sys.exit(0 if total_failed == 0 else 1)


if __name__ == "__main__":
    main()
