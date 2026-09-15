# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Research file validation and Markdown import.

Research uploads use their own limits (never ``FILE_SIZE_LIMIT``) and verify
MIME type, extension, size and the file signature (P0-FILE-04, P0-FILE-05).
"""

import html
import os
import re

import nh3

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}
IMAGE_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
}
PDF_EXTENSIONS = {".pdf"}
MARKDOWN_EXTENSIONS = {".md", ".markdown"}

IMAGE_SIGNATURES = (
    b"\x89PNG\r\n\x1a\n",
    b"\xff\xd8\xff",
    b"GIF87a",
    b"GIF89a",
    b"BM",
)

ALLOWED_HTML_TAGS = {
    "p", "br", "strong", "em", "u", "s", "code", "pre", "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "img",
    "table", "thead", "tbody", "tr", "th", "td", "hr",
}

ALLOWED_ATTRIBUTES = {"a": {"href", "title"}, "img": {"src", "alt", "title"}}


def extension_of(file_name):
    return os.path.splitext(str(file_name or ""))[1].lower()


def detect_kind(file_name, content_type):
    extension = extension_of(file_name)
    content_type = (content_type or "").split(";")[0].strip().lower()
    if extension in PDF_EXTENSIONS or content_type == "application/pdf":
        return "PDF"
    if extension in MARKDOWN_EXTENSIONS or content_type in ("text/markdown", "text/x-markdown"):
        return "MARKDOWN"
    if extension in IMAGE_EXTENSIONS or content_type in IMAGE_CONTENT_TYPES:
        return "IMAGE"
    return "OTHER"


def validate_attachment(*, file_name, content_type, size_bytes, limits, header_bytes=None):
    """Return an error code for an invalid upload, else ``None``."""
    kind = detect_kind(file_name, content_type)
    extension = extension_of(file_name)

    if kind == "OTHER":
        return "file_type_not_allowed"
    if kind == "IMAGE" and extension not in IMAGE_EXTENSIONS:
        return "file_type_not_allowed"
    if kind == "PDF" and extension not in PDF_EXTENSIONS:
        return "file_type_not_allowed"
    if kind == "MARKDOWN" and extension not in MARKDOWN_EXTENSIONS:
        return "file_type_not_allowed"

    limit_mb = {
        "IMAGE": limits.get("image_max_mb", 20),
        "PDF": limits.get("pdf_max_mb", 100),
        "MARKDOWN": limits.get("markdown_max_mb", 5),
    }[kind]
    if size_bytes is None or size_bytes <= 0:
        return "file_size_exceeded"
    if size_bytes > int(limit_mb) * 1024 * 1024:
        return "file_size_exceeded"

    if header_bytes:
        if kind == "PDF" and not header_bytes.startswith(b"%PDF"):
            return "file_type_not_allowed"
        if kind == "IMAGE" and not _looks_like_image(header_bytes):
            return "file_type_not_allowed"
        if kind == "MARKDOWN" and b"\x00" in header_bytes[:512]:
            return "file_type_not_allowed"

    return None


def _looks_like_image(header):
    if any(header.startswith(signature) for signature in IMAGE_SIGNATURES):
        return True
    # WEBP is RIFF....WEBP
    return header.startswith(b"RIFF") and header[8:12] == b"WEBP"


def markdown_to_html(content):
    """Minimal, safe Markdown to HTML conversion used by ``.md`` import.

    Remote images keep their original URL (P0-FILE-07); local relative image
    paths are reported back to the caller so the author can upload them.
    """
    lines = str(content or "").replace("\r\n", "\n").split("\n")
    html_parts = []
    in_code = False
    code_buffer = []
    in_list = False
    in_table = False
    local_images = []

    def close_list():
        nonlocal in_list
        if in_list:
            html_parts.append("</ul>")
            in_list = False

    def close_table():
        nonlocal in_table
        if in_table:
            html_parts.append("</tbody></table>")
            in_table = False

    for raw_line in lines:
        line = raw_line.rstrip()
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                html_parts.append(f"<pre><code>{html.escape(chr(10).join(code_buffer))}</code></pre>")
                code_buffer = []
                in_code = False
            else:
                close_list()
                close_table()
                in_code = True
            continue

        if in_code:
            code_buffer.append(raw_line)
            continue

        if not stripped:
            close_list()
            close_table()
            continue

        image_match = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", stripped)
        if image_match:
            close_list()
            close_table()
            alt, src = image_match.groups()
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", src):
                html_parts.append(f'<img src="{html.escape(src)}" alt="{html.escape(alt)}">')
            else:
                local_images.append(src)
            continue

        if stripped.startswith("|") and stripped.endswith("|"):
            cells = [cell.strip() for cell in stripped.strip("|").split("|")]
            if all(set(cell) <= set("-: ") and cell for cell in cells):
                continue
            close_list()
            if not in_table:
                html_parts.append("<table><tbody>")
                in_table = True
                html_parts.append(
                    "<tr>" + "".join(f"<th>{_inline(cell)}</th>" for cell in cells) + "</tr>"
                )
            else:
                html_parts.append("<tr>" + "".join(f"<td>{_inline(cell)}</td>" for cell in cells) + "</tr>")
            continue

        close_table()

        heading = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if heading:
            close_list()
            level = len(heading.group(1))
            html_parts.append(f"<h{level}>{_inline(heading.group(2))}</h{level}>")
            continue

        bullet = re.match(r"^[-*+]\s+(.*)$", stripped)
        if bullet:
            if not in_list:
                html_parts.append("<ul>")
                in_list = True
            html_parts.append(f"<li>{_inline(bullet.group(1))}</li>")
            continue

        numbered = re.match(r"^\d+[.)]\s+(.*)$", stripped)
        if numbered:
            if not in_list:
                html_parts.append("<ul>")
                in_list = True
            html_parts.append(f"<li>{_inline(numbered.group(1))}</li>")
            continue

        close_list()
        if stripped.startswith(">"):
            html_parts.append(f"<blockquote>{_inline(stripped[1:].strip())}</blockquote>")
            continue
        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", stripped):
            html_parts.append("<hr>")
            continue

        html_parts.append(f"<p>{_inline(stripped)}</p>")

    if in_code:
        html_parts.append(f"<pre><code>{html.escape(chr(10).join(code_buffer))}</code></pre>")
    close_list()
    close_table()

    raw_html = "".join(html_parts) or "<p></p>"
    sanitized = nh3.clean(
        raw_html,
        tags=ALLOWED_HTML_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes={"http", "https", "mailto"},
    )
    return sanitized, local_images


def _inline(text):
    escaped = html.escape(text)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", escaped)
    escaped = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', escaped)
    return escaped
