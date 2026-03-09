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

export function isCustomPropertyField(value: string) {
  return value.startsWith("customproperty_");
}

export function extractCustomPropertyFieldId(value: string) {
  if (!isCustomPropertyField(value)) {
    return value;
  }
  const parts = value.split("_");
  if (parts.length < 2) {
    return value;
  } else {
    return parts.slice(1).join("_");
  }
}
