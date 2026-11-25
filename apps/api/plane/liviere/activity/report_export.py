# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Files of the activity time report: Markdown and CSV here, PDF in report_pdf.py. All of them render the
# dictionary of report.build_report through the same tables below, so they show the numbers of the app view.

# Python imports
import csv
import io
from datetime import datetime

# Module imports
from plane.liviere.activity.report import SOURCE_GRID, SOURCE_LOG, SOURCE_MIXED
from plane.liviere.activity.report_labels import labels

# Columns of the tables for each source: one source shows its own time; "mixed" both, the difference
# and the result
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
    """(label, value) lines on top of every file."""
    project = report["project"]
    period = report["from"] if report["from"] == report["to"] else f"{report['from']} – {report['to']}"
    return [
        (L["project"], f"{project['name']} ({project['identifier']})"),
        (L["period"], period),
        (L["timezone"], report["timezone"]),
        (L["source"], L[f"source_{report['source']}"]),
        (L["person"], person_name(report["actor"], L) if report["actor"] else L["everybody"]),
    ]


def descriptions(report, L):
    """How the time was counted, in sentences; the series sentence names the thresholds."""
    values = {
        "gap": report["series_gap_minutes"],
        "padding": report["series_padding_minutes"],
        "open": report["open_entry_minutes"],
    }
    keys = {
        SOURCE_GRID: ["describe_grid"],
        SOURCE_LOG: ["describe_log"],
        SOURCE_MIXED: ["describe_mixed", "describe_log", "describe_grid"],
    }[report["source"]]
    return [L[key].format(**values) for key in keys] + [L["describe_union"]]


def day_table(report, L):
    """(headers, rows, total row) of the days, minutes as text."""
    columns = COLUMNS[report["source"]]
    headers = [L["date"]] + [L[COLUMN_LABELS[column]] for column in columns]
    rows = [[day["date"]] + [format_minutes(day[column], L) for column in columns] for day in report["days"]]
    total = [L["total"]] + [format_minutes(report["totals"][column], L) for column in columns]
    return headers, rows, total


def people_table(report, L):
    columns = COLUMNS[report["source"]]
    headers = [L["person"]] + [L[COLUMN_LABELS[column]] for column in columns]
    rows = [
        [person_name(row["actor"], L)] + [format_minutes(row[column], L) for column in columns]
        for row in report["people"]
    ]
    return headers, rows


def entry_time(entry):
    start = datetime.fromisoformat(entry["start"])
    if not entry["end"]:
        return start.strftime("%H:%M")
    end = datetime.fromisoformat(entry["end"])
    end_text = end.strftime("%H:%M") if end.date() == start.date() else end.strftime("%Y-%m-%d %H:%M")
    return f"{start.strftime('%H:%M')}–{end_text}"


def entry_heading(entry, L):
    """ "10:00–11:00 · Tomasz · LS-9 Name": the line above the text of an entry."""
    parts = [entry_time(entry), person_name(entry["actor"], L)]
    if entry["issue"]:
        identifier = entry["issue"]["identifier"]
        name = entry["issue"]["name"]
        parts.append(" ".join(part for part in (identifier, name) if part))
    return " · ".join(parts)


def days_with_entries(report):
    return [day for day in report["days"] if day["entries"]]


def days_with_summaries(report):
    return [day for day in report["days"] if day.get("summaries")]


def filename(report, export):
    return f"{report['project']['identifier']}-activity-{report['from']}_{report['to']}.{export}"


# Markdown


def _md_cell(text):
    return str(text).replace("\\", "\\\\").replace("|", "\\|").replace("\n", " ")


def _md_table(headers, rows):
    lines = ["| " + " | ".join(_md_cell(h) for h in headers) + " |"]
    lines.append("|" + "|".join(["---"] + ["---:"] * (len(headers) - 1)) + "|")
    lines.extend("| " + " | ".join(_md_cell(cell) for cell in row) + " |" for row in rows)
    return lines


def to_markdown(report, language):
    L = labels(language)
    lines = [f"# {L['title']}: {report['project']['name']}", ""]
    lines.extend(f"- **{label}:** {value}" for label, value in header(report, L))
    lines.append("")
    lines.extend(f"> {sentence}" for sentence in descriptions(report, L))
    lines.append("")

    headers, rows, total = day_table(report, L)
    lines.extend([f"## {L['days']}", ""])
    lines.extend(_md_table(headers, rows + [[f"**{cell}**" for cell in total]]))
    lines.append("")

    headers, rows = people_table(report, L)
    lines.extend([f"## {L['people']}", ""])
    lines.extend(_md_table(headers, rows))
    lines.append("")

    summarized = days_with_summaries(report)
    if summarized:
        lines.extend([f"## {L['summaries']}", ""])
        for day in summarized:
            lines.extend([f"### {day['date']}", ""])
            for summary in day["summaries"]:
                lines.extend([f"**{person_name(summary['author'], L)}**", ""])
                lines.extend(summary["text"].splitlines())
                lines.append("")

    if report["entries_included"]:
        lines.extend([f"## {L['entries']}", ""])
        listed = days_with_entries(report)
        if not listed:
            lines.extend([L["no_entries"], ""])
        for day in listed:
            lines.extend([f"### {day['date']}", ""])
            for entry in day["entries"]:
                lines.append(f"- **{entry_heading(entry, L)}**")
                for text_line in (entry["note"] or "").splitlines():
                    lines.append(f"  {text_line}" if text_line.strip() else "")
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


def render(report, export, language):
    """The file as bytes."""
    if export == "md":
        return to_markdown(report, language).encode("utf-8")
    if export == "csv":
        return to_csv(report, language)
    if export == "pdf":
        # Imported here: fpdf2 loads only for PDFs
        from plane.liviere.activity.report_pdf import to_pdf

        return to_pdf(report, language)
    raise ValueError(f"Unknown export: {export}")
