"""
Tests for ai-artist generate.py
"""

import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent.parent))

import generate


def test_generate_image_auto_honors_image_gen_provider(monkeypatch):
    monkeypatch.setenv("IMAGE_GEN_PROVIDER", "openrouter")
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini")
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter")

    captured = {}

    def fake_batch_process(**kwargs):
        captured.update(kwargs)
        return [{"status": "success", "model": kwargs["model"]}]

    with patch.object(generate.multimodal_batch, "batch_process", side_effect=fake_batch_process):
        result = generate.generate_image("Prompt", "/tmp/test-output.png")

    assert result["status"] == "success"
    assert captured["provider"] == "openrouter"
    assert captured["model"] == "google/gemini-3.1-flash-image-preview"
