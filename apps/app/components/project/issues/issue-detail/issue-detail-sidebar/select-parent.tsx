// react
import React, { useState } from "react";
// swr
import useSWR from "swr";
// react-hook-form
import { Control, Controller, UseFormWatch } from "react-hook-form";
// fetch keys
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
// components
import IssuesListModal from "components/project/issues/issues-list-modal";
// icons
import { UserIcon } from "@heroicons/react/24/outline";
// types
import { IIssue } from "types";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
  issuesList: IIssue[];
  customDisplay: JSX.Element;
  watch: UseFormWatch<IIssue>;
};

const SelectParent: React.FC<Props> = ({
  control,
  submitChanges,
  issuesList,
  customDisplay,
  watch,
}) => {
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  const { activeProject, activeWorkspace } = useUser();

  const { data: issues } = useSWR(
    activeWorkspace && activeProject
      ? PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id)
      : null,
    activeWorkspace && activeProject
      ? () => issuesServices.getIssues(activeWorkspace.slug, activeProject.id)
      : null
  );

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <UserIcon className="h-4 w-4 flex-shrink-0" />
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
          className="flex w-full cursor-pointer items-center justify-between gap-1 rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          onClick={() => setIsParentModalOpen(true)}
        >
          {watch("parent") && watch("parent") !== ""
            ? `${activeProject?.identifier}-${
                issues?.results.find((i) => i.id === watch("parent"))?.sequence_id
              }`
            : "Select issue"}
        </button>
      </div>
    </div>
  );
};

export default SelectParent;
