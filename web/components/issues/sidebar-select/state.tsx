import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { ProjectStateService } from "services/project";
// ui
import { CustomSearchSelect, StateGroupIcon } from "@plane/ui";
// helpers
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

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId ? () => stateService.getStates(workspaceSlug as string, projectId as string) : null
  );

  const selectedOption = states?.find((s) => s.id === value);

  const options = states?.map((state) => ({
    value: state.id,
    query: state.name,
    content: (
      <div className="flex items-center gap-2">
        <StateGroupIcon stateGroup={state.group} color={state.color} />
        {state.name}
      </div>
    ),
  }));

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={options}
      customButton={
        <div className="bg-custom-background-80 text-xs rounded px-2.5 py-0.5">
          {selectedOption ? (
            <div className="flex items-center gap-1.5 text-left text-custom-text-100">
              <StateGroupIcon stateGroup={selectedOption.group} color={selectedOption.color} />
              {addSpaceIfCamelCase(selectedOption?.name ?? "")}
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
      width="min-w-[10rem]"
      noChevron
      disabled={disabled}
    />
  );
};
