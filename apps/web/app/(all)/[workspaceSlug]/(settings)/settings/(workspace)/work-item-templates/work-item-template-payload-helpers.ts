/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TWorkItemTemplate, TWorkItemTemplatePayload } from "@plane/types";
import type { TWorkItemTemplateFormFields } from "./work-item-template-form.types";

/**
 * Prosty opis w formie tekstowej — zapis w `description_html` (jak z edytora).
 */
export function plainTextToDescriptionHtml(plain: string): string {
  if (!plain.trim()) return "<p></p>";
  const escaped = plain.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const withBreaks = escaped.split("\n").join("<br/>");
  return `<p>${withBreaks}</p>`;
}

/** Odwrotność `plainTextToDescriptionHtml` — do wypełnienia formularza przy edycji. */
export function descriptionHtmlToPlain(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n+$/g, "")
    .trim();
}

export function mapWorkItemTemplateToFormValues(template: TWorkItemTemplate): TWorkItemTemplateFormFields {
  const payload = template.payload ?? {};
  return {
    templateName: template.name,
    templateNote: template.description ?? "",
    projectId: template.project_id,
    workItemName: payload.name ?? "",
    workItemDescriptionPlain: descriptionHtmlToPlain(payload.description_html),
    type_id: payload.type_id ?? null,
    state_id: payload.state_id ?? "",
    priority: payload.priority ?? "none",
    assignee_ids: payload.assignee_ids ?? [],
    label_ids: payload.label_ids ?? [],
    cycle_id: payload.cycle_id ?? null,
    module_ids: payload.module_ids ?? null,
    estimate_point: payload.estimate_point ?? null,
    start_date: payload.start_date ?? null,
    target_date: payload.target_date ?? null,
  };
}

/**
 * Buduje payload zgodny z `TWorkItemTemplatePayload` i regułami API (pola projektowe tylko przy `project_id`).
 */
export function buildWorkItemTemplatePayloadFromFormValues(
  values: TWorkItemTemplateFormFields
): TWorkItemTemplatePayload {
  const projectId = values.projectId;
  const name = values.workItemName.trim();
  const hasProject = Boolean(projectId);

  const payload: TWorkItemTemplatePayload = {
    ...(name ? { name } : {}),
    description_html: plainTextToDescriptionHtml(values.workItemDescriptionPlain),
    priority: values.priority ?? "none",
    assignee_ids: values.assignee_ids?.length ? values.assignee_ids : [],
    type_id: values.type_id ?? null,
    estimate_point: values.estimate_point ?? null,
    start_date: values.start_date ?? null,
    target_date: values.target_date ?? null,
  };

  if (hasProject) {
    if (values.state_id) payload.state_id = values.state_id;
    payload.label_ids = values.label_ids ?? [];
    if (values.cycle_id) payload.cycle_id = values.cycle_id;
    if (values.module_ids && values.module_ids.length > 0) {
      payload.module_ids = values.module_ids;
    }
  }

  return payload;
}
