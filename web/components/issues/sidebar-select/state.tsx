import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { ProjectStateService } from "services/project";
// ui
import { CustomSelect } from "components/ui";
import { Spinner } from "@plane/ui";
// icons
import { StateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
// constants
import { STATES_LIST } from "constants/fetch-keys";

type Props = {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
};

// services
const stateService = new ProjectStateService();

export const SidebarStateSelect: React.FC<Props> = ({ value, onChange, disabled = false }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId ? () => stateService.getStates(workspaceSlug as string, projectId as string) : null
  );
  const states = getStatesList(stateGroups);

  const selectedState = states?.find((s) => s.id === value);

  return (
    <CustomSelect
      customButton={
        <div className="bg-custom-background-80 text-xs rounded px-2.5 py-0.5">
          {selectedState ? (
            <div className="flex items-center gap-1.5 text-left text-custom-text-100">
              <StateGroupIcon stateGroup={selectedState.group} color={selectedState.color} />
              {addSpaceIfCamelCase(selectedState?.name ?? "")}
            </div>
          ) : inboxIssueId ? (
            <div className="flex items-center gap-1.5 text-left text-custom-text-100">
              <StateGroupIcon stateGroup="backlog" color="#ff7700" />
              Triage
            </div>
          ) : (
            "None"
          )}
        </div>
      }
      value={value}
      onChange={onChange}
      optionsClassName="w-min"
      disabled={disabled}
    >
      {states ? (
        states.length > 0 ? (
          states.map((state) => (
            <CustomSelect.Option key={state.id} value={state.id}>
              <>
                <StateGroupIcon stateGroup={state.group} color={state.color} />
                {state.name}
              </>
            </CustomSelect.Option>
          ))
        ) : (
          <div className="text-center">No states found</div>
        )
      ) : (
        <Spinner />
      )}
    </CustomSelect>
  );
};
