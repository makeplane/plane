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
import { STATE_LIST } from "constants/fetch-keys";

type Props = {
  value: string;
  onChange: (val: string) => void;
  userAuth: UserAuth;
};

export const SidebarStateSelect: React.FC<Props> = ({ value, onChange, userAuth }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const states = getStatesList(stateGroups ?? {});

  const selectedState = states?.find((s) => s.id === value);

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <Squares2X2Icon className="h-4 w-4 flex-shrink-0" />
        <p>State</p>
      </div>
      <div className="sm:basis-1/2">
        <CustomSelect
          label={
            <div className={`flex items-center gap-2 text-left ${value ? "" : "text-gray-900"}`}>
              {getStateGroupIcon(
                selectedState?.group ?? "backlog",
                "16",
                "16",
                selectedState?.color ?? ""
              )}
              {addSpaceIfCamelCase(selectedState?.name ?? "")}
            </div>
          }
          value={value}
          onChange={onChange}
          width="w-full"
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
