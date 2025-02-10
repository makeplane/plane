import { observer } from "mobx-react";
import Image from "next/image";
// plane imports
import { EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { ListLayout } from "@/components/core/list/list-root";
import { DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useCommandPalette, useEventTracker, useUserPermissions } from "@/hooks/store";
// plane web hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { useTeamspaces, useTeamspaceFilter } from "@/plane-web/hooks/store";
// assets
import AllFiltersImage from "@/public/empty-state/project/all-filters.svg";
import NameFilterImage from "@/public/empty-state/project/name-filter.svg";
// components
import { TeamsLoader } from "./loader";
import { TeamspaceListItem } from "./teamspace-list-item";

type TTeamspacesListProps = {
  isEditingAllowed: boolean;
};

export const TeamspacesList = observer((props: TTeamspacesListProps) => {
  const { isEditingAllowed } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateTeamspaceModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { allowPermissions } = useUserPermissions();
  // plane web hooks
  const { allTeamSpaceIds, filteredTeamSpaceIds, loader } = useTeamspaces();
  const { searchQuery } = useTeamspaceFilter();
  // derived values
  const hasWorkspaceAdminLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE
  );
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/teams/teams" });

  if (!allTeamSpaceIds || loader === "init-loader") return <TeamsLoader />;

  if (allTeamSpaceIds?.length === 0)
    return (
      <DetailedEmptyState
        title={t("teamspaces.empty_state.general.title")}
        description={t("teamspaces.empty_state.general.description")}
        assetPath={resolvedPath}
        primaryButton={{
          text: t("teamspaces.empty_state.general.primary_button.text"),
          onClick: () => {
            setTrackElement("Teamspace empty state");
            toggleCreateTeamspaceModal({ isOpen: true, teamspaceId: undefined });
          },
          disabled: !hasWorkspaceAdminLevelPermissions,
        }}
      />
    );

  if (filteredTeamSpaceIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <Image
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48"
            alt="No matching teamspace"
          />
          <h5 className="mb-1 mt-7 text-xl font-medium">No matching teamspace</h5>
          <p className="whitespace-pre-line text-base text-custom-text-400">
            {searchQuery.trim() === ""
              ? "Remove the filters to see all teamspaces"
              : "No teamspace detected with the matching criteria.\nCreate a new teamspace instead"}
          </p>
        </div>
      </div>
    );

  return (
    <ListLayout>
      {filteredTeamSpaceIds.map((teamspaceId) => (
        <TeamspaceListItem key={teamspaceId} teamspaceId={teamspaceId} isEditingAllowed={isEditingAllowed} />
      ))}
    </ListLayout>
  );
});
