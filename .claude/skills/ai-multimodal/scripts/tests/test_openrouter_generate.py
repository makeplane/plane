"""
Tests for openrouter_generate.py
"""

import base64
import sys
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

import openrouter_generate as org


class TestOpenRouterHelpers:
    def test_is_openrouter_model(self):
        assert org.is_openrouter_model("google/gemini-3.1-flash-image-preview")
        assert not org.is_openrouter_model("gemini-3.1-flash-image-preview")

    def test_extract_image_bytes_from_data_url(self):
        raw = b"fake-image"
        data_url = "data:image/png;base64," + base64.b64encode(raw).decode("ascii")
        assert org._extract_image_bytes(data_url) == raw


class TestOpenRouterGeneration:
    @patch("openrouter_generate.find_openrouter_api_key")
    def test_generate_image_requires_api_key(self, mock_find_key):
        mock_find_key.return_value = None
        result = org.generate_image("Prompt", "google/gemini-3.1-flash-image-preview")
        assert result["status"] == "error"
        assert "OPENROUTER_API_KEY" in result["error"]

    @patch("openrouter_generate.get_output_dir")
    @patch("openrouter_generate.find_openrouter_api_key")
    @patch("openrouter_generate.requests.post")
    def test_generate_image_success(self, mock_post, mock_find_key, mock_output_dir, tmp_path):
        mock_find_key.return_value = "or-key"
        mock_output_dir.return_value = tmp_path
        data_url = "data:image/png;base64," + base64.b64encode(b"png-bytes").decode("ascii")

        response = Mock()
        response.json.return_value = {
            "model": "google/gemini-3.1-flash-image-preview",
            "choices": [
                {
                    "message": {
                        "images": [{"image_url": {"url": data_url}}],
                    }
                }
            ],
        }
        response.raise_for_status.return_value = None
        mock_post.return_value = response

        result = org.generate_image(
            prompt="Prompt",
            model="google/gemini-3.1-flash-image-preview",
            output=str(tmp_path / "out.png"),
        )

        assert result["status"] == "success"
        assert Path(result["generated_images"][0]).exists()
        assert (tmp_path / "out.png").exists()
