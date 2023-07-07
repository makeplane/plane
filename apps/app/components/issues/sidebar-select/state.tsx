import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
// ui
import { Spinner, CustomSelect } from "components/ui";
// icons
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import { getStateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { UserAuth } from "types";
// constants
import { STATES_LIST } from "constants/fetch-keys";

type Props = {
  value: string;
  onChange: (val: string) => void;
  userAuth: UserAuth;
};

export const SidebarStateSelect: React.FC<Props> = ({ value, onChange, userAuth }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxIssueId } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups ?? {});

  const selectedState = states?.find((s) => s.id === value);

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm text-brand-secondary sm:basis-1/2">
        <Squares2X2Icon className="h-4 w-4 flex-shrink-0" />
        <p>State</p>
      </div>
      <div className="sm:basis-1/2">
        <CustomSelect
          label={
            selectedState ? (
              <div className="flex items-center gap-2 text-left text-brand-base">
                {getStateGroupIcon(
                  selectedState?.group ?? "backlog",
                  "16",
                  "16",
                  selectedState?.color ?? ""
                )}
                {addSpaceIfCamelCase(selectedState?.name ?? "")}
              </div>
            ) : inboxIssueId ? (
              <div className="flex items-center gap-2 text-left text-brand-base">
                {getStateGroupIcon("backlog", "16", "16", "#ff7700")}
                Triage
              </div>
            ) : (
              "None"
            )
          }
          value={value}
          onChange={onChange}
          width="w-full"
          position="right"
          disabled={isNotAllowed}
        >
          {states ? (
            states.length > 0 ? (
              states.map((state) => (
                <CustomSelect.Option key={state.id} value={state.id}>
                  <>
                    {getStateGroupIcon(state.group, "16", "16", state.color)}
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
      </div>
    </div>
  );
};
