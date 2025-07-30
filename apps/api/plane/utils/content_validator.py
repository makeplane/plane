# Python imports
import base64
import json
import re


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

# Malicious HTML patterns for content validation
MALICIOUS_HTML_PATTERNS = [
    # Script tags with any content
    r"<script[^>]*>",
    r"</script>",
    # JavaScript URLs in various attributes
    r'(?:href|src|action)\s*=\s*["\']?\s*javascript:',
    # Data URLs with text/html (potential XSS)
    r'(?:href|src|action)\s*=\s*["\']?\s*data:text/html',
    # Dangerous event handlers with JavaScript-like content
    r'on(?:load|error|click|focus|blur|change|submit|reset|select|resize|scroll|unload|beforeunload|hashchange|popstate|storage|message|offline|online)\s*=\s*["\']?[^"\']*(?:javascript|alert|eval|document\.|window\.|location\.|history\.)[^"\']*["\']?',
    # Object and embed tags that could load external content
    r"<(?:object|embed)[^>]*(?:data|src)\s*=",
    # Base tag that could change relative URL resolution
    r"<base[^>]*href\s*=",
    # Dangerous iframe sources
    r'<iframe[^>]*src\s*=\s*["\']?(?:javascript:|data:text/html)',
    # Meta refresh redirects
    r'<meta[^>]*http-equiv\s*=\s*["\']?refresh["\']?',
    # Link tags - simplified patterns
    r'<link[^>]*rel\s*=\s*["\']?stylesheet["\']?',
    r'<link[^>]*href\s*=\s*["\']?https?://',
    r'<link[^>]*href\s*=\s*["\']?//',
    r'<link[^>]*href\s*=\s*["\']?(?:data:|javascript:)',
    # Style tags with external imports
    r"<style[^>]*>.*?@import.*?(?:https?://|//)",
    # Link tags with dangerous rel types
    r'<link[^>]*rel\s*=\s*["\']?(?:import|preload|prefetch|dns-prefetch|preconnect)["\']?',
    # Forms with action attributes
    r"<form[^>]*action\s*=",
]

# Dangerous JavaScript patterns for event handlers
DANGEROUS_JS_PATTERNS = [
    r"alert\s*\(",
    r"eval\s*\(",
    r"document\s*\.",
    r"window\s*\.",
    r"location\s*\.",
    r"fetch\s*\(",
    r"XMLHttpRequest",
    r"innerHTML\s*=",
    r"outerHTML\s*=",
    r"document\.write",
    r"script\s*>",
]

# HTML self-closing tags that don't need closing tags
SELF_CLOSING_TAGS = {
    "img",
    "br",
    "hr",
    "input",
    "meta",
    "link",
    "area",
    "base",
    "col",
    "embed",
    "source",
    "track",
    "wbr",
}


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


def validate_html_content(html_content):
    """
    Validate that HTML content is safe and doesn't contain malicious patterns.

    Args:
        html_content (str): The HTML content to validate

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not html_content:
        return True, None  # Empty is OK

    # Size check - 10MB limit (consistent with binary validation)
    if len(html_content.encode("utf-8")) > MAX_SIZE:
        return False, "HTML content exceeds maximum size limit (10MB)"

    # Check for specific malicious patterns (simplified and more reliable)
    for pattern in MALICIOUS_HTML_PATTERNS:
        if re.search(pattern, html_content, re.IGNORECASE | re.DOTALL):
            return (
                False,
                f"HTML content contains potentially malicious patterns: {pattern}",
            )

    # Additional check for inline event handlers that contain suspicious content
    # This is more permissive - only blocks if the event handler contains actual dangerous code
    event_handler_pattern = r'on\w+\s*=\s*["\']([^"\']*)["\']'
    event_matches = re.findall(event_handler_pattern, html_content, re.IGNORECASE)

    for handler_content in event_matches:
        for js_pattern in DANGEROUS_JS_PATTERNS:
            if re.search(js_pattern, handler_content, re.IGNORECASE):
                return (
                    False,
                    f"HTML content contains dangerous JavaScript in event handler: {handler_content[:100]}",
                )

    # Basic HTML structure validation - check for common malformed tags
    try:
        # Count opening and closing tags for basic structure validation
        opening_tags = re.findall(r"<(\w+)[^>]*>", html_content)
        closing_tags = re.findall(r"</(\w+)>", html_content)

        # Filter out self-closing tags from opening tags
        opening_tags_filtered = [
            tag for tag in opening_tags if tag.lower() not in SELF_CLOSING_TAGS
        ]

        # Basic check - if we have significantly more opening than closing tags, it might be malformed
        if len(opening_tags_filtered) > len(closing_tags) + 10:  # Allow some tolerance
            return False, "HTML content appears to be malformed (unmatched tags)"

    except Exception:
        # If HTML parsing fails, we'll allow it
        pass

    return True, None


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
