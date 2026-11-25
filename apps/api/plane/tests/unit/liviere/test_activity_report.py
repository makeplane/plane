# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Liviere/plane fork: time counting of the project activity report (plane/liviere/activity/report.py).
# Every expected number below is counted by hand; the comments show how.

from datetime import date, datetime, timedelta, timezone as dt_timezone
from zoneinfo import ZoneInfo

import pytest

from plane.liviere.activity import report as R

WARSAW = ZoneInfo("Europe/Warsaw")
GAP = timedelta(minutes=15)
PADDING = timedelta(minutes=5)
DAY = date(2026, 11, 16)
TOMASZ = "tomasz"
AGENT = "agent"


def at(clock, day=DAY, zone=WARSAW):
    hour, minute = map(int, clock.split(":"))
    return datetime(day.year, day.month, day.day, hour, minute, tzinfo=zone).astimezone(dt_timezone.utc)


def one_day(actions=(), entries=(), day=DAY, zone=WARSAW, gap=GAP, padding=PADDING, skipped=()):
    result = R.compute(list(actions), list(entries), [day], zone, gap, padding, skipped)
    return result["days"][day], {actor: cells[day] for actor, cells in result["people"].items()}


@pytest.mark.unit
class TestSeries:
    @pytest.mark.parametrize(
        "clocks, minutes",
        [
            # The LS-9 example: one series across the :15 boundary, 10:16 - 10:13 + 5 = 8 (quarters: 30)
            (["10:13", "10:16"], 8),
            # The order's example: a 16-minute gap is not shorter than 15, two single actions 5 + 5 (quarters: 30)
            (["13:00", "13:16"], 10),
            # 13:16 - 13:10 + 5 = 11 (quarters: 30)
            (["13:10", "13:16"], 11),
            # Gaps 5, 7, 8, 11: one series 10:31 - 10:00 + 5 = 36 (quarters: 45)
            (["10:00", "10:05", "10:12", "10:20", "10:31"], 36),
            # A single action (quarters: 15)
            (["14:07"], 5),
            # Gaps of 14 minutes still join: 09:42 - 09:00 + 5 = 47 (quarters: 45)
            (["09:00", "09:14", "09:28", "09:42"], 47),
        ],
    )
    def test_series_examples(self, clocks, minutes):
        project, _ = one_day(actions=[(TOMASZ, at(clock)) for clock in clocks])
        assert project[R.SOURCE_GRID] == minutes

    def test_thresholds_come_from_the_settings(self):
        actions = [(TOMASZ, at("13:00")), (TOMASZ, at("13:16"))]
        # A 20-minute gap joins them: 16 + 2 = 18
        project, _ = one_day(actions=actions, gap=timedelta(minutes=20), padding=timedelta(minutes=2))
        assert project[R.SOURCE_GRID] == 18

    def test_series_are_per_person_and_the_project_counts_parallel_time_once(self):
        # Tomasz 10:00-10:15 (10:10 + 5), the agent 10:05-10:24 (10:19 + 5): the project is busy 10:00-10:24
        actions = [(TOMASZ, at("10:00")), (TOMASZ, at("10:10")), (AGENT, at("10:05")), (AGENT, at("10:19"))]
        project, people = one_day(actions=actions)
        assert people[TOMASZ][R.SOURCE_GRID] == 15
        assert people[AGENT][R.SOURCE_GRID] == 19
        assert project[R.SOURCE_GRID] == 24


@pytest.mark.unit
class TestLog:
    def test_people_and_parallel_sessions(self):
        # The plan's P3 example: Tomasz 10:00-11:00; the agent account runs two sessions at once
        entries = [
            (TOMASZ, at("10:00"), at("11:00")),
            (AGENT, at("10:30"), at("11:30")),
            (AGENT, at("10:45"), at("11:15")),
        ]
        project, people = one_day(entries=entries)
        assert people[TOMASZ][R.SOURCE_LOG] == 60
        # 10:30-11:30, the second session lies inside it
        assert people[AGENT][R.SOURCE_LOG] == 60
        # Somebody worked 10:00-11:30
        assert project[R.SOURCE_LOG] == 90

    def test_an_entry_without_an_end_counts_15_minutes(self):
        project, _ = one_day(entries=[(TOMASZ, at("12:00"), None)])
        assert project[R.SOURCE_LOG] == 15

    def test_entries_do_not_count_as_actions(self):
        project, _ = one_day(entries=[(TOMASZ, at("12:00"), at("12:30"))])
        assert project[R.SOURCE_GRID] == 0
        assert project[R.SOURCE_MIXED] == 30

    def test_unknown_author(self):
        # Deleted users leave events without an actor; they still count, in their own row
        project, people = one_day(entries=[(None, at("08:00"), at("08:20"))], actions=[(None, at("09:00"))])
        assert people[None] == {R.SOURCE_LOG: 20, R.SOURCE_GRID: 5, R.SOURCE_MIXED: 25}
        assert project[R.SOURCE_MIXED] == 25


@pytest.mark.unit
class TestMixed:
    def test_log_plus_actions_outside_the_log(self):
        # The plan's P5 example. Series 10:10-10:25 (15) and 14:00-14:13 (13): 28. Log 10:00-11:00: 60.
        # Mixed: 10:00-11:00 covers the first series, the second one adds 13: 73. Difference 60 - 28 = 32.
        project, _ = one_day(
            entries=[(TOMASZ, at("10:00"), at("11:00"))],
            actions=[(TOMASZ, at(clock)) for clock in ("10:10", "10:20", "14:00", "14:08")],
        )
        assert project == {R.SOURCE_LOG: 60, R.SOURCE_GRID: 28, R.SOURCE_MIXED: 73}
        row = R.with_totals(project, R.SOURCE_MIXED)
        assert row == {"log_minutes": 60, "grid_minutes": 28, "difference_minutes": 32, "result_minutes": 73}

    def test_actions_of_another_person_outside_the_log_count_too(self):
        # The agent's night action, no entry for it: the project's mixed time includes its 5 minutes
        project, _ = one_day(entries=[(TOMASZ, at("10:00"), at("11:00"))], actions=[(AGENT, at("23:00"))])
        assert project[R.SOURCE_MIXED] == 65

    @pytest.mark.parametrize("source, result", [(R.SOURCE_LOG, 60), (R.SOURCE_GRID, 28), (R.SOURCE_MIXED, 73)])
    def test_the_result_follows_the_source(self, source, result):
        cells = {R.SOURCE_LOG: 60, R.SOURCE_GRID: 28, R.SOURCE_MIXED: 73}
        assert R.with_totals(cells, source)["result_minutes"] == result


@pytest.mark.unit
class TestDays:
    def test_a_series_after_midnight_is_split(self):
        # November, UTC+1. 23:55 and 00:05 next day: one series 23:55-00:10, 5 minutes + 10 minutes
        day2 = DAY + timedelta(days=1)
        actions = [(TOMASZ, at("23:55")), (TOMASZ, at("00:05", day=day2))]
        result = R.compute(actions, [], [DAY, day2], WARSAW, GAP, PADDING)
        assert result["days"][DAY][R.SOURCE_GRID] == 5
        assert result["days"][day2][R.SOURCE_GRID] == 10

    def test_a_day_counts_the_same_in_a_month_and_on_its_own(self):
        # 23:50 the day before joins 00:02: series 23:50-00:07, 7 minutes on the second day either way
        day2 = DAY + timedelta(days=1)
        actions = [(TOMASZ, at("23:50")), (TOMASZ, at("00:02", day=day2))]
        both = R.compute(actions, [], [DAY, day2], WARSAW, GAP, PADDING)["days"]
        alone = R.compute(actions, [], [day2], WARSAW, GAP, PADDING)["days"]
        assert both[day2] == alone[day2]
        assert alone[day2][R.SOURCE_GRID] == 7

    def test_the_day_clocks_go_back_has_25_hours(self):
        autumn = date(2026, 10, 25)
        ((_, since, until),) = R.day_bounds([autumn], WARSAW)
        assert until - since == timedelta(hours=25)
        # 01:30 summer time to 02:30 winter time: one clock hour, two real hours
        start = datetime(2026, 10, 25, 1, 30, tzinfo=WARSAW).astimezone(dt_timezone.utc)
        end = datetime(2026, 10, 25, 2, 30, fold=1, tzinfo=WARSAW).astimezone(dt_timezone.utc)
        project, _ = one_day(entries=[(TOMASZ, start, end)], day=autumn)
        assert project[R.SOURCE_LOG] == 120

    def test_a_whole_day_entry_on_the_autumn_day(self):
        autumn = date(2026, 10, 25)
        start = datetime(2026, 10, 25, 0, 0, tzinfo=WARSAW).astimezone(dt_timezone.utc)
        project, _ = one_day(entries=[(TOMASZ, start, start + timedelta(hours=12))], day=autumn)
        assert project[R.SOURCE_LOG] == 12 * 60

    @pytest.mark.parametrize("seconds, minutes", [(29, 0), (30, 1), (89, 1), (90, 2), (150, 3), (210, 4)])
    def test_rounding_is_half_up(self, seconds, minutes):
        # Python's round() would give 2 for 150 s (2.5 min) and 4 for 210 s (3.5 min); half up gives 3 and 4
        assert R.round_minutes(timedelta(seconds=seconds)) == minutes

    def test_totals_add_up_rounded_cells(self):
        # Two days of 40 s each: 1 + 1 = 2 minutes, not round(80 s) = 1
        day2 = DAY + timedelta(days=1)
        entries = [
            (TOMASZ, at("10:00"), at("10:00") + timedelta(seconds=40)),
            (TOMASZ, at("10:00", day=day2), at("10:00", day=day2) + timedelta(seconds=40)),
        ]
        days = R.compute([], entries, [DAY, day2], WARSAW, GAP, PADDING)["days"]
        rows = [R.with_totals(days[day], R.SOURCE_LOG) for day in (DAY, day2)]
        assert R.sum_rows(rows)["log_minutes"] == 2


@pytest.mark.unit
class TestRanges:
    def test_merge_and_subtract(self):
        a, b, c, d = (at(clock) for clock in ("10:00", "10:30", "11:00", "11:30"))
        assert R.merge([(c, d), (a, b), (b, c)]) == [(a, d)]
        assert R.subtract([(a, d)], [(b, c)]) == [(a, b), (c, d)]
        assert R.subtract([(a, b)], [(a, d)]) == []
        assert R.clip([(a, d)], b, c) == [(b, c)]


@pytest.mark.unit
class TestSkippedPeriods:
    def test_the_ls11_example(self):
        # Skipped 22:00-06:00. Actions 21:50, 23:00, 02:00, 06:10; entries 21:30-22:30 and 23:00-01:00.
        # Log: only 21:30-22:00 is left, 30. Series: 23:00 and 02:00 are skipped, so 21:50 and 06:10 stay
        # single actions, 5 + 5 = 10. Mixed: 21:30-22:00 covers 21:50-21:55, plus 06:10-06:15: 35.
        day2 = DAY + timedelta(days=1)
        skipped = [(at("22:00"), at("06:00", day=day2))]
        actions = [(TOMASZ, at("21:50")), (TOMASZ, at("23:00")), (TOMASZ, at("02:00", day=day2))]
        actions.append((TOMASZ, at("06:10", day=day2)))
        entries = [(TOMASZ, at("21:30"), at("22:30")), (TOMASZ, at("23:00"), at("01:00", day=day2))]

        days = R.compute(actions, entries, [DAY, day2], WARSAW, GAP, PADDING, skipped)["days"]

        totals = R.sum_rows([R.with_totals(days[day], R.SOURCE_MIXED) for day in (DAY, day2)])
        assert (totals["log_minutes"], totals["grid_minutes"], totals["result_minutes"]) == (30, 10, 35)
        assert days[DAY] == {R.SOURCE_LOG: 30, R.SOURCE_GRID: 5, R.SOURCE_MIXED: 30}
        assert days[day2] == {R.SOURCE_LOG: 0, R.SOURCE_GRID: 5, R.SOURCE_MIXED: 5}

    def test_the_padding_of_a_series_is_cut_at_the_period(self):
        # 21:58 + 5 would end at 22:03; the skipped period starts at 22:00
        project, _ = one_day(actions=[(TOMASZ, at("21:58"))], skipped=[(at("22:00"), at("23:00"))])
        assert project[R.SOURCE_GRID] == 2

    def test_a_skipped_action_does_not_join_two_series(self):
        # 10:00 and 10:20 are joined only by 10:10, which is skipped: two single actions, 5 + 5
        actions = [(TOMASZ, at("10:00")), (TOMASZ, at("10:10")), (TOMASZ, at("10:20"))]
        project, _ = one_day(actions=actions, skipped=[(at("10:08"), at("10:12"))])
        assert project[R.SOURCE_GRID] == 10

    def test_overlapping_periods_count_once(self):
        skipped = [(at("10:00"), at("10:40")), (at("10:20"), at("11:00"))]
        project, _ = one_day(entries=[(TOMASZ, at("09:30"), at("11:30"))], skipped=skipped)
        assert project[R.SOURCE_LOG] == 60
