#!/usr/bin/env python3
"""
Hybrid CTI Report DOCX Generator
Combines full narrative from Markdown with charts/diagrams from JSON.

Usage:
    python3 generate-cti-docx-hybrid.py <report.md> <report.json> <output.docx>
    python3 generate-cti-docx-hybrid.py <report.md> <report.json>
    python3 generate-cti-docx-hybrid.py <report.md> <output.docx>   # MD-only mode
    python3 generate-cti-docx-hybrid.py <report.md>                 # MD-only, auto name

Phase 1: pandoc converts MD to DOCX (preserves all tables, lists, formatting).
Phase 2: python-docx post-processes to add CTI styling, cover page, TOC, and
         injects charts/diagrams from JSON at matching section headings.
"""
import sys
import os
import json
import subprocess
import tempfile
import datetime

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPTS_DIR)


def ensure_deps():
    required = {"python-docx": "docx", "matplotlib": "matplotlib", "networkx": "networkx"}
    for pkg, mod in required.items():
        try:
            __import__(mod)
        except ImportError:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", "--break-system-packages", pkg],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )


ensure_deps()

from docx import Document
from cti_docx_postprocess import (
    apply_cti_styles, rebuild_with_cover_toc_and_charts, setup_header_footer_compat,
)


def ensure_pandoc():
    if subprocess.run(["command", "-v", "pandoc"], shell=True, capture_output=True).returncode != 0:
        subprocess.check_call(["apt", "install", "-y", "pandoc"],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def convert_md_to_docx(md_path: str) -> str:
    """Run pandoc to convert Markdown to a temporary DOCX file."""
    tmp = tempfile.NamedTemporaryFile(suffix=".docx", delete=False)
    tmp.close()
    subprocess.run(
        ["pandoc", md_path, "-o", tmp.name, "--from", "markdown", "--to", "docx", "--standalone"],
        check=True,
        capture_output=True,
    )
    return tmp.name


def load_json(json_path: str) -> dict:
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data.setdefault("case", {})
    case = data["case"]
    case.setdefault("id", "CTI-001")
    case.setdefault("label", "CTI Report")
    case.setdefault("classification", "OPEN SOURCE")
    case.setdefault("analyst", "AI-Assisted CTI")
    case.setdefault("date", datetime.date.today().isoformat())
    case.setdefault("subject", "N/A")
    case.setdefault("status", "active")
    return data


def build_minimal_json_from_md(md_path: str) -> dict:
    """When no JSON is provided, build minimal metadata from the MD filename."""
    basename = os.path.splitext(os.path.basename(md_path))[0]
    parts = basename.split("-")
    case_id = "-".join(parts[2:4]) if len(parts) >= 4 else basename
    date_str = parts[-1] if len(parts) >= 5 else datetime.date.today().isoformat()
    return {
        "case": {
            "id": case_id,
            "label": f"CTI Report — {case_id}",
            "classification": "OPEN SOURCE",
            "analyst": "AI-Assisted CTI",
            "date": date_str,
            "subject": case_id,
            "status": "active",
        }
    }


def resolve_output_path(md_path: str, json_data: dict) -> str:
    case = json_data.get("case", {})
    case_id = case.get("id", "CTI-001")
    date = case.get("date", datetime.date.today().isoformat())
    directory = os.path.dirname(md_path) or "."
    return os.path.join(directory, f"CTI-REPORT-{case_id}-{date}.docx")


def parse_args():
    """Parse CLI arguments into (md_path, json_path_or_none, output_path_or_none)."""
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)

    md_path = args[0]
    json_path = None
    output_path = None

    for arg in args[1:]:
        if arg.endswith(".json"):
            json_path = arg
        elif arg.endswith(".docx"):
            output_path = arg

    return md_path, json_path, output_path


def main():
    md_path, json_path, output_path = parse_args()

    if not os.path.exists(md_path):
        print(f"Error: MD file not found: {md_path}")
        sys.exit(1)

    ensure_pandoc()

    json_data = load_json(json_path) if json_path and os.path.exists(json_path) else build_minimal_json_from_md(md_path)
    has_json = json_path is not None and os.path.exists(json_path)

    if not output_path:
        output_path = resolve_output_path(md_path, json_data)

    print(f"[Phase 1] pandoc: {os.path.basename(md_path)} → temp.docx")
    pandoc_docx = convert_md_to_docx(md_path)

    try:
        doc = Document(pandoc_docx)

        print("[Phase 2] Applying CTI styles")
        apply_cti_styles(doc)

        print("[Phase 2] Prepending cover page + TOC, injecting charts")
        rebuild_with_cover_toc_and_charts(doc, json_data)

        case = json_data["case"]
        setup_header_footer_compat(doc, case["id"], case.get("classification", "OPEN SOURCE"))

        doc.save(output_path)
        print(f"Saved: {output_path}")

        subjects = json_data.get("subjects", [])
        findings = json_data.get("findings", [])
        connections = json_data.get("connections", [])
        timeline = json_data.get("timeline", [])
        mode = "MD + JSON (hybrid)" if has_json else "MD-only (styled)"
        print(f"  Mode: {mode}")
        if has_json:
            print(f"  Subjects: {len(subjects)}  Findings: {len(findings)}  "
                  f"Connections: {len(connections)}  Timeline: {len(timeline)}")

    finally:
        try:
            os.unlink(pandoc_docx)
        except OSError:
            pass


if __name__ == "__main__":
    main()
