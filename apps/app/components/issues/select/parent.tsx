import React from "react";
import { Controller, Control } from "react-hook-form";
// components
import { ParentIssuesListModal } from "components/issues";
// types
import type { IIssue } from "types";

type Props = {
  control: Control<IIssue, any>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  issues: IIssue[];
};

export const IssueParentSelect: React.FC<Props> = ({ control, isOpen, setIsOpen, issues }) => (
  <Controller
    control={control}
    name="parent"
    render={({ field: { onChange } }) => (
      <ParentIssuesListModal
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
        onChange={onChange}
      />
    )}
  />
);
