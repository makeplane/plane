"use client";
import type { FC } from "react";
import React from "react";
import type { TIssue } from "@plane/types";

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
}

export const CreateUpdateEpicModal: FC<EpicModalProps> = (props) => <></>;
