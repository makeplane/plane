# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Tests of plane-log against a fake Plane API (standard library only, no network):

    python3 -m unittest liviere/tools/test_plane_log.py
"""

import importlib.machinery
import importlib.util
import io
import json
import os
import tempfile
import threading
import unittest
import urllib.parse
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).with_name("plane-log")
loader = importlib.machinery.SourceFileLoader("plane_log", str(SCRIPT))
spec = importlib.util.spec_from_loader("plane_log", loader)
plane_log = importlib.util.module_from_spec(spec)
loader.exec_module(plane_log)

PROJECT = {"id": "11111111-1111-1111-1111-111111111111", "identifier": "LS", "name": "Studio", "timezone": "UTC"}
ME = {"id": "22222222-2222-2222-2222-222222222222"}


class FakePlane(BaseHTTPRequestHandler):
    """Records requests; answers the project list, users/me and the report."""

    requests = []
    # (status, content type, body) of the next report responses, by `export`
    files = {"md": b"# Raport aktywno\xc5\x9bci\n", "csv": b"\xef\xbb\xbfData\r\n"}
    stored = {}

    def log_message(self, *args):
        pass

    def _send(self, status, content_type, body):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status, value):
        self._send(status, "application/json", json.dumps(value).encode())

    def _body(self):
        length = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(length)) if length else None

    def _handle(self):
        url = urllib.parse.urlsplit(self.path)
        params = dict(urllib.parse.parse_qsl(url.query))
        body = self._body() if self.command in ("POST", "PATCH") else None
        FakePlane.requests.append(
            {"method": self.command, "path": url.path, "params": params, "body": body, "key": self.headers["X-Api-Key"]}
        )
        if url.path.endswith("/projects/"):
            return self._json(200, {"results": [PROJECT]})
        if url.path.endswith("/users/me/"):
            return self._json(200, ME)
        if url.path.endswith("/activity/report/"):
            export = params.get("export")
            if export:
                return self._send(200, "application/octet-stream", FakePlane.files[export])
            return self._json(200, {"from": params["from"], "to": params["to"], "totals": {"result_minutes": 73}})
        return self.route(url.path, params, body)

    def route(self, path, params, body):
        return self._json(404, {"error": "Not found"})

    do_GET = do_POST = do_PATCH = do_DELETE = _handle


class PlaneLogTestCase(unittest.TestCase):
    handler = FakePlane

    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), cls.handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        FakePlane.requests = []
        FakePlane.stored = {}
        environment = {
            "PLANE_API_KEY": "test-key",
            "PLANE_WORKSPACE_SLUG": "studio",
            "PLANE_BASE_URL": f"http://127.0.0.1:{self.server.server_port}",
        }
        patcher = mock.patch.dict(os.environ, environment)
        patcher.start()
        self.addCleanup(patcher.stop)

    def run_tool(self, *argv, stdin=None):
        """Exit code, standard output (text and bytes written to sys.stdout.buffer) and standard error."""
        raw = io.BytesIO()
        out = io.TextIOWrapper(raw, encoding="utf-8", write_through=True)
        err = io.StringIO()
        with (
            mock.patch.object(plane_log.sys, "stdout", out),
            mock.patch.object(plane_log.sys, "stderr", err),
            mock.patch.object(plane_log.sys, "stdin", io.StringIO(stdin or "")),
        ):
            code = plane_log.main(list(argv))
        out.flush()
        return code, raw.getvalue().decode("utf-8"), err.getvalue()

    def report_requests(self):
        return [r for r in FakePlane.requests if r["path"].endswith("/activity/report/")]


class TestReport(PlaneLogTestCase):
    def test_month_ranges(self):
        self.assertEqual(plane_log.month_range(date(2026, 11, 24), "current"), (date(2026, 11, 1), date(2026, 11, 24)))
        self.assertEqual(plane_log.month_range(date(2026, 11, 24), "previous"), (date(2026, 10, 1), date(2026, 10, 31)))
        self.assertEqual(plane_log.month_range(date(2026, 1, 5), "previous"), (date(2025, 12, 1), date(2025, 12, 31)))
        self.assertEqual(plane_log.month_range(date(2028, 3, 1), "previous"), (date(2028, 2, 1), date(2028, 2, 29)))

    def test_file_of_a_period_is_saved_as_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            target = os.path.join(directory, "week.md")
            code, _, err = self.run_tool(
                "report", "-p", "LS", "--from", "2026-11-02", "--to", "2026-11-08", "--lang", "pl", "-o", target
            )
            self.assertEqual(code, 0, err)
            with open(target, "rb") as saved:
                self.assertEqual(saved.read(), FakePlane.files["md"])
        (request,) = self.report_requests()
        self.assertEqual(request["key"], "test-key")
        self.assertEqual(
            request["params"],
            {"from": "2026-11-02", "to": "2026-11-08", "source": "mixed", "lang": "pl", "export": "md"},
        )

    def test_csv_to_standard_output_with_options(self):
        code, out, err = self.run_tool(
            "report", "-p", "LS", "--month", "previous", "--format", "csv", "--source", "log", "--mine", "--no-entries"
        )
        self.assertEqual(code, 0, err)
        self.assertTrue(out.startswith("﻿Data"))
        (request,) = self.report_requests()
        self.assertEqual(request["params"]["export"], "csv")
        self.assertEqual(request["params"]["source"], "log")
        self.assertEqual(request["params"]["entries"], "0")
        self.assertEqual(request["params"]["actor"], ME["id"])
        self.assertTrue(request["params"]["from"].endswith("-01"))

    def test_json(self):
        code, out, err = self.run_tool("report", "-p", "LS", "--from", "2026-11-01", "--to", "2026-11-30", "--json")
        self.assertEqual(code, 0, err)
        self.assertEqual(json.loads(out)["totals"]["result_minutes"], 73)
        self.assertNotIn("export", self.report_requests()[0]["params"])

    def test_period_is_required(self):
        code, _, err = self.run_tool("report", "-p", "LS", "--from", "2026-11-01")
        self.assertEqual(code, 1)
        self.assertIn("--from and --to", err)
        code, _, err = self.run_tool("report", "-p", "LS", "--month", "current", "--from", "2026-11-01")
        self.assertEqual(code, 1)
        self.assertEqual(self.report_requests(), [])


if __name__ == "__main__":
    unittest.main()
