# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Texts of the report files (report_export.py) in English and Polish. The web app has its own copies in
# the i18n namespace "liviere" (activity.report.*); keep the descriptions of the sources in step.

LANGUAGES = ("en", "pl")
DEFAULT_LANGUAGE = "en"

LABELS = {
    "en": {
        "title": "Activity report",
        "project": "Project",
        "period": "Period",
        "timezone": "Time zone",
        "source": "Time source",
        "person": "Person",
        "everybody": "All people and agents",
        "unknown_person": "(deleted user)",
        "source_grid": "Actions (series)",
        "source_log": "Work log",
        "source_mixed": "Mixed: work log + actions outside the log",
        "describe_grid": (
            "Time from series of actions, not from quarter-hours: actions less than {gap} min apart form a series "
            "that lasts from the first to the last action plus {padding} min, so a single action counts {padding} min."
        ),
        "describe_log": "Time from work log entries; an entry without an end counts {open} min.",
        "describe_mixed": (
            "Result: the time covered by a work log entry or by a series of actions, counted once. Actions outside "
            "log entries add to it, also those of AI agents (for example work items created at night)."
        ),
        "describe_union": "The project time counts the time anyone worked; parallel work counts once.",
        "date": "Date",
        "log": "Work log",
        "grid": "Series",
        "difference": "Difference (log − series)",
        "result": "Result",
        "total": "Total",
        "people": "People",
        "days": "Days",
        "summaries": "Day summaries",
        "no_activity": "No activity in this period.",
        "empty_days": "Days without activity left out: {count}.",
        "skipped": "Skipped periods",
        "describe_skipped": (
            "Skipped periods are left out of every source; an entry or a series counts only outside them."
        ),
        "entries": "Work log entries",
        "no_entries": "No entries.",
        "page": "Page {page} of {pages}",
        "minutes": "min",
        "hours": "h",
    },
    "pl": {
        "title": "Raport aktywności",
        "project": "Projekt",
        "period": "Okres",
        "timezone": "Strefa czasowa",
        "source": "Źródło czasu",
        "person": "Osoba",
        "everybody": "Wszystkie osoby i agenci",
        "unknown_person": "(usunięty użytkownik)",
        "source_grid": "Akcje (serie)",
        "source_log": "Dziennik pracy",
        "source_mixed": "Mieszane: dziennik + akcje poza dziennikiem",
        "describe_grid": (
            "Czas z serii akcji, nie z kwadransów: akcje oddalone o mniej niż {gap} min tworzą serię od pierwszej "
            "do ostatniej akcji plus {padding} min, więc pojedyncza akcja to {padding} min."
        ),
        "describe_log": "Czas z wpisów dziennika pracy; wpis bez końca liczy się jako {open} min.",
        "describe_mixed": (
            "Wynik: czas, w którym był wpis dziennika albo seria akcji, liczony raz. Akcje poza wpisami dziennika "
            "też się doliczają, również akcje agentów AI (np. tickety zakładane w nocy)."
        ),
        "describe_union": "Czas projektu to czas, w którym ktokolwiek pracował; praca równoległa liczy się raz.",
        "date": "Data",
        "log": "Dziennik",
        "grid": "Serie",
        "difference": "Różnica (dziennik − serie)",
        "result": "Wynik",
        "total": "Razem",
        "people": "Osoby",
        "days": "Dni",
        "summaries": "Podsumowania dni",
        "no_activity": "Brak aktywności w tym okresie.",
        "empty_days": "Pominięto dni bez aktywności: {count}.",
        "skipped": "Okresy pomijane",
        "describe_skipped": (
            "Okresy pomijane nie liczą się w żadnym źródle; wpis albo seria liczy się tylko poza nimi."
        ),
        "entries": "Wpisy dziennika",
        "no_entries": "Brak wpisów.",
        "page": "Strona {page} z {pages}",
        "minutes": "min",
        "hours": "h",
    },
}


def labels(language):
    return LABELS.get(language, LABELS[DEFAULT_LANGUAGE])
