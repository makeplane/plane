"use client";

import React from "react";
import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";
// components
import { CreateUpdateIssueModalBase } from "@/components/issues";
// constants
import { EIssuesStoreType } from "@/constants/issue";
// plane web providers
import { IssueModalProvider } from "@/plane-web/components/issues";

export interface IssuesModalProps {
  data?: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (res: TIssue) => Promise<void>;
  withDraftIssueWrapper?: boolean;
  storeType?: EIssuesStoreType;
  isDraft?: boolean;
  fetchIssueDetails?: boolean;
}

export const CreateUpdateIssueModal: React.FC<IssuesModalProps> = observer(
  (props) =>
    props.isOpen && (
      <IssueModalProvider>
        <CreateUpdateIssueModalBase {...props} />
      </IssueModalProvider>
    )
);
