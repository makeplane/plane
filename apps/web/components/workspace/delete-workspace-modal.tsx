/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import type { IWorkspace } from "@plane/types";
// components
import { DeleteWorkspaceForm } from "@/components/workspace/delete-workspace-form";

type Props = {
  isOpen: boolean;
  data: IWorkspace | null;
  onClose: () => void;
};

export const DeleteWorkspaceModal = observer(function DeleteWorkspaceModal(props: Props) {
  const { isOpen, data, onClose } = props;

  return <DeleteWorkspaceForm data={data} isOpen={isOpen} onClose={onClose} />;
});
