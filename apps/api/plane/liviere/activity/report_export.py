# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Files of the activity time report: Markdown and CSV here, PDF in report_pdf.py. All of them render the
# dictionary of report.build_report: the PDF and the Markdown through the same table (day_rows), the CSV as
# minutes per source, so they show the numbers of the app view.

# Python imports
import csv
import io
import re
from datetime import datetime

# Module imports
from plane.liviere.activity.report import SOURCE_GRID, SOURCE_LOG, SOURCE_MIXED
from plane.liviere.activity.report_labels import labels

# Columns of the CSV for each source: one source shows its own time; "mixed" both, the difference and the
# result
COLUMNS = {
    SOURCE_GRID: ["grid_minutes"],
    SOURCE_LOG: ["log_minutes"],
    SOURCE_MIXED: ["log_minutes", "grid_minutes", "difference_minutes", "result_minutes"],
}
COLUMN_LABELS = {
    "log_minutes": "log",
    "grid_minutes": "grid",
    "difference_minutes": "difference",
    "result_minutes": "result",
}
EXPORTS = {
    "md": "text/markdown; charset=utf-8",
    "csv": "text/csv; charset=utf-8",
    "pdf": "application/pdf",
}


def format_minutes(minutes, L):
    """73 -> "1 h 13 min", 45 -> "45 min", -15 -> "-15 min"."""
    sign = "-" if minutes < 0 else ""
    hours, rest = divmod(abs(minutes), 60)
    if hours:
        return f"{sign}{hours} {L['hours']} {rest:02d} {L['minutes']}"
    return f"{sign}{rest} {L['minutes']}"


def person_name(actor, L):
    if actor is None:
        return L["unknown_person"]
    return actor["display_name"] or actor["id"]


def header(report, L):
    """(label, value) lines under the title: the period, and the person when the report is narrowed to one."""
    period = report["from"] if report["from"] == report["to"] else f"{report['from']} – {report['to']}"
    lines = [(L["period"], period)]
    if report["actor"]:
        lines.append((L["person"], person_name(report["actor"], L)))
    return lines


def skipped_lines(report):
    """ "2026-11-16 22:00 – 2026-11-17 06:00: description" for every skipped period of the report."""
    lines = []
    for period in report.get("skipped", []):
        start = datetime.fromisoformat(period["starts_at"])
        end = datetime.fromisoformat(period["ends_at"])
        text = f"{start.strftime('%Y-%m-%d %H:%M')} – {end.strftime('%Y-%m-%d %H:%M')}"
        lines.append(f"{text}: {period['description']}" if period["description"] else text)
    return lines


def is_empty_day(day):
    """No time from any source."""
    return not (day["log_minutes"] or day["grid_minutes"] or day["result_minutes"])


def _author_key(actor):
    return actor["id"] if actor else None


def names_texts(report):
    """
    Whether the texts of the "log entry" column start with the name of their author: when the report is not
    narrowed to one person and its texts come from more than one.
    """
    if report["actor"]:
        return False
    authors = set()
    for day in report["days"]:
        authors.update(_author_key(summary["author"]) for summary in day.get("summaries", []))
        authors.update(_author_key(entry["actor"]) for entry in day["entries"] if (entry["note"] or "").strip())
    return len(authors) > 1


def day_texts(day, L, with_names):
    """
    Texts of the "log entry" column of a day, each of them possibly several lines: for every person their
    summary of the day, or without one the notes of their log entries of that day (no times).
    """
    authors = {}
    summaries = {}
    notes = {}
    for summary in day.get("summaries", []):
        key = _author_key(summary["author"])
        authors.setdefault(key, summary["author"])
        summaries[key] = summary["text"]
    for entry in day["entries"]:
        note = (entry["note"] or "").strip()
        if note:
            key = _author_key(entry["actor"])
            authors.setdefault(key, entry["actor"])
            notes.setdefault(key, []).append(note)
    texts = []
    for key, actor in authors.items():
        for text in [summaries[key]] if key in summaries else notes[key]:
            text = text.strip()
            if text:
                texts.append(f"{person_name(actor, L)}: {text}" if with_names else text)
    return texts


def day_rows(report, L):
    """
    (rows, total, number of days left out) of the report table. A row is {"date", "texts", "work"}, the work
    being the time of the chosen source as text. A day without time and without texts is left out (the JSON
    and the CSV keep it); a day with a summary but no time stays.
    """
    with_names = names_texts(report)
    rows = []
    for day in report["days"]:
        texts = day_texts(day, L, with_names)
        if texts or not is_empty_day(day):
            rows.append({"date": day["date"], "texts": texts, "work": format_minutes(day["result_minutes"], L)})
    total = format_minutes(report["totals"]["result_minutes"], L)
    return rows, total, len(report["days"]) - len(rows)


def filename(report, export):
    return f"{report['project']['identifier']}-activity-{report['from']}_{report['to']}.{export}"


# Markdown


# Texts of people and agents (project name, names, summaries, entries) must not add headings, rows, quotes,
# lists, links or HTML to the file: a summary with "## People" and a table would otherwise forge a section
_MD_INLINE = re.compile(r"([\\`*_\[\]|~])")


def _md_text(text):
    """One line of text: Markdown characters escaped, HTML as entities, no line breaks."""
    text = str(text).replace("\r", " ").replace("\n", " ")
    text = _MD_INLINE.sub(r"\\\1", text)
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _md_cell_lines(texts):
    """Texts of several lines in one table cell: every line escaped, then joined with <br>."""
    return "<br>".join(_md_text(line) for text in texts for line in str(text).splitlines() if line.strip())


def to_markdown(report, language):
    L = labels(language)
    lines = [f"# {L['title']}: {_md_text(report['project']['name'])}", ""]
    lines.extend(f"- **{label}:** {_md_text(value)}" for label, value in header(report, L))
    lines.append("")

    rows, total, empty_days = day_rows(report, L)
    if rows:
        lines.append(f"| {L['date']} | {L['notes']} | {L['work']} |")
        lines.append("|---|---|---:|")
        lines.extend(f"| {row['date']} | {_md_cell_lines(row['texts'])} | {row['work']} |" for row in rows)
        lines.append(f"| **{L['total']}** | | **{total}** |")
        if empty_days:
            lines.extend(["", L["empty_days"].format(count=empty_days)])
    else:
        lines.append(L["no_activity"])
    lines.append("")

    if report.get("skipped"):
        lines.extend([f"## {L['skipped']}", ""])
        lines.extend(f"- {_md_text(line)}" for line in skipped_lines(report))
        lines.append("")
    return "\n".join(lines).rstrip("\n") + "\n"


# CSV


def to_csv(report, language):
    """Days and a total row, minutes as numbers; UTF-8 with a BOM so spreadsheets read Polish letters."""
    L = labels(language)
    columns = COLUMNS[report["source"]]
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\r\n")
    writer.writerow([L["date"]] + [f"{L[COLUMN_LABELS[column]]} ({L['minutes']})" for column in columns])
    for day in report["days"]:
        writer.writerow([day["date"]] + [day[column] for column in columns])
    writer.writerow([L["total"]] + [report["totals"][column] for column in columns])
    return ("\ufeff" + buffer.getvalue()).encode("utf-8")


def render(report, export, language, grid=None):
    """The file as bytes; `grid` (queries.heatmap of the same query) draws the activity grid of the PDF."""
    if export == "md":
        return to_markdown(report, language).encode("utf-8")
    if export == "csv":
        return to_csv(report, language)
    if export == "pdf":
        # Imported here: fpdf2 loads only for PDFs
        from plane.liviere.activity.report_pdf import to_pdf

        return to_pdf(report, language, grid)
    raise ValueError(f"Unknown export: {export}")
