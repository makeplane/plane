import React from "react";
// react hook form
import { Controller, Control } from "react-hook-form";
// hooks
// components
import IssuesListModal from "components/project/issues/issues-list-modal";
// types
import type { IIssue } from "types";
// icons

type Props = {
  control: Control<IIssue, any>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  issues: IIssue[];
};

const SelectParent: React.FC<Props> = ({ control, isOpen, setIsOpen, issues }) => (
  <Controller
    control={control}
    name="parent"
    render={({ field: { value, onChange } }) => (
      <IssuesListModal
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
        onChange={onChange}
        issues={issues}
      />
    )}
  />
);

export default SelectParent;
