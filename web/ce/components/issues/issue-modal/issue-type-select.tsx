import { Control } from "react-hook-form";
// types
import { TBulkIssueProperties, TIssue } from "@plane/types";

export type TIssueFields = TIssue & TBulkIssueProperties;

export type TIssueTypeDropdownVariant = "xs" | "sm";

export type TIssueTypeSelectProps<T extends Partial<TIssueFields>> = {
  control: Control<T>;
  projectId: string | null;
  disabled?: boolean;
  variant?: TIssueTypeDropdownVariant;
  placeholder?: string;
  isRequired?: boolean;
  renderChevron?: boolean;
  dropDownContainerClassName?: string;
  showMandatoryFieldInfo?: boolean; // Show info about mandatory fields
  handleFormChange?: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const IssueTypeSelect = <T extends Partial<TIssueFields>>(props: TIssueTypeSelectProps<T>) => <></>;
