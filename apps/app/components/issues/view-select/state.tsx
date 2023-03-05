import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
// ui
import { CustomSelect, Tooltip } from "components/ui";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
import { getStatesList } from "helpers/state.helper";
// types
import { IIssue } from "types";
// fetch-keys
import { STATE_LIST } from "constants/fetch-keys";
import { getStateGroupIcon } from "components/icons";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  position?: "left" | "right";
  selfPositioned?: boolean;
  isNotAllowed: boolean;
};

export const ViewStateSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  position = "left",
  selfPositioned = false,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && issue ? STATE_LIST(issue.project) : null,
    workspaceSlug && issue
      ? () => stateService.getStates(workspaceSlug as string, issue.project)
      : null
  );
  const states = getStatesList(stateGroups ?? {});

  const currentState = states?.find((s) => s.id === issue.state);

  return (
    <CustomSelect
      label={
        <>
          {getStateGroupIcon(
            currentState?.group ?? "backlog",
            "16",
            "16",
            currentState?.color ?? ""
          )}
          <Tooltip
            tooltipHeading="State"
            tooltipContent={addSpaceIfCamelCase(currentState?.name ?? "")}
          >
            <span>{addSpaceIfCamelCase(currentState?.name ?? "")}</span>
          </Tooltip>
        </>
      }
      value={issue.state}
      onChange={(data: string) => partialUpdateIssue({ state: data })}
      maxHeight="md"
      noChevron
      disabled={isNotAllowed}
      position={position}
      selfPositioned={selfPositioned}
    >
      {states?.map((state) => (
        <CustomSelect.Option key={state.id} value={state.id}>
          <>
            {getStateGroupIcon(state.group, "16", "16", state.color)}
            {addSpaceIfCamelCase(state.name)}
          </>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
};
