"""
Tests for minimax_api_client.py - HTTP utilities, auth, polling, downloads.
"""

import json
import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent))

import minimax_api_client as mac


class TestFindMinimaxApiKey:
    """Test API key discovery."""

    def test_find_key_from_env(self, monkeypatch):
        monkeypatch.setenv('MINIMAX_API_KEY', 'test-minimax-key')
        with patch.object(mac, 'CENTRALIZED_RESOLVER_AVAILABLE', False):
            assert mac.find_minimax_api_key() == 'test-minimax-key'

    def test_find_key_not_found(self, monkeypatch):
        monkeypatch.delenv('MINIMAX_API_KEY', raising=False)
        with patch.object(mac, 'CENTRALIZED_RESOLVER_AVAILABLE', False):
            result = mac.find_minimax_api_key()
            assert result is None

    def test_find_key_via_centralized_resolver(self, monkeypatch):
        mock_resolve = Mock(return_value='resolved-key')
        with patch.object(mac, 'CENTRALIZED_RESOLVER_AVAILABLE', True), \
             patch.object(mac, 'resolve_env', mock_resolve, create=True):
            result = mac.find_minimax_api_key()
            assert result == 'resolved-key'
            mock_resolve.assert_called_once_with(
                'MINIMAX_API_KEY', skill='ai-multimodal'
            )


class TestGetHeaders:
    """Test header generation."""

    def test_headers_contain_bearer_token(self):
        headers = mac.get_headers('my-api-key')
        assert headers['Authorization'] == 'Bearer my-api-key'
        assert headers['Content-Type'] == 'application/json'

    def test_headers_with_different_key(self):
        headers = mac.get_headers('another-key-123')
        assert 'another-key-123' in headers['Authorization']


class TestApiPost:
    """Test POST request handling."""

    @patch('minimax_api_client.requests.post')
    def test_successful_post(self, mock_post):
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "base_resp": {"status_code": 0},
            "data": {"result": "ok"}
        }
        mock_post.return_value = mock_resp

        result = mac.api_post("test_endpoint", {"key": "val"}, "api-key")
        assert result["data"]["result"] == "ok"
        mock_post.assert_called_once()

    @patch('minimax_api_client.requests.post')
    def test_http_error_raises(self, mock_post):
        mock_resp = Mock()
        mock_resp.status_code = 401
        mock_resp.text = "Unauthorized"
        mock_post.return_value = mock_resp

        with pytest.raises(Exception, match="HTTP 401"):
            mac.api_post("endpoint", {}, "bad-key")

    @patch('minimax_api_client.requests.post')
    def test_minimax_error_code_raises(self, mock_post):
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "base_resp": {"status_code": 1002, "status_msg": "Rate limit"}
        }
        mock_post.return_value = mock_resp

        with pytest.raises(Exception, match="code 1002.*Rate limit"):
            mac.api_post("endpoint", {}, "api-key")

    @patch('minimax_api_client.requests.post')
    def test_custom_timeout(self, mock_post):
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"base_resp": {"status_code": 0}}
        mock_post.return_value = mock_resp

        mac.api_post("endpoint", {}, "key", timeout=300)
        _, kwargs = mock_post.call_args
        assert kwargs['timeout'] == 300

    @patch('minimax_api_client.requests.post')
    def test_default_timeout_is_120(self, mock_post):
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"base_resp": {"status_code": 0}}
        mock_post.return_value = mock_resp

        mac.api_post("endpoint", {}, "key")
        _, kwargs = mock_post.call_args
        assert kwargs['timeout'] == 120

    @patch('minimax_api_client.requests.post')
    def test_verbose_prints_url(self, mock_post, capsys):
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"base_resp": {"status_code": 0}}
        mock_post.return_value = mock_resp

        mac.api_post("image_generation", {}, "key", verbose=True)
        captured = capsys.readouterr()
        assert "image_generation" in captured.err


class TestApiGet:
    """Test GET request handling."""

    @patch('minimax_api_client.requests.get')
    def test_successful_get(self, mock_get):
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"status": "Success", "file_id": "abc"}
        mock_get.return_value = mock_resp

        result = mac.api_get("query/video_generation", {"task_id": "t1"}, "key")
        assert result["status"] == "Success"

    @patch('minimax_api_client.requests.get')
    def test_get_http_error(self, mock_get):
        mock_resp = Mock()
        mock_resp.status_code = 500
        mock_resp.text = "Server Error"
        mock_get.return_value = mock_resp

        with pytest.raises(Exception, match="HTTP 500"):
            mac.api_get("endpoint", {}, "key")


class TestPollAsyncTask:
    """Test async task polling."""

    @patch('minimax_api_client.time.sleep')
    @patch('minimax_api_client.api_get')
    def test_poll_success_first_try(self, mock_get, mock_sleep):
        mock_get.return_value = {"status": "Success", "file_id": "f123"}

        result = mac.poll_async_task("task1", "video_generation", "key")
        assert result["file_id"] == "f123"
        mock_sleep.assert_not_called()

    @patch('minimax_api_client.time.sleep')
    @patch('minimax_api_client.api_get')
    def test_poll_success_after_processing(self, mock_get, mock_sleep):
        mock_get.side_effect = [
            {"status": "Processing"},
            {"status": "Processing"},
            {"status": "Success", "file_id": "f456"}
        ]

        result = mac.poll_async_task("task2", "video_generation", "key",
                                      poll_interval=1)
        assert result["file_id"] == "f456"
        assert mock_sleep.call_count == 2

    @patch('minimax_api_client.time.sleep')
    @patch('minimax_api_client.api_get')
    def test_poll_task_failed(self, mock_get, mock_sleep):
        mock_get.return_value = {"status": "Failed", "error": "bad input"}

        with pytest.raises(Exception, match="Task failed"):
            mac.poll_async_task("task3", "video_generation", "key")

    @patch('minimax_api_client.time.sleep')
    @patch('minimax_api_client.api_get')
    def test_poll_timeout(self, mock_get, mock_sleep):
        mock_get.return_value = {"status": "Processing"}

        with pytest.raises(TimeoutError, match="timed out"):
            mac.poll_async_task("task4", "video_generation", "key",
                                 poll_interval=1, max_wait=3)


class TestDownloadFile:
    """Test file download."""

    @patch('minimax_api_client.requests.get')
    @patch('minimax_api_client.api_get')
    def test_download_success(self, mock_api_get, mock_req_get, tmp_path):
        mock_api_get.return_value = {
            "file": {"download_url": "https://cdn.minimax.io/video.mp4"}
        }
        mock_resp = Mock()
        mock_resp.raise_for_status = Mock()
        mock_resp.iter_content.return_value = [b"video_data"]
        mock_req_get.return_value = mock_resp

        output = str(tmp_path / "test.mp4")
        result = mac.download_file("file123", "key", output)
        assert result == output
        assert Path(output).exists()

    @patch('minimax_api_client.api_get')
    def test_download_no_url_raises(self, mock_api_get):
        mock_api_get.return_value = {"file": {}}

        with pytest.raises(Exception, match="No download URL"):
            mac.download_file("file123", "key", "/tmp/test.mp4")


class TestGetOutputDir:
    """Test output directory resolution."""

    def test_returns_path_object(self):
        result = mac.get_output_dir()
        assert isinstance(result, Path)

    def test_directory_exists(self):
        result = mac.get_output_dir()
        assert result.exists()
        assert result.is_dir()
