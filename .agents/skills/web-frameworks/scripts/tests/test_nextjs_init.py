"""Tests for nextjs-init.py script."""

import json
import sys
from pathlib import Path

import pytest

# Add parent directory to path to import the script
sys.path.insert(0, str(Path(__file__).parent.parent))

from nextjs_init import NextJSInitializer


class TestNextJSInitializer:
    """Test suite for NextJSInitializer."""

    def test_init_with_defaults(self, tmp_path):
        """Test initialization with default parameters."""
        initializer = NextJSInitializer(
            name="test-app",
            directory=tmp_path / "test-app"
        )

        assert initializer.name == "test-app"
        assert initializer.typescript is True
        assert initializer.app_router is True
        assert initializer.src_dir is False
        assert initializer.tailwind is False
        assert initializer.eslint is True

    def test_validate_name_valid(self, tmp_path):
        """Test name validation with valid names."""
        valid_names = ["my-app", "my_app", "myapp123", "test-app-1"]

        for name in valid_names:
            initializer = NextJSInitializer(
                name=name,
                directory=tmp_path / name
            )
            initializer.validate_name()  # Should not raise

    def test_validate_name_invalid(self, tmp_path):
        """Test name validation with invalid names."""
        invalid_cases = [
            ("", ValueError, "empty"),
            ("123app", ValueError, "starts with number"),
            ("my app", ValueError, "contains space"),
            ("my@app", ValueError, "contains special char"),
        ]

        for name, expected_error, reason in invalid_cases:
            initializer = NextJSInitializer(
                name=name,
                directory=tmp_path / (name or "empty")
            )

            with pytest.raises(expected_error):
                initializer.validate_name()

    def test_check_directory_exists(self, tmp_path):
        """Test directory existence check."""
        existing_dir = tmp_path / "existing"
        existing_dir.mkdir()

        initializer = NextJSInitializer(
            name="test-app",
            directory=existing_dir
        )

        with pytest.raises(FileExistsError):
            initializer.check_directory()

    def test_create_directory_structure_app_router(self, tmp_path):
        """Test directory structure creation with App Router."""
        project_dir = tmp_path / "test-app"
        initializer = NextJSInitializer(
            name="test-app",
            directory=project_dir,
            app_router=True
        )

        initializer.create_directory_structure()

        # Check directories
        assert (project_dir / "app").exists()
        assert (project_dir / "public").exists()
        assert (project_dir / "components").exists()
        assert (project_dir / "lib").exists()

        # Check App Router files
        assert (project_dir / "app" / "layout.tsx").exists()
        assert (project_dir / "app" / "page.tsx").exists()
        assert (project_dir / "app" / "globals.css").exists()

    def test_create_directory_structure_with_src(self, tmp_path):
        """Test directory structure with src/ directory."""
        project_dir = tmp_path / "test-app"
        initializer = NextJSInitializer(
            name="test-app",
            directory=project_dir,
            src_dir=True
        )

        initializer.create_directory_structure()

        # Check src structure
        assert (project_dir / "src" / "app").exists()
        assert (project_dir / "src" / "components").exists()
        assert (project_dir / "src" / "lib").exists()

    def test_package_json_generation(self, tmp_path):
        """Test package.json generation."""
        initializer = NextJSInitializer(
            name="test-app",
            directory=tmp_path / "test-app",
            typescript=True,
            tailwind=True,
            eslint=True
        )

        package_json = initializer._get_package_json()

        assert package_json["name"] == "test-app"
        assert package_json["version"] == "0.1.0"
        assert package_json["private"] is True

        # Check scripts
        assert "dev" in package_json["scripts"]
        assert "build" in package_json["scripts"]
        assert "start" in package_json["scripts"]
        assert "lint" in package_json["scripts"]

        # Check dependencies
        assert "next" in package_json["dependencies"]
        assert "react" in package_json["dependencies"]
        assert "react-dom" in package_json["dependencies"]

        # Check TypeScript dependencies
        assert "typescript" in package_json["devDependencies"]
        assert "@types/node" in package_json["devDependencies"]
        assert "@types/react" in package_json["devDependencies"]

        # Check Tailwind dependencies
        assert "tailwindcss" in package_json["dependencies"]

        # Check ESLint dependencies
        assert "eslint" in package_json["devDependencies"]

    def test_tsconfig_generation(self, tmp_path):
        """Test tsconfig.json generation."""
        initializer = NextJSInitializer(
            name="test-app",
            directory=tmp_path / "test-app",
            typescript=True,
            import_alias="@/*"
        )

        tsconfig = initializer._get_tsconfig()

        assert "compilerOptions" in tsconfig
        assert tsconfig["compilerOptions"]["strict"] is True
        assert tsconfig["compilerOptions"]["jsx"] == "preserve"
        assert "@/*" in tsconfig["compilerOptions"]["paths"]
        assert "next-env.d.ts" in tsconfig["include"]

    def test_layout_content_typescript(self, tmp_path):
        """Test layout.tsx content generation."""
        initializer = NextJSInitializer(
            name="test-app",
            directory=tmp_path / "test-app",
            typescript=True
        )

        content = initializer._get_layout_content()

        assert "import './globals.css'" in content
        assert "export const metadata" in content
        assert "children: React.ReactNode" in content
        assert "<html lang=\"en\">" in content

    def test_layout_content_javascript(self, tmp_path):
        """Test layout.jsx content generation."""
        initializer = NextJSInitializer(
            name="test-app",
            directory=tmp_path / "test-app",
            typescript=False
        )

        content = initializer._get_layout_content()

        assert "import './globals.css'" in content
        assert "export const metadata" in content
        assert "React.ReactNode" not in content  # No TypeScript types

    def test_tailwind_config_typescript(self, tmp_path):
        """Test Tailwind config generation with TypeScript."""
        initializer = NextJSInitializer(
            name="test-app",
            directory=tmp_path / "test-app",
            typescript=True,
            tailwind=True
        )

        config = initializer._get_tailwind_config()

        assert "import type { Config }" in config
        assert "const config: Config" in config
        assert "content:" in config

    def test_tailwind_config_javascript(self, tmp_path):
        """Test Tailwind config generation with JavaScript."""
        initializer = NextJSInitializer(
            name="test-app",
            directory=tmp_path / "test-app",
            typescript=False,
            tailwind=True
        )

        config = initializer._get_tailwind_config()

        assert "module.exports" in config
        assert "content:" in config

    def test_gitignore_generation(self, tmp_path):
        """Test .gitignore generation."""
        initializer = NextJSInitializer(
            name="test-app",
            directory=tmp_path / "test-app"
        )

        gitignore = initializer._get_gitignore()

        assert "/node_modules" in gitignore
        assert "/.next/" in gitignore
        assert ".env*.local" in gitignore
        assert ".DS_Store" in gitignore

    def test_readme_generation(self, tmp_path):
        """Test README.md generation."""
        initializer = NextJSInitializer(
            name="test-app",
            directory=tmp_path / "test-app"
        )

        readme = initializer._get_readme()

        assert "# test-app" in readme
        assert "Next.js" in readme
        assert "npm run dev" in readme

    def test_create_config_files(self, tmp_path):
        """Test configuration files creation."""
        project_dir = tmp_path / "test-app"
        initializer = NextJSInitializer(
            name="test-app",
            directory=project_dir,
            typescript=True,
            tailwind=True,
            eslint=True
        )

        initializer.create_directory_structure()
        initializer.create_config_files()

        # Check all config files exist
        assert (project_dir / "package.json").exists()
        assert (project_dir / "next.config.js").exists()
        assert (project_dir / "tsconfig.json").exists()
        assert (project_dir / ".eslintrc.json").exists()
        assert (project_dir / "tailwind.config.ts").exists()
        assert (project_dir / "postcss.config.js").exists()
        assert (project_dir / ".gitignore").exists()
        assert (project_dir / "README.md").exists()

        # Verify package.json is valid JSON
        with open(project_dir / "package.json") as f:
            package_json = json.load(f)
            assert package_json["name"] == "test-app"

    def test_full_initialization(self, tmp_path):
        """Test full initialization process."""
        project_dir = tmp_path / "test-app"
        initializer = NextJSInitializer(
            name="test-app",
            directory=project_dir,
            typescript=True,
            app_router=True,
            tailwind=True
        )

        initializer.initialize()

        # Verify directory exists
        assert project_dir.exists()

        # Verify structure
        assert (project_dir / "app").exists()
        assert (project_dir / "public").exists()

        # Verify config files
        assert (project_dir / "package.json").exists()
        assert (project_dir / "tsconfig.json").exists()
        assert (project_dir / "next.config.js").exists()

    def test_pages_router_structure(self, tmp_path):
        """Test Pages Router directory structure."""
        project_dir = tmp_path / "test-app"
        initializer = NextJSInitializer(
            name="test-app",
            directory=project_dir,
            app_router=False  # Use Pages Router
        )

        initializer.create_directory_structure()

        # Check Pages Router files
        assert (project_dir / "pages" / "_app.tsx").exists()
        assert (project_dir / "pages" / "index.tsx").exists()
