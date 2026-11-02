# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Calendar-day Finish-to-Start scheduling without framework dependencies."""

from collections import deque
from datetime import date, timedelta
from heapq import heapify, heappop, heappush


def find_cycle_through(dependencies, predecessor_id, successor_id):
    """Return the cycle closed by predecessor -> successor, if any."""
    if predecessor_id == successor_id:
        return [predecessor_id, predecessor_id]

    outgoing = {}
    for predecessor, successor in dependencies:
        outgoing.setdefault(predecessor, {})[successor] = None

    parents = {successor_id: None}
    pending = deque([successor_id])
    while pending:
        issue_id = pending.popleft()
        for next_id in outgoing.get(issue_id, {}):
            if next_id in parents:
                continue
            parents[next_id] = issue_id
            if next_id == predecessor_id:
                path = [next_id]
                while path[-1] != successor_id:
                    path.append(parents[path[-1]])
                return [predecessor_id] + list(reversed(path))
            pending.append(next_id)
    return None


def schedule_successors(tasks, dependencies, change):
    """Push reachable successors later, preserving duration and missing dates."""
    current = {}
    for task in [*tasks, change]:
        current[task["id"]] = {
            "start": date.fromisoformat(task["start"]) if isinstance(task["start"], str) else task["start"],
            "end": date.fromisoformat(task["end"]) if isinstance(task["end"], str) else task["end"],
        }

    outgoing = {}
    incoming = {}
    for predecessor, successor in dependencies:
        outgoing.setdefault(predecessor, {})[successor] = None
        incoming.setdefault(successor, {})[predecessor] = None

    visited = set()
    path = [change["id"]]
    visiting = {change["id"]: 0}
    stack = [iter(outgoing.get(change["id"], {}))]
    # Iterative DFS also handles chains longer than Python's recursion limit.
    while stack:
        next_id = next(stack[-1], None)
        if next_id is None:
            visited.add(path[-1])
            del visiting[path.pop()]
            stack.pop()
        elif next_id in visiting:
            return {"updates": [], "warnings": [], "cycle": path[visiting[next_id]:] + [next_id]}
        elif next_id not in visited:
            visiting[next_id] = len(path)
            path.append(next_id)
            stack.append(iter(outgoing.get(next_id, {})))

    indegree = {
        issue_id: sum(predecessor in visited for predecessor in incoming.get(issue_id, {}))
        for issue_id in visited
    }
    ready = [issue_id for issue_id, degree in indegree.items() if degree == 0]
    heapify(ready)
    moved = {change["id"]}
    updates = []
    warnings = []
    while ready:
        issue_id = heappop(ready)
        task = current.get(issue_id)
        predecessors = incoming.get(issue_id, {})
        if issue_id != change["id"] and task and any(pred in moved for pred in predecessors):
            if task["start"] is None and task["end"] is None:
                warnings.append({"id": issue_id, "reason": "missing_dates"})
            else:
                earliest = None
                missing_end = False
                for predecessor in predecessors:
                    end = current.get(predecessor, {}).get("end")
                    if end is None:
                        missing_end = True
                        continue
                    next_day = end + timedelta(days=1)
                    if earliest is None or next_day > earliest:
                        earliest = next_day
                if missing_end:
                    warnings.append({"id": issue_id, "reason": "missing_predecessor_end"})
                old_date = task["start"] or task["end"]
                if earliest is not None and old_date < earliest:
                    new_start = earliest if task["start"] is not None else None
                    new_end = None
                    if task["end"] is not None:
                        new_end = task["end"] + (earliest - task["start"]) if task["start"] is not None else earliest
                    updates.append({
                        "id": issue_id,
                        "old_start": task["start"],
                        "old_end": task["end"],
                        "new_start": new_start,
                        "new_end": new_end,
                    })
                    current[issue_id] = {"start": new_start, "end": new_end}
                    moved.add(issue_id)
        for next_id in outgoing.get(issue_id, {}):
            indegree[next_id] -= 1
            if indegree[next_id] == 0:
                heappush(ready, next_id)

    return {"updates": updates, "warnings": warnings, "cycle": None}
