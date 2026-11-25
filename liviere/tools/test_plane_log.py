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
from datetime import date, datetime, timezone
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
    files = {"md": b"# Raport aktywno\xc5\x9bci\n", "csv": b"\xef\xbb\xbfData\r\n", "pdf": b"%PDF-1.7\n\x00\xff"}
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
        """Day summaries kept in `stored` ({id: summary}), one per day (the fake has one author)."""
        if path.endswith("/activity/summaries/") and self.command == "GET":
            results = [
                s
                for s in FakePlane.stored.values()
                if params["from"] <= s["date"] <= params["to"] and params.get("actor", ME["id"]) == ME["id"]
            ]
            return self._json(200, {"results": results})
        if path.endswith("/activity/summaries/") and self.command == "POST":
            existing = next((s for s in FakePlane.stored.values() if s["date"] == body["date"]), None)
            if existing:
                existing["text"] = body["text"]
                return self._json(200, {**existing, "replaced": True})
            summary = {
                "id": len(FakePlane.stored) + 1,
                "date": body["date"],
                "text": body["text"],
                "author": {"id": ME["id"], "display_name": "ai"},
            }
            FakePlane.stored[summary["id"]] = summary
            return self._json(201, {**summary, "replaced": False})
        if "/activity/summaries/" in path:
            summary_id = int(path.rstrip("/").rsplit("/", 1)[1])
            if summary_id not in FakePlane.stored:
                return self._json(404, {"error": "Summary not found"})
            if self.command == "PATCH":
                FakePlane.stored[summary_id]["text"] = body["text"]
                return self._json(200, FakePlane.stored[summary_id])
            if self.command == "DELETE":
                del FakePlane.stored[summary_id]
                self.send_response(204)
                self.end_headers()
                return None
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

    def test_pdf_from_the_file_extension(self):
        with tempfile.TemporaryDirectory() as directory:
            target = os.path.join(directory, "october.pdf")
            code, _, err = self.run_tool("report", "-p", "LS", "--month", "previous", "-o", target)
            self.assertEqual(code, 0, err)
            with open(target, "rb") as saved:
                self.assertEqual(saved.read(), FakePlane.files["pdf"])
        self.assertEqual(self.report_requests()[0]["params"]["export"], "pdf")

    def test_pdf_needs_a_file(self):
        code, _, err = self.run_tool("report", "-p", "LS", "--month", "current", "--format", "pdf")
        self.assertEqual(code, 1)
        self.assertIn("-o FILE", err)
        self.assertEqual(self.report_requests(), [])

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


class TestSummary(PlaneLogTestCase):
    def posts(self):
        return [r for r in FakePlane.requests if r["method"] == "POST"]

    def test_add_show_edit_and_remove(self):
        code, out, err = self.run_tool("summary", "add", "-p", "LS", "--date", "2026-11-16", "Zrobione: raport.")
        self.assertEqual(code, 0, err)
        self.assertIn("#1  2026-11-16  ai", out)
        self.assertEqual(self.posts()[0]["body"], {"date": "2026-11-16", "text": "Zrobione: raport."})

        code, out, _ = self.run_tool("summary", "show", "-p", "LS", "--date", "2026-11-17", "--days", "2")
        self.assertEqual(code, 0)
        self.assertIn("Zrobione: raport.", out)

        code, _, err = self.run_tool("summary", "edit", "-p", "LS", "1", "--text", "-", stdin="Poprawione.")
        self.assertEqual(code, 0, err)
        self.assertEqual(FakePlane.stored[1]["text"], "Poprawione.")

        code, out, _ = self.run_tool("summary", "rm", "-p", "LS", "1")
        self.assertEqual((code, out.strip()), (0, "Deleted summary #1"))
        self.assertEqual(FakePlane.stored, {})

    def test_a_second_summary_of_the_day_needs_replace_or_append(self):
        self.run_tool("summary", "add", "-p", "LS", "--date", "2026-11-16", "Pierwsza sesja.")

        code, _, err = self.run_tool("summary", "add", "-p", "LS", "--date", "2026-11-16", "Druga sesja.")
        self.assertEqual(code, 1)
        self.assertIn("--replace", err)
        self.assertIn("--append", err)
        self.assertEqual(len(self.posts()), 1)

        code, _, err = self.run_tool("summary", "add", "-p", "LS", "--date", "2026-11-16", "--append", "Druga sesja.")
        self.assertEqual(code, 0, err)
        self.assertEqual(FakePlane.stored[1]["text"], "Pierwsza sesja.\n\nDruga sesja.")

        code, _, err = self.run_tool("summary", "add", "-p", "LS", "--date", "2026-11-16", "--replace", "Całość.")
        self.assertEqual(code, 0, err)
        self.assertEqual(FakePlane.stored[1]["text"], "Całość.")

    def test_the_day_defaults_to_today_in_the_project_time_zone(self):
        code, _, err = self.run_tool("summary", "add", "-p", "LS", "Dzisiaj.")
        self.assertEqual(code, 0, err)
        self.assertRegex(self.posts()[0]["body"]["date"], r"^\d{4}-\d{2}-\d{2}$")

    def test_show_defaults_to_today_in_the_project_time_zone(self):
        # 23:30 UTC on 16 November is already the 17th in Warsaw
        warsaw = {**PROJECT, "timezone": "Europe/Warsaw"}
        frozen = datetime(2026, 11, 16, 23, 30, tzinfo=timezone.utc)
        clock = mock.Mock(wraps=datetime)
        clock.now.side_effect = lambda tz=None: frozen.astimezone(tz) if tz else frozen
        with mock.patch.object(plane_log, "datetime", clock), mock.patch.dict(PROJECT, warsaw):
            code, _, err = self.run_tool("summary", "show", "-p", "LS")
        self.assertEqual(code, 0, err)
        request = [r for r in FakePlane.requests if r["path"].endswith("/activity/summaries/")][0]
        self.assertEqual((request["params"]["from"], request["params"]["to"]), ("2026-11-17", "2026-11-17"))

    def test_empty_text_is_refused(self):
        code, _, err = self.run_tool("summary", "add", "-p", "LS", "-", stdin="  ")
        self.assertEqual(code, 1)
        self.assertEqual(self.posts(), [])


if __name__ == "__main__":
    unittest.main()
