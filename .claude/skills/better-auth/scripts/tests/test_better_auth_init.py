"""
Tests for better_auth_init.py

Covers main functionality with mocked I/O and file operations.
Target: >80% coverage
"""

import sys
import pytest
from pathlib import Path
from unittest.mock import Mock, patch, mock_open, MagicMock
from io import StringIO

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from better_auth_init import BetterAuthInit, EnvConfig, main


@pytest.fixture
def mock_project_root(tmp_path):
    """Create mock project root with package.json."""
    (tmp_path / "package.json").write_text("{}")
    return tmp_path


@pytest.fixture
def auth_init(mock_project_root):
    """Create BetterAuthInit instance with mock project root."""
    return BetterAuthInit(project_root=mock_project_root)


class TestBetterAuthInit:
    """Test BetterAuthInit class."""

    def test_init_with_project_root(self, mock_project_root):
        """Test initialization with explicit project root."""
        init = BetterAuthInit(project_root=mock_project_root)
        assert init.project_root == mock_project_root
        assert init.env_config is None

    def test_find_project_root_success(self, mock_project_root, monkeypatch):
        """Test finding project root successfully."""
        monkeypatch.chdir(mock_project_root)
        init = BetterAuthInit()
        assert init.project_root == mock_project_root

    def test_find_project_root_failure(self, tmp_path, monkeypatch):
        """Test failure to find project root."""
        # Create path without package.json
        no_package_dir = tmp_path / "no-package"
        no_package_dir.mkdir()
        monkeypatch.chdir(no_package_dir)

        # Mock parent to stop infinite loop
        with patch.object(Path, "parent", new_callable=lambda: property(lambda self: self)):
            with pytest.raises(RuntimeError, match="Could not find project root"):
                BetterAuthInit()

    def test_generate_secret(self):
        """Test secret generation."""
        secret = BetterAuthInit.generate_secret()
        assert len(secret) == 64  # 32 bytes = 64 hex chars
        assert all(c in "0123456789abcdef" for c in secret)

        # Test custom length
        secret = BetterAuthInit.generate_secret(length=16)
        assert len(secret) == 32  # 16 bytes = 32 hex chars

    def test_parse_env_file(self, tmp_path):
        """Test parsing .env file."""
        env_content = """
# Comment
KEY1=value1
KEY2="value2"
KEY3='value3'
INVALID LINE
KEY4=value=with=equals
"""
        env_file = tmp_path / ".env"
        env_file.write_text(env_content)

        result = BetterAuthInit._parse_env_file(env_file)

        assert result["KEY1"] == "value1"
        assert result["KEY2"] == "value2"
        assert result["KEY3"] == "value3"
        assert result["KEY4"] == "value=with=equals"
        assert "INVALID" not in result

    def test_parse_env_file_missing(self, tmp_path):
        """Test parsing missing .env file."""
        result = BetterAuthInit._parse_env_file(tmp_path / "nonexistent.env")
        assert result == {}

    def test_load_env_files(self, auth_init, mock_project_root):
        """Test loading environment variables from multiple files."""
        # Create .env files
        claude_env = mock_project_root / ".claude" / ".env"
        claude_env.parent.mkdir(parents=True, exist_ok=True)
        claude_env.write_text("BASE_VAR=base\nOVERRIDE=claude")

        skills_env = mock_project_root / ".claude" / "skills" / ".env"
        skills_env.parent.mkdir(parents=True, exist_ok=True)
        skills_env.write_text("OVERRIDE=skills\nSKILLS_VAR=skills")

        # Mock process env (highest priority)
        with patch.dict("os.environ", {"OVERRIDE": "process", "PROCESS_VAR": "process"}):
            result = auth_init._load_env_files()

        assert result["BASE_VAR"] == "base"
        assert result["SKILLS_VAR"] == "skills"
        assert result["OVERRIDE"] == "process"  # Process env wins
        assert result["PROCESS_VAR"] == "process"

    def test_prompt_direct_db_sqlite(self, auth_init):
        """Test prompting for SQLite database."""
        with patch("builtins.input", side_effect=["3", "./test.db"]):
            config = auth_init._prompt_direct_db()

        assert config["type"] == "sqlite"
        assert "better-sqlite3" in config["import"]
        assert "./test.db" in config["config"]

    def test_prompt_direct_db_postgresql(self, auth_init):
        """Test prompting for PostgreSQL database."""
        with patch("builtins.input", side_effect=["1", "postgresql://localhost/test"]):
            config = auth_init._prompt_direct_db()

        assert config["type"] == "postgresql"
        assert "pg" in config["import"]
        assert config["env_var"] == ("DATABASE_URL", "postgresql://localhost/test")

    def test_prompt_direct_db_mysql(self, auth_init):
        """Test prompting for MySQL database."""
        with patch("builtins.input", side_effect=["2", "mysql://localhost/test"]):
            config = auth_init._prompt_direct_db()

        assert config["type"] == "mysql"
        assert "mysql2" in config["import"]
        assert config["env_var"][0] == "DATABASE_URL"

    def test_prompt_drizzle(self, auth_init):
        """Test prompting for Drizzle ORM."""
        with patch("builtins.input", return_value="1"):
            config = auth_init._prompt_drizzle()

        assert config["type"] == "drizzle"
        assert config["provider"] == "pg"
        assert "drizzleAdapter" in config["import"]
        assert "drizzleAdapter" in config["config"]

    def test_prompt_prisma(self, auth_init):
        """Test prompting for Prisma."""
        with patch("builtins.input", return_value="2"):
            config = auth_init._prompt_prisma()

        assert config["type"] == "prisma"
        assert config["provider"] == "mysql"
        assert "prismaAdapter" in config["import"]
        assert "PrismaClient" in config["import"]

    def test_prompt_kysely(self, auth_init):
        """Test prompting for Kysely."""
        config = auth_init._prompt_kysely()

        assert config["type"] == "kysely"
        assert "kyselyAdapter" in config["import"]

    def test_prompt_mongodb(self, auth_init):
        """Test prompting for MongoDB."""
        with patch("builtins.input", side_effect=["mongodb://localhost/test", "mydb"]):
            config = auth_init._prompt_mongodb()

        assert config["type"] == "mongodb"
        assert "mongodbAdapter" in config["import"]
        assert "mydb" in config["config"]
        assert config["env_var"] == ("MONGODB_URI", "mongodb://localhost/test")

    def test_prompt_database(self, auth_init):
        """Test database prompting with different choices."""
        # Test valid choice
        with patch("builtins.input", side_effect=["3", "1"]):
            config = auth_init.prompt_database()
        assert config["type"] == "prisma"

        # Test invalid choice (defaults to direct DB)
        with patch("builtins.input", side_effect=["99", "1", "postgresql://localhost/test"]):
            with patch("builtins.print"):
                config = auth_init.prompt_database()
        assert config["type"] == "postgresql"

    def test_prompt_auth_methods(self, auth_init):
        """Test prompting for authentication methods."""
        with patch("builtins.input", return_value="1 2 3 5 8"):
            with patch("builtins.print"):
                methods = auth_init.prompt_auth_methods()

        assert methods == ["1", "2", "3", "5", "8"]

    def test_prompt_auth_methods_invalid(self, auth_init):
        """Test filtering invalid auth method choices."""
        with patch("builtins.input", return_value="1 99 abc 3"):
            with patch("builtins.print"):
                methods = auth_init.prompt_auth_methods()

        assert methods == ["1", "3"]

    def test_generate_auth_config_basic(self, auth_init):
        """Test generating basic auth config."""
        db_config = {
            "import": "import Database from 'better-sqlite3';",
            "config": "database: new Database('./dev.db')"
        }
        auth_methods = ["1"]  # Email/password only

        config = auth_init.generate_auth_config(db_config, auth_methods)

        assert "import { betterAuth }" in config
        assert "emailAndPassword" in config
        assert "enabled: true" in config
        assert "better-sqlite3" in config

    def test_generate_auth_config_with_oauth(self, auth_init):
        """Test generating config with OAuth providers."""
        db_config = {
            "import": "import { Pool } from 'pg';",
            "config": "database: new Pool()"
        }
        auth_methods = ["1", "2", "3", "4"]  # Email + GitHub + Google + Discord

        config = auth_init.generate_auth_config(db_config, auth_methods)

        assert "socialProviders" in config
        assert "github:" in config
        assert "google:" in config
        assert "discord:" in config
        assert "GITHUB_CLIENT_ID" in config
        assert "GOOGLE_CLIENT_ID" in config
        assert "DISCORD_CLIENT_ID" in config

    def test_generate_auth_config_with_plugins(self, auth_init):
        """Test generating config with plugins."""
        db_config = {"import": "", "config": "database: db"}
        auth_methods = ["5", "6", "7", "8"]  # 2FA, Passkey, Magic Link, Username

        config = auth_init.generate_auth_config(db_config, auth_methods)

        assert "plugins:" in config
        assert "twoFactor" in config
        assert "passkey" in config
        assert "magicLink" in config
        assert "username" in config
        assert "from 'better-auth/plugins'" in config

    def test_generate_env_file_basic(self, auth_init):
        """Test generating basic .env file."""
        db_config = {"type": "sqlite"}
        auth_methods = ["1"]

        env_content = auth_init.generate_env_file(db_config, auth_methods)

        assert "BETTER_AUTH_SECRET=" in env_content
        assert "BETTER_AUTH_URL=http://localhost:3000" in env_content
        assert len(env_content.split("\n")) >= 2

    def test_generate_env_file_with_database_url(self, auth_init):
        """Test generating .env with database URL."""
        db_config = {
            "env_var": ("DATABASE_URL", "postgresql://localhost/test")
        }
        auth_methods = []

        env_content = auth_init.generate_env_file(db_config, auth_methods)

        assert "DATABASE_URL=postgresql://localhost/test" in env_content

    def test_generate_env_file_with_oauth(self, auth_init):
        """Test generating .env with OAuth credentials."""
        db_config = {}
        auth_methods = ["2", "3", "4"]  # GitHub, Google, Discord

        env_content = auth_init.generate_env_file(db_config, auth_methods)

        assert "GITHUB_CLIENT_ID=" in env_content
        assert "GITHUB_CLIENT_SECRET=" in env_content
        assert "GOOGLE_CLIENT_ID=" in env_content
        assert "GOOGLE_CLIENT_SECRET=" in env_content
        assert "DISCORD_CLIENT_ID=" in env_content
        assert "DISCORD_CLIENT_SECRET=" in env_content

    def test_save_files(self, auth_init, mock_project_root):
        """Test saving configuration files."""
        auth_config = "// auth config"
        env_content = "SECRET=test"

        with patch("builtins.input", side_effect=["1"]):
            auth_init._save_files(auth_config, env_content)

        # Check auth.ts was saved
        auth_path = mock_project_root / "lib" / "auth.ts"
        assert auth_path.exists()
        assert auth_path.read_text() == auth_config

        # Check .env was saved
        env_path = mock_project_root / ".env"
        assert env_path.exists()
        assert env_path.read_text() == env_content

    def test_save_files_custom_path(self, auth_init, mock_project_root):
        """Test saving with custom path."""
        auth_config = "// config"
        env_content = "SECRET=test"

        custom_path = str(mock_project_root / "custom" / "auth.ts")
        with patch("builtins.input", side_effect=["5", custom_path]):
            auth_init._save_files(auth_config, env_content)

        assert Path(custom_path).exists()

    def test_save_files_backup_existing_env(self, auth_init, mock_project_root):
        """Test backing up existing .env file."""
        # Create existing .env
        env_path = mock_project_root / ".env"
        env_path.write_text("OLD_SECRET=old")

        auth_config = "// config"
        env_content = "NEW_SECRET=new"

        with patch("builtins.input", return_value="1"):
            auth_init._save_files(auth_config, env_content)

        # Check backup was created
        backup_path = mock_project_root / ".env.backup"
        assert backup_path.exists()
        assert backup_path.read_text() == "OLD_SECRET=old"

        # Check new .env
        assert env_path.read_text() == "NEW_SECRET=new"

    def test_run_full_flow(self, auth_init, mock_project_root):
        """Test complete run flow."""
        inputs = [
            "1",  # Direct DB
            "1",  # PostgreSQL
            "postgresql://localhost/test",
            "1 2",  # Email + GitHub
            "n"  # Don't save
        ]

        with patch("builtins.input", side_effect=inputs):
            with patch("builtins.print"):
                auth_init.run()

        # Should complete without errors
        # Files not saved because user chose 'n'
        assert not (mock_project_root / "auth.ts").exists()

    def test_run_save_files(self, auth_init, mock_project_root):
        """Test run flow with file saving."""
        inputs = [
            "1",  # Direct DB
            "3",  # SQLite
            "",   # Default path
            "1",  # Email only
            "y",  # Save
            "1"   # Save location
        ]

        with patch("builtins.input", side_effect=inputs):
            with patch("builtins.print"):
                auth_init.run()

        # Check files were created
        assert (mock_project_root / "lib" / "auth.ts").exists()
        assert (mock_project_root / ".env").exists()


class TestMainFunction:
    """Test main entry point."""

    def test_main_success(self, tmp_path, monkeypatch):
        """Test successful main execution."""
        (tmp_path / "package.json").write_text("{}")
        monkeypatch.chdir(tmp_path)

        inputs = ["1", "3", "", "1", "n"]

        with patch("builtins.input", side_effect=inputs):
            with patch("builtins.print"):
                exit_code = main()

        assert exit_code == 0

    def test_main_keyboard_interrupt(self, tmp_path, monkeypatch):
        """Test main with keyboard interrupt."""
        (tmp_path / "package.json").write_text("{}")
        monkeypatch.chdir(tmp_path)

        with patch("builtins.input", side_effect=KeyboardInterrupt()):
            with patch("builtins.print"):
                exit_code = main()

        assert exit_code == 1

    def test_main_error(self, tmp_path, monkeypatch):
        """Test main with error."""
        # No package.json - should fail
        no_package = tmp_path / "no-package"
        no_package.mkdir()
        monkeypatch.chdir(no_package)

        with patch.object(Path, "parent", new_callable=lambda: property(lambda self: self)):
            with patch("sys.stderr", new_callable=StringIO):
                exit_code = main()

        assert exit_code == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=better_auth_init", "--cov-report=term-missing"])
