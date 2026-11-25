# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# The PDF of the activity time report (A4), drawn with fpdf2 (pure Python, LGPL-3.0) in DejaVu Sans, which
# has every Polish letter; the fonts are in fonts/ with their licence. No browser and no other service.
# The tables are those of report_export.py, so the PDF shows the numbers of the Markdown, CSV and app view.

# Python imports
import logging
from functools import lru_cache
from pathlib import Path

# Third party imports
from fontTools.ttLib import TTFont
from fpdf import FPDF
from fpdf.fonts import FontFace

# Module imports
from plane.liviere.activity.report_export import (
    day_table,
    days_with_entries,
    days_with_summaries,
    descriptions,
    entry_heading,
    header,
    people_table,
    person_name,
    skipped_lines,
)
from plane.liviere.activity.report_labels import labels

FONTS = Path(__file__).with_name("fonts")
FONT = "DejaVu"
REGULAR = FONTS / "DejaVuSans.ttf"
BOLD = FONTS / "DejaVuSans-Bold.ttf"
MUTED = (90, 90, 90)
HEADINGS = FontFace(emphasis="BOLD", fill_color=(235, 235, 235))
TOTAL = FontFace(emphasis="BOLD")
# fpdf2 logs the characters a font lacks, fontTools the glyphs it keeps when subsetting the font (INFO): both
# would hint at the texts of entries and summaries, which never go to the server logs
logging.getLogger("fpdf").setLevel(logging.ERROR)
logging.getLogger("fontTools").setLevel(logging.ERROR)


@lru_cache(maxsize=1)
def _covered():
    """Code points both fonts can draw."""
    regular = set(TTFont(REGULAR)["cmap"].getBestCmap())
    bold = set(TTFont(BOLD)["cmap"].getBestCmap())
    return frozenset(regular & bold)


def printable(text):
    """The text with characters the fonts lack (emoji and the like) as "?", and without control characters."""
    covered = _covered()
    result = []
    for char in str(text):
        if char in "\n\t":
            result.append(" " if char == "\t" else char)
        elif ord(char) < 32 or 0x7F <= ord(char) < 0xA0:
            continue
        else:
            result.append(char if ord(char) in covered else "?")
    return "".join(result)


class ReportPDF(FPDF):
    def __init__(self, page_label):
        super().__init__(format="A4")
        self.page_label = page_label
        self.add_font(FONT, "", str(REGULAR))
        self.add_font(FONT, "B", str(BOLD))
        self.set_margins(15, 15, 15)
        self.set_auto_page_break(True, margin=15)

    def footer(self):
        self.set_y(-12)
        self.set_font(FONT, "", 8)
        self.set_text_color(*MUTED)
        text = self.page_label.format(page=self.page_no(), pages="{nb}")
        self.cell(0, 5, text, align="R")
        self.set_text_color(0, 0, 0)


def _table(pdf, headers, rows, total=None):
    count = len(headers)
    # "mixed": date or person, log, series, difference (the longest heading), result
    widths = (1.6, 1, 1, 1.6, 1) if count == 5 else (3, 1)
    with pdf.table(
        # One source: a narrow table on the left
        width=None if count == 5 else 100,
        align="LEFT",
        col_widths=widths,
        text_align=("LEFT",) + ("RIGHT",) * (count - 1),
        headings_style=HEADINGS,
        line_height=5,
        padding=1.2,
        borders_layout="HORIZONTAL_LINES",
    ) as table:
        table.row([printable(cell) for cell in headers])
        for row in rows:
            table.row([printable(cell) for cell in row])
        if total:
            line = table.row()
            for cell in total:
                line.cell(printable(cell), style=TOTAL)


def _heading(pdf, text, size):
    pdf.ln(3)
    pdf.set_font(FONT, "B", size)
    pdf.multi_cell(0, size * 0.55, printable(text), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    pdf.set_font(FONT, "", 9)


def to_pdf(report, language):
    L = labels(language)
    pdf = ReportPDF(L["page"])
    project = report["project"]
    pdf.set_title(printable(f"{L['title']}: {project['name']}"))
    pdf.set_creator("Plane (Liviere/plane)")
    pdf.add_page()

    pdf.set_font(FONT, "B", 16)
    pdf.multi_cell(0, 8, printable(f"{L['title']}: {project['name']}"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    for label, value in header(report, L):
        pdf.set_font(FONT, "B", 9)
        pdf.cell(35, 5, printable(label))
        pdf.set_font(FONT, "", 9)
        pdf.multi_cell(0, 5, printable(value), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font(FONT, "", 8)
    pdf.set_text_color(*MUTED)
    for sentence in descriptions(report, L):
        pdf.multi_cell(0, 4, printable(sentence), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)
    pdf.set_text_color(0, 0, 0)

    headers, rows, total = day_table(report, L)
    _heading(pdf, L["days"], 12)
    _table(pdf, headers, rows, total)

    headers, rows = people_table(report, L)
    _heading(pdf, L["people"], 12)
    _table(pdf, headers, rows)

    if report.get("skipped"):
        _heading(pdf, L["skipped"], 12)
        for line in skipped_lines(report):
            pdf.multi_cell(0, 5, printable(f"• {line}"), new_x="LMARGIN", new_y="NEXT")

    summarized = days_with_summaries(report)
    if summarized:
        _heading(pdf, L["summaries"], 12)
        for day in summarized:
            _heading(pdf, day["date"], 10)
            for summary in day["summaries"]:
                pdf.set_font(FONT, "B", 9)
                pdf.multi_cell(0, 5, printable(person_name(summary["author"], L)), new_x="LMARGIN", new_y="NEXT")
                pdf.set_font(FONT, "", 9)
                pdf.set_x(pdf.l_margin + 4)
                pdf.multi_cell(0, 4.5, printable(summary["text"]), new_x="LMARGIN", new_y="NEXT")
                pdf.ln(1.5)

    if report["entries_included"]:
        _heading(pdf, L["entries"], 12)
        listed = days_with_entries(report)
        if not listed:
            pdf.multi_cell(0, 5, printable(L["no_entries"]), new_x="LMARGIN", new_y="NEXT")
        for day in listed:
            _heading(pdf, day["date"], 10)
            for entry in day["entries"]:
                pdf.set_font(FONT, "B", 9)
                pdf.multi_cell(0, 5, printable(entry_heading(entry, L)), new_x="LMARGIN", new_y="NEXT")
                pdf.set_font(FONT, "", 9)
                if entry["note"]:
                    pdf.set_x(pdf.l_margin + 4)
                    pdf.multi_cell(0, 4.5, printable(entry["note"]), new_x="LMARGIN", new_y="NEXT")
                pdf.ln(1.5)

    return bytes(pdf.output())
