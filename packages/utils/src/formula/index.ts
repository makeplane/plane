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

// Analyzer exports
export { extractFieldReferences } from "./analyzer/field-extractor";
export { detectCircularReference } from "./analyzer/circular-detector";

// Display name converter exports
export { convertDisplayNamesToIds, convertIdsToDisplayNames } from "./display-to-id-converter";

// Error parsing exports
export { parseApiError } from "./parse-error";

// Constants exports
export {
  createDisplayNamePattern,
  createPropertyIdPattern,
  createSyntaxHighlightPattern,
  WORD_AFTER_OPERATOR_PATTERN,
  INSIDE_BRACKETS_PATTERN,
} from "./constants";
