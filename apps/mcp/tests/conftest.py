"""Pytest configuration for Plane MCP Server tests."""

import os

# The server has no default Plane URL (it used to be Plane Cloud). Tests that
# build a real client need one; nothing here makes a request to it.
os.environ.setdefault("PLANE_BASE_URL", "http://plane.invalid")
