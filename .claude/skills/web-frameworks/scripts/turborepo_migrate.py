#!/usr/bin/env python3
"""
Turborepo Migration Script

Convert existing monorepo to Turborepo with intelligent pipeline generation.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Set


class TurborepoMigrator:
    """Migrate existing monorepo to Turborepo."""

    def __init__(
        self,
        path: Path,
        dry_run: bool = False,
        package_manager: str = "npm",
    ):
        """
        Initialize TurborepoMigrator.

        Args:
            path: Path to existing monorepo
            dry_run: Preview changes without writing files
            package_manager: Package manager (npm, yarn, pnpm, bun)
        """
        self.path = path.resolve()
        self.dry_run = dry_run
        self.package_manager = package_manager
        self.packages: List[Dict] = []
        self.workspace_config: Dict = {}

    def validate_path(self) -> None:
        """Validate monorepo path."""
        if not self.path.exists():
            raise FileNotFoundError(f"Path '{self.path}' does not exist")

        if not self.path.is_dir():
            raise NotADirectoryError(f"Path '{self.path}' is not a directory")

        package_json = self.path / "package.json"
        if not package_json.exists():
            raise FileNotFoundError(
                f"No package.json found in '{self.path}'. Not a valid monorepo."
            )

    def analyze_workspace(self) -> None:
        """Analyze existing workspace configuration."""
        print("Analyzing workspace...")

        package_json = self.path / "package.json"
        with open(package_json) as f:
            root_config = json.load(f)

        # Detect workspace configuration
        if "workspaces" in root_config:
            self.workspace_config = {
                "type": "npm/yarn",
                "patterns": root_config["workspaces"],
            }
        elif (self.path / "pnpm-workspace.yaml").exists():
            self.workspace_config = {
                "type": "pnpm",
                "file": "pnpm-workspace.yaml",
            }
        else:
            raise ValueError(
                "No workspace configuration found. Monorepo structure not detected."
            )

        print(f"  Workspace type: {self.workspace_config['type']}")

    def discover_packages(self) -> None:
        """Discover all packages in workspace."""
        print("Discovering packages...")

        if self.workspace_config["type"] == "npm/yarn":
            patterns = self.workspace_config["patterns"]
            if isinstance(patterns, dict):
                patterns = patterns.get("packages", [])
        else:
            # Parse pnpm-workspace.yaml
            yaml_file = self.path / "pnpm-workspace.yaml"
            patterns = self._parse_pnpm_workspace(yaml_file)

        # Find all packages matching patterns
        for pattern in patterns:
            self._find_packages_by_pattern(pattern)

        print(f"  Found {len(self.packages)} packages")
        for pkg in self.packages:
            print(f"    - {pkg['name']} ({pkg['path'].relative_to(self.path)})")

    def _parse_pnpm_workspace(self, yaml_file: Path) -> List[str]:
        """Parse pnpm-workspace.yaml file."""
        patterns = []
        with open(yaml_file) as f:
            in_packages = False
            for line in f:
                line = line.strip()
                if line.startswith("packages:"):
                    in_packages = True
                    continue
                if in_packages and line.startswith("- "):
                    pattern = line[2:].strip().strip("'\"")
                    patterns.append(pattern)
        return patterns

    def _find_packages_by_pattern(self, pattern: str) -> None:
        """Find packages matching glob pattern."""
        import glob

        # Convert pattern to absolute path
        search_pattern = str(self.path / pattern)

        for match in glob.glob(search_pattern):
            match_path = Path(match)
            package_json = match_path / "package.json"

            if package_json.exists():
                with open(package_json) as f:
                    pkg_data = json.load(f)

                self.packages.append(
                    {
                        "name": pkg_data.get("name", match_path.name),
                        "path": match_path,
                        "scripts": pkg_data.get("scripts", {}),
                        "dependencies": pkg_data.get("dependencies", {}),
                        "devDependencies": pkg_data.get("devDependencies", {}),
                    }
                )

    def analyze_scripts(self) -> Dict[str, Set[str]]:
        """Analyze common scripts across packages."""
        print("Analyzing scripts...")

        script_map: Dict[str, Set[str]] = {}

        for pkg in self.packages:
            for script_name in pkg["scripts"]:
                if script_name not in script_map:
                    script_map[script_name] = set()
                script_map[script_name].add(pkg["name"])

        common_scripts = {
            name: packages
            for name, packages in script_map.items()
            if len(packages) >= 2  # Present in at least 2 packages
        }

        print(f"  Found {len(common_scripts)} common scripts:")
        for script, packages in common_scripts.items():
            print(f"    - {script} ({len(packages)} packages)")

        return common_scripts

    def generate_turbo_config(self, common_scripts: Dict[str, Set[str]]) -> Dict:
        """Generate turbo.json configuration."""
        print("Generating turbo.json configuration...")

        pipeline = {}

        # Build task
        if "build" in common_scripts:
            pipeline["build"] = {
                "dependsOn": ["^build"],
                "outputs": self._infer_build_outputs(),
            }

        # Test task
        if "test" in common_scripts:
            pipeline["test"] = {
                "dependsOn": ["build"],
                "outputs": ["coverage/**"],
            }

        # Lint task
        if "lint" in common_scripts:
            pipeline["lint"] = {"dependsOn": ["^build"]}

        # Typecheck task
        if "typecheck" in common_scripts or "type-check" in common_scripts:
            task_name = "typecheck" if "typecheck" in common_scripts else "type-check"
            pipeline[task_name] = {"dependsOn": ["^build"]}

        # Dev task
        if "dev" in common_scripts or "start" in common_scripts:
            dev_task = "dev" if "dev" in common_scripts else "start"
            pipeline[dev_task] = {"cache": False, "persistent": True}

        # Clean task
        if "clean" in common_scripts:
            pipeline["clean"] = {"cache": False}

        turbo_config = {
            "$schema": "https://turbo.build/schema.json",
            "globalDependencies": ["**/.env.*local"],
            "pipeline": pipeline,
        }

        return turbo_config

    def _infer_build_outputs(self) -> List[str]:
        """Infer build output directories from packages."""
        outputs = set()

        for pkg in self.packages:
            pkg_path = pkg["path"]

            # Check common output directories
            if (pkg_path / "dist").exists():
                outputs.add("dist/**")
            if (pkg_path / "build").exists():
                outputs.add("build/**")
            if (pkg_path / ".next").exists():
                outputs.add(".next/**")
                outputs.add("!.next/cache/**")
            if (pkg_path / "out").exists():
                outputs.add("out/**")

        return sorted(list(outputs)) or ["dist/**"]

    def update_root_package_json(self) -> Dict:
        """Update root package.json with Turborepo scripts."""
        print("Updating root package.json...")

        package_json_path = self.path / "package.json"
        with open(package_json_path) as f:
            package_json = json.load(f)

        # Add turbo to devDependencies
        if "devDependencies" not in package_json:
            package_json["devDependencies"] = {}

        package_json["devDependencies"]["turbo"] = "latest"

        # Update scripts to use turbo
        if "scripts" not in package_json:
            package_json["scripts"] = {}

        common_tasks = ["build", "dev", "test", "lint", "typecheck", "clean"]
        for task in common_tasks:
            # Check if task exists in any package
            if any(task in pkg["scripts"] for pkg in self.packages):
                package_json["scripts"][task] = f"turbo run {task}"

        return package_json

    def generate_migration_report(
        self, turbo_config: Dict, updated_package_json: Dict
    ) -> str:
        """Generate migration report."""
        report = []

        report.append("=" * 60)
        report.append("TURBOREPO MIGRATION REPORT")
        report.append("=" * 60)
        report.append("")

        report.append(f"Monorepo Path: {self.path}")
        report.append(f"Package Manager: {self.package_manager}")
        report.append(f"Total Packages: {len(self.packages)}")
        report.append("")

        report.append("PACKAGES:")
        for pkg in self.packages:
            rel_path = pkg["path"].relative_to(self.path)
            report.append(f"  - {pkg['name']} ({rel_path})")
        report.append("")

        report.append("TURBO.JSON PIPELINE:")
        for task, config in turbo_config["pipeline"].items():
            report.append(f"  {task}:")
            for key, value in config.items():
                report.append(f"    {key}: {value}")
        report.append("")

        report.append("ROOT PACKAGE.JSON SCRIPTS:")
        for script, command in updated_package_json.get("scripts", {}).items():
            report.append(f"  {script}: {command}")
        report.append("")

        report.append("RECOMMENDATIONS:")
        report.append("  1. Review generated turbo.json pipeline configuration")
        report.append("  2. Adjust output directories based on your build tools")
        report.append("  3. Configure remote caching: turbo login && turbo link")
        report.append("  4. Run 'npm install' to install Turborepo")
        report.append("  5. Test with: turbo run build --dry-run")
        report.append("")

        if self.dry_run:
            report.append("DRY RUN MODE: No files were modified")
        else:
            report.append("FILES CREATED/MODIFIED:")
            report.append(f"  - {self.path / 'turbo.json'}")
            report.append(f"  - {self.path / 'package.json'}")

        report.append("")
        report.append("=" * 60)

        return "\n".join(report)

    def write_files(self, turbo_config: Dict, updated_package_json: Dict) -> None:
        """Write configuration files."""
        if self.dry_run:
            print("\nDRY RUN - Files that would be created/modified:")
            print(f"  - {self.path / 'turbo.json'}")
            print(f"  - {self.path / 'package.json'}")
            return

        print("Writing files...")

        # Write turbo.json
        turbo_json_path = self.path / "turbo.json"
        with open(turbo_json_path, "w") as f:
            json.dump(turbo_config, f, indent=2)
        print(f"  ✓ Created {turbo_json_path}")

        # Write updated package.json
        package_json_path = self.path / "package.json"
        with open(package_json_path, "w") as f:
            json.dump(updated_package_json, f, indent=2)
        print(f"  ✓ Updated {package_json_path}")

    def migrate(self) -> None:
        """Run migration process."""
        try:
            print(f"Migrating monorepo to Turborepo: {self.path}")
            print(f"Dry run: {self.dry_run}")
            print()

            self.validate_path()
            self.analyze_workspace()
            self.discover_packages()

            common_scripts = self.analyze_scripts()
            turbo_config = self.generate_turbo_config(common_scripts)
            updated_package_json = self.update_root_package_json()

            print()
            self.write_files(turbo_config, updated_package_json)

            print()
            report = self.generate_migration_report(turbo_config, updated_package_json)
            print(report)

        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Migrate existing monorepo to Turborepo"
    )
    parser.add_argument(
        "--path",
        type=Path,
        default=Path.cwd(),
        help="Path to monorepo (default: current directory)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing files",
    )
    parser.add_argument(
        "--package-manager",
        choices=["npm", "yarn", "pnpm", "bun"],
        default="npm",
        help="Package manager (default: npm)",
    )

    args = parser.parse_args()

    migrator = TurborepoMigrator(
        path=args.path,
        dry_run=args.dry_run,
        package_manager=args.package_manager,
    )

    migrator.migrate()


if __name__ == "__main__":
    main()
