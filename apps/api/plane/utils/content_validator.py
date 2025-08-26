# Python imports
import base64
import json
import re
import nh3
from plane.utils.exception_logger import log_exception

# Maximum allowed size for binary data (10MB)
MAX_SIZE = 10 * 1024 * 1024

# Maximum recursion depth to prevent stack overflow
MAX_RECURSION_DEPTH = 20

# Dangerous text patterns that could indicate XSS or script injection
DANGEROUS_TEXT_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript\s*:",
    r"data\s*:\s*text/html",
    r"eval\s*\(",
    r"document\s*\.",
    r"window\s*\.",
    r"location\s*\.",
]

# Dangerous attribute patterns for HTML attributes
DANGEROUS_ATTR_PATTERNS = [
    r"javascript\s*:",
    r"data\s*:\s*text/html",
    r"eval\s*\(",
    r"alert\s*\(",
    r"document\s*\.",
    r"window\s*\.",
]

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
    Validate that binary data appears to be valid document format and doesn't contain malicious content.

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


def validate_html_content(html_content: str):
    """
    Sanitize HTML content using nh3.
    Returns a tuple: (is_valid, error_message, clean_html)
    """
    if not html_content:
        return True, None, None

    # Size check - 10MB limit (consistent with binary validation)
    if len(html_content.encode("utf-8")) > MAX_SIZE:
        return False, "HTML content exceeds maximum size limit (10MB)", None

    try:
        clean_html = nh3.clean(html_content)
        return True, None, clean_html
    except Exception as e:
        log_exception(e)
        return False, "Failed to sanitize HTML", None


def validate_json_content(json_content):
    """
    Validate that JSON content is safe and doesn't contain malicious patterns.

    Args:
        json_content (dict): The JSON content to validate

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not json_content:
        return True, None  # Empty is OK

    try:
        # Size check - 10MB limit (consistent with other validations)
        json_str = json.dumps(json_content)
        if len(json_str.encode("utf-8")) > MAX_SIZE:
            return False, "JSON content exceeds maximum size limit (10MB)"

        # Basic structure validation for page description JSON
        if isinstance(json_content, dict):
            # Check for expected page description structure
            # This is based on ProseMirror/Tiptap JSON structure
            if "type" in json_content and json_content.get("type") == "doc":
                # Valid document structure
                if "content" in json_content and isinstance(
                    json_content["content"], list
                ):
                    # Recursively check content for suspicious patterns
                    is_valid, error_msg = _validate_json_content_array(
                        json_content["content"]
                    )
                    if not is_valid:
                        return False, error_msg
            elif "type" not in json_content and "content" not in json_content:
                # Allow other JSON structures but validate for suspicious content
                is_valid, error_msg = _validate_json_content_recursive(json_content)
                if not is_valid:
                    return False, error_msg
        else:
            return False, "JSON description must be a valid object"

    except (TypeError, ValueError) as e:
        return False, "Invalid JSON structure"
    except Exception as e:
        return False, "Failed to validate JSON content"

    return True, None


def _validate_json_content_array(content, depth=0):
    """
    Validate JSON content array for suspicious patterns.

    Args:
        content (list): Array of content nodes to validate
        depth (int): Current recursion depth (default: 0)

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    # Check recursion depth to prevent stack overflow
    if depth > MAX_RECURSION_DEPTH:
        return False, f"Maximum recursion depth ({MAX_RECURSION_DEPTH}) exceeded"

    if not isinstance(content, list):
        return True, None

    for node in content:
        if isinstance(node, dict):
            # Check text content for suspicious patterns (more targeted)
            if node.get("type") == "text" and "text" in node:
                text_content = node["text"]
                for pattern in DANGEROUS_TEXT_PATTERNS:
                    if re.search(pattern, text_content, re.IGNORECASE):
                        return (
                            False,
                            "JSON content contains suspicious script patterns in text",
                        )

            # Check attributes for suspicious content (more targeted)
            if "attrs" in node and isinstance(node["attrs"], dict):
                for attr_name, attr_value in node["attrs"].items():
                    if isinstance(attr_value, str):
                        # Only check specific attributes that could be dangerous
                        if attr_name.lower() in [
                            "href",
                            "src",
                            "action",
                            "onclick",
                            "onload",
                            "onerror",
                        ]:
                            for pattern in DANGEROUS_ATTR_PATTERNS:
                                if re.search(pattern, attr_value, re.IGNORECASE):
                                    return (
                                        False,
                                        f"JSON content contains dangerous pattern in {attr_name} attribute",
                                    )

            # Recursively check nested content
            if "content" in node and isinstance(node["content"], list):
                is_valid, error_msg = _validate_json_content_array(
                    node["content"], depth + 1
                )
                if not is_valid:
                    return False, error_msg

    return True, None


def _validate_json_content_recursive(obj, depth=0):
    """
    Recursively validate JSON object for suspicious content.

    Args:
        obj: JSON object (dict, list, or primitive) to validate
        depth (int): Current recursion depth (default: 0)

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    # Check recursion depth to prevent stack overflow
    if depth > MAX_RECURSION_DEPTH:
        return False, f"Maximum recursion depth ({MAX_RECURSION_DEPTH}) exceeded"
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, str):
                # Check for dangerous patterns using module constants
                for pattern in DANGEROUS_TEXT_PATTERNS:
                    if re.search(pattern, value, re.IGNORECASE):
                        return (
                            False,
                            "JSON content contains suspicious script patterns",
                        )
            elif isinstance(value, (dict, list)):
                is_valid, error_msg = _validate_json_content_recursive(value, depth + 1)
                if not is_valid:
                    return False, error_msg
    elif isinstance(obj, list):
        for item in obj:
            is_valid, error_msg = _validate_json_content_recursive(item, depth + 1)
            if not is_valid:
                return False, error_msg

    return True, None
