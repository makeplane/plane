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
import type { TJsonUISpec } from "@plane/types";
import { isObject } from "./common";

export const isValidJsonUISpec = (jsonString: string) => {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    // Validate that the parsed JSON has the expected spec shape
    if (
      isObject(parsed) &&
      "root" in parsed &&
      "elements" in parsed &&
      typeof parsed.root === "string" &&
      isObject(parsed.elements)
    ) {
      return parsed as TJsonUISpec;
    }
    return null;
  } catch {
    return null;
  }
};
