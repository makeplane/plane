# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date
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


if __name__ == "__main__":
    unittest.main()
