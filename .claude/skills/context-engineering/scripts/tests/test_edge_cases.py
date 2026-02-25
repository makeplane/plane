"""Tests for context-engineering edge case handling.

Tests the error handling improvements in compression_evaluator.py and context_analyzer.py:
- File not found
- Permission denied
- Invalid JSON
- File too large
- UTF-8 encoding
"""

import json
import os
import stat
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

SCRIPTS_DIR = Path(__file__).parent.parent
PYTHON = sys.executable


class TestCompressionEvaluatorEdgeCases:
    """Test edge cases in compression_evaluator.py"""

    @pytest.fixture
    def valid_json_file(self, tmp_path):
        """Create valid JSON file."""
        f = tmp_path / "valid.json"
        f.write_text('{"messages": [{"role": "user", "content": "hello"}]}', encoding='utf-8')
        return str(f)

    @pytest.fixture
    def valid_text_file(self, tmp_path):
        """Create valid text file."""
        f = tmp_path / "compressed.txt"
        f.write_text("Summary of conversation", encoding='utf-8')
        return str(f)

    def run_script(self, *args, timeout=30):
        """Run compression_evaluator.py with args."""
        cmd = [PYTHON, str(SCRIPTS_DIR / "compression_evaluator.py")] + list(args)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result

    def test_missing_file_exits_1(self, tmp_path):
        """Test exit code 1 when file not found."""
        result = self.run_script("evaluate", "/nonexistent/file.json", str(tmp_path / "c.txt"))
        assert result.returncode == 1
        assert "File not found" in result.stderr

    def test_missing_file_error_message(self, tmp_path):
        """Test error message format for missing file."""
        missing = "/this/path/does/not/exist/file.json"
        result = self.run_script("evaluate", missing, str(tmp_path / "c.txt"))
        assert result.returncode == 1
        assert missing in result.stderr or "not found" in result.stderr.lower()

    def test_invalid_json_exits_1(self, tmp_path, valid_text_file):
        """Test exit code 1 when JSON is invalid."""
        bad_json = tmp_path / "bad.json"
        bad_json.write_text("{invalid json content", encoding='utf-8')

        result = self.run_script("evaluate", str(bad_json), valid_text_file)
        assert result.returncode == 1
        assert "Invalid JSON" in result.stderr or "JSON" in result.stderr

    def test_valid_files_succeed(self, valid_json_file, valid_text_file):
        """Test success with valid inputs."""
        result = self.run_script("evaluate", valid_json_file, valid_text_file)
        assert result.returncode == 0
        output = json.loads(result.stdout)
        assert "compression_ratio" in output
        assert "quality_score" in output

    def test_generate_probes_missing_file(self):
        """Test generate-probes with missing file."""
        result = self.run_script("generate-probes", "/nonexistent/context.json")
        assert result.returncode == 1
        assert "File not found" in result.stderr

    def test_generate_probes_invalid_json(self, tmp_path):
        """Test generate-probes with invalid JSON."""
        bad = tmp_path / "bad.json"
        bad.write_text("not valid json {{{", encoding='utf-8')

        result = self.run_script("generate-probes", str(bad))
        assert result.returncode == 1
        assert "Invalid JSON" in result.stderr or "JSON" in result.stderr

    def test_generate_probes_success(self, valid_json_file):
        """Test generate-probes with valid file."""
        result = self.run_script("generate-probes", valid_json_file)
        assert result.returncode == 0
        output = json.loads(result.stdout)
        assert isinstance(output, list)

    def test_utf8_content(self, tmp_path):
        """Test UTF-8 encoding with special characters."""
        utf8_file = tmp_path / "utf8.json"
        content = {"messages": [{"role": "user", "content": "日本語テスト émojis 🎉"}]}
        utf8_file.write_text(json.dumps(content), encoding='utf-8')

        compressed = tmp_path / "compressed.txt"
        compressed.write_text("Summary with 日本語 and émojis 🎉", encoding='utf-8')

        result = self.run_script("evaluate", str(utf8_file), str(compressed))
        assert result.returncode == 0

    @pytest.mark.skipif(os.name == 'nt', reason="Permission test not reliable on Windows")
    def test_permission_denied(self, tmp_path):
        """Test permission denied error."""
        protected = tmp_path / "protected.json"
        protected.write_text('{"messages": []}', encoding='utf-8')
        os.chmod(protected, 0o000)

        try:
            result = self.run_script("generate-probes", str(protected))
            assert result.returncode == 1
            assert "Permission denied" in result.stderr or "permission" in result.stderr.lower()
        finally:
            os.chmod(protected, stat.S_IRUSR | stat.S_IWUSR)


class TestContextAnalyzerEdgeCases:
    """Test edge cases in context_analyzer.py"""

    @pytest.fixture
    def valid_context_file(self, tmp_path):
        """Create valid context file."""
        f = tmp_path / "context.json"
        content = {
            "messages": [
                {"role": "user", "content": "implement feature X"},
                {"role": "assistant", "content": "I'll help with that"}
            ]
        }
        f.write_text(json.dumps(content), encoding='utf-8')
        return str(f)

    def run_script(self, *args, timeout=30):
        """Run context_analyzer.py with args."""
        cmd = [PYTHON, str(SCRIPTS_DIR / "context_analyzer.py")] + list(args)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result

    def test_missing_file_exits_1(self):
        """Test exit code 1 when file not found."""
        result = self.run_script("analyze", "/nonexistent/context.json")
        assert result.returncode == 1
        assert "File not found" in result.stderr

    def test_invalid_json_exits_1(self, tmp_path):
        """Test exit code 1 when JSON is invalid."""
        bad = tmp_path / "bad.json"
        bad.write_text("not json", encoding='utf-8')

        result = self.run_script("analyze", str(bad))
        assert result.returncode == 1
        assert "Invalid JSON" in result.stderr or "JSON" in result.stderr

    def test_valid_file_succeeds(self, valid_context_file):
        """Test success with valid input."""
        result = self.run_script("analyze", valid_context_file)
        assert result.returncode == 0
        output = json.loads(result.stdout)
        assert "health_status" in output or "health_score" in output

    def test_utf8_content(self, tmp_path):
        """Test UTF-8 encoding with international characters."""
        utf8_file = tmp_path / "utf8.json"
        content = {
            "messages": [
                {"role": "user", "content": "日本語で説明してください"},
                {"role": "assistant", "content": "はい、説明します。émojis: 🎉🚀"}
            ]
        }
        utf8_file.write_text(json.dumps(content, ensure_ascii=False), encoding='utf-8')

        result = self.run_script("analyze", str(utf8_file))
        assert result.returncode == 0

    def test_empty_messages_array(self, tmp_path):
        """Test handling of empty messages array."""
        f = tmp_path / "empty.json"
        f.write_text('{"messages": []}', encoding='utf-8')

        result = self.run_script("analyze", str(f))
        assert result.returncode == 0

    def test_direct_messages_list(self, tmp_path):
        """Test handling of direct messages list (no wrapper)."""
        f = tmp_path / "direct.json"
        content = [
            {"role": "user", "content": "hello"},
            {"role": "assistant", "content": "hi"}
        ]
        f.write_text(json.dumps(content), encoding='utf-8')

        result = self.run_script("analyze", str(f))
        assert result.returncode == 0

    @pytest.mark.skipif(os.name == 'nt', reason="Permission test not reliable on Windows")
    def test_permission_denied(self, tmp_path):
        """Test permission denied error."""
        protected = tmp_path / "protected.json"
        protected.write_text('{"messages": []}', encoding='utf-8')
        os.chmod(protected, 0o000)

        try:
            result = self.run_script("analyze", str(protected))
            assert result.returncode == 1
            assert "Permission denied" in result.stderr or "permission" in result.stderr.lower()
        finally:
            os.chmod(protected, stat.S_IRUSR | stat.S_IWUSR)

    def test_with_keywords_filter(self, valid_context_file):
        """Test analyze with keywords filter."""
        result = self.run_script("analyze", valid_context_file, "--keywords", "feature,implement")
        assert result.returncode == 0

    def test_with_limit(self, valid_context_file):
        """Test analyze with limit parameter."""
        result = self.run_script("analyze", valid_context_file, "--limit", "10")
        assert result.returncode == 0


class TestFileSizeValidation:
    """Test file size validation (100MB limit)."""

    def test_large_file_warning_in_code(self):
        """Verify MAX_FILE_SIZE_MB constant exists in scripts."""
        evaluator = SCRIPTS_DIR / "compression_evaluator.py"
        analyzer = SCRIPTS_DIR / "context_analyzer.py"

        eval_content = evaluator.read_text()
        analyzer_content = analyzer.read_text()

        assert "MAX_FILE_SIZE_MB = 100" in eval_content
        assert "MAX_FILE_SIZE_MB = 100" in analyzer_content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
