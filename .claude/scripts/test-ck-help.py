#!/usr/bin/env python3
"""
Comprehensive test suite for ck-help.py
Run: python3 .claude/scripts/test-ck-help.py
"""

import subprocess
import sys
from pathlib import Path

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

SCRIPT_PATH = Path(__file__).parent / "ck-help.py"


def run_ck_help(*args):
    """Run ck-help.py with given arguments and return output."""
    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH)] + list(args),
        capture_output=True,
        text=True
    )
    return result.stdout + result.stderr


def test_case(name, args, expected_patterns, unexpected_patterns=None):
    """Run a test case and check for expected patterns."""
    output = run_ck_help(*args) if args else run_ck_help()

    passed = True
    errors = []

    for pattern in expected_patterns:
        if pattern not in output:
            passed = False
            errors.append(f"Missing: '{pattern}'")

    if unexpected_patterns:
        for pattern in unexpected_patterns:
            if pattern in output:
                passed = False
                errors.append(f"Unexpected: '{pattern}'")

    status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
    print(f"{status} {name}")

    if not passed:
        for error in errors:
            print(f"    {YELLOW}{error}{RESET}")

    return passed


def main():
    print("=" * 60)
    print("ck-help.py Test Suite")
    print("=" * 60)
    print()

    tests = []

    # ========== New Category Guides ==========
    print("--- New Category Guides ---")

    tests.append(test_case(
        "worktree category",
        ["worktree"],
        ["Git Worktrees", "Parallel Development", "/worktree", "isolated branch"]
    ))

    tests.append(test_case(
        "kanban category",
        ["kanban"],
        ["AI Orchestration Board", "/kanban", "dashboard", "progress"]
    ))

    tests.append(test_case(
        "preview category",
        ["preview"],
        ["Content Preview", "Novel Reader", "/preview", "markdown"]
    ))

    tests.append(test_case(
        "journal category",
        ["journal"],
        ["Technical Journaling", "/journal", "failure", "Lessons"]
    ))

    tests.append(test_case(
        "brainstorm category",
        ["brainstorm"],
        ["Brainstorming", "Ideation", "/brainstorm", "codingLevel"]
    ))

    tests.append(test_case(
        "watzup category",
        ["watzup"],
        ["Session Review", "Wrap-up", "/watzup", "summary"]
    ))

    # ========== Existing Categories ==========
    print("\n--- Existing Categories ---")

    tests.append(test_case(
        "plan category",
        ["plan"],
        ["Planning", "/plan:fast", "/plan:hard", "/plan:validate", "Commands:"]
    ))

    tests.append(test_case(
        "fix category",
        ["fix"],
        ["Fixing Issues", "/fix", "/debug"]
    ))

    tests.append(test_case(
        "cook category",
        ["cook"],
        ["Implementation", "/cook"]
    ))

    # ========== Overview ==========
    print("\n--- Overview ---")

    tests.append(test_case(
        "overview shows workflow sequences",
        [],
        ["Common Workflows:", "/plan", "/code", "/test", "/git:pr", "→"]
    ))

    tests.append(test_case(
        "overview shows tips",
        [],
        ["Tips:", "/brainstorm", "ultrathink", "tokens", "/preview", ":parallel", "quota"]
    ))

    tests.append(test_case(
        "overview shows categories",
        [],
        ["Categories:", "bootstrap", "cook", "fix", "plan", "test"]
    ))

    # ========== Intent Detection Fixes ==========
    print("\n--- Intent Detection Fixes ---")

    tests.append(test_case(
        "multi-word routes to task (not category)",
        ["test", "my", "login"],
        ["Recommended for:"],
        ["# Testing"]  # Should NOT show category guide
    ))

    tests.append(test_case(
        "single word category still works",
        ["test"],
        ["Testing", "Workflow:"]
    ))

    # ========== Word Boundary Fix ==========
    print("\n--- Word Boundary Fix ---")

    tests.append(test_case(
        "git matches git commands",
        ["git", "commit"],
        ["Recommended for:", "/git:cm"]
    ))

    tests.append(test_case(
        "digital marketing - git should NOT match",
        ["digital", "marketing"],
        ["content", "Recommended for:"],
        ["/git"]  # git should NOT appear for "digital"
    ))

    # ========== Command Lookup ==========
    print("\n--- Command Lookup ---")

    tests.append(test_case(
        "command with colon",
        ["plan:fast"],
        ["plan:fast"]
    ))

    # ========== Special Guides ==========
    print("\n--- Special Guides ---")

    tests.append(test_case(
        "config guide",
        ["config"],
        [".ck.json", "Configuration", "locale", "codingLevel"]
    ))

    tests.append(test_case(
        "coding-level guide",
        ["coding-level"],
        ["Coding Level", "ELI5", "God Mode", "-1"]
    ))

    # ========== Summary ==========
    print()
    print("=" * 60)
    passed = sum(tests)
    total = len(tests)

    if passed == total:
        print(f"{GREEN}All {total} tests passed!{RESET}")
        sys.exit(0)
    else:
        print(f"{RED}{total - passed} of {total} tests failed{RESET}")
        sys.exit(1)


if __name__ == "__main__":
    main()
