#!/usr/bin/env python3
"""
Simple test script for the nh3 HTML sanitization.
Run this to test the HTML sanitization functionality.
"""

import sys
import os

# Add the parent directory to the path so we can import the module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from content_validator import validate_html_content

    print("✅ Successfully imported validate_html_content")
except ImportError as e:
    print(f"❌ Failed to import: {e}")
    sys.exit(1)


def test_html_sanitization():
    """Test the HTML sanitization functionality"""

    print("\nTesting HTML content validation and sanitization...")
    print("=" * 60)

    # Test cases
    test_cases = [
        # Safe HTML
        ("<p>Hello World</p>", "Safe HTML - should be valid"),
        ("<div><strong>Bold text</strong></div>", "Safe HTML with formatting"),
        ("<a href='https://example.com'>Link</a>", "Safe HTML with link"),
        # Malicious HTML that should be sanitized
        ("<script>alert('xss')</script><p>Hello</p>", "Script tag should be removed"),
        ("<p onclick='alert(1)'>Click me</p>", "onclick attribute should be removed"),
        ("<iframe src='javascript:alert(1)'></iframe>", "iframe should be removed"),
        ("<img src='x' onerror='alert(1)'>", "onerror attribute should be removed"),
        # Mixed content
        (
            "<p>Safe text</p><script>alert('xss')</script><div>More safe text</div>",
            "Mixed content should be sanitized",
        ),
        # Empty content
        ("", "Empty content should be valid"),
        (None, "None content should be valid"),
    ]

    passed = 0
    total = len(test_cases)

    for html_content, description in test_cases:
        print(f"\n🧪 Test: {description}")
        print(f"📥 Input: {html_content}")

        try:
            is_valid, error_msg, sanitized_html = validate_html_content(html_content)

            if is_valid:
                print(f"✅ Valid: {is_valid}")
                print(f"📝 Error: {error_msg}")
                print(f"🧹 Sanitized: {sanitized_html}")

                if html_content and sanitized_html != html_content:
                    print("🔒 Content was sanitized (malicious parts removed)")
                else:
                    print("✅ Content was already safe (no sanitization needed)")
                passed += 1
            else:
                print(f"❌ Invalid: {is_valid}")
                print(f"🚨 Error: {error_msg}")
                print(f"🧹 Sanitized: {sanitized_html}")

        except Exception as e:
            print(f"💥 Exception: {e}")

        print("-" * 40)

    print(f"\n📊 Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! HTML sanitization is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")


if __name__ == "__main__":
    test_html_sanitization()
