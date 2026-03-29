#!/usr/bin/env python3
"""
Legacy command scanner (deprecated).

Commands were migrated to skills. This script now writes an empty commands dataset
for backward compatibility with older tooling.
"""

from pathlib import Path


def main() -> None:
    output_path = Path(".claude/scripts/commands_data.yaml")
    output_path.write_text(
        "# Commands have been migrated to skills.\n"
        "# See .claude/scripts/skills_data.yaml for the current catalog.\n"
        "[]\n",
        encoding="utf-8",
    )
    print("Commands are deprecated; wrote empty commands catalog for compatibility.")
    print(f"✓ Saved metadata to {output_path}")


if __name__ == "__main__":
    main()
