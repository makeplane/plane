/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IWorkspace } from "@plane/types";

type TDeleteWorkspace = {
  workspace: IWorkspace | null;
};

// Hidden: "Delete this workspace" section is disabled in this build
export const DeleteWorkspaceSection = (_props: TDeleteWorkspace) => null;
