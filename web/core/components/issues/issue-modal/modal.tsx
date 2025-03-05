"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuesStoreType } from "@plane/constants";
import type { TIssue } from "@plane/types";
// components
import { CreateUpdateIssueModalBase } from "@/components/issues";
// plane web imports
import { IssueModalProvider } from "@/plane-web/components/issues";

export interface IssuesModalProps {
  data?: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  beforeFormSubmit?: () => Promise<void>;
  onSubmit?: (res: TIssue) => Promise<void>;
  withDraftIssueWrapper?: boolean;
  storeType?: EIssuesStoreType;
  isDraft?: boolean;
  fetchIssueDetails?: boolean;
  moveToIssue?: boolean;
  modalTitle?: string;
  primaryButtonText?: {
    default: string;
    loading: string;
  };
  isProjectSelectionDisabled?: boolean;
  templateId?: string;
}

export const CreateUpdateIssueModal: React.FC<IssuesModalProps> = observer(
  (props) =>
    props.isOpen && (
      <IssueModalProvider templateId={props.templateId}>
        <CreateUpdateIssueModalBase {...props} />
      </IssueModalProvider>
    )
);
