# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Tests of plane-search against a fake Plane API (standard library only, no network; made-up texts):

    python3 -m unittest liviere/tools/test_plane_search.py
"""

import importlib.machinery
import importlib.util
import io
import json
import os
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).with_name("plane-search")
loader = importlib.machinery.SourceFileLoader("plane_search", str(SCRIPT))
spec = importlib.util.spec_from_loader("plane_search", loader)
plane_search = importlib.util.module_from_spec(spec)
loader.exec_module(plane_search)

RESPONSE = {
    "query": "rate limit",
    "project": None,
    "limit": 20,
    "archived": True,
    "total": 3,
    "has_more": False,
    "results": [
        {
            "identifier": "LS-7",
            "name": "Rate limit of the API",
            "state": "Todo",
            "archived": False,
            "match": "title",
            "snippet": "Rate limit of the API",
            "comment_matches": 2,
        },
        {
            "identifier": "OO-12",
            "name": "Backups",
            "state": "Done",
            "archived": True,
            "match": "description",
            "snippet": "…the rate limit is not relevant…",
            "comment_matches": 0,
        },
        {
            "identifier": "LS-5",
            "name": "Agents",
            "state": "Todo",
            "archived": False,
            "match": "comment",
            "snippet": "…a rate limit of 60 requests a minute…",
            "comment_matches": 3,
            "comment_created_at": "2026-11-26T12:38:00Z",
        },
    ],
}


class FakePlane(BaseHTTPRequestHandler):
    """Records requests and answers the next prepared response."""

    requests = []
    answer = (200, RESPONSE)

    def log_message(self, *args):
        pass

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        FakePlane.requests.append(
            {
                "method": self.command,
                "path": self.path,
                "body": json.loads(self.rfile.read(length)) if length else None,
                "key": self.headers["X-Api-Key"],
            }
        )
        status, value = FakePlane.answer
        body = json.dumps(value).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class PlaneSearchTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), FakePlane)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        FakePlane.requests = []
        FakePlane.answer = (200, RESPONSE)
        environment = {
            "PLANE_API_KEY": "test-key",
            "PLANE_WORKSPACE_SLUG": "studio",
            "PLANE_BASE_URL": f"http://127.0.0.1:{self.server.server_port}",
            "TZ": "Europe/Warsaw",
        }
        patcher = mock.patch.dict(os.environ, environment)
        patcher.start()
        self.addCleanup(patcher.stop)

    def run_tool(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with mock.patch.object(plane_search.sys, "stdout", out), mock.patch.object(plane_search.sys, "stderr", err):
            code = plane_search.main(list(argv))
        return code, out.getvalue(), err.getvalue()


class TestSearch(PlaneSearchTestCase):
    def test_request(self):
        code, _, _ = self.run_tool("rate", "limit")
        self.assertEqual(code, 0)
        (request,) = FakePlane.requests
        self.assertEqual(request["method"], "POST")
        self.assertEqual(request["path"], "/api/v1/workspaces/studio/liviere/search/")
        self.assertEqual(request["body"], {"q": "rate limit", "archived": True})
        self.assertEqual(request["key"], "test-key")

    def test_options_go_to_the_body(self):
        self.run_tool("-p", "LS", "-n", "50", "--no-archived", "faktur")
        self.assertEqual(
            FakePlane.requests[0]["body"], {"q": "faktur", "project": "LS", "limit": 50, "archived": False}
        )

    def test_lines(self):
        with mock.patch.object(plane_search, "local_time", lambda value: "2026-11-26 13:38"):
            code, out, _ = self.run_tool("rate limit")
        self.assertEqual(code, 0)
        self.assertEqual(
            out.splitlines(),
            [
                "LS-7  [Todo]  title + comments (2)  Rate limit of the API",
                "OO-12  [Done, archived]  description  Backups",
                "    …the rate limit is not relevant…",
                "LS-5  [Todo]  comment (3)  Agents",
                "    …a rate limit of 60 requests a minute…   (comment 2026-11-26 13:38)",
                "3 of 3",
            ],
        )

    def test_local_time(self):
        self.assertRegex(plane_search.local_time("2026-11-26T12:38:00Z"), r"^2026-11-26 \d\d:38$")
        self.assertEqual(plane_search.local_time("not a date"), "not a date")

    def test_more_than_shown(self):
        FakePlane.answer = (200, {**RESPONSE, "results": RESPONSE["results"][:1], "total": 57, "has_more": True})
        _, out, _ = self.run_tool("rate limit")
        self.assertEqual(out.splitlines()[-1], "1 of 57: narrow the phrase, add -p or raise -n (at most 100)")

    def test_no_matches(self):
        FakePlane.answer = (200, {**RESPONSE, "results": [], "total": 0})
        code, out, _ = self.run_tool("nothing here")
        self.assertEqual((code, out), (0, "No matches.\n"))

    def test_json(self):
        code, out, _ = self.run_tool("--json", "rate limit")
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out), RESPONSE)

    def test_error(self):
        FakePlane.answer = (400, {"error": "q must be at least 3 characters"})
        code, out, err = self.run_tool("ab")
        self.assertEqual((code, out), (1, ""))
        self.assertEqual(err, "plane-search: HTTP 400: q must be at least 3 characters\n")

    def test_missing_configuration(self):
        with (
            mock.patch.dict(os.environ, {"PLANE_API_KEY": ""}),
            mock.patch.object(plane_search, "ENV_FILE", "/nonexistent/env"),
        ):
            code, _, err = self.run_tool("rate limit")
        self.assertEqual(code, 1)
        self.assertIn("Missing PLANE_API_KEY", err)


if __name__ == "__main__":
    unittest.main()
