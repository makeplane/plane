"""
Tests for document_converter.py
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock, mock_open

sys.path.insert(0, str(Path(__file__).parent.parent))

import document_converter as dc


class TestAPIKeyFinder:
    """Test API key finding logic."""

    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test-key-from-env'})
    def test_find_api_key_from_env(self):
        """Test finding API key from environment."""
        api_key = dc.find_api_key()
        assert api_key == 'test-key-from-env'

    @patch.dict('os.environ', {}, clear=True)
    @patch('document_converter.load_dotenv', None)
    def test_find_api_key_no_key(self):
        """Test when no API key is available."""
        api_key = dc.find_api_key()
        assert api_key is None


class TestProjectRoot:
    """Test project root finding."""

    @patch('pathlib.Path.exists')
    def test_find_project_root_with_git(self, mock_exists):
        """Test finding project root with .git directory."""
        root = dc.find_project_root()
        assert isinstance(root, Path)


class TestMimeType:
    """Test MIME type detection."""

    def test_pdf_mime_type(self):
        """Test PDF MIME type."""
        assert dc.get_mime_type('document.pdf') == 'application/pdf'

    def test_image_mime_types(self):
        """Test image MIME types."""
        assert dc.get_mime_type('image.jpg') == 'image/jpeg'
        assert dc.get_mime_type('image.png') == 'image/png'

    def test_unknown_mime_type(self):
        """Test unknown file extension."""
        assert dc.get_mime_type('file.unknown') == 'application/octet-stream'


class TestIntegration:
    """Integration tests."""

    def test_mime_type_integration(self):
        """Test MIME type detection with various extensions."""
        test_cases = [
            ('document.pdf', 'application/pdf'),
            ('image.jpg', 'image/jpeg'),
            ('unknown.xyz', 'application/octet-stream'),
        ]
        for file_path, expected_mime in test_cases:
            assert dc.get_mime_type(file_path) == expected_mime


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--cov=document_converter', '--cov-report=term-missing'])
