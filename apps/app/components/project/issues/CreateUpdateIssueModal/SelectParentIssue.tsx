import React, { useEffect, useState } from "react";
// react hook form
import { Controller, Control } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// types
import type { IIssue, IssueResponse } from "types";
// icons
import { UserIcon } from "@heroicons/react/24/outline";
// components
import IssuesListModal from "components/project/issues/IssuesListModal";

type Props = {
  control: Control<IIssue, any>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  issues: IIssue[];
};

const SelectParent: React.FC<Props> = ({ control, isOpen, setIsOpen, issues }) => {
  return (
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
};

export default SelectParent;
