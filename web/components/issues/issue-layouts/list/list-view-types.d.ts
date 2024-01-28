export interface IQuickActionProps {
  issue: TIssue;
  handleDelete: () => Promise<void>;
  handleUpdate?: (data: TIssue) => Promise<void>;
  handleRemoveFromView?: () => Promise<void>;
  customActionButton?: React.ReactElement;
  portalElement?: HTMLDivElement | null;
}
