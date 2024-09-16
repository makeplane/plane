export type TIssuePropertyAction = "created" | "updated" | "deleted";

export type TIssuePropertiesActivity = {
  id: string | undefined;
  old_value: string | undefined;
  new_value: string | undefined;
  old_identifier: string | undefined;
  new_identifier: string | undefined;

  action: TIssuePropertyAction | undefined;
  epoch: number | undefined;
  comment: string | undefined;

  issue: string | undefined;
  property: string | undefined;
  actor: string | undefined;
  project: string | undefined;
  workspace: string | undefined;

  created_at: string | undefined;
  created_by: string | undefined;
  updated_at: string | undefined;
  updated_by: string | undefined;
};
