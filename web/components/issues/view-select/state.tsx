import { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
import trackEventServices from "services/track-event.service";
// ui
import { CustomSearchSelect, Tooltip } from "components/ui";
// icons
import { getStateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { ICurrentUserResponse, IIssue } from "types";
// fetch-keys
import { STATES_LIST } from "constants/fetch-keys";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  position?: "left" | "right";
  tooltipPosition?: "top" | "bottom";
  className?: string;
  selfPositioned?: boolean;
  customButton?: boolean;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const ViewStateSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  position = "left",
  tooltipPosition = "top",
  className = "",
  selfPositioned = false,
  customButton = false,
  user,
  isNotAllowed,
}) => {
  const [fetchStates, setFetchStates] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && issue && fetchStates ? STATES_LIST(issue.project) : null,
    workspaceSlug && issue && fetchStates
      ? () => stateService.getStates(workspaceSlug as string, issue.project)
      : null
  );
  const states = getStatesList(stateGroups);

  const options = states?.map((state) => ({
    value: state.id,
    query: state.name,
    content: (
      <div className="flex items-center gap-2">
        {getStateGroupIcon(state.group, "16", "16", state.color)}
        {state.name}
      </div>
    ),
  }));

  const selectedOption = issue.state_detail;

  const stateLabel = (
    <Tooltip
      tooltipHeading="State"
      tooltipContent={selectedOption?.name ?? ""}
      position={tooltipPosition}
    >
      <div className="flex items-center cursor-pointer w-full gap-2 text-custom-text-200">
        <span className="h-3.5 w-3.5">
          {selectedOption &&
            getStateGroupIcon(selectedOption.group, "14", "14", selectedOption.color)}
        </span>
        <span className="truncate">{selectedOption?.name ?? "State"}</span>
      </div>
    </Tooltip>
  );

  return (
    <CustomSearchSelect
      className={className}
      value={issue.state}
      onChange={(data: string) => {
        const oldState = states?.find((s) => s.id === issue.state);
        const newState = states?.find((s) => s.id === data);

        partialUpdateIssue(
          {
            state: data,
            state_detail: newState,
          },
          issue
        );
        trackEventServices.trackIssuePartialPropertyUpdateEvent(
          {
            workspaceSlug,
            workspaceId: issue.workspace,
            projectId: issue.project_detail.id,
            projectIdentifier: issue.project_detail.identifier,
            projectName: issue.project_detail.name,
            issueId: issue.id,
          },
          "ISSUE_PROPERTY_UPDATE_STATE",
          user
        );

        if (oldState?.group !== "completed" && newState?.group !== "completed") {
          trackEventServices.trackIssueMarkedAsDoneEvent(
            {
              workspaceSlug: issue.workspace_detail.slug,
              workspaceId: issue.workspace_detail.id,
              projectId: issue.project_detail.id,
              projectIdentifier: issue.project_detail.identifier,
              projectName: issue.project_detail.name,
              issueId: issue.id,
            },
            user
          );
        }
      }}
      options={options}
      {...(customButton ? { customButton: stateLabel } : { label: stateLabel })}
      position={position}
      disabled={isNotAllowed}
      onOpen={() => setFetchStates(true)}
      noChevron
      selfPositioned={selfPositioned}
    />
  );
};
