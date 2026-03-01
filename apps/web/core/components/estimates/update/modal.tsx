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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import type { TEstimateSystemKeys, TEstimateUpdateStageKeys } from "@plane/types";
// constants
import { EEstimateUpdateStages } from "@/constants/estimates";
// local imports
import { EstimateUpdateStageOne } from "./stage-one";
import { EstimatePointEditRoot } from "../points/edit-root";
import { EstimatePointSwitchRoot } from "../points/switch/root";

type TUpdateEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
};

export const UpdateEstimateModal = observer(function UpdateEstimateModal(props: TUpdateEstimateModal) {
  // props
  const { workspaceSlug, projectId, estimateId, isOpen, handleClose } = props;
  // states
  const [estimateEditType, setEstimateEditType] = useState<TEstimateUpdateStageKeys | undefined>(undefined);
  const [estimateSystemSwitchType, setEstimateSystemSwitchType] = useState<TEstimateSystemKeys | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setEstimateEditType(undefined);
      setEstimateSystemSwitchType(undefined);
    }
  }, [isOpen]);

  const handleEstimateEditType = (type: TEstimateUpdateStageKeys) => {
    setEstimateEditType(type);
    setEstimateSystemSwitchType(undefined);
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="relative space-y-6 py-5">
        {!estimateEditType && (
          <EstimateUpdateStageOne
            estimateEditType={estimateEditType}
            handleEstimateEditType={handleEstimateEditType}
            handleClose={handleClose}
          />
        )}

        {estimateEditType && estimateId && (
          <>
            {estimateEditType === EEstimateUpdateStages.EDIT && (
              <EstimatePointEditRoot
                setEstimateEditType={setEstimateEditType}
                handleClose={handleClose}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                estimateId={estimateId}
              />
            )}
            {estimateEditType === EEstimateUpdateStages.SWITCH && (
              <EstimatePointSwitchRoot
                setEstimateEditType={setEstimateEditType}
                estimateSystemSwitchType={estimateSystemSwitchType}
                setEstimateSystemSwitchType={setEstimateSystemSwitchType}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                estimateId={estimateId}
                handleClose={handleClose}
              />
            )}
          </>
        )}
      </div>
    </ModalCore>
  );
});
