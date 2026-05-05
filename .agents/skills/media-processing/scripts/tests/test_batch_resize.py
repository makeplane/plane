#!/usr/bin/env python3
"""Tests for batch_resize.py"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, call, patch

import pytest

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from batch_resize import ImageResizer, collect_images


class TestImageResizer:
    """Test ImageResizer class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.resizer = ImageResizer(verbose=False, dry_run=False)

    @patch("subprocess.run")
    def test_check_imagemagick_available(self, mock_run):
        """Test ImageMagick availability check."""
        mock_run.return_value = MagicMock(returncode=0)
        assert self.resizer.check_imagemagick() is True

    @patch("subprocess.run")
    def test_check_imagemagick_unavailable(self, mock_run):
        """Test when ImageMagick is not available."""
        mock_run.side_effect = FileNotFoundError()
        assert self.resizer.check_imagemagick() is False

    def test_build_resize_command_fit_strategy(self):
        """Test command building for 'fit' strategy."""
        cmd = self.resizer.build_resize_command(
            Path("input.jpg"),
            Path("output.jpg"),
            width=800,
            height=600,
            strategy="fit",
            quality=85
        )

        assert "magick" in cmd
        assert str(Path("input.jpg")) in cmd
        assert "-resize" in cmd
        assert "800x600" in cmd
        assert "-quality" in cmd
        assert "85" in cmd
        assert "-strip" in cmd

    def test_build_resize_command_fill_strategy(self):
        """Test command building for 'fill' strategy."""
        cmd = self.resizer.build_resize_command(
            Path("input.jpg"),
            Path("output.jpg"),
            width=800,
            height=600,
            strategy="fill",
            quality=85
        )

        assert "-resize" in cmd
        assert "800x600^" in cmd
        assert "-gravity" in cmd
        assert "center" in cmd
        assert "-extent" in cmd

    def test_build_resize_command_thumbnail_strategy(self):
        """Test command building for 'thumbnail' strategy."""
        cmd = self.resizer.build_resize_command(
            Path("input.jpg"),
            Path("output.jpg"),
            width=200,
            height=None,
            strategy="thumbnail",
            quality=85
        )

        assert "200x200^" in cmd
        assert "-gravity" in cmd
        assert "center" in cmd

    def test_build_resize_command_with_watermark(self):
        """Test command building with watermark."""
        watermark = Path("watermark.png")
        cmd = self.resizer.build_resize_command(
            Path("input.jpg"),
            Path("output.jpg"),
            width=800,
            height=None,
            strategy="fit",
            quality=85,
            watermark=watermark
        )

        assert str(watermark) in cmd
        assert "-gravity" in cmd
        assert "southeast" in cmd
        assert "-composite" in cmd

    def test_build_resize_command_exact_strategy(self):
        """Test command building for 'exact' strategy."""
        cmd = self.resizer.build_resize_command(
            Path("input.jpg"),
            Path("output.jpg"),
            width=800,
            height=600,
            strategy="exact",
            quality=85
        )

        assert "800x600!" in cmd

    def test_build_resize_command_fill_requires_dimensions(self):
        """Test that 'fill' strategy requires both dimensions."""
        with pytest.raises(ValueError):
            self.resizer.build_resize_command(
                Path("input.jpg"),
                Path("output.jpg"),
                width=800,
                height=None,
                strategy="fill",
                quality=85
            )

    @patch("subprocess.run")
    def test_resize_image_success(self, mock_run):
        """Test successful image resize."""
        mock_run.return_value = MagicMock(returncode=0)

        result = self.resizer.resize_image(
            Path("input.jpg"),
            Path("output/output.jpg"),
            width=800,
            height=None,
            strategy="fit",
            quality=85
        )

        assert result is True
        mock_run.assert_called_once()

    @patch("subprocess.run")
    def test_resize_image_dry_run(self, mock_run):
        """Test resize in dry-run mode."""
        resizer = ImageResizer(dry_run=True)

        result = resizer.resize_image(
            Path("input.jpg"),
            Path("output.jpg"),
            width=800,
            height=None
        )

        assert result is True
        mock_run.assert_not_called()

    @patch("subprocess.run")
    def test_resize_image_failure(self, mock_run):
        """Test resize failure handling."""
        mock_run.side_effect = Exception("Resize failed")

        result = self.resizer.resize_image(
            Path("input.jpg"),
            Path("output.jpg"),
            width=800,
            height=None
        )

        assert result is False


class TestCollectImages:
    """Test image collection functionality."""

    def test_collect_images_from_file(self, tmp_path):
        """Test collecting a single image file."""
        img_file = tmp_path / "test.jpg"
        img_file.touch()

        images = collect_images([img_file])
        assert len(images) == 1
        assert images[0] == img_file

    def test_collect_images_from_directory(self, tmp_path):
        """Test collecting images from directory."""
        (tmp_path / "image1.jpg").touch()
        (tmp_path / "image2.png").touch()
        (tmp_path / "text.txt").touch()

        images = collect_images([tmp_path])
        assert len(images) == 2
        assert all(img.suffix.lower() in {'.jpg', '.png'} for img in images)

    def test_collect_images_recursive(self, tmp_path):
        """Test recursive image collection."""
        subdir = tmp_path / "subdir"
        subdir.mkdir()
        (tmp_path / "image1.jpg").touch()
        (subdir / "image2.jpg").touch()

        images = collect_images([tmp_path], recursive=True)
        assert len(images) == 2

        images_non_recursive = collect_images([tmp_path], recursive=False)
        assert len(images_non_recursive) == 1

    def test_collect_images_filters_extensions(self, tmp_path):
        """Test that only image files are collected."""
        (tmp_path / "image.jpg").touch()
        (tmp_path / "doc.pdf").touch()
        (tmp_path / "text.txt").touch()

        images = collect_images([tmp_path])
        assert len(images) == 1
        assert images[0].suffix.lower() == '.jpg'

    def test_collect_images_multiple_paths(self, tmp_path):
        """Test collecting from multiple paths."""
        dir1 = tmp_path / "dir1"
        dir2 = tmp_path / "dir2"
        dir1.mkdir()
        dir2.mkdir()

        (dir1 / "image1.jpg").touch()
        (dir2 / "image2.png").touch()

        images = collect_images([dir1, dir2])
        assert len(images) == 2


class TestBatchResize:
    """Test batch resize functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.resizer = ImageResizer(verbose=False, dry_run=False)

    @patch.object(ImageResizer, "resize_image")
    def test_batch_resize_success(self, mock_resize, tmp_path):
        """Test successful batch resize."""
        mock_resize.return_value = True

        input_images = [
            tmp_path / "image1.jpg",
            tmp_path / "image2.jpg"
        ]
        for img in input_images:
            img.touch()

        output_dir = tmp_path / "output"

        success, fail = self.resizer.batch_resize(
            input_images,
            output_dir,
            width=800,
            height=None,
            strategy="fit"
        )

        assert success == 2
        assert fail == 0
        assert mock_resize.call_count == 2

    @patch.object(ImageResizer, "resize_image")
    def test_batch_resize_with_failures(self, mock_resize, tmp_path):
        """Test batch resize with some failures."""
        mock_resize.side_effect = [True, False, True]

        input_images = [
            tmp_path / "image1.jpg",
            tmp_path / "image2.jpg",
            tmp_path / "image3.jpg"
        ]
        for img in input_images:
            img.touch()

        output_dir = tmp_path / "output"

        success, fail = self.resizer.batch_resize(
            input_images,
            output_dir,
            width=800,
            height=None
        )

        assert success == 2
        assert fail == 1

    @patch.object(ImageResizer, "resize_image")
    def test_batch_resize_format_conversion(self, mock_resize, tmp_path):
        """Test batch resize with format conversion."""
        mock_resize.return_value = True

        input_images = [tmp_path / "image.png"]
        input_images[0].touch()

        output_dir = tmp_path / "output"

        self.resizer.batch_resize(
            input_images,
            output_dir,
            width=800,
            height=None,
            format_ext="jpg"
        )

        # Check that resize_image was called with .jpg extension
        call_args = mock_resize.call_args[0]
        assert call_args[1].suffix == ".jpg"


class TestResizeStrategies:
    """Test different resize strategies."""

    def setup_method(self):
        """Set up test fixtures."""
        self.resizer = ImageResizer()

    def test_fit_strategy_maintains_aspect(self):
        """Test that 'fit' strategy maintains aspect ratio."""
        cmd = self.resizer.build_resize_command(
            Path("input.jpg"),
            Path("output.jpg"),
            width=800,
            height=600,
            strategy="fit",
            quality=85
        )

        # Should have resize without ^ or !
        resize_idx = cmd.index("-resize")
        geometry = cmd[resize_idx + 1]
        assert "^" not in geometry
        assert "!" not in geometry

    def test_cover_strategy_fills_dimensions(self):
        """Test that 'cover' strategy fills dimensions."""
        cmd = self.resizer.build_resize_command(
            Path("input.jpg"),
            Path("output.jpg"),
            width=800,
            height=600,
            strategy="cover",
            quality=85
        )

        resize_idx = cmd.index("-resize")
        geometry = cmd[resize_idx + 1]
        assert "^" in geometry

    def test_exact_strategy_ignores_aspect(self):
        """Test that 'exact' strategy ignores aspect ratio."""
        cmd = self.resizer.build_resize_command(
            Path("input.jpg"),
            Path("output.jpg"),
            width=800,
            height=600,
            strategy="exact",
            quality=85
        )

        resize_idx = cmd.index("-resize")
        geometry = cmd[resize_idx + 1]
        assert "!" in geometry


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
