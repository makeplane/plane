import { Control } from "react-hook-form";
// types
import { TIssue } from "@plane/types";

type TIssueTypeSelectProps = {
  control: Control<TIssue>;
  projectId: string | null;
  disabled?: boolean;
  handleFormChange: () => void;
};

export const IssueTypeSelect: React.FC<TIssueTypeSelectProps> = () => <></>;
