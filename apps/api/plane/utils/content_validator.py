# Python imports
import base64
import nh3
from plane.utils.exception_logger import log_exception
from bs4 import BeautifulSoup
from collections import defaultdict


# Maximum allowed size for binary data (10MB)
MAX_SIZE = 10 * 1024 * 1024

# Suspicious patterns for binary data content
SUSPICIOUS_BINARY_PATTERNS = [
    "<html",
    "<!doctype",
    "<script",
    "javascript:",
    "data:",
    "<iframe",
]


def validate_binary_data(data):
    """
    Validate that binary data appears to be a valid document format
    and doesn't contain malicious content.

    Args:
        data (bytes or str): The binary data to validate, or base64-encoded string

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not data:
        return True, None  # Empty is OK

    # Handle base64-encoded strings by decoding them first
    if isinstance(data, str):
        try:
            binary_data = base64.b64decode(data)
        except Exception:
            return False, "Invalid base64 encoding"
    else:
        binary_data = data

    # Size check - 10MB limit
    if len(binary_data) > MAX_SIZE:
        return False, "Binary data exceeds maximum size limit (10MB)"

    # Basic format validation
    if len(binary_data) < 4:
        return False, "Binary data too short to be valid document format"

    # Check for suspicious text patterns (HTML/JS)
    try:
        decoded_text = binary_data.decode("utf-8", errors="ignore")[:200]
        if any(
            pattern in decoded_text.lower() for pattern in SUSPICIOUS_BINARY_PATTERNS
        ):
            return False, "Binary data contains suspicious content patterns"
    except Exception:
        pass  # Binary data might not be decodable as text, which is fine

    return True, None


# Combine custom components and editor-specific nodes into a single set of tags
CUSTOM_TAGS = {
    # editor node/tag names
    "imageComponent",
    "image",
    "mention",
    "link",
    "customColor",
    "emoji",
    "tableHeader",
    "tableCell",
    "tableRow",
    "codeBlock",
    "code",
    "horizontalRule",
    "calloutComponent",
    # component-style tag used by editor embeds
    "image-component",
}
ALLOWED_TAGS = nh3.ALLOWED_TAGS | CUSTOM_TAGS

# Merge nh3 defaults with all attributes used across our custom components
ATTRIBUTES = {
    "*": {
        "class",
        "id",
        "title",
        "role",
        "aria-label",
        "aria-hidden",
        "style",
        # common editor data-* attributes seen in stored HTML
        # (wildcards like data-* are NOT supported by nh3; we add known keys
        # here and dynamically include all data-* seen in the input below)
        "data-tight",
        "data-node-type",
        "data-type",
        "data-checked",
        "data-background",
        "data-text-color",
        "data-icon-name",
        "data-icon-color",
        "data-background-color",
        "data-emoji-unicode",
        "data-emoji-url",
        "data-logo-in-use",
        "data-block-type",
        "data-name",
        "data-entity-id",
        "data-entity-group-id",
    },
    "a": {"href", "target"},
    # editor node/tag attributes
    "imageComponent": {"id", "width", "height", "aspectRatio", "src", "alignment"},
    "image": {"width", "height", "aspectRatio", "alignment", "src", "alt", "title"},
    "mention": {"id", "entity_identifier", "entity_name"},
    "link": {"href", "target"},
    "customColor": {"color", "backgroundColor"},
    "emoji": {"name"},
    "tableHeader": {"colspan", "rowspan", "colwidth", "background", "hideContent"},
    "tableCell": {
        "colspan",
        "rowspan",
        "colwidth",
        "background",
        "textColor",
        "hideContent",
    },
    "tableRow": {"background", "textColor"},
    "codeBlock": {"language"},
    "calloutComponent": {
        "data-icon-color",
        "data-icon-name",
        "data-emoji-unicode",
        "data-emoji-url",
        "data-logo-in-use",
        "data-background",
        "data-block-type",
    },
    # image-component (from editor extension and seeds)
    "image-component": {"src", "id", "width", "height", "aspectratio", "alignment"},
}

SAFE_PROTOCOLS = {"http", "https", "mailto", "tel"}


def _compute_html_sanitization_diff(before_html: str, after_html: str):
    """
    Compute a coarse diff between original and sanitized HTML.

    Returns a dict with:
    - removed_tags: mapping[tag] -> removed_count
    - removed_attributes: mapping[tag] -> sorted list of attribute names removed
    """
    try:

        def collect(soup):
            tag_counts = defaultdict(int)
            attrs_by_tag = defaultdict(set)
            for el in soup.find_all(True):
                tag_name = (el.name or "").lower()
                if not tag_name:
                    continue
                tag_counts[tag_name] += 1
                for attr_name in list(el.attrs.keys()):
                    if isinstance(attr_name, str) and attr_name:
                        attrs_by_tag[tag_name].add(attr_name.lower())
            return tag_counts, attrs_by_tag

        soup_before = BeautifulSoup(before_html or "", "html.parser")
        soup_after = BeautifulSoup(after_html or "", "html.parser")

        counts_before, attrs_before = collect(soup_before)
        counts_after, attrs_after = collect(soup_after)

        removed_tags = {}
        for tag, cnt_before in counts_before.items():
            cnt_after = counts_after.get(tag, 0)
            if cnt_after < cnt_before:
                removed = cnt_before - cnt_after
                removed_tags[tag] = removed

        removed_attributes = {}
        for tag, before_set in attrs_before.items():
            after_set = attrs_after.get(tag, set())
            removed = before_set - after_set
            if removed:
                removed_attributes[tag] = sorted(list(removed))

        return {"removed_tags": removed_tags, "removed_attributes": removed_attributes}
    except Exception:
        # Best-effort only; if diffing fails we don't block the request
        return {"removed_tags": {}, "removed_attributes": {}}


def validate_html_content(html_content: str):
    # Size check - 10MB limit (consistent with binary validation)
    if len(html_content.encode("utf-8")) > MAX_SIZE:
        return False, "HTML content exceeds maximum size limit (10MB)", None

    try:
        clean_html = nh3.clean(
            html_content,
            tags=ALLOWED_TAGS,
            attributes=ATTRIBUTES,
            url_schemes=SAFE_PROTOCOLS,
        )
        # Report removals to logger (Sentry) if anything was stripped
        diff = _compute_html_sanitization_diff(html_content, clean_html)
        if diff.get("removed_tags") or diff.get("removed_attributes"):
            try:
                import json

                summary = json.dumps(diff)
            except Exception:
                summary = str(diff)
            log_exception(
                f"HTML sanitization removals: {summary}",
                warning=True,
            )
        return True, None, clean_html
    except Exception as e:
        log_exception(e)
        return False, "Failed to sanitize HTML", None

