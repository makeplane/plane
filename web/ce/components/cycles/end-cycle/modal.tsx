import React from "react";

interface Props {
  isOpen: boolean;
  handleClose: () => void;
  cycleId: string;
  projectId: string;
  workspaceSlug: string;
  pendingIssues: number;
}

export const EndCycleModal: React.FC<Props> = () => <></>;
