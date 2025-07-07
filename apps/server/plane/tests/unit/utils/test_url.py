import pytest
from plane.utils.url import (
    contains_url,
    is_valid_url,
    get_url_components,
    normalize_url_path,
)


@pytest.mark.unit
class TestContainsURL:
    """Test the contains_url function"""

    def test_contains_url_with_http_protocol(self):
        """Test contains_url with HTTP protocol URLs"""
        assert contains_url("Check out http://example.com") is True
        assert contains_url("Visit http://google.com/search") is True
        assert contains_url("http://localhost:8000") is True

    def test_contains_url_with_https_protocol(self):
        """Test contains_url with HTTPS protocol URLs"""
        assert contains_url("Check out https://example.com") is True
        assert contains_url("Visit https://google.com/search") is True
        assert contains_url("https://secure.example.com") is True

    def test_contains_url_with_www_prefix(self):
        """Test contains_url with www prefix"""
        assert contains_url("Visit www.example.com") is True
        assert contains_url("Check www.google.com") is True
        assert contains_url("Go to www.test-site.org") is True

    def test_contains_url_with_domain_patterns(self):
        """Test contains_url with domain patterns"""
        assert contains_url("Visit example.com") is True
        assert contains_url("Check google.org") is True
        assert contains_url("Go to test-site.co.uk") is True
        assert contains_url("Visit sub.domain.com") is True

    def test_contains_url_with_ip_addresses(self):
        """Test contains_url with IP addresses"""
        assert contains_url("Connect to 192.168.1.1") is True
        assert contains_url("Visit 10.0.0.1") is True
        assert contains_url("Check 127.0.0.1") is True
        assert contains_url("Go to 8.8.8.8") is True

    def test_contains_url_case_insensitive(self):
        """Test contains_url is case insensitive"""
        assert contains_url("Check HTTP://EXAMPLE.COM") is True
        assert contains_url("Visit WWW.GOOGLE.COM") is True
        assert contains_url("Go to Https://Test.Com") is True

    def test_contains_url_with_no_urls(self):
        """Test contains_url with text that doesn't contain URLs"""
        assert contains_url("This is just plain text") is False
        assert contains_url("No URLs here!") is False
        assert contains_url("com org net") is False  # Just TLD words
        assert contains_url("192.168") is False  # Incomplete IP
        assert contains_url("") is False  # Empty string

    def test_contains_url_edge_cases(self):
        """Test contains_url with edge cases"""
        assert contains_url("example.c") is False  # TLD too short
        assert contains_url("999.999.999.999") is True
        assert contains_url("just-a-hyphen") is False  # No domain
        assert contains_url("www.") is True  # Incomplete www


@pytest.mark.unit
class TestIsValidURL:
    """Test the is_valid_url function"""

    def test_is_valid_url_with_valid_urls(self):
        """Test is_valid_url with valid URLs"""
        assert is_valid_url("https://example.com") is True
        assert is_valid_url("http://google.com") is True
        assert is_valid_url("https://sub.domain.com/path") is True
        assert is_valid_url("http://localhost:8000") is True
        assert is_valid_url("https://example.com/path?query=1") is True
        assert is_valid_url("ftp://files.example.com") is True

    def test_is_valid_url_with_invalid_urls(self):
        """Test is_valid_url with invalid URLs"""
        assert is_valid_url("not a url") is False
        assert is_valid_url("example.com") is False  # No scheme
        assert is_valid_url("https://") is False  # No netloc
        assert is_valid_url("") is False  # Empty string
        assert is_valid_url("://example.com") is False  # No scheme
        assert is_valid_url("https:/example.com") is False  # Malformed

    def test_is_valid_url_with_non_string_input(self):
        """Test is_valid_url with non-string input"""
        assert is_valid_url(None) is False
        assert is_valid_url([]) is False
        assert is_valid_url({}) is False

    def test_is_valid_url_with_special_schemes(self):
        """Test is_valid_url with special URL schemes"""
        assert is_valid_url("ftp://ftp.example.com") is True
        assert is_valid_url("mailto:user@example.com") is False
        assert is_valid_url("file:///path/to/file") is False


@pytest.mark.unit
class TestNormalizeURLPath:
    """Test the normalize_url_path function"""

    def test_normalize_url_path_with_multiple_slashes(self):
        """Test normalize_url_path with multiple consecutive slashes"""
        result = normalize_url_path("https://example.com//foo///bar//baz")
        assert result == "https://example.com/foo/bar/baz"

    def test_normalize_url_path_with_query_and_fragment(self):
        """Test normalize_url_path preserves query and fragment"""
        result = normalize_url_path(
            "https://example.com//foo///bar//baz?x=1&y=2#fragment"
        )
        assert result == "https://example.com/foo/bar/baz?x=1&y=2#fragment"

    def test_normalize_url_path_with_no_redundant_slashes(self):
        """Test normalize_url_path with already normalized URL"""
        url = "https://example.com/foo/bar/baz?x=1#fragment"
        result = normalize_url_path(url)
        assert result == url

    def test_normalize_url_path_with_root_path(self):
        """Test normalize_url_path with root path"""
        result = normalize_url_path("https://example.com//")
        assert result == "https://example.com/"

    def test_normalize_url_path_with_empty_path(self):
        """Test normalize_url_path with empty path"""
        result = normalize_url_path("https://example.com")
        assert result == "https://example.com"

    def test_normalize_url_path_with_complex_path(self):
        """Test normalize_url_path with complex path structure"""
        result = normalize_url_path(
            "https://example.com///api//v1///users//123//profile"
        )
        assert result == "https://example.com/api/v1/users/123/profile"

    def test_normalize_url_path_with_different_schemes(self):
        """Test normalize_url_path with different URL schemes"""
        # HTTP
        result = normalize_url_path("http://example.com//path")
        assert result == "http://example.com/path"

        # FTP
        result = normalize_url_path("ftp://ftp.example.com//files//document.txt")
        assert result == "ftp://ftp.example.com/files/document.txt"

    def test_normalize_url_path_with_port(self):
        """Test normalize_url_path with port number"""
        result = normalize_url_path("https://example.com:8080//api//v1")
        assert result == "https://example.com:8080/api/v1"

    def test_normalize_url_path_edge_cases(self):
        """Test normalize_url_path with edge cases"""
        # Many consecutive slashes
        result = normalize_url_path("https://example.com///////path")
        assert result == "https://example.com/path"

        # Mixed single and multiple slashes
        result = normalize_url_path("https://example.com/a//b/c///d")
        assert result == "https://example.com/a/b/c/d"
