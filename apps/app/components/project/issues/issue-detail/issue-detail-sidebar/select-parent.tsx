// react
import React, { useState } from "react";
// react-hook-form
import { Control, Controller, UseFormWatch } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// components
import IssuesListModal from "components/project/issues/IssuesListModal";
// icons
import { UserIcon } from "@heroicons/react/24/outline";
// types
import { IIssue } from "types";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
  issuesList: IIssue[];
  customDisplay: JSX.Element;
  watchIssue: UseFormWatch<IIssue>;
};

const SelectParent: React.FC<Props> = ({
  control,
  submitChanges,
  issuesList,
  customDisplay,
  watchIssue,
}) => {
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  const { activeProject, issues } = useUser();

  return (
    <div className="flex items-center py-2 flex-wrap">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <UserIcon className="flex-shrink-0 h-4 w-4" />
        <p>Parent</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="parent"
          render={({ field: { value, onChange } }) => (
            <IssuesListModal
              isOpen={isParentModalOpen}
              handleClose={() => setIsParentModalOpen(false)}
              onChange={(val) => {
                submitChanges({ parent: val });
                onChange(val);
              }}
              issues={issuesList}
              title="Select Parent"
              value={value}
              customDisplay={customDisplay}
            />
          )}
        />
        <button
          type="button"
          className="flex justify-between items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 w-full"
          onClick={() => setIsParentModalOpen(true)}
        >
          {watchIssue("parent") && watchIssue("parent") !== ""
            ? `${activeProject?.identifier}-${
                issues?.results.find((i) => i.id === watchIssue("parent"))?.sequence_id
              }`
            : "Select Parent"}
        </button>
      </div>
    </div>
  );
};

export default SelectParent;
