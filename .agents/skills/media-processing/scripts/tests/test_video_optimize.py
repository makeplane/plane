#!/usr/bin/env python3
"""Tests for video_optimize.py"""

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from video_optimize import VideoInfo, VideoOptimizer


class TestVideoOptimizer:
    """Test VideoOptimizer class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.optimizer = VideoOptimizer(verbose=False, dry_run=False)

    @patch("subprocess.run")
    def test_check_ffmpeg_available(self, mock_run):
        """Test FFmpeg availability check."""
        mock_run.return_value = MagicMock(returncode=0)
        assert self.optimizer.check_ffmpeg() is True

    @patch("subprocess.run")
    def test_check_ffmpeg_unavailable(self, mock_run):
        """Test when FFmpeg is not available."""
        mock_run.side_effect = FileNotFoundError()
        assert self.optimizer.check_ffmpeg() is False

    @patch("subprocess.run")
    def test_get_video_info_success(self, mock_run):
        """Test successful video info extraction."""
        mock_data = {
            "streams": [
                {
                    "codec_type": "video",
                    "codec_name": "h264",
                    "width": 1920,
                    "height": 1080,
                    "r_frame_rate": "30/1"
                },
                {
                    "codec_type": "audio",
                    "codec_name": "aac",
                    "bit_rate": "128000"
                }
            ],
            "format": {
                "duration": "120.5",
                "bit_rate": "5000000",
                "size": "75000000"
            }
        }

        mock_run.return_value = MagicMock(
            stdout=json.dumps(mock_data).encode(),
            returncode=0
        )

        info = self.optimizer.get_video_info(Path("test.mp4"))

        assert info is not None
        assert info.width == 1920
        assert info.height == 1080
        assert info.fps == 30.0
        assert info.codec == "h264"
        assert info.audio_codec == "aac"

    @patch("subprocess.run")
    def test_get_video_info_failure(self, mock_run):
        """Test video info extraction failure."""
        mock_run.side_effect = Exception("ffprobe failed")

        info = self.optimizer.get_video_info(Path("test.mp4"))
        assert info is None

    def test_calculate_target_resolution_no_constraints(self):
        """Test resolution calculation without constraints."""
        width, height = self.optimizer.calculate_target_resolution(
            1920, 1080, None, None
        )
        assert width == 1920
        assert height == 1080

    def test_calculate_target_resolution_width_constraint(self):
        """Test resolution calculation with width constraint."""
        width, height = self.optimizer.calculate_target_resolution(
            1920, 1080, 1280, None
        )
        assert width == 1280
        assert height == 720

    def test_calculate_target_resolution_height_constraint(self):
        """Test resolution calculation with height constraint."""
        width, height = self.optimizer.calculate_target_resolution(
            1920, 1080, None, 720
        )
        assert width == 1280
        assert height == 720

    def test_calculate_target_resolution_both_constraints(self):
        """Test resolution calculation with both constraints."""
        width, height = self.optimizer.calculate_target_resolution(
            1920, 1080, 1280, 720
        )
        assert width == 1280
        assert height == 720

    def test_calculate_target_resolution_even_dimensions(self):
        """Test that dimensions are always even."""
        width, height = self.optimizer.calculate_target_resolution(
            1920, 1080, 1279, None  # Odd width
        )
        assert width % 2 == 0
        assert height % 2 == 0

    def test_calculate_target_resolution_no_upscale(self):
        """Test that small videos are not upscaled."""
        width, height = self.optimizer.calculate_target_resolution(
            640, 480, 1920, 1080
        )
        assert width == 640
        assert height == 480

    @patch("subprocess.run")
    @patch.object(VideoOptimizer, "get_video_info")
    def test_optimize_video_dry_run(self, mock_get_info, mock_run):
        """Test video optimization in dry-run mode."""
        mock_info = VideoInfo(
            path=Path("input.mp4"),
            duration=120.0,
            width=1920,
            height=1080,
            bitrate=5000000,
            fps=30.0,
            size=75000000,
            codec="h264",
            audio_codec="aac",
            audio_bitrate=128000
        )
        mock_get_info.return_value = mock_info

        optimizer = VideoOptimizer(dry_run=True)
        result = optimizer.optimize_video(
            Path("input.mp4"),
            Path("output.mp4"),
            max_width=1280
        )

        assert result is True
        mock_run.assert_not_called()

    @patch("subprocess.run")
    @patch.object(VideoOptimizer, "get_video_info")
    def test_optimize_video_resolution_reduction(self, mock_get_info, mock_run):
        """Test video optimization with resolution reduction."""
        mock_info = VideoInfo(
            path=Path("input.mp4"),
            duration=120.0,
            width=1920,
            height=1080,
            bitrate=5000000,
            fps=30.0,
            size=75000000,
            codec="h264",
            audio_codec="aac",
            audio_bitrate=128000
        )
        mock_get_info.return_value = mock_info
        mock_run.return_value = MagicMock(returncode=0)

        result = self.optimizer.optimize_video(
            Path("input.mp4"),
            Path("output.mp4"),
            max_width=1280,
            max_height=720
        )

        assert result is True
        mock_run.assert_called_once()

        # Check that scale filter is applied
        cmd = mock_run.call_args[0][0]
        assert "-vf" in cmd
        filter_idx = cmd.index("-vf")
        assert "scale=1280:720" in cmd[filter_idx + 1]

    @patch("subprocess.run")
    @patch.object(VideoOptimizer, "get_video_info")
    def test_optimize_video_fps_reduction(self, mock_get_info, mock_run):
        """Test video optimization with FPS reduction."""
        mock_info = VideoInfo(
            path=Path("input.mp4"),
            duration=120.0,
            width=1920,
            height=1080,
            bitrate=5000000,
            fps=60.0,
            size=75000000,
            codec="h264",
            audio_codec="aac",
            audio_bitrate=128000
        )
        mock_get_info.return_value = mock_info
        mock_run.return_value = MagicMock(returncode=0)

        result = self.optimizer.optimize_video(
            Path("input.mp4"),
            Path("output.mp4"),
            target_fps=30.0
        )

        assert result is True

        # Check that FPS filter is applied
        cmd = mock_run.call_args[0][0]
        assert "-r" in cmd
        fps_idx = cmd.index("-r")
        assert "30.0" in cmd[fps_idx + 1]

    @patch("subprocess.run")
    @patch.object(VideoOptimizer, "get_video_info")
    def test_optimize_video_two_pass(self, mock_get_info, mock_run):
        """Test two-pass encoding."""
        mock_info = VideoInfo(
            path=Path("input.mp4"),
            duration=120.0,
            width=1920,
            height=1080,
            bitrate=5000000,
            fps=30.0,
            size=75000000,
            codec="h264",
            audio_codec="aac",
            audio_bitrate=128000
        )
        mock_get_info.return_value = mock_info
        mock_run.return_value = MagicMock(returncode=0)

        result = self.optimizer.optimize_video(
            Path("input.mp4"),
            Path("output.mp4"),
            two_pass=True
        )

        assert result is True
        # Should be called twice (pass 1 and pass 2)
        assert mock_run.call_count == 2

        # Check pass 1 command
        pass1_cmd = mock_run.call_args_list[0][0][0]
        assert "-pass" in pass1_cmd
        assert "1" in pass1_cmd

        # Check pass 2 command
        pass2_cmd = mock_run.call_args_list[1][0][0]
        assert "-pass" in pass2_cmd
        assert "2" in pass2_cmd

    @patch("subprocess.run")
    @patch.object(VideoOptimizer, "get_video_info")
    def test_optimize_video_crf_encoding(self, mock_get_info, mock_run):
        """Test CRF-based encoding (single pass)."""
        mock_info = VideoInfo(
            path=Path("input.mp4"),
            duration=120.0,
            width=1920,
            height=1080,
            bitrate=5000000,
            fps=30.0,
            size=75000000,
            codec="h264",
            audio_codec="aac",
            audio_bitrate=128000
        )
        mock_get_info.return_value = mock_info
        mock_run.return_value = MagicMock(returncode=0)

        result = self.optimizer.optimize_video(
            Path("input.mp4"),
            Path("output.mp4"),
            crf=23,
            two_pass=False
        )

        assert result is True
        mock_run.assert_called_once()

        # Check CRF parameter
        cmd = mock_run.call_args[0][0]
        assert "-crf" in cmd
        crf_idx = cmd.index("-crf")
        assert "23" in cmd[crf_idx + 1]

    @patch("subprocess.run")
    @patch.object(VideoOptimizer, "get_video_info")
    def test_optimize_video_failure(self, mock_get_info, mock_run):
        """Test optimization failure handling."""
        mock_info = VideoInfo(
            path=Path("input.mp4"),
            duration=120.0,
            width=1920,
            height=1080,
            bitrate=5000000,
            fps=30.0,
            size=75000000,
            codec="h264",
            audio_codec="aac",
            audio_bitrate=128000
        )
        mock_get_info.return_value = mock_info
        mock_run.side_effect = Exception("FFmpeg failed")

        result = self.optimizer.optimize_video(
            Path("input.mp4"),
            Path("output.mp4")
        )

        assert result is False


class TestVideoInfo:
    """Test VideoInfo dataclass."""

    def test_video_info_creation(self):
        """Test creating VideoInfo object."""
        info = VideoInfo(
            path=Path("test.mp4"),
            duration=120.5,
            width=1920,
            height=1080,
            bitrate=5000000,
            fps=30.0,
            size=75000000,
            codec="h264",
            audio_codec="aac",
            audio_bitrate=128000
        )

        assert info.width == 1920
        assert info.height == 1080
        assert info.fps == 30.0
        assert info.codec == "h264"


class TestCompareVideos:
    """Test video comparison functionality."""

    @patch.object(VideoOptimizer, "get_video_info")
    def test_compare_videos_success(self, mock_get_info, capsys):
        """Test video comparison output."""
        orig_info = VideoInfo(
            path=Path("original.mp4"),
            duration=120.0,
            width=1920,
            height=1080,
            bitrate=5000000,
            fps=30.0,
            size=75000000,
            codec="h264",
            audio_codec="aac",
            audio_bitrate=128000
        )

        opt_info = VideoInfo(
            path=Path("optimized.mp4"),
            duration=120.0,
            width=1280,
            height=720,
            bitrate=2500000,
            fps=30.0,
            size=37500000,
            codec="h264",
            audio_codec="aac",
            audio_bitrate=128000
        )

        mock_get_info.side_effect = [orig_info, opt_info]

        optimizer = VideoOptimizer()
        optimizer.compare_videos(Path("original.mp4"), Path("optimized.mp4"))

        captured = capsys.readouterr()
        assert "Resolution" in captured.out
        assert "1920x1080" in captured.out
        assert "1280x720" in captured.out
        assert "50.0%" in captured.out  # Size reduction


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
