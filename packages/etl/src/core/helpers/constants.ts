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

import type { IState } from "@plane/types";
import { E_SILO_ERROR_CODES } from "../types/error";

export const SILO_ERROR_CODES = (
  Object.entries(E_SILO_ERROR_CODES) as Array<[keyof typeof E_SILO_ERROR_CODES, string]>
).map((key) => ({
  code: key[1],
  description: key[0].toLowerCase(),
}));

export const EMPTY_PLANE_STATE: IState = {
  id: "",
  name: "No transition",
  group: "backlog",
  color: "#000000",
  default: false,
  description: "",
  project_id: "",
  sequence: 0,
  workspace_id: "",
  order: 0,
  created_by: null,
};
