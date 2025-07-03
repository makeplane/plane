import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import {
  EUserPermissionsLevel,
  EPageAccess,
  TEAMSPACE_PAGE_TRACKER_EVENTS,
  TEAMSPACE_PAGE_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { ListLayout } from "@/components/core/list";
import { DetailedEmptyState, SimpleEmptyState } from "@/components/empty-state";
import { PageListBlockRoot, PageLoader } from "@/components/pages";
// hooks
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.TEAMSPACE;

type Props = {
  teamspaceId: string;
};

export const TeamspacePagesList = observer((props: Props) => {
  const { teamspaceId } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // plane web hooks
  const {
    getTeamspacePagesLoader,
    getTeamspacePageIds,
    getFilteredTeamspacePageIds,
    getTeamspacePagesFilters,
    createPage,
  } = usePageStore(EPageStoreType.TEAMSPACE);
  // derived values
  const teamspacePagesLoader = getTeamspacePagesLoader(teamspaceId);
  const teamspacePageIds = getTeamspacePageIds(teamspaceId);
  const filteredTeamspacePageIds = getFilteredTeamspacePageIds(teamspaceId);
  const teamspacePagesFilters = getTeamspacePagesFilters(teamspaceId);
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const generalPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/onboarding/pages",
  });
  const filteredPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/pages/all-filters",
    extension: "svg",
    includeThemeInPath: false,
  });
  const searchedPageResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/pages/name-filter",
    extension: "svg",
    includeThemeInPath: false,
  });
  // handlers
  const handleCreatePage = async () => {
    captureClick({
      elementName: TEAMSPACE_PAGE_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PAGE_BUTTON,
    });
    // Create page
    await createPage({
      access: EPageAccess.PUBLIC,
    })
      .then((res) => {
        const pageId = `/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${res?.id}`;
        router.push(pageId);
        captureSuccess({
          eventName: TEAMSPACE_PAGE_TRACKER_EVENTS.PAGE_CREATE,
          payload: {
            id: res?.id,
            teamspaceId,
          },
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        });
        captureError({
          eventName: TEAMSPACE_PAGE_TRACKER_EVENTS.PAGE_CREATE,
          payload: {
            teamspaceId,
          },
        });
      });
  };

  if (teamspacePagesLoader === "init-loader" || !teamspacePageIds || !filteredTeamspacePageIds) return <PageLoader />;

  if (filteredTeamspacePageIds.length === 0 && teamspacePageIds.length > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        {teamspacePagesFilters?.searchQuery && teamspacePagesFilters.searchQuery.length > 0 ? (
          <SimpleEmptyState
            title={t("teamspace_pages.empty_state.search.title")}
            description={t("teamspace_pages.empty_state.search.description")}
            assetPath={searchedPageResolvedPath}
          />
        ) : (
          <SimpleEmptyState
            title={t("teamspace_pages.empty_state.filter.title")}
            description={t("teamspace_pages.empty_state.filter.description")}
            assetPath={filteredPageResolvedPath}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {filteredTeamspacePageIds.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <ListLayout>
            {filteredTeamspacePageIds.length > 0 ? (
              filteredTeamspacePageIds.map((pageId) => (
                <PageListBlockRoot key={pageId} paddingLeft={0} pageId={pageId} storeType={storeType} />
              ))
            ) : (
              <p className="mt-10 text-center text-sm text-custom-text-300">No results found</p>
            )}
          </ListLayout>
        </div>
      ) : (
        <DetailedEmptyState
          title={t("teamspace_pages.empty_state.team_page.title")}
          description={t("teamspace_pages.empty_state.team_page.description")}
          assetPath={generalPageResolvedPath}
          primaryButton={{
            text: t("teamspace_pages.empty_state.team_page.primary_button.text"),
            onClick: handleCreatePage,
            disabled: !hasWorkspaceMemberLevelPermissions,
          }}
        />
      )}
    </>
  );
});
