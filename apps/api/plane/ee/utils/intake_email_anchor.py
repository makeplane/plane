# Python imports
from typing import Tuple


def get_anchors(to_email: str) -> Tuple[str | bool, str | bool]:
    """Get the publish anchor and workspace slug from the email address.

    Args:
        to_email (str): The email address to parse.

    Returns:
        Tuple[str | bool, str | bool]: The publish anchor and workspace slug.
    """

    # split the email to get anchor and slug
    workspace_anchor = to_email.split("@")

    # Check if workspace anchor is empty
    if not workspace_anchor:
        return False, False

    # split the anchor again with -
    anchor = workspace_anchor[0].rsplit("-", 1)
    # Check if anchor is empty
    if not anchor or not (len(anchor) == 2):
        return False, False

    # Get the publish anchor and workspace slug
    publish_anchor = anchor[1]
    workspace_slug = anchor[0]

    return publish_anchor, workspace_slug
