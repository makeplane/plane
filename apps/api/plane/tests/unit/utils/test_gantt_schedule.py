# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, timedelta
import importlib.util
from pathlib import Path
from time import perf_counter
import unittest

# Load the pure module without plane.__init__, which initializes Celery.
spec = importlib.util.spec_from_file_location(
    "gantt_schedule", Path(__file__).resolve().parents[3] / "utils" / "gantt_schedule.py"
)
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)
find_cycle_through = engine.find_cycle_through
schedule_successors = engine.schedule_successors


def day(value):
    return date.fromisoformat(value) if value else None


def task(issue_id, start, end):
    return {"id": issue_id, "start": day(start), "end": day(end)}


def update(issue_id, old_start, old_end, new_start, new_end):
    return {
        "id": issue_id,
        "old_start": day(old_start),
        "old_end": day(old_end),
        "new_start": day(new_start),
        "new_end": day(new_end),
    }


class ScheduleSuccessorsTests(unittest.TestCase):
    def setUp(self):
        self.tasks = [
            task("A", "2026-11-01", "2026-11-03"),
            task("B", "2026-11-04", "2026-11-06"),
            task("C", "2026-11-07", "2026-11-09"),
        ]
        self.chain = [("A", "B"), ("B", "C")]
        self.change = task("A", "2026-11-01", "2026-11-05")

    def test_spec_chain_preserves_duration_and_excludes_change(self):
        self.assertEqual(
            schedule_successors(self.tasks, self.chain, self.change),
            {
                "updates": [
                    update("B", "2026-11-04", "2026-11-06", "2026-11-06", "2026-11-08"),
                    update("C", "2026-11-07", "2026-11-09", "2026-11-09", "2026-11-11"),
                ],
                "warnings": [],
                "cycle": None,
            },
        )
        self.assertEqual(self.tasks[1]["start"], day("2026-11-04"))

    def test_all_predecessors_including_outside_downstream(self):
        result = schedule_successors(
            self.tasks + [task("P", "2026-11-01", "2026-11-10")],
            self.chain + [("P", "B")],
            self.change,
        )
        self.assertEqual(
            [(item["id"], item["new_start"], item["new_end"]) for item in result["updates"]],
            [
                ("B", day("2026-11-11"), day("2026-11-13")),
                ("C", day("2026-11-14"), day("2026-11-16")),
            ],
        )

    def test_unchanged_successor_stops_propagation(self):
        self.assertEqual(
            schedule_successors(
                [self.tasks[0], task("B", "2026-11-10", "2026-11-12"), self.tasks[2]],
                self.chain,
                self.change,
            ),
            {"updates": [], "warnings": [], "cycle": None},
        )

    def test_milestone_start_only_missing_dates_and_deterministic_ties(self):
        result = schedule_successors(
            [
                self.tasks[0],
                task("B", None, "2026-11-04"),
                task("C", "2026-11-04", None),
                task("D", None, None),
                task("E", "2026-11-01", "2026-11-02"),
            ],
            [("A", "D"), ("A", "C"), ("A", "B"), ("D", "E")],
            self.change,
        )
        self.assertEqual(result, {
            "updates": [
                update("B", None, "2026-11-04", None, "2026-11-06"),
                update("C", "2026-11-04", None, "2026-11-06", None),
            ],
            "warnings": [{"id": "D", "reason": "missing_dates"}],
            "cycle": None,
        })

    def test_missing_predecessor_end_uses_remaining_predecessors(self):
        result = schedule_successors(
            self.tasks + [task("P", "2026-11-01", None)],
            self.chain + [("P", "B")],
            self.change,
        )
        self.assertEqual(result["updates"][0]["new_start"], day("2026-11-06"))
        self.assertEqual(result["warnings"], [{"id": "B", "reason": "missing_predecessor_end"}])
        self.assertEqual(
            schedule_successors(self.tasks, self.chain, task("A", "2026-11-01", None)),
            {"updates": [], "warnings": [{"id": "B", "reason": "missing_predecessor_end"}], "cycle": None},
        )

    def test_calendar_days_across_month_year_and_leap_day(self):
        for tasks, change, expected in [
            (
                [task("A", "2026-12-29", "2026-12-30"), task("B", "2026-12-31", "2027-01-02")],
                task("A", "2026-12-29", "2027-01-02"),
                "2027-01-05",
            ),
            (
                [task("A", "2028-02-27", "2028-02-27"), task("B", "2028-02-28", "2028-02-28")],
                task("A", "2028-02-27", "2028-02-28"),
                "2028-02-29",
            ),
        ]:
            with self.subTest(expected=expected):
                result = schedule_successors(tasks, [("A", "B")], change)
                self.assertEqual(result["updates"][0]["new_end"], day(expected))

    def test_cycles_even_past_unchanged_or_undated_tasks(self):
        for edges in [self.chain + [("B", "A")], self.chain + [("C", "B")]]:
            for middle in [task("B", None, None), task("B", "2026-11-10", "2026-11-12")]:
                with self.subTest(edges=edges, middle=middle):
                    result = schedule_successors([self.tasks[0], middle, self.tasks[2]], edges, self.change)
                    self.assertTrue(result["cycle"])
                    self.assertEqual(result["cycle"][0], result["cycle"][-1])
                    self.assertEqual(result["updates"], [])
                    self.assertEqual(result["warnings"], [])

    def test_never_earlier_unrelated_tasks_or_unrelated_cycles(self):
        self.assertEqual(
            schedule_successors(
                self.tasks + [task("X", None, None)],
                self.chain + [("X", "X")],
                task("A", "2026-10-30", "2026-11-01"),
            ),
            {"updates": [], "warnings": [], "cycle": None},
        )

    def test_shared_successor_uses_another_moved_predecessor(self):
        result = schedule_successors(
            [
                self.tasks[0],
                task("B", "2026-11-10", "2026-11-12"),
                task("C", "2026-11-04", "2026-11-06"),
                task("D", "2026-11-07", "2026-11-09"),
            ],
            [("A", "C"), ("A", "B"), ("B", "D"), ("C", "D")],
            self.change,
        )
        self.assertEqual(
            [(item["id"], item["new_start"]) for item in result["updates"]],
            [("C", day("2026-11-06")), ("D", day("2026-11-13"))],
        )

    def test_500_item_chain_under_one_second(self):
        tasks = [task(str(i), "2026-11-01", "2026-11-01") for i in range(500)]
        edges = [(str(i), str(i + 1)) for i in range(499)]
        start = perf_counter()
        result = schedule_successors(tasks, edges, task("0", "2026-11-01", "2026-11-05"))
        self.assertEqual(len(result["updates"]), 499)
        self.assertLess(perf_counter() - start, 1)

    def test_deep_chain_does_not_depend_on_python_recursion_limit(self):
        tasks = [task(str(i), "2026-11-01", "2026-11-01") for i in range(2001)]
        result = schedule_successors(
            tasks, [(str(i), str(i + 1)) for i in range(2000)], self.change | {"id": "0"}
        )
        self.assertEqual(len(result["updates"]), 2000)

    def test_iso_string_inputs_and_duplicate_edges(self):
        result = schedule_successors(
            [{"id": item["id"], "start": item["start"].isoformat(), "end": item["end"].isoformat()} for item in self.tasks],
            self.chain + self.chain,
            {"id": "A", "start": "2026-11-01", "end": "2026-11-05"},
        )
        self.assertEqual(result, schedule_successors(self.tasks, self.chain, self.change))


class WorkingScheduleTests(unittest.TestCase):
    def test_helpers_and_validation(self):
        c = engine.build_calendar(range(1, 6), [day("2026-11-09")])
        self.assertFalse(engine.is_working_day(day("2026-11-09"), c))
        self.assertTrue(engine.is_working_day(day("2026-11-10"), c))
        self.assertEqual(engine.next_working_day(day("2026-11-06"), c), day("2026-11-10"))
        self.assertEqual(engine.on_or_after_working(day("2026-11-07"), c), day("2026-11-10"))
        self.assertEqual(engine.on_or_after_working(day("2026-11-06"), c), day("2026-11-06"))
        self.assertEqual(engine.add_working_days(day("2026-11-10"), -1, c), day("2026-11-06"))
        self.assertEqual(engine.add_working_days(day("2026-11-07"), 0, c), day("2026-11-07"))
        self.assertEqual(engine.working_steps(day("2026-11-06"), day("2026-11-11"), c), 2)
        for weekdays in [[], [0], [8], [True], [1.0], ["1"]]:
            with self.subTest(weekdays=weekdays), self.assertRaises(ValueError):
                engine.build_calendar(weekdays, [])
        with self.assertRaises(ValueError):
            engine.build_calendar([1], ["2026-11-01"])
        for weekdays, holidays in [(None, []), ([1], None)]:
            with self.assertRaises(ValueError):
                engine.build_calendar(weekdays, holidays)
        empty = {"weekdays": set(), "holidays": set()}
        for helper, args in [
            (engine.is_working_day, (day("2026-11-01"),)),
            (engine.next_working_day, (day("2026-11-01"),)),
            (engine.on_or_after_working, (day("2026-11-01"),)),
            (engine.add_working_days, (day("2026-11-01"), 0)),
            (engine.working_steps, (day("2026-11-01"), day("2026-11-02"))),
        ]:
            with self.subTest(helper=helper), self.assertRaisesRegex(ValueError, "No working days"):
                helper(*args, empty)
        with self.assertRaisesRegex(ValueError, "No working days"):
            schedule_successors([], [], task("A", None, None), {"weekdays": set(), "holidays": set()})
        with self.assertRaises(ValueError):
            engine.add_working_days(day("2026-11-01"), 3651, c)
        with self.assertRaises(ValueError):
            engine.working_steps(day("2026-11-01"), day("2040-11-01"), c)

    def test_loop_guards_and_half_open_range(self):
        from datetime import timedelta

        start = day("2026-11-02")
        c = engine.build_calendar(range(1, 8), (start + timedelta(days=i) for i in range(3651)))
        with self.assertRaises(ValueError):
            engine.next_working_day(start, c)
        with self.assertRaises(ValueError):
            engine.on_or_after_working(start, c)
        c = engine.build_calendar(range(1, 8), [])
        self.assertEqual(engine.add_working_days(start, 3650, c), start + timedelta(days=3650))
        self.assertEqual(engine.working_steps(start, start, c), 0)
        self.assertEqual(engine.working_steps(start, start + timedelta(days=3650), c), 3650)

    def test_weekend_holiday_duration_and_partial_dates(self):
        tasks = [task("A", None, "2026-11-06"), task("B", "2026-11-05", "2026-11-10"),
                 task("C", None, "2026-11-06"), task("D", "2026-11-06", None)]
        for holidays, start, end in [([], "2026-11-09", "2026-11-12"),
                                      ([day("2026-11-09")], "2026-11-10", "2026-11-12")]:
            with self.subTest(holidays=holidays):
                result = schedule_successors(tasks, [("A", "B"), ("A", "C"), ("A", "D")], tasks[0],
                                             engine.build_calendar(range(1, 6), holidays))
                self.assertEqual(result["updates"], [
                    update("B", "2026-11-05", "2026-11-10", start, end),
                    update("C", None, "2026-11-06", None, start),
                    update("D", "2026-11-06", None, start, None),
                ])

    def test_holiday_on_weekend_moves_a_day_off_to_next_working_day(self):
        # Sat 7 and Sun 8 are holidays: Mon 9 and Tue 10 are off; a Friday holiday needs no compensation.
        cases = [(["2026-11-07"], ["2026-11-09"]), (["2026-11-07", "2026-11-08"], ["2026-11-09", "2026-11-10"]),
                 (["2026-11-07", "2026-11-09"], ["2026-11-10"]), (["2026-11-06"], [])]
        for holidays, extra in cases:
            with self.subTest(holidays=holidays):
                off = engine.build_calendar(range(1, 6), [day(h) for h in holidays])["holidays"]
                self.assertEqual(off, {day(h) for h in holidays + extra})

    def test_compensation_search_is_not_capped(self):
        mondays = [day("2026-11-09") + timedelta(weeks=i) for i in range(60)]
        off = engine.build_calendar([1], [day("2026-11-07")] + mondays)["holidays"]
        self.assertIn(day("2026-11-09") + timedelta(weeks=60), off)

    def test_lags_and_multiple_predecessors(self):
        c = engine.build_calendar(range(1, 6), [day("2026-11-09")])
        tasks = [task("A", None, "2026-11-06"), task("B", "2026-11-01", "2026-11-02")]
        for calendar, lag, expected in [(None, 2, "2026-11-09"), (None, -2, "2026-11-05"),
                                        (c, 2, "2026-11-12"), (c, -2, "2026-11-05")]:
            with self.subTest(calendar=calendar, lag=lag):
                result = schedule_successors(tasks, [("A", "B", lag)], tasks[0], calendar)
                self.assertEqual(result["updates"][0]["new_start"], day(expected))
        for calendar, expected in [(None, "2026-11-09"), (c, "2026-11-12")]:
            result = schedule_successors(tasks + [task("P", None, "2026-11-05")],
                                         [("A", "B", -1), ("P", "B", 3)], tasks[0], calendar)
            self.assertEqual(result["updates"][0]["new_start"], day(expected))

    def test_pull_earlier_with_missing_predecessor_falls_back_to_push(self):
        tasks = [task("A", None, "2026-11-06"), task("B", "2026-11-16", "2026-11-17")]
        for calendar, expected in [(None, "2026-11-07"),
                                    (engine.build_calendar(range(1, 6), []), "2026-11-09")]:
            self.assertEqual(schedule_successors(tasks, [("A", "B")], tasks[0], calendar)["updates"], [])
            result = schedule_successors(tasks, [("A", "B")], tasks[0], calendar, True)
            self.assertEqual(result["updates"][0]["new_start"], day(expected))
            result = schedule_successors(tasks + [task("P", None, None)],
                                         [("A", "B"), ("P", "B")], tasks[0], calendar, True)
            self.assertEqual(result["updates"], [])
            self.assertEqual(result["warnings"], [{"id": "B", "reason": "missing_predecessor_end"}])
            early = [tasks[0], task("B", "2026-11-01", None), task("P", None, None)]
            result = schedule_successors(early, [("A", "B"), ("P", "B")], tasks[0], calendar, True)
            self.assertEqual(result["updates"][0]["new_start"], day(expected))

    def test_working_chain_performance_and_cycle(self):
        c = engine.build_calendar(range(1, 6), [])
        tasks = [task(str(i), "2026-11-02", "2026-11-03") for i in range(500)]
        edges = [(str(i), str(i + 1), 0) for i in range(499)]
        start = perf_counter()
        result = schedule_successors(tasks, edges, tasks[0], c)
        self.assertEqual(len(result["updates"]), 499)
        self.assertLess(perf_counter() - start, 1)
        result = schedule_successors(tasks, edges + [("499", "0", 1)], tasks[0], c)
        self.assertEqual(result["updates"], [])
        self.assertEqual(result["warnings"], [])
        self.assertEqual(result["cycle"][0], result["cycle"][-1])


class FindCycleThroughTests(unittest.TestCase):
    def test_self(self):
        self.assertEqual(find_cycle_through([], "A", "A"), ["A", "A"])

    def test_direct(self):
        self.assertEqual(find_cycle_through([("A", "B")], "B", "A"), ["B", "A", "B"])

    def test_long_chain(self):
        self.assertEqual(
            find_cycle_through([("A", "B"), ("B", "C"), ("C", "D")], "D", "A"),
            ["D", "A", "B", "C", "D"],
        )

    def test_no_cycle_or_duplicate(self):
        edges = [("A", "B"), ("B", "C"), ("X", "Y"), ("Y", "X")]
        self.assertIsNone(find_cycle_through(edges, "A", "C"))
        self.assertIsNone(find_cycle_through(edges, "A", "B"))
        self.assertIsNone(find_cycle_through(edges, "C", "D"))


class DependencyTypeTests(unittest.TestCase):
    def run_one(self, dep_type, change, successor, lag=0, calendar=None):
        return schedule_successors(
            [change, successor], [("A", "B", lag, dep_type)], change, calendar
        )

    def test_start_to_start_follows_the_predecessor_start(self):
        b = task("B", "2026-11-04", "2026-11-06")
        result = self.run_one("SS", task("A", "2026-11-06", "2026-11-08"), b)
        self.assertEqual(result["updates"], [update("B", "2026-11-04", "2026-11-06", "2026-11-06", "2026-11-08")])
        result = self.run_one("SS", task("A", "2026-11-06", "2026-11-08"), b, lag=2)
        self.assertEqual(result["updates"][0]["new_start"], day("2026-11-08"))
        self.assertEqual(self.run_one("SS", task("A", "2026-11-01", "2026-11-09"), b)["updates"], [])

    def test_finish_to_finish_follows_the_predecessor_end_and_keeps_duration(self):
        b = task("B", "2026-11-04", "2026-11-06")
        result = self.run_one("FF", task("A", "2026-11-01", "2026-11-08"), b)
        self.assertEqual(result["updates"], [update("B", "2026-11-04", "2026-11-06", "2026-11-06", "2026-11-08")])
        self.assertEqual(self.run_one("FF", task("A", "2026-11-01", "2026-11-05"), b)["updates"], [])

    def test_start_to_finish_ends_the_successor_no_earlier_than_the_predecessor_start(self):
        b = task("B", "2026-11-04", "2026-11-06")
        result = self.run_one("SF", task("A", "2026-11-10", "2026-11-12"), b)
        self.assertEqual(result["updates"], [update("B", "2026-11-04", "2026-11-06", "2026-11-08", "2026-11-10")])

    def test_explicit_fs_matches_the_default(self):
        change = task("A", "2026-11-01", "2026-11-05")
        b = task("B", "2026-11-04", "2026-11-06")
        self.assertEqual(
            self.run_one("FS", change, b), schedule_successors([change, b], [("A", "B")], change)
        )

    def test_missing_dates_warn_instead_of_moving(self):
        b = task("B", "2026-11-04", "2026-11-06")
        result = self.run_one("SS", task("A", None, "2026-11-08"), b)
        self.assertEqual(result["updates"], [])
        self.assertEqual(result["warnings"], [{"id": "B", "reason": "missing_predecessor_start"}])
        result = self.run_one("FF", task("A", "2026-11-01", "2026-11-08"), task("B", "2026-11-04", None))
        self.assertEqual(result["updates"], [])
        self.assertEqual(result["warnings"], [{"id": "B", "reason": "missing_dates"}])

    def test_working_calendar_counts_working_days_for_the_end_constraint(self):
        calendar = engine.build_calendar([1, 2, 3, 4, 5], [])
        result = self.run_one(
            "FF", task("A", "2026-11-02", "2026-11-09"), task("B", "2026-11-04", "2026-11-05"), calendar=calendar
        )
        self.assertEqual(result["updates"], [update("B", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-09")])

    def test_satisfied_end_constraint_never_measures_the_duration(self):
        calendar = engine.build_calendar([1, 2, 3, 4, 5], [])
        huge = task("B", "2027-01-01", "2038-01-01")
        for dep_type in ("FF", "SF"):
            result = self.run_one(dep_type, task("A", "2026-11-02", "2026-11-03"), huge, calendar=calendar)
            self.assertEqual(result["updates"], [])

    def test_unknown_type_is_rejected(self):
        with self.assertRaises(ValueError):
            self.run_one("XX", task("A", "2026-11-01", "2026-11-05"), task("B", "2026-11-04", "2026-11-06"))


if __name__ == "__main__":
    unittest.main()
