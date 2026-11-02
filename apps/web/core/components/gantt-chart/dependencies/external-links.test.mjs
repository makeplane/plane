/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { extractExternalLinks } from "./external-links.ts";

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
      },
      {
        localId: "local",
        direction: "succ",
        externalId: "external",
        projectId: "other",
        sequenceId: 12,
        name: "External task",
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
