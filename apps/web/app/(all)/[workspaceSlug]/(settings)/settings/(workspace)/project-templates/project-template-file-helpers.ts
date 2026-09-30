/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TProjectTemplate, TProjectTemplatePayload } from "@plane/types";
import { downloadBlob } from "@/helpers/project-csv-helpers";

export const MAX_TEMPLATE_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export type TProjectTemplateFile = {
  name: string;
  description: string;
  payload: TProjectTemplatePayload;
};

export class ProjectTemplateFileError extends Error {}

const toFileStem = (name: string) => {
  const stem = name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return stem.slice(0, 80) || "project-template";
};

export const isValidTemplateFile = (file: File): boolean => file.name.toLowerCase().endsWith(".json");

export const downloadTemplateAsJson = (template: TProjectTemplate): void => {
  const content: TProjectTemplateFile = {
    name: template.name,
    description: template.description ?? "",
    payload: template.payload ?? {},
  };
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `${toFileStem(template.name)}.json`);
};

export const readTemplateFromJson = async (file: File): Promise<TProjectTemplateFile> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new ProjectTemplateFileError("invalid_json");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ProjectTemplateFileError("not_a_template");
  }

  const candidate = parsed as Partial<TProjectTemplateFile>;
  const payload = candidate.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ProjectTemplateFileError("not_a_template");
  }

  return {
    name: typeof candidate.name === "string" ? candidate.name.trim() : "",
    description: typeof candidate.description === "string" ? candidate.description : "",
    payload: payload as TProjectTemplatePayload,
  };
};

/**
 * Template names are unique per workspace, so a name already in use gets a numeric suffix
 * instead of failing the upload.
 */
export const buildUniqueTemplateName = (desired: string, existingNames: string[]): string => {
  const base = desired.trim().slice(0, 255) || "Imported template";
  const taken = new Set(existingNames.map((name) => name.trim()));
  if (!taken.has(base)) return base;

  for (let index = 2; index < 1000; index++) {
    const suffix = ` (${index})`;
    const candidate = `${base.slice(0, 255 - suffix.length)}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new ProjectTemplateFileError("name_taken");
};
