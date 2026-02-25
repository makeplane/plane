#!/usr/bin/env python3
"""
Comprehensive test suite for ck-help.py
Tests all user scenarios and edge cases.

Run: python test_ck_help.py
"""

import subprocess
import sys
from pathlib import Path

SCRIPT_PATH = Path(__file__).parent / "ck-help.py"

# Test results tracking
passed = 0
failed = 0
failures = []


def run_ck_help(args: str) -> tuple[str, int]:
    """Run ck-help.py with given arguments and return (output, exit_code)."""
    cmd = [sys.executable, str(SCRIPT_PATH)] + (args.split() if args else [])
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout + result.stderr, result.returncode


def test(name: str, args: str, expect_contains: list[str] = None, expect_type: str = None, expect_not_contains: list[str] = None):
    """Run a test case and check expectations."""
    global passed, failed, failures

    output, code = run_ck_help(args)
    success = True
    errors = []

    # Check output type marker
    if expect_type:
        marker = f"@CK_OUTPUT_TYPE:{expect_type}"
        if marker not in output:
            success = False
            errors.append(f"Expected type {expect_type}, got: {output[:100]}")

    # Check expected content
    if expect_contains:
        for text in expect_contains:
            if text.lower() not in output.lower():
                success = False
                errors.append(f"Expected '{text}' not found")

    # Check content that should NOT be present
    if expect_not_contains:
        for text in expect_not_contains:
            if text.lower() in output.lower():
                success = False
                errors.append(f"Unexpected '{text}' found")

    if success:
        passed += 1
        print(f"✅ {name}")
    else:
        failed += 1
        failures.append((name, args, errors, output[:500]))
        print(f"❌ {name}")
        for e in errors:
            print(f"   {e}")


def main():
    print("=" * 60)
    print("ck-help.py Comprehensive Test Suite")
    print("=" * 60)
    print()

    # =========================================
    # CATEGORY 1: Input Validation
    # =========================================
    print("\n## Category 1: Input Validation\n")

    test(
        "1.1 Empty input → overview",
        "",
        expect_contains=["ClaudeKit Commands", "Quick Start"],
        expect_type="category-guide"
    )

    test(
        "1.2 Single space → overview",
        " ",
        expect_contains=["ClaudeKit Commands"],
        expect_type="category-guide"
    )

    test(
        "1.3 Very long input (handled)",
        "a " * 100,  # 200 chars
        expect_type="task-recommendations"  # Will try to parse as task
    )

    # =========================================
    # CATEGORY 2: Intent Detection
    # =========================================
    print("\n## Category 2: Intent Detection\n")

    test(
        "2.1 Single known category → category guide",
        "fix",
        expect_contains=["Fixing Issues", "Workflow"],
        expect_type="category-guide"
    )

    test(
        "2.2 Single unknown word → search",
        "xyzabc",
        expect_contains=["No commands found"],
        expect_type="search-results"
    )

    test(
        "2.3 Single word with colon → command",
        "plan:fast",
        expect_type="command-details"
    )

    test(
        "2.4 Multiple words → task",
        "fix bugs",
        expect_contains=["Recommended for"],
        expect_type="task-recommendations"
    )

    test(
        "2.5 Case insensitive category",
        "FIX",
        expect_contains=["Fixing Issues"],
        expect_type="category-guide"
    )

    test(
        "2.6 Mixed case category",
        "Fix",
        expect_contains=["Fixing Issues"],
        expect_type="category-guide"
    )

    # =========================================
    # CATEGORY 3: All Categories Work
    # =========================================
    print("\n## Category 3: Category Queries\n")

    categories_with_guides = [
        ("fix", "Fixing Issues"),
        ("plan", "Planning"),
        ("cook", "Implementation"),
        ("bootstrap", "Project Setup"),
        ("test", "Testing"),
        ("docs", "Documentation"),
        ("git", "Git Workflow"),
        ("design", "Design"),
        ("review", "Code Review"),
        ("content", "Content Creation"),
        ("integrate", "Integration"),
        ("skill", "Skill Management"),
        ("scout", "Codebase Exploration"),
        ("config", "ClaudeKit Configuration"),
        ("coding-level", "Coding Level"),
        ("worktree", "Git Worktrees"),
        ("kanban", "AI Orchestration"),
        ("preview", "Content Preview"),
        ("journal", "Technical Journaling"),
        ("brainstorm", "Brainstorming"),
        ("watzup", "Session Review"),
        ("notifications", "Session Notifications"),
    ]

    for cat, title in categories_with_guides:
        test(
            f"3.x Category '{cat}'",
            cat,
            expect_contains=[title]
        )

    test(
        "3.23 Unknown category → helpful message",
        "nonexistent",
        expect_contains=["No commands found"]
    )

    # =========================================
    # CATEGORY 4: Task Scoring (Positional Weighting)
    # =========================================
    print("\n## Category 4: Task Scoring Algorithm\n")

    test(
        "4.1 'setup notifications' → notifications (not bootstrap)",
        "setup notifications",
        expect_contains=["DISCORD_WEBHOOK_URL", "notifications"],
        expect_not_contains=["/bootstrap"]
    )

    test(
        "4.2 'fix bugs' → fix category",
        "fix bugs",
        expect_contains=["/fix"],  # Workflow shows /fix commands
        expect_type="task-recommendations"
    )

    test(
        "4.3 'create new feature' → cook category",
        "create new feature",
        expect_contains=["/cook"],
        expect_type="task-recommendations"
    )

    test(
        "4.4 'add discord webhook' → notifications (discord keyword)",
        "add discord webhook",
        expect_contains=["notifications", "DISCORD"],
        expect_type="task-recommendations"
    )

    test(
        "4.5 'telegram alerts' → notifications",
        "telegram alerts",
        expect_contains=["notifications"],
        expect_type="task-recommendations"
    )

    test(
        "4.6 'setup slack' → notifications (slack keyword)",
        "setup slack",
        expect_contains=["notifications"],
        expect_type="task-recommendations"
    )

    test(
        "4.7 'start new project' → bootstrap",
        "start new project",
        expect_contains=["/bootstrap"],
        expect_type="task-recommendations"
    )

    test(
        "4.8 'commit my changes' → git (action verb 'commit' at start)",
        "commit my changes",
        expect_contains=["/git"],  # "commit" is action verb = high intent
        expect_type="task-recommendations"
    )

    test(
        "4.9 'test my code' → test (action verb 'test' at start)",
        "test my code",
        expect_contains=["/test"],  # "test" is action verb = high intent, shows /test workflow
        expect_type="task-recommendations"
    )

    test(
        "4.10 No keyword match → helpful message",
        "xyzzy foo bar",
        expect_contains=["Not sure about", "browse categories"]
    )

    # Edge cases: service-specific queries should hit notifications, not config
    test(
        "4.11 'configure discord' → notifications (service keyword)",
        "configure discord",
        expect_contains=["DISCORD_WEBHOOK_URL"],
        expect_type="task-recommendations"
    )

    test(
        "4.12 'discord webhook' → notifications",
        "discord webhook",
        expect_contains=["notifications"],
        expect_type="task-recommendations"
    )

    test(
        "4.13 'telegram bot' → notifications",
        "telegram bot",
        expect_contains=["TELEGRAM"],
        expect_type="task-recommendations"
    )

    # =========================================
    # CATEGORY 5: Command Lookup
    # =========================================
    print("\n## Category 5: Command Lookup\n")

    test(
        "5.1 Command with colon",
        "plan:fast",
        expect_type="command-details"
    )

    test(
        "5.2 Command not found → search fallback",
        "plan:nonexistent",
        expect_contains=["not found"]
    )

    # =========================================
    # CATEGORY 6: Special Queries
    # =========================================
    print("\n## Category 6: Special Queries\n")

    test(
        "6.1 'config' → comprehensive docs",
        "config",
        expect_contains=["ClaudeKit Configuration", ".ck.json"],
        expect_type="comprehensive-docs"
    )

    test(
        "6.2 '.ck.json' → comprehensive docs",
        ".ck.json",
        expect_contains=["ClaudeKit Configuration"],
        expect_type="comprehensive-docs"
    )

    test(
        "6.3 'coding-level' → comprehensive docs",
        "coding-level",
        expect_contains=["Coding Level", "ELI5"],
        expect_type="comprehensive-docs"
    )

    test(
        "6.4 'eli5' → comprehensive docs",
        "eli5",
        expect_contains=["Coding Level"],
        expect_type="comprehensive-docs"
    )

    test(
        "6.5 'god mode' → comprehensive docs",
        "god mode",
        expect_contains=["Coding Level", "God Mode"],
        expect_type="comprehensive-docs"
    )

    # =========================================
    # CATEGORY 7: Output Type Markers
    # =========================================
    print("\n## Category 7: Output Type Markers\n")

    test(
        "7.1 Overview has correct type",
        "",
        expect_type="category-guide"
    )

    test(
        "7.2 Category has correct type",
        "fix",
        expect_type="category-guide"
    )

    test(
        "7.3 Command has correct type",
        "fix:fast",
        expect_type="command-details"
    )

    test(
        "7.4 Search has correct type",
        "nonexistent",
        expect_type="search-results"
    )

    test(
        "7.5 Task has correct type",
        "fix my bug",
        expect_type="task-recommendations"
    )

    # =========================================
    # CATEGORY 8: Workflow-Only Categories
    # =========================================
    print("\n## Category 8: Workflow-Only Categories\n")

    test(
        "8.1 'notifications' shows workflow, no bootstrap commands",
        "notifications",
        expect_contains=["DISCORD_WEBHOOK_URL", "Workflow"],
        expect_not_contains=["/bootstrap"]
    )

    test(
        "8.2 'worktree' shows workflow",
        "worktree",
        expect_contains=["Git Worktrees", "Workflow"]
    )

    test(
        "8.3 'kanban' shows workflow",
        "kanban",
        expect_contains=["AI Orchestration", "Workflow"]
    )

    # =========================================
    # SUMMARY
    # =========================================
    print("\n" + "=" * 60)
    print(f"SUMMARY: {passed} passed, {failed} failed")
    print("=" * 60)

    if failures:
        print("\n## Failed Tests:\n")
        for name, args, errors, output in failures:
            print(f"### {name}")
            print(f"Args: '{args}'")
            print(f"Errors: {errors}")
            print(f"Output preview: {output[:200]}...")
            print()

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
