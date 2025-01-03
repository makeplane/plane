import { observer } from "mobx-react";
import { useParams } from "next/navigation";
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
import { useTeamPage, useTeamPages } from "@/plane-web/hooks/store";

type Props = {
  teamId: string;
};

export const TeamPagesList = observer((props: Props) => {
  const { teamId } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // plane web hooks
  const { getTeamPagesLoader, getTeamPageIds, getFilteredTeamPageIds, createPage } = useTeamPages();
  // derived values
  const teamPagesLoader = getTeamPagesLoader(teamId);
  const teamPageIds = getTeamPageIds(teamId);
  const filteredTeamPageIds = getFilteredTeamPageIds(teamId);
  // handlers
  const handleCreatePage = async () => {
    // Create page
    await createPage(workspaceSlug, teamId, {
      access: EPageAccess.PUBLIC,
    })
      .then((res) => {
        const pageId = `/${workspaceSlug}/teams/${teamId}/pages/${res?.id}`;
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

  if (teamPagesLoader === "init-loader" || !teamPageIds || !filteredTeamPageIds) return <PageLoader />;

  if (filteredTeamPageIds.length === 0 && teamPageIds.length > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState type={EmptyStateType.VIEWS_EMPTY_SEARCH} layout="screen-simple" />
      </div>
    );
  }

  return (
    <>
      {filteredTeamPageIds.length > 0 ? (
        <div className="flex h-full w-full flex-col">
          <ListLayout>
            {filteredTeamPageIds.length > 0 ? (
              filteredTeamPageIds.map((pageId) => (
                <PageListBlock key={pageId} pageId={pageId} usePage={(pageId) => useTeamPage(teamId, pageId)} />
              ))
            ) : (
              <p className="mt-10 text-center text-sm text-custom-text-300">No results found</p>
            )}
          </ListLayout>
        </div>
      ) : (
        <EmptyState type={EmptyStateType.TEAM_VIEW} primaryButtonOnClick={handleCreatePage} />
      )}
    </>
  );
});
