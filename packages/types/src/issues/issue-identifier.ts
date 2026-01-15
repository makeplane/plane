import type { IIssueDisplayProperties } from "../view-props";

export type TIssueIdentifierSize = "xs" | "sm" | "md" | "lg";

export type TIdentifierTextVariant = "default" | "secondary" | "tertiary" | "primary" | "primary-subtle" | "success";

export type TIssueIdentifierBaseProps = {
  projectId: string;
  size?: TIssueIdentifierSize;
  variant?: TIdentifierTextVariant;
  displayProperties?: IIssueDisplayProperties | undefined;
  enableClickToCopyIdentifier?: boolean;
};

export type TIssueIdentifierFromStore = TIssueIdentifierBaseProps & {
  issueId: string;
};

export type TIssueIdentifierWithDetails = TIssueIdentifierBaseProps & {
  issueTypeId?: string | null;
  projectIdentifier: string;
  issueSequenceId: string | number;
};

export type TIssueIdentifierProps = TIssueIdentifierFromStore | TIssueIdentifierWithDetails;

export type TIssueTypeIdentifier = {
  issueTypeId: string;
  size?: TIssueIdentifierSize;
};

export type TIdentifierTextProps = {
  identifier: string;
  enableClickToCopyIdentifier?: boolean;
  size?: TIssueIdentifierSize;
  variant?: TIdentifierTextVariant;
};
