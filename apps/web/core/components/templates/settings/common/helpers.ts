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

export const COMMON_BUTTON_CLASS_NAME = "bg-surface-1 shadow-sm rounded";
export const COMMON_ERROR_CLASS_NAME = "border border-danger";
export const COMMON_LABEL_TEXT_CLASS_NAME = "text-caption-sm-medium text-tertiary";
export const COMMON_ERROR_TEXT_CLASS_NAME = "text-caption-sm-medium text-danger-primary";

export const validateWhitespaceI18n = (value: string) => {
  if (value.trim() === "") {
    return "common.errors.required";
  }
  return undefined;
};
