#!/usr/bin/env python3
"""
Translation review server.
Parses English and Hebrew TS translation files, serves a web UI for review,
and writes corrected translations back to the Hebrew TS files.

Usage: python3 server.py [port]
"""

import http.server
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

LOCALES_DIR = Path(__file__).resolve().parent.parent / "packages" / "i18n" / "src" / "locales"
TRANSLATION_FILES = ["translations", "accessibility", "empty-state", "editor"]
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8888


def parse_ts_to_dict(filepath: Path) -> dict:
    """Parse a TS file that exports a default object literal into a Python dict."""
    text = filepath.read_text(encoding="utf-8")
    # Strip copyright header, export default, and trailing "as const;"
    text = re.sub(r"/\*[\s\S]*?\*/", "", text)
    # Strip single-line comments (// ...)
    text = re.sub(r"//[^\n]*", "", text)
    text = re.sub(r"export\s+default\s+", "", text)
    text = re.sub(r"\}\s*as\s+const\s*;?\s*$", "}", text.strip())
    # Convert JS object to JSON: add quotes around unquoted keys
    # Handle keys that start with numbers or contain special chars (already quoted)
    text = re.sub(r'(?<=[{,\n])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r' "\1":', text)
    # Remove trailing commas before } or ]
    text = re.sub(r",\s*([}\]])", r"\1", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"Warning: Failed to parse {filepath}: {e}")
        print(f"Problematic text around error (char {e.pos}):")
        start = max(0, e.pos - 100)
        end = min(len(text), e.pos + 100)
        print(text[start:end])
        return {}


def flatten_dict(d: dict, prefix: str = "") -> list[tuple[str, str]]:
    """Flatten nested dict into list of (dotted.path, value) pairs."""
    items = []
    for key, value in d.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            items.extend(flatten_dict(value, path))
        else:
            items.append((path, str(value)))
    return items


def unflatten_dict(pairs: list[tuple[str, str]]) -> dict:
    """Convert list of (dotted.path, value) pairs back to nested dict."""
    result = {}
    for path, value in pairs:
        parts = path.split(".")
        d = result
        for part in parts[:-1]:
            d = d.setdefault(part, {})
        d[parts[-1]] = value
    return result


def dict_to_ts(d: dict, indent: int = 2) -> str:
    """Convert a dict back to TypeScript object literal format."""
    def format_value(v, level):
        pad = " " * (indent * level)
        if isinstance(v, dict):
            if not v:
                return "{}"
            lines = []
            lines.append("{")
            items = list(v.items())
            for i, (key, val) in enumerate(items):
                # Quote keys that start with numbers or have special chars
                if re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', key):
                    key_str = key
                else:
                    key_str = f'"{key}"'
                formatted = format_value(val, level + 1)
                comma = "," if i < len(items) - 1 else ","
                if isinstance(val, dict):
                    lines.append(f"{pad}  {key_str}: {formatted}{comma}")
                else:
                    lines.append(f"{pad}  {key_str}: {formatted}{comma}")
            lines.append(f"{pad}}}")
            return "\n".join(lines)
        else:
            # Escape the string value for JS
            escaped = str(v).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
            return f'"{escaped}"'

    return format_value(d, 0)


def build_review_data() -> dict:
    """Build the review data structure from EN and HE files."""
    files = {}
    for name in TRANSLATION_FILES:
        en_path = LOCALES_DIR / "en" / f"{name}.ts"
        he_path = LOCALES_DIR / "he" / f"{name}.ts"
        if not en_path.exists():
            continue
        en_dict = parse_ts_to_dict(en_path)
        he_dict = parse_ts_to_dict(he_path) if he_path.exists() else {}
        en_flat = flatten_dict(en_dict)
        he_flat_dict = dict(flatten_dict(he_dict))

        entries = []
        for path, en_value in en_flat:
            he_value = he_flat_dict.get(path, en_value)
            entries.append({
                "path": path,
                "file": name,
                "en": en_value,
                "he": he_value,
                "status": "pending",  # pending, accepted, rejected, corrected
            })
        files[name] = entries
    return files


def save_translations(file_name: str, pairs: list[tuple[str, str]]):
    """Save reviewed translations back to a Hebrew TS file."""
    he_path = LOCALES_DIR / "he" / f"{file_name}.ts"
    d = unflatten_dict(pairs)
    ts_content = dict_to_ts(d)

    content = f"""/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export default {ts_content} as const;
"""
    he_path.write_text(content, encoding="utf-8")
    print(f"Saved {he_path}")


# Pre-build review data
print("Parsing translation files...")
review_data = build_review_data()
total = sum(len(entries) for entries in review_data.values())
print(f"Loaded {total} translation entries across {len(review_data)} files")

HTML_PATH = Path(__file__).resolve().parent / "index.html"


class ReviewHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/" or parsed.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_PATH.read_bytes())
        elif parsed.path == "/api/data":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(review_data, ensure_ascii=False).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/api/save":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            file_name = body["file"]
            pairs = [(e["path"], e["he"]) for e in body["entries"]]
            save_translations(file_name, pairs)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress request logs


if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", PORT), ReviewHandler)
    print(f"\nReview UI: http://localhost:{PORT}")
    print("Press Ctrl+C to stop\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
