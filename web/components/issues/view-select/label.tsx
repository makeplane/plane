import { useState, FC } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { IssueLabelService } from "services/issue";
// component
import { CreateLabelModal } from "components/labels";
// ui
import { CustomSearchSelect } from "components/ui";
import { Tooltip } from "@plane/ui";
// icons
import { PlusIcon, TagIcon } from "@heroicons/react/24/outline";
// types
import { IUser, IIssue, IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  position?: "left" | "right";
  selfPositioned?: boolean;
  tooltipPosition?: "top" | "bottom";
  customButton?: boolean;
  user: IUser | undefined;
  isNotAllowed: boolean;
};

const issueLabelStore = new IssueLabelService();

export const ViewLabelSelect: FC<Props> = ({
  issue,
  partialUpdateIssue,
  // position = "left",
  // selfPositioned = false,
  tooltipPosition = "top",
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
      ? () => issueLabelStore.getProjectIssueLabels(workspaceSlug as string, projectId as string)
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
      position={tooltipPosition}
      tooltipHeading="Labels"
      tooltipContent={
        issue.labels.length > 0
          ? issue.labels
              .map((labelId) => {
                const label = issueLabels?.find((l) => l.id === labelId);

                return label?.name ?? "";
              })
              .join(", ")
          : "No label"
      }
    >
      <div
        className={`flex ${
          isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
        } items-center gap-2 text-custom-text-200`}
      >
        {issue.labels.length > 0 ? (
          <>
            {issue.labels.slice(0, 4).map((labelId, index) => {
              const label = issueLabels?.find((l) => l.id === labelId);

              return (
                <div className={`flex h-4 w-4 rounded-full ${index ? "-ml-3.5" : ""}`}>
                  <span
                    className={`h-4 w-4 flex-shrink-0 rounded-full border group-hover:bg-custom-background-80 border-custom-border-200`}
                    style={{
                      backgroundColor: label?.color ?? "#000000",
                    }}
                  />
                </div>
              );
            })}
            {issue.labels.length > 4 ? <span>+{issue.labels.length - 4}</span> : null}
          </>
        ) : (
          <>
            <TagIcon className="h-3.5 w-3.5 text-custom-text-200" />
          </>
        )}
      </div>
    </Tooltip>
  );

  const footerOption = (
    <button
      type="button"
      className="flex w-full select-none items-center rounded py-2 px-1 hover:bg-custom-background-80"
      onClick={() => setLabelModal(true)}
    >
      <span className="flex items-center justify-start gap-1 text-custom-text-200">
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
        disabled={isNotAllowed}
        footerOption={footerOption}
        width="w-full min-w-[12rem]"
      />
    </>
  );
};
