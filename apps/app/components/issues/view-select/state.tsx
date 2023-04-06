import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
// ui
import { CustomSearchSelect, Tooltip } from "components/ui";
// icons
import { getStateGroupIcon } from "components/icons";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
import { getStatesList } from "helpers/state.helper";
// types
import { IIssue } from "types";
// fetch-keys
import { STATE_LIST } from "constants/fetch-keys";

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

  return (
    <CustomSearchSelect
      value={issue.state}
      onChange={(data: string) =>
        partialUpdateIssue({
          state: data,
          priority: issue.priority,
          target_date: issue.target_date,
        })
      }
      options={options}
      label={
        <Tooltip
          tooltipHeading="State"
          tooltipContent={addSpaceIfCamelCase(selectedOption?.name ?? "")}
        >
          <div className="flex items-center gap-2 text-skin-muted-2">
            {selectedOption &&
              getStateGroupIcon(selectedOption.group, "16", "16", selectedOption.color)}
            {selectedOption?.name ?? "State"}
          </div>
        </Tooltip>
      }
      position={position}
      disabled={isNotAllowed}
      noChevron
    />
  );
};
