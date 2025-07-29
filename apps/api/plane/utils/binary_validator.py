# Python imports


def validate_binary_data(binary_data):
    """
    Validate that binary data appears to be valid document format and doesn't contain malicious content.

    Args:
        binary_data (bytes): The binary data to validate

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not binary_data:
        return True, None  # Empty is OK

    # Size check - 10MB limit
    MAX_SIZE = 10 * 1024 * 1024
    if len(binary_data) > MAX_SIZE:
        return False, "Binary data exceeds maximum size limit (10MB)"

    # Basic format validation
    if len(binary_data) < 4:
        return False, "Binary data too short to be valid document format"

    # Check for suspicious text patterns (HTML/JS)
    try:
        decoded_text = binary_data.decode("utf-8", errors="ignore")[:200]
        suspicious_patterns = [
            "<html",
            "<!doctype",
            "<script",
            "javascript:",
            "data:",
            "<iframe",
        ]
        if any(pattern in decoded_text.lower() for pattern in suspicious_patterns):
            return False, "Binary data contains suspicious content patterns"
    except:
        pass  # Binary data might not be decodable as text, which is fine

    return True, None
