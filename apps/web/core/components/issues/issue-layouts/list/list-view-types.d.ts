import { Placement } from "@popperjs/core";
import { TIssue } from "@plane/types";

export interface IQuickActionProps {
  parentRef: React.RefObject<HTMLElement>;
  issue: TIssue;
  handleDelete: () => Promise<void>;
  handleUpdate?: (data: TIssue) => Promise<void>;
  handleRemoveFromView?: () => Promise<void>;
  handleArchive?: () => Promise<void>;
  handleRestore?: () => Promise<void>;
  handleMoveToIssues?: () => Promise<void>;
  customActionButton?: React.ReactElement;
  portalElement?: HTMLDivElement | null;
  readOnly?: boolean;
  placements?: Placement;
}

export type TRenderQuickActions = ({
  issue,
  parentRef,
  customActionButton,
  placement,
  portalElement,
}: {
  issue: TIssue;
  parentRef: React.RefObject<HTMLElement>;
  customActionButton?: React.ReactElement;
  placement?: Placement;
  portalElement?: HTMLDivElement | null;
}) => React.ReactNode;
