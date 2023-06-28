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
import { addSpaceIfCamelCase } from "helpers/string.helper";
import { getStatesList } from "helpers/state.helper";
// types
import { ICurrentUserResponse, IIssue } from "types";
// fetch-keys
import { STATES_LIST } from "constants/fetch-keys";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  position?: "left" | "right";
  selfPositioned?: boolean;
  customButton?: boolean;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const ViewStateSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  position = "left",
  selfPositioned = false,
  customButton = false,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && issue ? STATES_LIST(issue.project) : null,
    workspaceSlug && issue
      ? () => stateService.getStates(workspaceSlug as string, issue.project)
      : null
  );
  const states = getStatesList(stateGroups ?? {});

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

  const selectedOption = states?.find((s) => s.id === issue.state);

  const stateLabel = (
    <Tooltip
      tooltipHeading="State"
      tooltipContent={addSpaceIfCamelCase(selectedOption?.name ?? "")}
    >
      <div className="flex items-center cursor-pointer gap-2 text-brand-secondary">
        {selectedOption &&
          getStateGroupIcon(selectedOption.group, "16", "16", selectedOption.color)}
        {selectedOption?.name ?? "State"}
      </div>
    </Tooltip>
  );

  return (
    <CustomSearchSelect
      value={issue.state}
      onChange={(data: string) => {
        partialUpdateIssue(
          {
            state: data,
            priority: issue.priority,
            target_date: issue.target_date,
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

        const oldState = states.find((s) => s.id === issue.state);
        const newState = states.find((s) => s.id === data);

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
      noChevron
    />
  );
};
