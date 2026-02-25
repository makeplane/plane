#!/usr/bin/env python3
"""Tests for media_convert.py"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from media_convert import (
    build_audio_command,
    build_image_command,
    build_video_command,
    check_dependencies,
    convert_file,
    detect_media_type,
)


class TestMediaTypeDetection:
    """Test media type detection."""

    def test_detect_video_formats(self):
        """Test video format detection."""
        assert detect_media_type(Path("test.mp4")) == "video"
        assert detect_media_type(Path("test.mkv")) == "video"
        assert detect_media_type(Path("test.avi")) == "video"
        assert detect_media_type(Path("test.mov")) == "video"

    def test_detect_audio_formats(self):
        """Test audio format detection."""
        assert detect_media_type(Path("test.mp3")) == "audio"
        assert detect_media_type(Path("test.aac")) == "audio"
        assert detect_media_type(Path("test.flac")) == "audio"
        assert detect_media_type(Path("test.wav")) == "audio"

    def test_detect_image_formats(self):
        """Test image format detection."""
        assert detect_media_type(Path("test.jpg")) == "image"
        assert detect_media_type(Path("test.png")) == "image"
        assert detect_media_type(Path("test.gif")) == "image"
        assert detect_media_type(Path("test.webp")) == "image"

    def test_detect_unknown_format(self):
        """Test unknown format detection."""
        assert detect_media_type(Path("test.txt")) == "unknown"
        assert detect_media_type(Path("test.doc")) == "unknown"

    def test_case_insensitive(self):
        """Test case-insensitive detection."""
        assert detect_media_type(Path("TEST.MP4")) == "video"
        assert detect_media_type(Path("TEST.JPG")) == "image"


class TestCommandBuilding:
    """Test command building functions."""

    def test_build_video_command_web_preset(self):
        """Test video command with web preset."""
        cmd = build_video_command(
            Path("input.mp4"),
            Path("output.mp4"),
            preset="web"
        )

        assert "ffmpeg" in cmd
        assert "-i" in cmd
        assert str(Path("input.mp4")) in cmd
        assert "-c:v" in cmd
        assert "libx264" in cmd
        assert "-crf" in cmd
        assert "23" in cmd
        assert "-preset" in cmd
        assert "medium" in cmd
        assert str(Path("output.mp4")) in cmd

    def test_build_video_command_archive_preset(self):
        """Test video command with archive preset."""
        cmd = build_video_command(
            Path("input.mp4"),
            Path("output.mp4"),
            preset="archive"
        )

        assert "18" in cmd  # CRF for archive
        assert "slow" in cmd  # Preset for archive

    def test_build_audio_command_mp3(self):
        """Test audio command for MP3 output."""
        cmd = build_audio_command(
            Path("input.wav"),
            Path("output.mp3"),
            preset="web"
        )

        assert "ffmpeg" in cmd
        assert "-c:a" in cmd
        assert "libmp3lame" in cmd
        assert "-b:a" in cmd

    def test_build_audio_command_flac(self):
        """Test audio command for FLAC (lossless)."""
        cmd = build_audio_command(
            Path("input.wav"),
            Path("output.flac"),
            preset="web"
        )

        assert "flac" in cmd
        assert "-b:a" not in cmd  # No bitrate for lossless

    def test_build_image_command(self):
        """Test image command building."""
        cmd = build_image_command(
            Path("input.png"),
            Path("output.jpg"),
            preset="web"
        )

        assert "magick" in cmd
        assert str(Path("input.png")) in cmd
        assert "-quality" in cmd
        assert "85" in cmd
        assert "-strip" in cmd
        assert str(Path("output.jpg")) in cmd


class TestDependencyCheck:
    """Test dependency checking."""

    @patch("subprocess.run")
    def test_check_dependencies_both_available(self, mock_run):
        """Test when both tools are available."""
        mock_run.return_value = MagicMock(returncode=0)
        ffmpeg_ok, magick_ok = check_dependencies()
        assert ffmpeg_ok is True
        assert magick_ok is True

    @patch("subprocess.run")
    def test_check_dependencies_ffmpeg_only(self, mock_run):
        """Test when only FFmpeg is available."""
        def side_effect(*args, **kwargs):
            if "ffmpeg" in args[0]:
                return MagicMock(returncode=0)
            return MagicMock(returncode=1)

        mock_run.side_effect = side_effect
        ffmpeg_ok, magick_ok = check_dependencies()
        assert ffmpeg_ok is True
        assert magick_ok is False


class TestFileConversion:
    """Test file conversion functionality."""

    @patch("subprocess.run")
    @patch("media_convert.detect_media_type")
    def test_convert_video_file_dry_run(self, mock_detect, mock_run):
        """Test video conversion in dry-run mode."""
        mock_detect.return_value = "video"

        result = convert_file(
            Path("input.mp4"),
            Path("output.mp4"),
            preset="web",
            dry_run=True
        )

        assert result is True
        mock_run.assert_not_called()

    @patch("subprocess.run")
    @patch("media_convert.detect_media_type")
    def test_convert_image_file_success(self, mock_detect, mock_run):
        """Test successful image conversion."""
        mock_detect.return_value = "image"
        mock_run.return_value = MagicMock(returncode=0)

        result = convert_file(
            Path("input.png"),
            Path("output.jpg"),
            preset="web"
        )

        assert result is True
        mock_run.assert_called_once()

    @patch("subprocess.run")
    @patch("media_convert.detect_media_type")
    def test_convert_file_error(self, mock_detect, mock_run):
        """Test conversion error handling."""
        mock_detect.return_value = "video"
        mock_run.side_effect = Exception("Conversion failed")

        result = convert_file(
            Path("input.mp4"),
            Path("output.mp4")
        )

        assert result is False

    @patch("media_convert.detect_media_type")
    def test_convert_unknown_format(self, mock_detect):
        """Test conversion with unknown format."""
        mock_detect.return_value = "unknown"

        result = convert_file(
            Path("input.txt"),
            Path("output.txt")
        )

        assert result is False


class TestQualityPresets:
    """Test quality preset functionality."""

    def test_web_preset_settings(self):
        """Test web preset values."""
        cmd = build_video_command(
            Path("input.mp4"),
            Path("output.mp4"),
            preset="web"
        )

        cmd_str = " ".join(cmd)
        assert "23" in cmd_str  # CRF
        assert "128k" in cmd_str  # Audio bitrate

    def test_archive_preset_settings(self):
        """Test archive preset values."""
        cmd = build_video_command(
            Path("input.mp4"),
            Path("output.mp4"),
            preset="archive"
        )

        cmd_str = " ".join(cmd)
        assert "18" in cmd_str  # Higher quality CRF
        assert "192k" in cmd_str  # Higher audio bitrate

    def test_mobile_preset_settings(self):
        """Test mobile preset values."""
        cmd = build_video_command(
            Path("input.mp4"),
            Path("output.mp4"),
            preset="mobile"
        )

        cmd_str = " ".join(cmd)
        assert "26" in cmd_str  # Lower quality CRF
        assert "96k" in cmd_str  # Lower audio bitrate


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
