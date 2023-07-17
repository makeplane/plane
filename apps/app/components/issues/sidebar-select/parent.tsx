import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

import { Control, Controller, UseFormWatch } from "react-hook-form";
// fetch keys
import { UserIcon } from "@heroicons/react/24/outline";
// services
import issuesServices from "services/issues.service";
// components
import { ParentIssuesListModal } from "components/issues";
// icons
// types
import { IIssue, UserAuth } from "types";
// fetch-keys
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
  customDisplay: JSX.Element;
  watch: UseFormWatch<IIssue>;
  userAuth: UserAuth;
  disabled?: boolean;
};

export const SidebarParentSelect: React.FC<Props> = ({
  control,
  submitChanges,
  customDisplay,
  watch,
  userAuth,
  disabled = false,
}) => {
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || disabled;

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
        <UserIcon className="h-4 w-4 flex-shrink-0" />
        <p>Parent</p>
      </div>
      <div className="sm:basis-1/2">
        <Controller
          control={control}
          name="parent"
          render={({ field: { value, onChange } }) => (
            <ParentIssuesListModal
              isOpen={isParentModalOpen}
              handleClose={() => setIsParentModalOpen(false)}
              onChange={(val) => {
                submitChanges({ parent: val });
                onChange(val);
              }}
              issueId={issueId as string}
              value={value}
              customDisplay={customDisplay}
            />
          )}
        />
        <button
          type="button"
          className={`flex w-full ${
            isNotAllowed ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-80"
          } items-center justify-between gap-1 rounded-md border border-custom-border-200 px-2 py-1 text-xs shadow-sm duration-300 focus:outline-none`}
          onClick={() => setIsParentModalOpen(true)}
          disabled={isNotAllowed}
        >
          {watch("parent") && watch("parent") !== "" ? (
            `${issues?.find((i) => i.id === watch("parent"))?.project_detail?.identifier}-${
              issues?.find((i) => i.id === watch("parent"))?.sequence_id
            }`
          ) : (
            <span className="text-custom-text-200">Select issue</span>
          )}
        </button>
      </div>
    </div>
  );
};
