"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { IWorkspace } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { DeleteWorkspaceForm } from "@/components/workspace/delete-workspace-form";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// local imports
import { CancelTrial } from "./cancel-trial";

type Props = {
  isOpen: boolean;
  data: IWorkspace | null;
  onClose: () => void;
};

export const DeleteWorkspaceModal: React.FC<Props> = observer((props) => {
  const { isOpen, data, onClose } = props;
  // store hooks
  const { getIsInTrialPeriod } = useWorkspaceSubscription();
  // derived values
  const isInTrialPeriod = getIsInTrialPeriod(false);

  return (
    <ModalCore isOpen={isOpen} handleClose={() => onClose()} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      {isInTrialPeriod ? (
        <CancelTrial setActiveSubscriptionModal={onClose} />
      ) : (
        <DeleteWorkspaceForm data={data} onClose={onClose} />
      )}
    </ModalCore>
  );
});
