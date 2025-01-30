import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ETeamspaceEntityScope } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { ListLayout } from "@/components/core/list";
import { EmptyState } from "@/components/empty-state";
import { PageListBlock, PageLoader } from "@/components/pages";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EPageAccess } from "@/constants/page";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { useTeamspacePage, useTeamspacePages } from "@/plane-web/hooks/store";

type Props = {
  teamspaceId: string;
};

export const TeamspacePagesList = observer((props: Props) => {
  const { teamspaceId } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // plane web hooks
  const {
    getTeamspacePagesLoader,
    getTeamspacePagesScope,
    getTeamspacePageIds,
    getFilteredTeamspacePageIds,
    createPage,
  } = useTeamspacePages();
  // derived values
  const teamspacePagesLoader = getTeamspacePagesLoader(teamspaceId);
  const teamspacePagesScope = getTeamspacePagesScope(teamspaceId);
  const teamspacePageIds = getTeamspacePageIds(teamspaceId);
  const filteredTeamspacePageIds = getFilteredTeamspacePageIds(teamspaceId);
  // handlers
  const handleCreatePage = async () => {
    // Create page
    await createPage(workspaceSlug, teamspaceId, {
      access: EPageAccess.PUBLIC,
    })
      .then((res) => {
        const pageId = `/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${res?.id}`;
        router.push(pageId);
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        })
      );
  };

  if (teamspacePagesLoader === "init-loader" || !teamspacePageIds || !filteredTeamspacePageIds) return <PageLoader />;

  if (filteredTeamspacePageIds.length === 0 && teamspacePageIds.length > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState type={EmptyStateType.VIEWS_EMPTY_SEARCH} layout="screen-simple" />
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
                <PageListBlock
                  key={pageId}
                  pageId={pageId}
                  usePage={(pageId) => useTeamspacePage(teamspaceId, pageId)}
                />
              ))
            ) : (
              <p className="mt-10 text-center text-sm text-custom-text-300">No results found</p>
            )}
          </ListLayout>
        </div>
      ) : (
        <EmptyState
          type={
            teamspacePagesScope === ETeamspaceEntityScope.TEAM
              ? EmptyStateType.TEAM_PAGE
              : EmptyStateType.TEAM_PROJECT_PAGE
          }
          primaryButtonOnClick={handleCreatePage}
        />
      )}
    </>
  );
});
