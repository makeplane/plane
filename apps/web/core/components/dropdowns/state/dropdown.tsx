import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import type { TWorkItemStateDropdownBaseProps } from "./base";
import { WorkItemStateDropdownBase } from "./base";

type TWorkItemStateDropdownProps = Omit<
  TWorkItemStateDropdownBaseProps,
  "stateIds" | "getStateById" | "onDropdownOpen" | "isInitializing"
> & {
  stateIds?: string[];
};

export const StateDropdown = observer(function StateDropdown(props: TWorkItemStateDropdownProps) {
  const { projectId, stateIds: propsStateIds } = props;
  // router params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // states
  const [stateLoader, setStateLoader] = useState(false);
  // store hooks
  const { fetchProjectStates, getProjectStateIds, getStateById } = useProjectState();
  // derived values
  const stateIds = propsStateIds ?? getProjectStateIds(projectId);
  const isSupportTicket = pathname?.includes("/support-tickets");

  const filteredStateIds = (stateIds ?? []).filter((stateId) => {
    if (!isSupportTicket) return true;
    const state = getStateById(stateId);
    if (!state) return true;
    return state.name.toLowerCase() !== "backlog" && state.group !== "backlog";
  });

  // fetch states if not provided
  const onDropdownOpen = async () => {
    if ((stateIds === undefined || stateIds.length === 0) && workspaceSlug && projectId) {
      setStateLoader(true);
      await fetchProjectStates(workspaceSlug.toString(), projectId);
      setStateLoader(false);
    }
  };

  return (
    <WorkItemStateDropdownBase
      {...props}
      getStateById={getStateById}
      isInitializing={stateLoader}
      stateIds={filteredStateIds}
      onDropdownOpen={onDropdownOpen}
    />
  );
});
