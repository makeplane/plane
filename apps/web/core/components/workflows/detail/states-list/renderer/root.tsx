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

import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import type { TWorkflowRendererGraph } from "./types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { WorkflowRendererCanvas } from "./canvas";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  graph: TWorkflowRendererGraph;
};

export const WorkflowRendererModal = ({ isOpen, onClose, graph }: Props) => {
  const hasColumns = graph.columns.length > 0;

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.XXXL} position={EModalPosition.TOP}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between bg-layer-1 px-6 py-4 rounded-t-lg ">
          <h5 className="text-h5-medium">Design</h5>
          <IconButton icon={CloseIcon} onClick={onClose} size="sm" variant="ghost" />
        </div>

        {hasColumns ? (
          <WorkflowRendererCanvas graph={graph} />
        ) : (
          <div className="rounded-lg border border-subtle bg-layer-2 p-6 text-body-sm-regular text-tertiary">
            There is no workflow data to render yet.
          </div>
        )}
      </div>
    </ModalCore>
  );
};
