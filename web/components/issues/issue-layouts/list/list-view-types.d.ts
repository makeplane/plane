import { TIssue } from "@plane/types";

export interface IQuickActionProps {
  issue: TIssue;
  handleDelete: () => Promise<void>;
  handleUpdate?: (data: TIssue) => Promise<void>;
  handleRemoveFromView?: () => Promise<void>;
  handleArchive?: () => Promise<void>;
  handleRestore?: () => Promise<void>;
  customActionButton?: React.ReactElement;
  portalElement?: HTMLDivElement | null;
  readOnly?: boolean;
}
