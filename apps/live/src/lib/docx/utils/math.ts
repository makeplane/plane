/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { mathJaxReady, convertLatex2Math } from "@hungknguyen/docx-math-converter";
import { ImportedXmlComponent } from "docx";
import { logger } from "@plane/logger";

let initPromise: Promise<void> | null = null;

export const ensureMathJaxReady = (): Promise<void> => {
  if (!initPromise) {
    initPromise = mathJaxReady()
      .then(() => undefined)
      .catch((err) => {
        logger.error("DOCX: Failed to initialize MathJax", err);
        initPromise = null;
      });
  }
  return initPromise;
};

/**
 * The `@hungknguyen/docx-math-converter` imports `docx` via CJS while
 * this app uses ESM, causing the dual-package hazard: the converter's
 * `XmlComponent` class is a different instance than the one the `docx`
 * Packer uses for serialization. The result is `<rootKey>m:oMath</rootKey>`
 * instead of `<m:oMath>…</m:oMath>`, which breaks Word.
 *
 * Fix: recursively rebuild the tree using our own `XmlComponent`.
 */
const rebuildXmlComponent = (node: unknown): ImportedXmlComponent | string | null => {
  if (typeof node === "string") return node;
  if (node === null || node === undefined) return null;

  const n = node as { rootKey?: string; root?: unknown[] };
  if (!n.rootKey) return null;

  const component = new ImportedXmlComponent(n.rootKey);
  if (Array.isArray(n.root)) {
    for (const child of n.root) {
      const rebuilt = rebuildXmlComponent(child);
      if (rebuilt !== null) {
        component.push(rebuilt as ImportedXmlComponent | string);
      }
    }
  }
  return component;
};

export const latexToMath = (latex: string): ImportedXmlComponent | null => {
  if (!initPromise || !latex) return null;
  try {
    const raw = convertLatex2Math(latex);
    if (!raw) return null;
    const rebuilt = rebuildXmlComponent(raw);
    return rebuilt instanceof ImportedXmlComponent ? rebuilt : null;
  } catch {
    return null;
  }
};
