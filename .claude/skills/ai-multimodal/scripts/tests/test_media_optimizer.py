"""
Tests for media_optimizer.py
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import json

sys.path.insert(0, str(Path(__file__).parent.parent))

import media_optimizer as mo


class TestEnvLoading:
    """Test environment variable loading."""

    @patch('media_optimizer.load_dotenv')
    @patch('pathlib.Path.exists')
    def test_load_env_files_success(self, mock_exists, mock_load_dotenv):
        """Test successful .env file loading."""
        mock_exists.return_value = True
        mo.load_env_files()
        # Should be called for skill, skills, and claude dirs
        assert mock_load_dotenv.call_count >= 1

    @patch('media_optimizer.load_dotenv', None)
    def test_load_env_files_no_dotenv(self):
        """Test when dotenv is not available."""
        # Should not raise an error
        mo.load_env_files()


class TestFFmpegCheck:
    """Test ffmpeg availability checking."""

    @patch('subprocess.run')
    def test_ffmpeg_installed(self, mock_run):
        """Test when ffmpeg is installed."""
        mock_run.return_value = Mock()
        assert mo.check_ffmpeg() is True

    @patch('subprocess.run')
    def test_ffmpeg_not_installed(self, mock_run):
        """Test when ffmpeg is not installed."""
        mock_run.side_effect = FileNotFoundError()
        assert mo.check_ffmpeg() is False

    @patch('subprocess.run')
    def test_ffmpeg_error(self, mock_run):
        """Test ffmpeg command error."""
        mock_run.side_effect = Exception("Error")
        assert mo.check_ffmpeg() is False


class TestMediaInfo:
    """Test media information extraction."""

    @patch('media_optimizer.check_ffmpeg')
    @patch('subprocess.run')
    def test_get_video_info(self, mock_run, mock_check):
        """Test extracting video information."""
        mock_check.return_value = True

        mock_result = Mock()
        mock_result.stdout = json.dumps({
            'format': {
                'size': '10485760',
                'duration': '120.5',
                'bit_rate': '691200'
            },
            'streams': [
                {
                    'codec_type': 'video',
                    'width': 1920,
                    'height': 1080,
                    'r_frame_rate': '30/1'
                },
                {
                    'codec_type': 'audio',
                    'sample_rate': '48000',
                    'channels': 2
                }
            ]
        })
        mock_run.return_value = mock_result

        info = mo.get_media_info('test.mp4')

        assert info['size'] == 10485760
        assert info['duration'] == 120.5
        assert info['width'] == 1920
        assert info['height'] == 1080
        assert info['sample_rate'] == 48000

    @patch('media_optimizer.check_ffmpeg')
    def test_get_media_info_no_ffmpeg(self, mock_check):
        """Test when ffmpeg is not available."""
        mock_check.return_value = False
        info = mo.get_media_info('test.mp4')
        assert info == {}

    @patch('media_optimizer.check_ffmpeg')
    @patch('subprocess.run')
    def test_get_media_info_error(self, mock_run, mock_check):
        """Test error handling in media info extraction."""
        mock_check.return_value = True
        mock_run.side_effect = Exception("Error")

        info = mo.get_media_info('test.mp4')
        assert info == {}


class TestVideoOptimization:
    """Test video optimization functionality."""

    @patch('media_optimizer.check_ffmpeg')
    @patch('media_optimizer.get_media_info')
    @patch('subprocess.run')
    def test_optimize_video_success(self, mock_run, mock_info, mock_check):
        """Test successful video optimization."""
        mock_check.return_value = True
        mock_info.side_effect = [
            # Input info
            {
                'size': 50 * 1024 * 1024,
                'duration': 120.0,
                'bit_rate': 3500000,
                'width': 1920,
                'height': 1080
            },
            # Output info
            {
                'size': 25 * 1024 * 1024,
                'duration': 120.0,
                'width': 1920,
                'height': 1080
            }
        ]

        result = mo.optimize_video(
            'input.mp4',
            'output.mp4',
            quality=23,
            verbose=False
        )

        assert result is True
        mock_run.assert_called_once()

    @patch('media_optimizer.check_ffmpeg')
    def test_optimize_video_no_ffmpeg(self, mock_check):
        """Test video optimization without ffmpeg."""
        mock_check.return_value = False

        result = mo.optimize_video('input.mp4', 'output.mp4')
        assert result is False

    @patch('media_optimizer.check_ffmpeg')
    @patch('media_optimizer.get_media_info')
    def test_optimize_video_no_info(self, mock_info, mock_check):
        """Test video optimization when info cannot be read."""
        mock_check.return_value = True
        mock_info.return_value = {}

        result = mo.optimize_video('input.mp4', 'output.mp4')
        assert result is False

    @patch('media_optimizer.check_ffmpeg')
    @patch('media_optimizer.get_media_info')
    @patch('subprocess.run')
    def test_optimize_video_with_target_size(self, mock_run, mock_info, mock_check):
        """Test video optimization with target size."""
        mock_check.return_value = True
        mock_info.side_effect = [
            {'size': 100 * 1024 * 1024, 'duration': 60.0, 'bit_rate': 3500000},
            {'size': 50 * 1024 * 1024, 'duration': 60.0}
        ]

        result = mo.optimize_video(
            'input.mp4',
            'output.mp4',
            target_size_mb=50,
            verbose=False
        )

        assert result is True

    @patch('media_optimizer.check_ffmpeg')
    @patch('media_optimizer.get_media_info')
    @patch('subprocess.run')
    def test_optimize_video_with_resolution(self, mock_run, mock_info, mock_check):
        """Test video optimization with custom resolution."""
        mock_check.return_value = True
        mock_info.side_effect = [
            {'size': 50 * 1024 * 1024, 'duration': 120.0, 'bit_rate': 3500000},
            {'size': 25 * 1024 * 1024, 'duration': 120.0}
        ]

        result = mo.optimize_video(
            'input.mp4',
            'output.mp4',
            resolution='1280x720',
            verbose=False
        )

        assert result is True


class TestAudioOptimization:
    """Test audio optimization functionality."""

    @patch('media_optimizer.check_ffmpeg')
    @patch('media_optimizer.get_media_info')
    @patch('subprocess.run')
    def test_optimize_audio_success(self, mock_run, mock_info, mock_check):
        """Test successful audio optimization."""
        mock_check.return_value = True
        mock_info.side_effect = [
            {'size': 10 * 1024 * 1024, 'duration': 300.0},
            {'size': 5 * 1024 * 1024, 'duration': 300.0}
        ]

        result = mo.optimize_audio(
            'input.mp3',
            'output.m4a',
            bitrate='64k',
            verbose=False
        )

        assert result is True
        mock_run.assert_called_once()

    @patch('media_optimizer.check_ffmpeg')
    def test_optimize_audio_no_ffmpeg(self, mock_check):
        """Test audio optimization without ffmpeg."""
        mock_check.return_value = False

        result = mo.optimize_audio('input.mp3', 'output.m4a')
        assert result is False


class TestImageOptimization:
    """Test image optimization functionality."""

    @patch('PIL.Image.open')
    @patch('pathlib.Path.stat')
    def test_optimize_image_success(self, mock_stat, mock_image_open):
        """Test successful image optimization."""
        # Mock image
        mock_resized = Mock()
        mock_resized.mode = 'RGB'

        mock_img = Mock()
        mock_img.width = 3840
        mock_img.height = 2160
        mock_img.mode = 'RGB'
        mock_img.resize.return_value = mock_resized
        mock_image_open.return_value = mock_img

        # Mock file sizes
        mock_stat.return_value.st_size = 5 * 1024 * 1024

        result = mo.optimize_image(
            'input.jpg',
            'output.jpg',
            max_width=1920,
            quality=85,
            verbose=False
        )

        assert result is True
        # Since image is resized, save is called on the resized image
        mock_resized.save.assert_called_once()

    @patch('PIL.Image.open')
    @patch('pathlib.Path.stat')
    def test_optimize_image_resize(self, mock_stat, mock_image_open):
        """Test image resizing during optimization."""
        mock_img = Mock()
        mock_img.width = 3840
        mock_img.height = 2160
        mock_img.mode = 'RGB'
        mock_resized = Mock()
        mock_img.resize.return_value = mock_resized
        mock_image_open.return_value = mock_img

        mock_stat.return_value.st_size = 5 * 1024 * 1024

        mo.optimize_image('input.jpg', 'output.jpg', max_width=1920, verbose=False)

        mock_img.resize.assert_called_once()

    @patch('PIL.Image.open')
    @patch('pathlib.Path.stat')
    def test_optimize_image_rgba_to_jpg(self, mock_stat, mock_image_open):
        """Test converting RGBA to RGB for JPEG."""
        mock_img = Mock()
        mock_img.width = 1920
        mock_img.height = 1080
        mock_img.mode = 'RGBA'
        mock_img.split.return_value = [Mock(), Mock(), Mock(), Mock()]
        mock_image_open.return_value = mock_img

        mock_stat.return_value.st_size = 1024 * 1024

        with patch('PIL.Image.new') as mock_new:
            mock_rgb = Mock()
            mock_new.return_value = mock_rgb

            mo.optimize_image('input.png', 'output.jpg', verbose=False)

            mock_new.assert_called_once()

    def test_optimize_image_no_pillow(self):
        """Test image optimization without Pillow."""
        with patch.dict('sys.modules', {'PIL': None}):
            result = mo.optimize_image('input.jpg', 'output.jpg')
            # Will fail to import but function handles it
            assert result is False


class TestVideoSplitting:
    """Test video splitting functionality."""

    @patch('media_optimizer.check_ffmpeg')
    @patch('media_optimizer.get_media_info')
    @patch('subprocess.run')
    @patch('pathlib.Path.mkdir')
    def test_split_video_success(self, mock_mkdir, mock_run, mock_info, mock_check):
        """Test successful video splitting."""
        mock_check.return_value = True
        mock_info.return_value = {'duration': 7200.0}  # 2 hours

        result = mo.split_video(
            'input.mp4',
            './chunks',
            chunk_duration=3600,  # 1 hour chunks
            verbose=False
        )

        # Duration 7200s / 3600s = 2, +1 for safety = 3 chunks
        assert len(result) == 3
        assert mock_run.call_count == 3

    @patch('media_optimizer.check_ffmpeg')
    @patch('media_optimizer.get_media_info')
    def test_split_video_short_duration(self, mock_info, mock_check):
        """Test splitting video shorter than chunk duration."""
        mock_check.return_value = True
        mock_info.return_value = {'duration': 1800.0}  # 30 minutes

        result = mo.split_video(
            'input.mp4',
            './chunks',
            chunk_duration=3600,  # 1 hour
            verbose=False
        )

        assert result == ['input.mp4']

    @patch('media_optimizer.check_ffmpeg')
    def test_split_video_no_ffmpeg(self, mock_check):
        """Test video splitting without ffmpeg."""
        mock_check.return_value = False

        result = mo.split_video('input.mp4', './chunks')
        assert result == []


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--cov=media_optimizer', '--cov-report=term-missing'])
