// Liviere/plane fork: the texts of the decision register page. Run: node --test apps/web/liviere/decisions/
// Both languages have the same keys under `liviere`, and every key the page code names exists.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { DECISION_EVENT_KINDS, DECISION_FIELDS, DECISION_KINDS, DECISION_QUEUES, DECISION_STATUSES } from "./types.ts";
import { CARD_ACTIONS, ERROR_CODES_WITH_TEXT, STATUS_FILTERS } from "./model.ts";

const here = dirname(fileURLToPath(import.meta.url));
const locales = join(here, "../../../../packages/i18n/src/locales");
const load = (language) => JSON.parse(readFileSync(join(locales, language, "liviere.json"), "utf8"));

const flatten = (node, prefix = "") =>
  Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === "object" ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

const pl = new Set(flatten(load("pl")));
const en = new Set(flatten(load("en")));

test("pl and en have the same keys", () => {
  assert.deepEqual(
    [...pl].filter((key) => !en.has(key)),
    []
  );
  assert.deepEqual(
    [...en].filter((key) => !pl.has(key)),
    []
  );
});

test("every literal key of the page code exists", () => {
  const files = readdirSync(here).filter((name) => /\.tsx?$/.test(name));
  files.push("../navigation.ts");
  const keys = new Set();
  for (const name of files)
    for (const match of readFileSync(join(here, name), "utf8").matchAll(/["`](liviere\.decisions\.[a-z0-9_.]+)["`]/g))
      keys.add(match[1]);
  assert.ok(keys.size > 30, `found only ${keys.size} keys`);
  assert.deepEqual(
    [...keys].filter((key) => !pl.has(key)),
    []
  );
});

test("keys built from values exist", () => {
  const families = {
    status: DECISION_STATUSES,
    kinds: DECISION_KINDS,
    author: ["user", "agent", "unknown"],
    status_filter: STATUS_FILTERS,
    events: DECISION_EVENT_KINDS,
    fields: DECISION_FIELDS,
    channel: ["app", "api"],
    badges: ["review", "return"],
    queues: DECISION_QUEUES,
    actions: CARD_ACTIONS,
    errors: ERROR_CODES_WITH_TEXT,
    "dialogs.defer": ["title", "description", "submit", "date"],
    "dialogs.review": ["title", "description", "submit", "date"],
    "dialogs.postpone": ["title", "description", "submit"],
    "dialogs.revoke": ["title", "description", "submit"],
    "dialogs.reject": ["title", "description", "submit"],
    "unavailable.no_access": ["title", "description"],
    "unavailable.disabled": ["title", "description"],
    "unavailable.error": ["title", "description"],
  };
  const missing = Object.entries(families).flatMap(([family, values]) =>
    values.map((value) => `liviere.decisions.${family}.${value}`).filter((key) => !pl.has(key))
  );
  assert.deepEqual(missing, []);
});
