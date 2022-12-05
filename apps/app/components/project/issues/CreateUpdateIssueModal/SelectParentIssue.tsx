import React, { useState } from "react";
// react hook form
import { Controller, Control } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// types
import type { IIssue } from "types";
// icons
import { UserIcon } from "@heroicons/react/24/outline";
// components
import IssuesListModal from "components/project/issues/IssuesListModal";

type Props = {
  control: Control<IIssue, any>;
};

const SelectParent: React.FC<Props> = ({ control }) => {
  const [isIssueListModalOpen, setIsIssueListModalOpen] = useState(false);

  const { issues } = useUser();

  return (
    <Controller
      control={control}
      name="parent"
      render={({ field: { value, onChange } }) => (
        <>
          <IssuesListModal
            isOpen={isIssueListModalOpen}
            handleClose={() => setIsIssueListModalOpen(false)}
            onChange={onChange}
            issues={issues}
          />
          <button
            type="button"
            className="p-2 text-left text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap"
            onClick={() => setIsIssueListModalOpen(true)}
          >
            {value ? issues?.results.find((i) => i.id === value)?.name : "Select Parent Issue"}
          </button>
        </>
      )}
    />
  );
};

export default SelectParent;
