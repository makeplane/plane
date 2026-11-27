# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# The PDF of the activity time report (A4), drawn with fpdf2 (pure Python, LGPL-3.0) in DejaVu Sans, which
# has every Polish letter; the fonts are in fonts/ with their licence. No browser and no other service.
# The table is that of report_export.day_rows, so the PDF shows the numbers of the Markdown, CSV and app view;
# under it the activity grid of the Activity page, drawn as rectangles in print colours.

# Python imports
import logging
from datetime import date
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo

# Third party imports
from fontTools.ttLib import TTFont
from fpdf import FPDF

# Module imports
from plane.liviere.activity.report_export import day_rows, header, skipped_lines
from plane.liviere.activity.report_grid import SLOTS_PER_DAY, level_of, level_thresholds, skipped_quarters
from plane.liviere.activity.report_labels import labels

FONTS = Path(__file__).with_name("fonts")
FONT = "DejaVu"
REGULAR = FONTS / "DejaVuSans.ttf"
BOLD = FONTS / "DejaVuSans-Bold.ttf"
MUTED = (90, 90, 90)
HEADING_FILL = (235, 235, 235)
RULE = (205, 205, 205)
# The table: date, texts, work (mm); text lines and the space above and below them
COLUMN_WIDTHS = (24, 130, 26)
LINE = 4.5
PAD = 1.2
# The grid: Plane's accent blue (#3f76ff) at 25/50/75/100 % on white, an empty quarter light grey
GRID_COLOURS = [(234, 234, 234), (207, 221, 255), (159, 187, 255), (111, 152, 255), (63, 118, 255)]
HATCH = (95, 95, 95)
GRID_LABEL_WIDTH = 17
GRID_GAP = 0.3
HOUR_LABEL_EVERY = 3
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


def _heading(pdf, text, size):
    pdf.ln(3)
    pdf.set_font(FONT, "B", size)
    pdf.multi_cell(0, size * 0.55, printable(text), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    pdf.set_font(FONT, "", 9)


def _note(pdf, text):
    pdf.set_font(FONT, "", 8)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(0, 4, printable(text), new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.set_font(FONT, "", 9)


def _table_heading(pdf, L):
    pdf.set_font(FONT, "B", 9)
    pdf.set_fill_color(*HEADING_FILL)
    x, y, height = pdf.l_margin, pdf.get_y(), LINE + 2 * PAD
    pdf.rect(x, y, sum(COLUMN_WIDTHS), height, style="F")
    for width, text, align in zip(COLUMN_WIDTHS, (L["date"], L["notes"], L["work"]), "LLR"):
        pdf.set_xy(x, y)
        pdf.cell(width, height, printable(text), align=align)
        x += width
    pdf.set_y(y + height)
    pdf.set_font(FONT, "", 9)


def _rule(pdf, y):
    pdf.set_draw_color(*RULE)
    pdf.set_line_width(0.2)
    pdf.line(pdf.l_margin, y, pdf.l_margin + sum(COLUMN_WIDTHS), y)


def _table(pdf, rows, total, L):
    """
    The day table drawn line by line: fpdf2's tables keep a row on one page and refuse one taller than a
    page, while a day summary may run over several. A row going on to the next page repeats the heading
    and, in grey, its date.
    """
    date_x = pdf.l_margin
    text_x = date_x + COLUMN_WIDTHS[0]
    work_x = text_x + COLUMN_WIDTHS[1]
    bottom = pdf.page_break_trigger
    _table_heading(pdf, L)
    for row in rows:
        pdf.set_font(FONT, "", 9)
        lines = []
        for text in row["texts"]:
            lines.extend(pdf.multi_cell(COLUMN_WIDTHS[1], LINE, printable(text), dry_run=True, output="LINES"))
        if pdf.get_y() + 2 * PAD + LINE > bottom:
            pdf.add_page()
            _table_heading(pdf, L)
        y = pdf.get_y() + PAD
        pdf.set_xy(date_x, y)
        pdf.cell(COLUMN_WIDTHS[0], LINE, row["date"])
        pdf.set_xy(work_x, y)
        pdf.cell(COLUMN_WIDTHS[2], LINE, printable(row["work"]), align="R")
        for line in lines:
            if y + LINE + PAD > bottom:
                pdf.add_page()
                _table_heading(pdf, L)
                y = pdf.get_y() + PAD
                pdf.set_text_color(*MUTED)
                pdf.set_xy(date_x, y)
                pdf.cell(COLUMN_WIDTHS[0], LINE, row["date"])
                pdf.set_text_color(0, 0, 0)
            pdf.set_xy(text_x, y)
            pdf.cell(COLUMN_WIDTHS[1], LINE, line)
            y += LINE
        if not lines:
            y += LINE
        y += PAD
        _rule(pdf, y)
        pdf.set_y(y)

    if pdf.get_y() + 2 * PAD + LINE > bottom:
        pdf.add_page()
        _table_heading(pdf, L)
    y = pdf.get_y() + PAD
    pdf.set_font(FONT, "B", 9)
    pdf.set_xy(date_x, y)
    pdf.cell(COLUMN_WIDTHS[0], LINE, printable(L["total"]))
    pdf.set_xy(work_x, y)
    pdf.cell(COLUMN_WIDTHS[2], LINE, printable(total), align="R")
    pdf.set_font(FONT, "", 9)
    pdf.set_y(y + LINE + PAD)


def _day_label(day, L):
    """ "pon., 16.11" """
    value = date.fromisoformat(day)
    return f"{L['weekdays'][value.weekday()]}, {value.day:02d}.{value.month:02d}"


def _grid(pdf, report, grid, dates, L):
    """
    The activity grid of the days of the table (oldest first): 96 quarters a day, levels as on the Activity
    page, quarters of skipped periods hatched. Long periods go on over several pages, each with the hours.
    """
    pitch = (pdf.epw - GRID_LABEL_WIDTH) / SLOTS_PER_DAY
    size = pitch - GRID_GAP
    hours_height = 3.5
    legend_height = 6
    left = pdf.l_margin + GRID_LABEL_WIDTH
    bottom = pdf.page_break_trigger
    counts = {(bucket["date"], bucket["slot"]): bucket["count"] for bucket in grid["buckets"]}
    thresholds = level_thresholds(counts.values())
    shown = set(dates)
    skipped = {
        key for key in skipped_quarters(report.get("skipped", []), ZoneInfo(report["timezone"])) if key[0] in shown
    }

    def hours():
        y = pdf.get_y()
        pdf.set_font(FONT, "", 6)
        pdf.set_text_color(*MUTED)
        for hour in range(0, 24, HOUR_LABEL_EVERY):
            pdf.set_xy(left + hour * 4 * pitch, y)
            pdf.cell(4 * HOUR_LABEL_EVERY * pitch, hours_height, f"{hour:02d}")
        pdf.set_y(y + hours_height)

    # A grid that fits on one page starts on a new one rather than leaving its last days to the next; a longer
    # one starts here when a few of its days fit
    heading_height = 12
    whole = heading_height + hours_height + len(dates) * pitch + legend_height
    room = bottom - pdf.get_y()
    if whole > room and (whole <= bottom - pdf.t_margin or room < heading_height + hours_height + 10 * pitch):
        pdf.add_page()
    _heading(pdf, L["activity_grid"], 12)
    hours()
    pdf.set_draw_color(*HATCH)
    pdf.set_line_width(0.15)
    for index, day in enumerate(dates):
        last = index == len(dates) - 1
        if pdf.get_y() + pitch + (legend_height if last else 0) > bottom:
            pdf.add_page()
            hours()
        y = pdf.get_y()
        pdf.set_font(FONT, "", 5)
        pdf.set_text_color(*MUTED)
        pdf.set_xy(pdf.l_margin, y)
        pdf.cell(GRID_LABEL_WIDTH - 1.5, size, printable(_day_label(day, L)), align="R")
        for slot in range(SLOTS_PER_DAY):
            x = left + slot * pitch
            pdf.set_fill_color(*GRID_COLOURS[level_of(counts.get((day, slot), 0), thresholds)])
            pdf.rect(x, y, size, size, style="F")
            if (day, slot) in skipped:
                pdf.line(x, y + size, x + size, y)
        pdf.set_y(y + pitch)
    _legend(pdf, L, bool(skipped))
    pdf.set_text_color(0, 0, 0)
    pdf.set_font(FONT, "", 9)


def _legend(pdf, L, with_skipped):
    """ "Less ■■■■■ More" (and the hatched skipped quarter) in the bottom right corner of the grid."""
    swatch, gap = 2.4, 0.6
    pdf.set_font(FONT, "", 6.5)
    pdf.set_text_color(*MUTED)
    less, more = printable(L["less"]), printable(L["more"])
    skipped = printable(L["skipped_legend"])
    width = pdf.get_string_width(less) + 1.5 + len(GRID_COLOURS) * (swatch + gap) + 1.5 + pdf.get_string_width(more)
    if with_skipped:
        width += 4 + swatch + 1 + pdf.get_string_width(skipped)
    y = pdf.get_y() + 2
    x = pdf.l_margin + pdf.epw - width

    def text(value):
        nonlocal x
        pdf.set_xy(x, y)
        pdf.cell(pdf.get_string_width(value), swatch, value)
        x += pdf.get_string_width(value)

    text(less)
    x += 1.5
    for colour in GRID_COLOURS:
        pdf.set_fill_color(*colour)
        pdf.rect(x, y, swatch, swatch, style="F")
        x += swatch + gap
    x += 1.5 - gap
    text(more)
    if with_skipped:
        x += 4
        pdf.set_fill_color(*GRID_COLOURS[0])
        pdf.rect(x, y, swatch, swatch, style="F")
        pdf.line(x, y + swatch / 2, x + swatch / 2, y)
        pdf.line(x, y + swatch, x + swatch, y)
        pdf.line(x + swatch / 2, y + swatch, x + swatch, y + swatch / 2)
        x += swatch + 1
        text(skipped)
    pdf.set_y(y + swatch + 2)


def to_pdf(report, language, grid=None):
    """The PDF as bytes; `grid` is queries.heatmap of the report's query (without it, no activity grid)."""
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
        pdf.cell(20, 5, printable(label))
        pdf.set_font(FONT, "", 9)
        pdf.multi_cell(0, 5, printable(value), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    rows, total, empty_days = day_rows(report, L)
    if rows:
        _table(pdf, rows, total, L)
        if empty_days:
            pdf.ln(1)
            _note(pdf, L["empty_days"].format(count=empty_days))
        if grid is not None:
            pdf.ln(2)
            _grid(pdf, report, grid, [row["date"] for row in rows], L)
    else:
        pdf.multi_cell(0, 5, printable(L["no_activity"]), new_x="LMARGIN", new_y="NEXT")

    if report.get("skipped"):
        _heading(pdf, L["skipped"], 12)
        for line in skipped_lines(report):
            pdf.multi_cell(0, 5, printable(f"• {line}"), new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())
