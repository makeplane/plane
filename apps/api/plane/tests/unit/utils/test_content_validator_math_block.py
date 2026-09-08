# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.content_validator import validate_html_content


@pytest.mark.unit
class TestMathBlockSanitization:
    """Editor math blocks (`<math-block>`) must survive HTML sanitization."""

    def test_math_block_tag_is_preserved(self):
        html = '<p>before</p><math-block data-latex="E = mc^2"></math-block><p>after</p>'
        is_valid, error, clean_html = validate_html_content(html)
        assert is_valid is True
        assert error is None
        assert '<math-block data-latex="E = mc^2">' in clean_html

    def test_math_block_multiline_latex_is_preserved(self):
        latex = "\\begin{aligned}\na &= b \\\\ c &= d\n\\end{aligned}"
        html = f'<math-block data-latex="{latex}"></math-block>'
        is_valid, error, clean_html = validate_html_content(html)
        assert is_valid is True
        assert error is None
        assert "<math-block" in clean_html
        assert 'data-latex="' in clean_html
        assert "aligned" in clean_html

    def test_math_block_escapes_are_not_double_encoded(self):
        html = '<math-block data-latex="a &lt; b"></math-block>'
        is_valid, error, clean_html = validate_html_content(html)
        assert is_valid is True
        assert error is None
        assert 'data-latex="a &lt; b"' in clean_html

    def test_math_block_strips_script_attributes(self):
        html = '<math-block data-latex="x" onclick="alert(1)"><script>alert(1)</script></math-block>'
        is_valid, error, clean_html = validate_html_content(html)
        assert is_valid is True
        assert error is None
        assert "onclick" not in clean_html
        assert "<script" not in clean_html
        assert 'data-latex="x"' in clean_html


@pytest.mark.unit
class TestMathInlineSanitization:
    """Editor inline math (`<math-inline>`) must survive HTML sanitization."""

    def test_math_inline_tag_is_preserved(self):
        html = "<p>the equation <math-inline data-latex=\"x+1\"></math-inline> holds</p>"
        is_valid, error, clean_html = validate_html_content(html)
        assert is_valid is True
        assert error is None
        assert '<math-inline data-latex="x+1">' in clean_html

    def test_math_inline_strips_script_attributes(self):
        html = '<math-inline data-latex="x" onmouseover="alert(1)"></math-inline>'
        is_valid, error, clean_html = validate_html_content(html)
        assert is_valid is True
        assert error is None
        assert "onmouseover" not in clean_html
        assert 'data-latex="x"' in clean_html
