"use client";

import { observer } from "mobx-react";

type TUpdateEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
};

export const UpdateEstimateModal: React.FC<TUpdateEstimateModal> = observer(() => <></>);
