"use client";

import React from "react";
import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";
// components
// constants
// plane web providers
import { CreateUpdateEpicModalBase } from "./base";
import { EpicModalProvider } from "./provider";

export interface EpicModalProps {
  data?: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  beforeFormSubmit?: () => Promise<void>;
  onSubmit?: (res: TIssue) => Promise<void>;
  fetchIssueDetails?: boolean;
  primaryButtonText?: {
    default: string;
    loading: string;
  };
  isProjectSelectionDisabled?: boolean;
  isConversionOperation?: boolean;
}

export const CreateUpdateEpicModal: React.FC<EpicModalProps> = observer(
  (props) =>
    props.isOpen && (
      <EpicModalProvider>
        <CreateUpdateEpicModalBase {...props} />
      </EpicModalProvider>
    )
);
