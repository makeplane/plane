#!/usr/bin/env node
// Liviere/plane fork: an invented decision register of any size, to try the decision page on (e.g. how the map
// draws 300 decisions in 20 areas). Every text is generated ("Sample decision 17"); nothing comes from a project.
//
//   node apps/web/liviere/decisions/fixtures/generate-sample.mjs --decisions 300 --areas 20 > /tmp/sample.json
//   plane-decision import -p DEMO /tmp/sample.json            # dry run, then again with --commit
//
// The output is the import file format 2 (apps/api/plane/tests/contract/api/data/decisions_sample.json):
// chains of versions, splits (one decision superseded by two), related pairs and every state.
// The tests import generateDecisions(), which returns the same register in the shape of the API.

import { argv, stdout } from "node:process";
import { fileURLToPath } from "node:url";

const KINDS = ["product", "architecture", "process", "operations"];

/** Deterministic pseudo-random numbers in [0, 1) (mulberry32). */
function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (value) => String(value).padStart(2, "0");
const day = (offset) => {
  const date = new Date(Date.UTC(2026, 0, 1 + offset));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

/** The register as import records: {areas, records}. */
function generateRecords({ decisions: count, areas: areaCount, seed }) {
  const next = random(seed);
  const pick = (items) => items[Math.floor(next() * items.length)];
  const areas = Array.from({ length: areaCount }, (_, index) => {
    const number = index + 1;
    const mechanisms = Array.from({ length: Math.floor(next() * 4) }, (__, m) => ({
      key: `obszar-${pad(number)}-m${m + 1}`,
      name: `Mechanizm ${number}.${m + 1}`,
    }));
    return { key: `obszar-${pad(number)}`, name: `Obszar przykładowy ${number}`, mechanisms };
  });
  const records = [];
  let lastSplit = null;
  for (let number = 1; number <= count; number++) {
    const area = pick(areas);
    const author = next();
    const record = {
      number,
      title: `Decyzja przykładowa ${number}`,
      rationale: `Uzasadnienie przykładowe ${number}.`,
      rejected: next() < 0.2 ? `Wariant odrzucony ${number}.` : null,
      area: area.key,
      mechanism: area.mechanisms.length && next() < 0.6 ? pick(area.mechanisms).key : null,
      area2: next() < 0.12 ? pick(areas.filter((other) => other.key !== area.key)).key : null,
      kind: pick(KINDS),
      status: "active",
      decided_by: author < 0.8 ? "user" : author < 0.95 ? "agent" : "unknown",
      confirmed: author < 0.8,
      decided_on: author < 0.95 ? day(number) : null,
      review_on: null,
      review_condition: null,
      issues: [],
      sources: [`sample:${number}`],
      supersedes: null,
      related: [],
      pending_rollout: false,
      needs_review: author >= 0.95,
      estimated: [],
      note: null,
    };
    // A new version of an earlier decision in force of the same area; now and then a second one (a split)
    const split = lastSplit && next() < 0.25 ? lastSplit : null;
    lastSplit = null;
    if (split) {
      record.supersedes = split.number;
      record.area = split.area;
    } else if (next() < 0.15) {
      const earlier = records.filter((other) => other.area === area.key && other.status === "active");
      if (earlier.length) {
        const old = pick(earlier);
        old.status = "superseded";
        record.supersedes = old.number;
        record.area = old.area;
        record.mechanism = old.mechanism;
        lastSplit = old;
      }
    }
    if (record.supersedes === null) {
      const state = next();
      if (state < 0.07) record.status = "proposed";
      else if (state < 0.15) {
        record.status = "deferred";
        if (next() < 0.5) record.review_on = day(count + number);
        else record.review_condition = `Warunek powrotu ${number}`;
      } else if (state < 0.23) record.status = "done";
      else if (state < 0.29) record.status = "revoked";
      else if (state < 0.37) record.review_on = day(300 + number);
    }
    if (record.status === "proposed") {
      record.decided_by = "agent";
      record.confirmed = false;
      record.needs_review = false;
      record.decided_on = day(number);
    }
    if (records.length && next() < 0.3) {
      const other = pick(records);
      if (!other.related.includes(number)) record.related.push(other.number);
    }
    records.push(record);
  }
  return { areas, records };
}

/** The register in the shape of the API (serialize.py): identifiers, superseded_by and symmetric related. */
export function generateDecisions(options) {
  const { areas, records } = generateRecords(options);
  const successors = new Map();
  const related = new Map(records.map((record) => [record.number, new Set()]));
  for (const record of records) {
    if (record.supersedes !== null)
      successors.set(record.supersedes, [...(successors.get(record.supersedes) ?? []), record.number]);
    for (const other of record.related) {
      related.get(record.number).add(other);
      related.get(other).add(record.number);
    }
  }
  const decisions = records.map((record) => {
    const pairs = [...related.get(record.number)];
    pairs.sort((a, b) => a - b);
    return Object.assign(structuredClone(record), {
      id: record.number,
      identifier: `DEMO-D${record.number}`,
      superseded_by: successors.get(record.number) ?? [],
      related: pairs,
      rollout: null,
      queues: [],
      created_by: null,
      created_at: "2026-11-27T10:00:00+00:00",
      updated_at: "2026-11-27T10:00:00+00:00",
    });
  });
  const apiAreas = areas.map((area, index) => ({
    id: index + 1,
    key: area.key,
    name: area.name,
    sort_order: index + 1,
    mechanisms: area.mechanisms.map((mechanism, m) => ({ id: 1000 + index * 10 + m, ...mechanism, sort_order: m + 1 })),
  }));
  return { decisions, areas: apiAreas };
}

function option(name, fallback) {
  const index = argv.indexOf(`--${name}`);
  const value = index >= 0 ? Number(argv[index + 1]) : fallback;
  if (!Number.isInteger(value) || value < 1) throw new Error(`--${name} must be a positive whole number`);
  return value;
}

if (argv[1] === fileURLToPath(import.meta.url)) {
  const options = { decisions: option("decisions", 300), areas: option("areas", 20), seed: option("seed", 7) };
  const { areas, records } = generateRecords(options);
  const file = {
    format: 2,
    sample: true,
    project: "DEMO",
    project_name: "Sample register (generated, invented data)",
    generated_on: "2026-11-27",
    areas,
    decisions: records,
  };
  stdout.write(`${JSON.stringify(file, null, 1)}\n`);
}
