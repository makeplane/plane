"""
Tests for repomix_batch.py

Run with: pytest test_repomix_batch.py -v --cov=repomix_batch --cov-report=term-missing
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from unittest.mock import Mock, patch, mock_open, MagicMock
import pytest

# Add parent directory to path to import the module
sys.path.insert(0, str(Path(__file__).parent.parent))

from repomix_batch import (
    RepomixConfig,
    EnvLoader,
    RepomixBatchProcessor,
    load_repositories_from_file,
    main
)


class TestRepomixConfig:
    """Test RepomixConfig dataclass."""

    def test_default_values(self):
        """Test default configuration values."""
        config = RepomixConfig()
        assert config.style == "xml"
        assert config.output_dir == "repomix-output"
        assert config.remove_comments is False
        assert config.include_pattern is None
        assert config.ignore_pattern is None
        assert config.no_security_check is False
        assert config.verbose is False

    def test_custom_values(self):
        """Test custom configuration values."""
        config = RepomixConfig(
            style="markdown",
            output_dir="custom-output",
            remove_comments=True,
            include_pattern="src/**",
            ignore_pattern="tests/**",
            no_security_check=True,
            verbose=True
        )
        assert config.style == "markdown"
        assert config.output_dir == "custom-output"
        assert config.remove_comments is True
        assert config.include_pattern == "src/**"
        assert config.ignore_pattern == "tests/**"
        assert config.no_security_check is True
        assert config.verbose is True


class TestEnvLoader:
    """Test EnvLoader class."""

    def test_parse_env_file_basic(self, tmp_path):
        """Test parsing basic .env file."""
        env_file = tmp_path / ".env"
        env_file.write_text("KEY1=value1\nKEY2=value2\n")

        result = EnvLoader._parse_env_file(env_file)
        assert result == {"KEY1": "value1", "KEY2": "value2"}

    def test_parse_env_file_with_quotes(self, tmp_path):
        """Test parsing .env file with quoted values."""
        env_file = tmp_path / ".env"
        env_file.write_text('KEY1="value with spaces"\nKEY2=\'single quotes\'\n')

        result = EnvLoader._parse_env_file(env_file)
        assert result == {"KEY1": "value with spaces", "KEY2": "single quotes"}

    def test_parse_env_file_with_comments(self, tmp_path):
        """Test parsing .env file with comments."""
        env_file = tmp_path / ".env"
        env_file.write_text("# Comment\nKEY1=value1\n\n# Another comment\nKEY2=value2\n")

        result = EnvLoader._parse_env_file(env_file)
        assert result == {"KEY1": "value1", "KEY2": "value2"}

    def test_parse_env_file_with_empty_lines(self, tmp_path):
        """Test parsing .env file with empty lines."""
        env_file = tmp_path / ".env"
        env_file.write_text("KEY1=value1\n\n\nKEY2=value2\n")

        result = EnvLoader._parse_env_file(env_file)
        assert result == {"KEY1": "value1", "KEY2": "value2"}

    def test_parse_env_file_with_equals_in_value(self, tmp_path):
        """Test parsing .env file with equals sign in value."""
        env_file = tmp_path / ".env"
        env_file.write_text("KEY1=value=with=equals\n")

        result = EnvLoader._parse_env_file(env_file)
        assert result == {"KEY1": "value=with=equals"}

    def test_parse_env_file_invalid(self, tmp_path):
        """Test parsing invalid .env file."""
        env_file = tmp_path / ".env"
        env_file.write_text("INVALID LINE WITHOUT EQUALS\n")

        result = EnvLoader._parse_env_file(env_file)
        assert result == {}

    def test_parse_env_file_not_found(self, tmp_path):
        """Test parsing non-existent .env file."""
        env_file = tmp_path / "nonexistent.env"
        result = EnvLoader._parse_env_file(env_file)
        assert result == {}

    @patch.dict(os.environ, {"PROCESS_VAR": "from_process"}, clear=True)
    def test_load_env_files_process_env_priority(self):
        """Test that process environment has highest priority."""
        with patch.object(Path, 'exists', return_value=False):
            env_vars = EnvLoader.load_env_files()
            assert env_vars.get("PROCESS_VAR") == "from_process"


class TestRepomixBatchProcessor:
    """Test RepomixBatchProcessor class."""

    def test_init(self):
        """Test processor initialization."""
        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)
        assert processor.config == config
        assert isinstance(processor.env_vars, dict)

    @patch("subprocess.run")
    def test_check_repomix_installed_success(self, mock_run):
        """Test checking if repomix is installed (success)."""
        mock_run.return_value = Mock(returncode=0)

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)
        assert processor.check_repomix_installed() is True

        mock_run.assert_called_once()
        args = mock_run.call_args
        assert args[0][0] == ["repomix", "--version"]

    @patch("subprocess.run")
    def test_check_repomix_installed_failure(self, mock_run):
        """Test checking if repomix is installed (failure)."""
        mock_run.return_value = Mock(returncode=1)

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)
        assert processor.check_repomix_installed() is False

    @patch("subprocess.run")
    def test_check_repomix_installed_not_found(self, mock_run):
        """Test checking if repomix is not found."""
        mock_run.side_effect = FileNotFoundError()

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)
        assert processor.check_repomix_installed() is False

    def test_get_extension(self):
        """Test getting file extension for style."""
        assert RepomixBatchProcessor._get_extension("xml") == "xml"
        assert RepomixBatchProcessor._get_extension("markdown") == "md"
        assert RepomixBatchProcessor._get_extension("json") == "json"
        assert RepomixBatchProcessor._get_extension("plain") == "txt"
        assert RepomixBatchProcessor._get_extension("unknown") == "xml"

    def test_build_command_local(self):
        """Test building command for local repository."""
        config = RepomixConfig(style="markdown", remove_comments=True)
        processor = RepomixBatchProcessor(config)

        output_file = Path("output.md")
        cmd = processor._build_command("/path/to/repo", output_file, is_remote=False)

        assert cmd[0] == "repomix"
        assert "/path/to/repo" in cmd
        assert "--style" in cmd
        assert "markdown" in cmd
        assert "--remove-comments" in cmd
        assert "-o" in cmd

    def test_build_command_remote(self):
        """Test building command for remote repository."""
        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)

        output_file = Path("output.xml")
        cmd = processor._build_command("owner/repo", output_file, is_remote=True)

        assert cmd[0] == "npx"
        assert "repomix" in cmd
        assert "--remote" in cmd
        assert "owner/repo" in cmd

    def test_build_command_with_patterns(self):
        """Test building command with include/ignore patterns."""
        config = RepomixConfig(
            include_pattern="src/**/*.ts",
            ignore_pattern="tests/**"
        )
        processor = RepomixBatchProcessor(config)

        output_file = Path("output.xml")
        cmd = processor._build_command("/path/to/repo", output_file, is_remote=False)

        assert "--include" in cmd
        assert "src/**/*.ts" in cmd
        assert "-i" in cmd
        assert "tests/**" in cmd

    def test_build_command_verbose(self):
        """Test building command with verbose flag."""
        config = RepomixConfig(verbose=True)
        processor = RepomixBatchProcessor(config)

        output_file = Path("output.xml")
        cmd = processor._build_command("/path/to/repo", output_file, is_remote=False)

        assert "--verbose" in cmd

    def test_build_command_no_security_check(self):
        """Test building command with security check disabled."""
        config = RepomixConfig(no_security_check=True)
        processor = RepomixBatchProcessor(config)

        output_file = Path("output.xml")
        cmd = processor._build_command("/path/to/repo", output_file, is_remote=False)

        assert "--no-security-check" in cmd

    @patch("subprocess.run")
    @patch("pathlib.Path.mkdir")
    def test_process_repository_success(self, mock_mkdir, mock_run):
        """Test processing repository successfully."""
        mock_run.return_value = Mock(returncode=0)

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)

        success, message = processor.process_repository("/path/to/repo")

        assert success is True
        assert "Successfully processed" in message
        mock_mkdir.assert_called_once()
        mock_run.assert_called_once()

    @patch("subprocess.run")
    @patch("pathlib.Path.mkdir")
    def test_process_repository_failure(self, mock_mkdir, mock_run):
        """Test processing repository with failure."""
        mock_run.return_value = Mock(
            returncode=1,
            stderr="Error message",
            stdout=""
        )

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)

        success, message = processor.process_repository("/path/to/repo")

        assert success is False
        assert "Failed to process" in message
        assert "Error message" in message

    @patch("subprocess.run")
    @patch("pathlib.Path.mkdir")
    def test_process_repository_timeout(self, mock_mkdir, mock_run):
        """Test processing repository with timeout."""
        mock_run.side_effect = subprocess.TimeoutExpired(cmd=[], timeout=300)

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)

        success, message = processor.process_repository("/path/to/repo")

        assert success is False
        assert "Timeout" in message

    @patch("subprocess.run")
    @patch("pathlib.Path.mkdir")
    def test_process_repository_exception(self, mock_mkdir, mock_run):
        """Test processing repository with exception."""
        mock_run.side_effect = Exception("Unexpected error")

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)

        success, message = processor.process_repository("/path/to/repo")

        assert success is False
        assert "Error processing" in message
        assert "Unexpected error" in message

    @patch("subprocess.run")
    @patch("pathlib.Path.mkdir")
    def test_process_repository_with_custom_output(self, mock_mkdir, mock_run):
        """Test processing repository with custom output name."""
        mock_run.return_value = Mock(returncode=0)

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)

        success, message = processor.process_repository(
            "/path/to/repo",
            output_name="custom-output.xml"
        )

        assert success is True
        assert "custom-output.xml" in message

    @patch("subprocess.run")
    @patch("pathlib.Path.mkdir")
    def test_process_repository_remote(self, mock_mkdir, mock_run):
        """Test processing remote repository."""
        mock_run.return_value = Mock(returncode=0)

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)

        success, message = processor.process_repository(
            "owner/repo",
            is_remote=True
        )

        assert success is True
        cmd = mock_run.call_args[0][0]
        assert "npx" in cmd
        assert "--remote" in cmd

    @patch.object(RepomixBatchProcessor, "process_repository")
    def test_process_batch_success(self, mock_process):
        """Test processing batch of repositories."""
        mock_process.return_value = (True, "Success")

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)

        repositories = [
            {"path": "/repo1"},
            {"path": "/repo2", "output": "custom.xml"},
            {"path": "owner/repo", "remote": True}
        ]

        results = processor.process_batch(repositories)

        assert len(results["success"]) == 3
        assert len(results["failed"]) == 0
        assert mock_process.call_count == 3

    @patch.object(RepomixBatchProcessor, "process_repository")
    def test_process_batch_with_failures(self, mock_process):
        """Test processing batch with some failures."""
        mock_process.side_effect = [
            (True, "Success 1"),
            (False, "Failed"),
            (True, "Success 2")
        ]

        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)

        repositories = [
            {"path": "/repo1"},
            {"path": "/repo2"},
            {"path": "/repo3"}
        ]

        results = processor.process_batch(repositories)

        assert len(results["success"]) == 2
        assert len(results["failed"]) == 1

    def test_process_batch_missing_path(self):
        """Test processing batch with missing path."""
        config = RepomixConfig()
        processor = RepomixBatchProcessor(config)

        repositories = [
            {"output": "custom.xml"}  # Missing 'path'
        ]

        results = processor.process_batch(repositories)

        assert len(results["success"]) == 0
        assert len(results["failed"]) == 1
        assert "Missing 'path'" in results["failed"][0]


class TestLoadRepositoriesFromFile:
    """Test load_repositories_from_file function."""

    def test_load_valid_json(self, tmp_path):
        """Test loading valid JSON file."""
        json_file = tmp_path / "repos.json"
        repos = [
            {"path": "/repo1"},
            {"path": "owner/repo", "remote": True}
        ]
        json_file.write_text(json.dumps(repos))

        result = load_repositories_from_file(str(json_file))
        assert result == repos

    def test_load_invalid_json(self, tmp_path):
        """Test loading invalid JSON file."""
        json_file = tmp_path / "invalid.json"
        json_file.write_text("not valid json {")

        result = load_repositories_from_file(str(json_file))
        assert result == []

    def test_load_non_array_json(self, tmp_path):
        """Test loading JSON file with non-array content."""
        json_file = tmp_path / "object.json"
        json_file.write_text('{"path": "/repo"}')

        result = load_repositories_from_file(str(json_file))
        assert result == []

    def test_load_nonexistent_file(self):
        """Test loading non-existent file."""
        result = load_repositories_from_file("/nonexistent/file.json")
        assert result == []


class TestMain:
    """Test main function."""

    @patch("sys.argv", ["repomix_batch.py", "/repo1", "/repo2"])
    @patch.object(RepomixBatchProcessor, "check_repomix_installed", return_value=True)
    @patch.object(RepomixBatchProcessor, "process_batch")
    def test_main_with_repos(self, mock_process_batch, mock_check):
        """Test main function with repository arguments."""
        mock_process_batch.return_value = {"success": ["msg1", "msg2"], "failed": []}

        result = main()

        assert result == 0
        mock_check.assert_called_once()
        mock_process_batch.assert_called_once()

        # Verify repositories passed
        call_args = mock_process_batch.call_args[0][0]
        assert len(call_args) == 2
        assert call_args[0]["path"] == "/repo1"
        assert call_args[1]["path"] == "/repo2"

    @patch("sys.argv", ["repomix_batch.py", "-f", "repos.json"])
    @patch.object(RepomixBatchProcessor, "check_repomix_installed", return_value=True)
    @patch.object(RepomixBatchProcessor, "process_batch")
    @patch("repomix_batch.load_repositories_from_file")
    def test_main_with_file(self, mock_load, mock_process_batch, mock_check):
        """Test main function with file argument."""
        mock_load.return_value = [{"path": "/repo1"}]
        mock_process_batch.return_value = {"success": ["msg1"], "failed": []}

        result = main()

        assert result == 0
        mock_load.assert_called_once_with("repos.json")
        mock_process_batch.assert_called_once()

    @patch("sys.argv", ["repomix_batch.py"])
    @patch.object(RepomixBatchProcessor, "check_repomix_installed", return_value=True)
    def test_main_no_repos(self, mock_check):
        """Test main function with no repositories."""
        result = main()
        assert result == 1

    @patch("sys.argv", ["repomix_batch.py", "/repo1"])
    @patch.object(RepomixBatchProcessor, "check_repomix_installed", return_value=False)
    def test_main_repomix_not_installed(self, mock_check):
        """Test main function when repomix is not installed."""
        result = main()
        assert result == 1

    @patch("sys.argv", ["repomix_batch.py", "/repo1"])
    @patch.object(RepomixBatchProcessor, "check_repomix_installed", return_value=True)
    @patch.object(RepomixBatchProcessor, "process_batch")
    def test_main_with_failures(self, mock_process_batch, mock_check):
        """Test main function with processing failures."""
        mock_process_batch.return_value = {
            "success": ["msg1"],
            "failed": ["error1"]
        }

        result = main()
        assert result == 1

    @patch("sys.argv", [
        "repomix_batch.py",
        "/repo1",
        "--style", "markdown",
        "--remove-comments",
        "--verbose"
    ])
    @patch.object(RepomixBatchProcessor, "check_repomix_installed", return_value=True)
    @patch.object(RepomixBatchProcessor, "process_batch")
    def test_main_with_options(self, mock_process_batch, mock_check):
        """Test main function with various options."""
        mock_process_batch.return_value = {"success": ["msg1"], "failed": []}

        result = main()
        assert result == 0

        # Verify config passed to processor
        # The processor is created inside main, so we check it was called
        mock_process_batch.assert_called_once()

    @patch("sys.argv", ["repomix_batch.py", "/repo1", "--remote"])
    @patch.object(RepomixBatchProcessor, "check_repomix_installed", return_value=True)
    @patch.object(RepomixBatchProcessor, "process_batch")
    def test_main_with_remote_flag(self, mock_process_batch, mock_check):
        """Test main function with --remote flag."""
        mock_process_batch.return_value = {"success": ["msg1"], "failed": []}

        result = main()
        assert result == 0

        # Verify remote flag is set
        call_args = mock_process_batch.call_args[0][0]
        assert call_args[0]["remote"] is True
