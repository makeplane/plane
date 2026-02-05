export type TIssueType = {
  id: string;
  name: string;
  description: string;
  logo_props: Record<string, any>;
  is_default: boolean;
  is_active: boolean;
};
