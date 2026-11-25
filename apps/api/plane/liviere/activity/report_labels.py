# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Texts of the report files (report_export.py, report_pdf.py) in English and Polish. The web app has its own
# copies in the i18n namespace "liviere" (activity.report.*); keep the column names in step.

LANGUAGES = ("en", "pl")
DEFAULT_LANGUAGE = "en"

LABELS = {
    "en": {
        "title": "Activity report",
        "period": "Period",
        "person": "Person",
        "unknown_person": "(deleted user)",
        "date": "Date",
        "notes": "Log entry",
        "work": "Work",
        "log": "Work log",
        "grid": "Series",
        "difference": "Difference (log − series)",
        "result": "Result",
        "total": "Total",
        "no_activity": "No activity in this period.",
        "empty_days": "Days without activity left out: {count}.",
        "skipped": "Skipped periods",
        "skipped_legend": "Skipped period",
        "activity_grid": "Activity grid",
        "less": "Less",
        "more": "More",
        "weekdays": ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"),
        "page": "Page {page} of {pages}",
        "minutes": "min",
        "hours": "h",
    },
    "pl": {
        "title": "Raport aktywności",
        "period": "Okres",
        "person": "Osoba",
        "unknown_person": "(usunięty użytkownik)",
        "date": "Data",
        "notes": "Wpis z dziennika",
        "work": "Praca",
        "log": "Dziennik",
        "grid": "Serie",
        "difference": "Różnica (dziennik − serie)",
        "result": "Wynik",
        "total": "Razem",
        "no_activity": "Brak aktywności w tym okresie.",
        "empty_days": "Pominięto dni bez aktywności: {count}.",
        "skipped": "Okresy pomijane",
        "skipped_legend": "Okres pomijany",
        "activity_grid": "Siatka aktywności",
        "less": "Mniej",
        "more": "Więcej",
        "weekdays": ("pon.", "wt.", "śr.", "czw.", "pt.", "sob.", "niedz."),
        "page": "Strona {page} z {pages}",
        "minutes": "min",
        "hours": "h",
    },
}


def labels(language):
    return LABELS.get(language, LABELS[DEFAULT_LANGUAGE])
