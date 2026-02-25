"""Tests for turborepo-migrate.py script."""

import json
import sys
from pathlib import Path

import pytest

# Add parent directory to path to import the script
sys.path.insert(0, str(Path(__file__).parent.parent))

from turborepo_migrate import TurborepoMigrator


@pytest.fixture
def mock_monorepo(tmp_path):
    """Create a mock monorepo structure."""
    # Root package.json
    root_pkg = {
        "name": "test-monorepo",
        "private": True,
        "workspaces": ["apps/*", "packages/*"],
        "scripts": {
            "build": "npm run build --workspaces",
            "test": "npm run test --workspaces"
        }
    }

    (tmp_path / "package.json").write_text(json.dumps(root_pkg, indent=2))

    # Create apps
    apps_dir = tmp_path / "apps"
    apps_dir.mkdir()

    web_dir = apps_dir / "web"
    web_dir.mkdir()
    (web_dir / "package.json").write_text(json.dumps({
        "name": "web",
        "version": "1.0.0",
        "scripts": {
            "dev": "next dev",
            "build": "next build",
            "test": "jest",
            "lint": "eslint ."
        },
        "dependencies": {
            "@repo/ui": "*",
            "next": "latest"
        }
    }, indent=2))

    # Create Next.js output directory
    (web_dir / ".next").mkdir()

    # Create packages
    packages_dir = tmp_path / "packages"
    packages_dir.mkdir()

    ui_dir = packages_dir / "ui"
    ui_dir.mkdir()
    (ui_dir / "package.json").write_text(json.dumps({
        "name": "@repo/ui",
        "version": "0.0.0",
        "scripts": {
            "build": "tsc",
            "test": "jest",
            "lint": "eslint ."
        },
        "dependencies": {
            "react": "latest"
        }
    }, indent=2))

    # Create dist directory
    (ui_dir / "dist").mkdir()

    return tmp_path


class TestTurborepoMigrator:
    """Test suite for TurborepoMigrator."""

    def test_init(self, tmp_path):
        """Test migrator initialization."""
        migrator = TurborepoMigrator(
            path=tmp_path,
            dry_run=True,
            package_manager="npm"
        )

        assert migrator.path == tmp_path.resolve()
        assert migrator.dry_run is True
        assert migrator.package_manager == "npm"

    def test_validate_path_exists(self, mock_monorepo):
        """Test path validation with valid monorepo."""
        migrator = TurborepoMigrator(path=mock_monorepo)
        migrator.validate_path()  # Should not raise

    def test_validate_path_not_exists(self, tmp_path):
        """Test path validation with non-existent path."""
        migrator = TurborepoMigrator(path=tmp_path / "nonexistent")

        with pytest.raises(FileNotFoundError):
            migrator.validate_path()

    def test_validate_path_not_directory(self, tmp_path):
        """Test path validation with file instead of directory."""
        file_path = tmp_path / "file.txt"
        file_path.touch()

        migrator = TurborepoMigrator(path=file_path)

        with pytest.raises(NotADirectoryError):
            migrator.validate_path()

    def test_validate_path_no_package_json(self, tmp_path):
        """Test path validation without package.json."""
        empty_dir = tmp_path / "empty"
        empty_dir.mkdir()

        migrator = TurborepoMigrator(path=empty_dir)

        with pytest.raises(FileNotFoundError):
            migrator.validate_path()

    def test_analyze_workspace_npm(self, mock_monorepo):
        """Test workspace analysis for npm/yarn workspaces."""
        migrator = TurborepoMigrator(path=mock_monorepo)
        migrator.analyze_workspace()

        assert migrator.workspace_config["type"] == "npm/yarn"
        assert "apps/*" in migrator.workspace_config["patterns"]
        assert "packages/*" in migrator.workspace_config["patterns"]

    def test_analyze_workspace_pnpm(self, tmp_path):
        """Test workspace analysis for pnpm workspaces."""
        # Create root package.json without workspaces
        (tmp_path / "package.json").write_text(json.dumps({
            "name": "test-monorepo",
            "private": True
        }))

        # Create pnpm-workspace.yaml
        (tmp_path / "pnpm-workspace.yaml").write_text("""packages:
  - 'apps/*'
  - 'packages/*'
""")

        migrator = TurborepoMigrator(path=tmp_path)
        migrator.analyze_workspace()

        assert migrator.workspace_config["type"] == "pnpm"
        assert migrator.workspace_config["file"] == "pnpm-workspace.yaml"

    def test_discover_packages(self, mock_monorepo):
        """Test package discovery."""
        migrator = TurborepoMigrator(path=mock_monorepo)
        migrator.analyze_workspace()
        migrator.discover_packages()

        assert len(migrator.packages) == 2

        package_names = {pkg["name"] for pkg in migrator.packages}
        assert "web" in package_names
        assert "@repo/ui" in package_names

    def test_analyze_scripts(self, mock_monorepo):
        """Test script analysis."""
        migrator = TurborepoMigrator(path=mock_monorepo)
        migrator.analyze_workspace()
        migrator.discover_packages()

        common_scripts = migrator.analyze_scripts()

        # All packages have build, test, lint
        assert "build" in common_scripts
        assert "test" in common_scripts
        assert "lint" in common_scripts

        # Check package counts
        assert len(common_scripts["build"]) == 2
        assert len(common_scripts["test"]) == 2

    def test_infer_build_outputs(self, mock_monorepo):
        """Test build output inference."""
        migrator = TurborepoMigrator(path=mock_monorepo)
        migrator.analyze_workspace()
        migrator.discover_packages()

        outputs = migrator._infer_build_outputs()

        # Should detect .next and dist directories
        assert ".next/**" in outputs
        assert "!.next/cache/**" in outputs
        assert "dist/**" in outputs

    def test_generate_turbo_config(self, mock_monorepo):
        """Test turbo.json generation."""
        migrator = TurborepoMigrator(path=mock_monorepo)
        migrator.analyze_workspace()
        migrator.discover_packages()

        common_scripts = migrator.analyze_scripts()
        turbo_config = migrator.generate_turbo_config(common_scripts)

        assert "$schema" in turbo_config
        assert "pipeline" in turbo_config

        # Check build task
        assert "build" in turbo_config["pipeline"]
        assert turbo_config["pipeline"]["build"]["dependsOn"] == ["^build"]
        assert "outputs" in turbo_config["pipeline"]["build"]

        # Check test task
        assert "test" in turbo_config["pipeline"]
        assert "coverage/**" in turbo_config["pipeline"]["test"]["outputs"]

        # Check lint task
        assert "lint" in turbo_config["pipeline"]

        # Note: dev task won't be in pipeline because it's only in 1 package
        # (needs to be in 2+ packages to be considered "common")
        # This is correct behavior - only truly common scripts are included

    def test_update_root_package_json(self, mock_monorepo):
        """Test root package.json update."""
        migrator = TurborepoMigrator(path=mock_monorepo)
        migrator.analyze_workspace()
        migrator.discover_packages()

        updated_package_json = migrator.update_root_package_json()

        # Check turbo added to devDependencies
        assert "turbo" in updated_package_json["devDependencies"]
        assert updated_package_json["devDependencies"]["turbo"] == "latest"

        # Check scripts updated (only common scripts are added)
        assert updated_package_json["scripts"]["build"] == "turbo run build"
        assert updated_package_json["scripts"]["test"] == "turbo run test"
        assert updated_package_json["scripts"]["lint"] == "turbo run lint"
        # dev is only in one package, so it won't be added

    def test_generate_migration_report(self, mock_monorepo):
        """Test migration report generation."""
        migrator = TurborepoMigrator(path=mock_monorepo)
        migrator.analyze_workspace()
        migrator.discover_packages()

        common_scripts = migrator.analyze_scripts()
        turbo_config = migrator.generate_turbo_config(common_scripts)
        updated_package_json = migrator.update_root_package_json()

        report = migrator.generate_migration_report(turbo_config, updated_package_json)

        assert "TURBOREPO MIGRATION REPORT" in report
        assert "PACKAGES:" in report
        assert "TURBO.JSON PIPELINE:" in report
        assert "ROOT PACKAGE.JSON SCRIPTS:" in report
        assert "RECOMMENDATIONS:" in report

        # Check package names appear
        assert "web" in report
        assert "@repo/ui" in report

    def test_write_files_dry_run(self, mock_monorepo, capsys):
        """Test file writing in dry-run mode."""
        migrator = TurborepoMigrator(path=mock_monorepo, dry_run=True)
        migrator.analyze_workspace()
        migrator.discover_packages()

        common_scripts = migrator.analyze_scripts()
        turbo_config = migrator.generate_turbo_config(common_scripts)
        updated_package_json = migrator.update_root_package_json()

        migrator.write_files(turbo_config, updated_package_json)

        # Check files not created
        assert not (mock_monorepo / "turbo.json").exists()

        # Check output
        captured = capsys.readouterr()
        assert "DRY RUN" in captured.out

    def test_write_files_actual(self, mock_monorepo):
        """Test actual file writing."""
        migrator = TurborepoMigrator(path=mock_monorepo, dry_run=False)
        migrator.analyze_workspace()
        migrator.discover_packages()

        common_scripts = migrator.analyze_scripts()
        turbo_config = migrator.generate_turbo_config(common_scripts)
        updated_package_json = migrator.update_root_package_json()

        migrator.write_files(turbo_config, updated_package_json)

        # Check turbo.json created
        assert (mock_monorepo / "turbo.json").exists()

        # Verify content
        with open(mock_monorepo / "turbo.json") as f:
            saved_config = json.load(f)
            assert saved_config["$schema"] == turbo_config["$schema"]
            assert "pipeline" in saved_config

        # Check package.json updated
        with open(mock_monorepo / "package.json") as f:
            saved_package = json.load(f)
            assert "turbo" in saved_package["devDependencies"]

    def test_full_migration_dry_run(self, mock_monorepo):
        """Test full migration process in dry-run mode."""
        migrator = TurborepoMigrator(path=mock_monorepo, dry_run=True)
        migrator.migrate()

        # Files should not be created in dry-run
        assert not (mock_monorepo / "turbo.json").exists()

        # Original package.json should be unchanged
        with open(mock_monorepo / "package.json") as f:
            package_json = json.load(f)
            assert "turbo" not in package_json.get("devDependencies", {})

    def test_full_migration_actual(self, mock_monorepo):
        """Test full migration process."""
        migrator = TurborepoMigrator(path=mock_monorepo, dry_run=False)
        migrator.migrate()

        # Check turbo.json created
        assert (mock_monorepo / "turbo.json").exists()

        with open(mock_monorepo / "turbo.json") as f:
            turbo_config = json.load(f)
            assert "$schema" in turbo_config
            assert "pipeline" in turbo_config
            assert "build" in turbo_config["pipeline"]

        # Check package.json updated
        with open(mock_monorepo / "package.json") as f:
            package_json = json.load(f)
            assert "turbo" in package_json["devDependencies"]
            assert package_json["scripts"]["build"] == "turbo run build"

    def test_parse_pnpm_workspace(self, tmp_path):
        """Test pnpm-workspace.yaml parsing."""
        yaml_content = """packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
"""
        yaml_file = tmp_path / "pnpm-workspace.yaml"
        yaml_file.write_text(yaml_content)

        migrator = TurborepoMigrator(path=tmp_path)
        patterns = migrator._parse_pnpm_workspace(yaml_file)

        assert len(patterns) == 3
        assert "apps/*" in patterns
        assert "packages/*" in patterns
        assert "tools/*" in patterns

    def test_monorepo_without_workspaces(self, tmp_path):
        """Test migration fails for non-workspace monorepo."""
        # Create package.json without workspaces
        (tmp_path / "package.json").write_text(json.dumps({
            "name": "not-a-monorepo",
            "version": "1.0.0"
        }))

        migrator = TurborepoMigrator(path=tmp_path)

        # migrate() calls sys.exit(1) on error, so we catch SystemExit
        with pytest.raises(SystemExit):
            migrator.migrate()
