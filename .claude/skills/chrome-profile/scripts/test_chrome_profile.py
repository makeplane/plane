#!/usr/bin/env python3
"""Tests for chrome-profile CLI bridge-detection + precheck logic.

Run: python3 scripts/test_chrome_profile.py

These tests exercise pure-Python functions that don't touch the real Chrome:
- detect_bridge_state(cdp_probe_fn, port_listener_fn, mcp_config_fn) -> BridgeState
- format_bridge_report(state, json_mode) -> str
- cmd_open precheck guard (refuses without bridge unless --force)

Subprocess + http probes are dependency-injected so tests stay hermetic.
"""

from __future__ import annotations

import io
import json
import sys
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import chrome_profile_cli as cpc  # noqa: E402


# ---------------------------------------------------------------------------
# Bridge-state detection
# ---------------------------------------------------------------------------

class TestBridgeDetection(unittest.TestCase):
    def test_real_cdp_endpoint_yields_attached_bridge(self):
        state = cpc.detect_bridge_state(
            cdp_probe_fn=lambda port: {"Browser": "Chrome/131.0", "webSocketDebuggerUrl": "ws://..."},
            port_listener_fn=lambda port: {"listening": True, "command": "Google Chrome", "pid": 1943},
            mcp_config_fn=lambda: {"chrome_devtools_browser_url": "http://127.0.0.1:9222"},
            extension_probe_fn=lambda: "unknown",
        )
        self.assertEqual(state["bridge"], "chrome_devtools_mcp_attached")
        self.assertTrue(state["ok"])

    def test_squatter_detected_when_port_held_but_non_cdp_response(self):
        # The kai scenario: :9222 is bound by something Chrome-ish that returns 404 to /json/version
        state = cpc.detect_bridge_state(
            cdp_probe_fn=lambda port: None,  # /json/version returns non-200
            port_listener_fn=lambda port: {"listening": True, "command": "Google Chrome", "pid": 1943},
            mcp_config_fn=lambda: {"chrome_devtools_browser_url": None},
            extension_probe_fn=lambda: "likely",  # squatter on :9222 from inside Chrome is a strong signal
        )
        self.assertTrue(state["cdp_endpoint"]["non_cdp_squatter"])
        # Squatter detection alone is not enough; the agent session also needs MCP config.
        self.assertEqual(state["bridge"], "claude_in_chrome_likely_without_mcp_config")
        self.assertFalse(state["ok"])

    def test_squatter_with_claude_in_chrome_config_yields_bridge(self):
        state = cpc.detect_bridge_state(
            cdp_probe_fn=lambda port: None,
            port_listener_fn=lambda port: {"listening": True, "command": "Google Chrome", "pid": 1943},
            mcp_config_fn=lambda: {
                "chrome_devtools_browser_url": None,
                "claude_in_chrome_configured": True,
            },
            extension_probe_fn=lambda: "likely",
        )
        self.assertEqual(state["bridge"], "claude_in_chrome")
        self.assertTrue(state["ok"])

    def test_wrong_browser_url_port_does_not_pass_with_default_cdp(self):
        state = cpc.detect_bridge_state(
            cdp_probe_fn=lambda port: {"Browser": "Chrome/131.0", "webSocketDebuggerUrl": "ws://..."} if port == 9222 else None,
            port_listener_fn=lambda port: {"listening": True, "command": "Google Chrome", "pid": 1943},
            mcp_config_fn=lambda: {"chrome_devtools_browser_url": "http://127.0.0.1:9333"},
            extension_probe_fn=lambda: "unknown",
        )
        self.assertEqual(state["bridge"], "chrome_devtools_mcp_unreachable")
        self.assertFalse(state["ok"])

    def test_no_bridge_when_isolated_mcp_and_no_extension(self):
        state = cpc.detect_bridge_state(
            cdp_probe_fn=lambda port: None,
            port_listener_fn=lambda port: {"listening": False, "command": None, "pid": None},
            mcp_config_fn=lambda: {"chrome_devtools_browser_url": None},
            extension_probe_fn=lambda: "no",
        )
        self.assertEqual(state["bridge"], "none")
        self.assertFalse(state["ok"])
        self.assertTrue(len(state["remediation"]) >= 1)

    def test_json_output_is_valid_json(self):
        state = cpc.detect_bridge_state(
            cdp_probe_fn=lambda port: None,
            port_listener_fn=lambda port: {"listening": False, "command": None, "pid": None},
            mcp_config_fn=lambda: {"chrome_devtools_browser_url": None},
            extension_probe_fn=lambda: "no",
        )
        out = cpc.format_bridge_report(state, json_mode=True)
        parsed = json.loads(out)
        self.assertIn("bridge", parsed)
        self.assertIn("ok", parsed)
        self.assertIn("remediation", parsed)


# ---------------------------------------------------------------------------
# Precheck guard in cmd_open
# ---------------------------------------------------------------------------

class FakeArgs:
    def __init__(self, key="personal", url="https://example.com", force=False):
        self.key = key
        self.url = url
        self.force = force


class TestOpenPrecheck(unittest.TestCase):
    """The default `chrome-profile <key> <url>` MUST refuse if no bridge AND no --force."""

    def _mock_no_bridge(self):
        return {
            "ok": False,
            "bridge": "none",
            "remediation": ["install claude-in-chrome", "or use --browserUrl"],
            "cdp_endpoint": {"non_cdp_squatter": False},
        }

    def _mock_with_bridge(self):
        return {
            "ok": True,
            "bridge": "claude_in_chrome",
            "remediation": [],
            "cdp_endpoint": {"non_cdp_squatter": True},
        }

    def test_open_refuses_without_bridge_when_no_force(self):
        args = FakeArgs(force=False)
        buf_err = io.StringIO()
        with patch.object(cpc, "detect_bridge_state_default", return_value=self._mock_no_bridge()), \
             patch.object(cpc, "_launch_chrome_tab") as launch, \
             redirect_stderr(buf_err):
            with self.assertRaises(SystemExit) as ctx:
                cpc.cmd_open(args)
        self.assertNotEqual(ctx.exception.code, 0)
        launch.assert_not_called()
        self.assertIn("bridge", buf_err.getvalue().lower())
        self.assertIn("--force", buf_err.getvalue())

    def test_open_bypasses_precheck_with_force(self):
        args = FakeArgs(force=True)
        with patch.object(cpc, "detect_bridge_state_default", return_value=self._mock_no_bridge()), \
             patch.object(cpc, "_launch_chrome_tab", return_value=("Default", {"user_name": "x@y"})) as launch, \
             redirect_stdout(io.StringIO()):
            cpc.cmd_open(args)  # must not raise
        launch.assert_called_once()

    def test_open_proceeds_when_bridge_detected(self):
        args = FakeArgs(force=False)
        with patch.object(cpc, "detect_bridge_state_default", return_value=self._mock_with_bridge()), \
             patch.object(cpc, "_launch_chrome_tab", return_value=("Default", {"user_name": "x@y"})) as launch, \
             redirect_stdout(io.StringIO()):
            cpc.cmd_open(args)
        launch.assert_called_once()

    def test_validate_url_rejects_chrome_arg_injection(self):
        with self.assertRaises(SystemExit):
            cpc.validate_url("--user-data-dir=/tmp/evil")

    def test_redact_email_hides_local_part_by_default(self):
        self.assertEqual(cpc.redact_email("person@example.com"), "p***@example.com")


# ---------------------------------------------------------------------------
# Backward compatibility — existing surface preserved
# ---------------------------------------------------------------------------

class TestBackwardCompat(unittest.TestCase):
    def test_existing_helpers_still_importable(self):
        for name in ("cmd_list", "cmd_open", "cmd_setup", "cmd_discover",
                     "resolve_profile_dir", "info_cache", "load_config",
                     "chrome_binary", "chrome_user_data_dir"):
            self.assertTrue(hasattr(cpc, name), f"missing: {name}")

    def test_main_dispatches_open_when_two_positional_args(self):
        # `chrome-profile <key> <url>` (no subcommand) still routes to cmd_open
        with patch.object(cpc, "cmd_open") as fn:
            try:
                cpc.main(["personal", "https://example.com"])
            except SystemExit:
                pass
        fn.assert_called_once()

    def test_doctor_subcommand_registered(self):
        with patch.object(cpc, "cmd_doctor") as fn:
            try:
                cpc.main(["doctor"])
            except SystemExit:
                pass
        fn.assert_called_once()


if __name__ == "__main__":
    unittest.main(verbosity=2)
