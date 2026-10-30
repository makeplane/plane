import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { analyticsLabel, localizeAnalyticsChart } from "../components/analytics/labels.ts";

function translator(locale) {
  const root = new URL(`../../../packages/i18n/src/locales/${locale}/`, import.meta.url);
  const resources = Object.assign(
    ...["common", "workspace"].map((name) => JSON.parse(readFileSync(new URL(`${name}.json`, root), "utf8")))
  );
  return (key) => {
    const text = key.split(".").reduce((value, part) => value?.[part], resources);
    assert.equal(typeof text, "string", `Missing translation: ${locale}/${key}`);
    return text;
  };
}

test("all analytics selectors and axes have Chinese and English labels", () => {
  const values = [
    "STATES",
    "STATE_GROUPS",
    "PRIORITY",
    "LABELS",
    "ASSIGNEES",
    "ESTIMATE_POINTS",
    "CYCLES",
    "MODULES",
    "COMPLETED_AT",
    "TARGET_DATE",
    "START_DATE",
    "CREATED_AT",
    "WORK_ITEM_COUNT",
    "ESTIMATE_POINT_COUNT",
    "EPIC_WORK_ITEM_COUNT",
    "add_property",
    "add_metric",
    "yesterday",
    "last_7_days",
    "last_30_days",
    "last_3_months",
  ];
  for (const value of values) {
    assert.match(analyticsLabel(value, translator("zh-CN")), /[\u4e00-\u9fff]/);
    assert.ok(analyticsLabel(value, translator("en")));
  }
  assert.equal(analyticsLabel("PRIORITY", translator("zh-CN")), "优先级");
  assert.equal(analyticsLabel("WORK_ITEM_COUNT", translator("zh-CN")), "工作项");
});

test("priority labels change with language while IDs, counts and source remain intact", () => {
  const chart = {
    data: ["high", "low", "none", "urgent"].map((key, i) => ({ key, name: key, count: i + 1 })),
    schema: { high: "High", low: "Low" },
  };
  const original = structuredClone(chart);
  const zh = localizeAnalyticsChart(chart, "PRIORITY", "PRIORITY", translator("zh-CN"));
  assert.deepEqual(
    zh.data.map((row) => row.name),
    ["高", "低", "无", "紧急"]
  );
  assert.deepEqual(zh.schema, { high: "高", low: "低" });
  assert.deepEqual(
    zh.data.map(({ key, count }) => ({ key, count })),
    chart.data.map(({ key, count }) => ({ key, count }))
  );
  const en = localizeAnalyticsChart(chart, "PRIORITY", "PRIORITY", translator("en"));
  assert.deepEqual(
    en.data.map((row) => row.name),
    ["High", "Low", "None", "Urgent"]
  );
  assert.deepEqual(chart, original);
});

test("system state groups are translated but custom names are preserved", () => {
  const chart = {
    data: [{ key: "backlog", name: "Backlog", count: 2 }],
    schema: { completed: "Completed", cancelled: "Cancelled" },
  };
  const zh = localizeAnalyticsChart(chart, "STATE_GROUPS", "STATE_GROUPS", translator("zh-CN"));
  assert.equal(zh.data[0].name, "待规划");
  assert.deepEqual(zh.schema, { completed: "已完成", cancelled: "已取消" });
  for (const property of ["STATES", "LABELS", "ASSIGNEES", "CYCLES", "MODULES"]) {
    const custom = { data: [{ key: "high", name: "High", count: 3 }], schema: { none: "None", backlog: "Backlog" } };
    assert.deepEqual(localizeAnalyticsChart(custom, property, property, translator("zh-CN")), custom);
  }
});
