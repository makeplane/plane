import { observer } from "mobx-react";

export type TWorkflowDisabledOverlayProps = {
  messageContainerRef: React.RefObject<HTMLDivElement>;
  workflowDisabledSource: string;
  shouldOverlayBeVisible: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const WorkFlowDisabledOverlay = observer((props: TWorkflowDisabledOverlayProps) => <></>);
