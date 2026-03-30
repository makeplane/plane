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

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane package imports
import { ModalPortal, EPortalWidth, EPortalPosition } from "@plane/propel/portal";
import type { ICycle, IModule, IProject } from "@plane/types";
import { useAnalytics } from "@/hooks/store/use-analytics";
// plane web components
import { WorkItemsModalMainContent } from "./content";
import { WorkItemsModalHeader } from "./header";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectDetails?: IProject | undefined;
  cycleDetails?: ICycle | undefined;
  moduleDetails?: IModule | undefined;
  isEpic?: boolean;
};

export const WorkItemsModal = observer(function WorkItemsModal(props: Props) {
  const { isOpen, onClose, projectDetails, moduleDetails, cycleDetails, isEpic } = props;
  const { updateIsEpic, isPeekView } = useAnalytics();
  const [fullScreen, setFullScreen] = useState(false);

  const handleClose = () => {
    setFullScreen(false);
    onClose();
  };

  useEffect(() => {
    updateIsEpic(isPeekView ? (isEpic ?? false) : false);
  }, [isEpic, updateIsEpic, isPeekView]);

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={handleClose}
      width={fullScreen ? EPortalWidth.FULL : EPortalWidth.THREE_QUARTER}
      position={EPortalPosition.RIGHT}
      fullScreen={fullScreen}
      showOverlay={false}
    >
      <div
        className={`flex h-full flex-col overflow-hidden border-subtle bg-surface-1 text-left ${
          fullScreen ? "rounded-lg border" : "border-l shadow-direction-left"
        }`}
      >
        <WorkItemsModalHeader
          fullScreen={fullScreen}
          handleClose={handleClose}
          setFullScreen={setFullScreen}
          title={projectDetails?.name ?? ""}
          cycle={cycleDetails}
          module={moduleDetails}
        />
        <WorkItemsModalMainContent
          fullScreen={fullScreen}
          projectDetails={projectDetails}
          cycleDetails={cycleDetails}
          moduleDetails={moduleDetails}
          isEpic={isEpic}
        />
      </div>
    </ModalPortal>
  );
});
