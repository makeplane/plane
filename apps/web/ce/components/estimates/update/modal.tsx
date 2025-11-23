import type { FC } from "react";
import { observer } from "mobx-react";

type TUpdateEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
};

export const UpdateEstimateModal = observer(function UpdateEstimateModal(_props: TUpdateEstimateModal) {
  return <></>;
});
