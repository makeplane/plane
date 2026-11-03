/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { extractExternalLinks } from "./external-links.ts";
import { isDependencyViolated } from "./dependency-utils.ts";

const relation = {
  id: "external",
  project_id: "other",
  relation_type: "blocked_by",
  sequence_id: 12,
  name: "External task",
};

test("extracts external predecessors and inverse successors with available labels", () => {
  assert.deepEqual(
    extractExternalLinks([{ id: "local", issue_relation: [relation], issue_related: [relation] }], "project"),
    [
      {
        localId: "local",
        direction: "pred",
        externalId: "external",
        projectId: "other",
        sequenceId: 12,
        name: "External task",
        startDate: undefined,
        targetDate: undefined,
      },
      {
        localId: "local",
        direction: "succ",
        externalId: "external",
        projectId: "other",
        sequenceId: 12,
        name: "External task",
        startDate: undefined,
        targetDate: undefined,
      },
    ]
  );
});

test("ignores same-project and non-blocking relations and deduplicates each direction", () => {
  const ignored = ["blocking", "relates_to", "duplicate"].map((relation_type) => ({ ...relation, relation_type }));
  const links = extractExternalLinks(
    [
      {
        id: "local",
        issue_relation: [relation, relation, { ...relation, project_id: "project" }, ...ignored],
        issue_related: [relation, relation, ...ignored],
      },
    ],
    "project"
  );
  assert.deepEqual(
    links.map(({ direction }) => direction),
    ["pred", "succ"]
  );
  assert.deepEqual(extractExternalLinks([{ id: "empty" }], "project"), []);
  assert.equal(links[0].startDate, undefined);
  assert.equal(links[0].targetDate, undefined);
});

test("preserves external dates in both directions and null dates", () => {
  const dated = { ...relation, start_date: "2026-11-01", target_date: "2026-11-03" };
  const links = extractExternalLinks([{ id: "local", issue_relation: [dated], issue_related: [dated] }], "project");
  assert.deepEqual(
    links.map(({ startDate, targetDate }) => [startDate, targetDate]),
    [
      ["2026-11-01", "2026-11-03"],
      ["2026-11-01", "2026-11-03"],
    ]
  );
  const [undated] = extractExternalLinks(
    [{ id: "local", issue_relation: [{ ...relation, start_date: null, target_date: null }] }],
    "project"
  );
  assert.equal(undated.startDate, null);
  assert.equal(undated.targetDate, null);
});

test("external predecessor and successor violations use the correct endpoint dates", () => {
  const [pred, succ] = extractExternalLinks(
    [
      {
        id: "local",
        issue_relation: [{ ...relation, start_date: "2026-10-01", target_date: "2026-11-03" }],
        issue_related: [{ ...relation, start_date: "2026-11-10", target_date: "2026-12-01" }],
      },
    ],
    "project"
  );
  assert.equal(isDependencyViolated(pred.targetDate, "2026-11-03"), true);
  assert.equal(isDependencyViolated(pred.targetDate, "2026-11-04"), false);
  assert.equal(isDependencyViolated("2026-11-10", succ.startDate), true);
  assert.equal(isDependencyViolated("2026-11-09", succ.startDate), false);
  const [legacy] = extractExternalLinks([{ id: "local", issue_relation: [relation] }], "project");
  assert.equal(isDependencyViolated(legacy.targetDate, "2026-11-03"), false);
  assert.equal(isDependencyViolated("2026-11-10", legacy.startDate), false);
});
