/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";

type TDuplicateWorkItemModalProps = {
  workItemId: string;
  onClose: () => void;
  isOpen: boolean;
  workspaceSlug: string;
  projectId: string;
};

export function DuplicateWorkItemModal(_props: TDuplicateWorkItemModalProps) {
  return <></>;
}
