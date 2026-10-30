import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { getFilterPropertyLabel } from "../components/rich-filters/property-label.ts";

const fields = [
  "state_id",
  "state_group",
  "assignee_id",
  "priority",
  "mention_id",
  "label_id",
  "cycle_id",
  "module_id",
  "start_date",
  "target_date",
  "created_at",
  "updated_at",
];
function translator(locale) {
  const data = JSON.parse(
    readFileSync(new URL(`../../../packages/i18n/src/locales/${locale}/common.json`, import.meta.url), "utf8")
  );
  return (key) => {
    const value = key.split(".").reduce((obj, part) => obj?.[part], data);
    assert.equal(typeof value, "string", key);
    return value;
  };
}

test("all twelve built-in filter fields and the Filters button have Chinese text", () => {
  const t = translator("zh-CN");
  assert.deepEqual(
    fields.map((field) => getFilterPropertyLabel(field, "fallback", t)),
    ["状态", "状态组", "负责人", "优先级", "提及", "标签", "周期", "模块", "开始日期", "截止日期", "创建于", "更新时间"]
  );
  assert.equal(t("common.filters"), "筛选");
  const matches = fields.filter((field) => getFilterPropertyLabel(field, "", t).includes("日期"));
  assert.deepEqual(matches, ["start_date", "target_date"]);
});

test("language changes do not overwrite custom labels or field identifiers", () => {
  const en = translator("en");
  const zh = translator("zh-CN");
  assert.equal(getFilterPropertyLabel("priority", "Priority", en), "Priority");
  assert.equal(getFilterPropertyLabel("priority", "Priority", zh), "优先级");
  assert.equal(getFilterPropertyLabel("customer_field", "Customer status", zh), "Customer status");
  assert.equal(getFilterPropertyLabel("priority", "Priority", en), "Priority");
});
