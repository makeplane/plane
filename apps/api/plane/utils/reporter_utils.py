"""
Reporter normalization and validation utility.

Rules:
- Only @winjit.com emails accepted for manual reporter entry
- Store ONLY the local part (e.g. 'akash.barnwal'), never the full address
- Sanitize with strip_tags + html.escape
"""
import html as html_module

from plane.utils.html_processor import strip_tags


def normalize_reporter_email(value):
    """
    Normalize a reporter email input value.

    Accepts:
      - Full email: "Akash.Barnwal@winjit.com" → "akash.barnwal"
      - Already-normalized local part: "akash.barnwal" → "akash.barnwal"

    Returns:
      (local_part_or_none, error_message_or_none)

    Examples:
      >>> normalize_reporter_email("Akash.Barnwal@winjit.com")
      ("akash.barnwal", None)
      >>> normalize_reporter_email("akash.barnwal")
      ("akash.barnwal", None)
      >>> normalize_reporter_email("user@gmail.com")
      (None, "Reporter email must use the @winjit.com domain.")
      >>> normalize_reporter_email("")
      (None, None)
    """
    if not value or not str(value).strip():
        return None, None

    value = str(value).strip().lower()

    if "@" in value:
        # Full email format — validate domain
        parts = value.split("@", 1)
        local_part = parts[0]
        domain = parts[1]

        if domain != "winjit.com":
            return None, "Reporter email must use the @winjit.com domain."

        if not local_part:
            return None, "Enter a valid Winjit email address."

        # Sanitize: strip HTML tags, escape special chars, limit length
        cleaned = html_module.escape(strip_tags(local_part))[:512]
        return cleaned, None
    else:
        # Already a local part — accept as-is after sanitization
        cleaned = html_module.escape(strip_tags(value))[:512]
        if not cleaned:
            return None, "Enter a valid Winjit email address."
        return cleaned, None
