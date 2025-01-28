import { isEmpty, size } from "lodash";
import { observer } from "mobx-react";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCommandPalette, useMember } from "@/hooks/store";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
//
import { getGroupList } from "../utils";
import { InitiativeGroup } from "./initiatives-group";

export const InitiativesRoot = observer(() => {
  const { initiative, initiativeFilters } = useInitiatives();
  const { getUserDetails } = useMember();
  const { toggleCreateInitiativeModal } = useCommandPalette();

  const displayFilters = initiativeFilters.currentInitiativeDisplayFilters;

  const groupBy = displayFilters?.group_by;
  const groupedInitiativeIds = initiative.currentGroupedInitiativeIds;

  if (!groupedInitiativeIds) return <></>;

  const groupIds = Object.keys(groupedInitiativeIds).sort((a, b) => {
    if (a === "none") return -1;
    return 1;
  });

  const groupList = getGroupList(groupIds, groupBy, getUserDetails);

  // Check if the object is empty or contains only empty arrays

  const emptyGroupedInitiativeIds = Object.values(groupedInitiativeIds).every(
    (arr) => Array.isArray(arr) && arr.length === 0
  );

  const isEmptyInitiatives = isEmpty(groupedInitiativeIds) || emptyGroupedInitiativeIds;

  if (emptyGroupedInitiativeIds && size(initiative.initiativesMap) > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState type={EmptyStateType.WORKSPACE_INITIATIVES_EMPTY_SEARCH} layout="screen-simple" />
      </div>
    );
  }

  if (isEmptyInitiatives) {
    return (
      <EmptyState
        type={EmptyStateType.WORKSPACE_INITIATIVES}
        primaryButtonOnClick={() => {
          toggleCreateInitiativeModal({ isOpen: true, initiativeId: undefined });
        }}
      />
    );
  }

  return (
    <div className={`relative size-full bg-custom-background-90`}>
      <div className="relative size-full flex flex-col">
        {groupList && (
          <div className="size-full vertical-scrollbar scrollbar-lg relative overflow-auto vertical-scrollbar-margin-top-md">
            {groupList.map((group) => (
              <InitiativeGroup
                key={group.id}
                group={group}
                initiativesIds={groupedInitiativeIds[group.id]}
                groupBy={groupBy}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
