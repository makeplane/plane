import type { TPopoverMenuPlacement } from "@plane/blocks/common";
import type { TIssue } from "@plane/types";

export interface IQuickActionProps {
  parentRef: React.RefObject<HTMLElement | null>;
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
  placements?: TPopoverMenuPlacement;
}

export type TRenderQuickActions = ({
  issue,
  parentRef,
  customActionButton,
  placement,
  portalElement,
}: {
  issue: TIssue;
  parentRef: React.RefObject<HTMLElement | null>;
  customActionButton?: React.ReactElement;
  placement?: TPopoverMenuPlacement;
  portalElement?: HTMLDivElement | null;
}) => React.ReactNode;
