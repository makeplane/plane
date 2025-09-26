import { isEmpty, size } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import { getGroupList } from "../utils";
import { InitiativeGroup } from "./initiatives-group";

export const InitiativesRoot = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { initiative, initiativeFilters } = useInitiatives();
  const { getUserDetails } = useMember();
  const { toggleCreateInitiativeModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const displayFilters = initiativeFilters.currentInitiativeDisplayFilters;
  const groupBy = displayFilters?.group_by;
  const groupedInitiativeIds = initiative.currentGroupedInitiativeIds;
  const generalResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/initiatives/initiatives" });
  const searchedResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/project" });
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (initiative.initiativesLoader) return <ListLayoutLoader />;

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
        <SimpleEmptyState
          title={t("initiatives.empty_state.search.title")}
          description={t("initiatives.empty_state.search.description")}
          assetPath={searchedResolvedPath}
        />
      </div>
    );
  }

  if (isEmptyInitiatives) {
    return (
      <DetailedEmptyState
        title={t("initiatives.empty_state.general.title")}
        description={t("initiatives.empty_state.general.description")}
        assetPath={generalResolvedPath}
        primaryButton={{
          text: t("initiatives.empty_state.general.primary_button.text"),
          onClick: () => toggleCreateInitiativeModal({ isOpen: true, initiativeId: undefined }),
          disabled: !hasWorkspaceMemberLevelPermissions,
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
