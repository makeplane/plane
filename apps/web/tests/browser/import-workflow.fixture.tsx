/** Isolated browser fixture. All account requests are local fakes; never provisions real users. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ResearchAccountService } from "../../core/services/research/account.service";
import { ResearchUserImportPanel } from "../../core/components/research/settings/system/user-import-panel";
import type { TUserImportBatch, TUserImportRow } from "@plane/types";
// oxlint-disable-next-line import/no-unassigned-import -- fixture stylesheet
import "../../styles/globals.css";

const options = {
  profile_categories: [],
  org_units: [
    {
      id: "team",
      name: "测试小组",
      display_path: "隔离测试 / 测试小组",
      business_category: "BASIC_RESEARCH",
      unit_type: "TEAM",
    },
  ],
  advisors: [{ id: "mentor", display_name: "测试导师", email: "mentor@example.test" }],
};
let batch = {
  id: "browser-batch",
  source_filename: "浏览器隔离名单 · 189 人",
  status: "PENDING_REVIEW",
  rows_total: 189,
  rows_ok: 189,
  rows_pending: 0,
  rows_error: 0,
  rows: Array.from({ length: 189 }, (_, index) => ({
    id: `row-${index}`,
    row_number: index + 1,
    display_name: `测试学生 ${index + 1}`,
    email: `student-${index + 1}@example.test`,
    student_no: `S${index}`,
    status: "OK",
    review_decision: "PENDING",
    category: "STUDENT",
    org_unit: "team",
    group_label: "隔离测试 / 测试小组",
    advisor_name: "测试导师",
    primary_advisor_email: "mentor@example.test",
    phone: "",
    grade: "",
    degree: "",
    business_category: "BASIC_RESEARCH",
    co_advisor_1_name: "",
    co_advisor_1_email: "",
    co_advisor_2_name: "",
    co_advisor_2_email: "",
    review_note: "",
  })),
} as TUserImportBatch;
const clone = () => structuredClone(batch);
const api = ResearchAccountService.prototype;
api.getAccountProvisioningOptions = async () => options as never;
api.getUserImports = async () => ({ results: [clone()], count: 1 });
api.getUserImport = async () => clone();
api.updateUserImportRow = async (_workspace, _batch, id, payload) => {
  const row = batch.rows!.find((item) => item.id === id)!;
  Object.assign(row, payload, { review_decision: payload.review_decision || "PENDING" });
  return { ...batch.rows!.find((item) => item.id === id), batch_detail: clone() };
};
api.bulkUpdateUserImportRows = async (_workspace, _batch, ids, decision) => {
  batch.rows!.forEach((row) => {
    if (ids.includes(row.id!)) row.review_decision = decision;
  });
  return { updated: ids.length, batch: clone() };
};
api.previewUserImport = async () => ({
  token: "fixture-token",
  included: batch
    .rows!.filter((row) => row.review_decision === "INCLUDED")
    .map((row) => ({
      id: row.id!,
      name: row.display_name,
      email: row.email,
      category: row.category,
      org_unit: "team",
      org_path: row.group_label,
      account_action: "CREATE",
      advisors: [
        {
          name: row.advisor_name,
          email: row.primary_advisor_email,
          primary: true,
          membership_action: "CREATE",
          binding_action: "CREATE",
        },
      ],
    })),
  excluded: [],
  advisors: [],
  blockers: [],
});
api.approveUserImport = async (_workspace, _batch, token) => {
  if (token !== "fixture-token") throw new Error("Invalid preview");
  batch = { ...batch, status: "IMPORTED" };
  return clone();
};
api.createSingleImport = async (_workspace, payload) => {
  batch = {
    ...batch,
    id: "single-browser-batch",
    source_filename: "单条录入 · 浏览器测试",
    status: "PENDING_REVIEW",
    rows_total: 1,
    rows_ok: 1,
    rows: [{ ...batch.rows![0], ...payload, id: "single-row", review_decision: "PENDING" } as TUserImportRow],
  };
  return clone();
};
createRoot(document.getElementById("root")!).render(
  <main className="bg-surface-1 p-4 text-primary">
    <ResearchUserImportPanel workspaceSlug="isolated-test" />
  </main>
);
