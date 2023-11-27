export interface IQuickActionProps {
  issue: IIssue;
  handleDelete: () => Promise<void>;
  handleUpdate?: (data: IIssue) => Promise<void>;
  handleRemoveFromView?: () => Promise<void>;
}
