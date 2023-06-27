import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// component
import { CreateLabelModal } from "components/labels";
// ui
import { CustomSearchSelect, Tooltip } from "components/ui";
// icons
import { PlusIcon, TagIcon } from "@heroicons/react/24/outline";
// types
import { ICurrentUserResponse, IIssue, IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  position?: "left" | "right";
  selfPositioned?: boolean;
  tooltipPosition?: "left" | "right";
  customButton?: boolean;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const ViewLabelSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  position = "left",
  selfPositioned = false,
  tooltipPosition = "right",
  user,
  isNotAllowed,
  customButton = false,
}) => {
  const [labelModal, setLabelModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: issueLabels } = useSWR<IIssueLabels[]>(
    projectId ? PROJECT_ISSUE_LABELS(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const options = issueLabels?.map((label) => ({
    value: label.id,
    query: label.name,
    content: (
      <div className="flex items-center justify-start gap-2">
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label.color,
          }}
        />
        <span>{label.name}</span>
      </div>
    ),
  }));

  const labelsLabel = (
    <Tooltip
      position={`top-${tooltipPosition}`}
      tooltipHeading="Labels"
      tooltipContent={
        issue.label_details.length > 0
          ? issue.label_details.map((label) => label.name ?? "").join(", ")
          : "No Label"
      }
    >
      <div
        className={`flex ${
          isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
        } items-center gap-2 text-brand-secondary`}
      >
        {issue.label_details.length > 0 ? (
          <>
            {issue.label_details.slice(0, 4).map((label, index) => (
              <div className={`flex h-4 w-4 rounded-full ${index ? "-ml-3.5" : ""}`}>
                <span
                  className={`h-4 w-4 flex-shrink-0 rounded-full border group-hover:bg-brand-surface-2 border-brand-base
                          `}
                  style={{
                    backgroundColor: label?.color && label.color !== "" ? label.color : "#000000",
                  }}
                />
              </div>
            ))}
            {issue.label_details.length > 4 ? <span>+{issue.label_details.length - 4}</span> : null}
          </>
        ) : (
          <>
            <TagIcon className="h-3.5 w-3.5 text-brand-secondary" />
          </>
        )}
      </div>
    </Tooltip>
  );

  const footerOption = (
    <button
      type="button"
      className="flex w-full select-none items-center rounded py-2 px-1 hover:bg-brand-surface-2"
      onClick={() => setLabelModal(true)}
    >
      <span className="flex items-center justify-start gap-1 text-brand-secondary">
        <PlusIcon className="h-4 w-4" aria-hidden="true" />
        <span>Create New Label</span>
      </span>
    </button>
  );

  return (
    <>
      {projectId && (
        <CreateLabelModal
          isOpen={labelModal}
          handleClose={() => setLabelModal(false)}
          projectId={projectId.toString()}
          user={user}
        />
      )}
      <CustomSearchSelect
        value={issue.labels}
        onChange={(data: string[]) => {
          partialUpdateIssue({ labels_list: data }, issue);
        }}
        options={options}
        {...(customButton ? { customButton: labelsLabel } : { label: labelsLabel })}
        multiple
        noChevron
        position={position}
        disabled={isNotAllowed}
        selfPositioned={selfPositioned}
        footerOption={footerOption}
        dropdownWidth="w-full min-w-[12rem]"
      />
    </>
  );
};
