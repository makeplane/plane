import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectViewListItem } from "components/views";
// ui
import { EmptyState, Loader } from "components/ui";
// assets
import emptyView from "public/empty-state/view.svg";
import { useRouter } from "next/router";
import { Plus } from "lucide-react";

export const ProjectViewsList = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { projectViews: projectViewsStore } = useMobxStore();

  const viewsList = projectId ? projectViewsStore.viewsList[projectId.toString()] : undefined;

  if (!viewsList)
    return (
      <Loader className="space-y-3 p-8">
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
        <Loader.Item height="30px" />
      </Loader>
    );

  return (
    <>
      {viewsList.length > 0 ? (
        <div className="space-y-5 p-8">
          <h3 className="text-2xl font-semibold text-custom-text-100">Views</h3>
          <div className="divide-y divide-custom-border-200 rounded-[10px] border border-custom-border-200">
            {viewsList.map((view) => (
              <ProjectViewListItem key={view.id} view={view} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="Get focused with views"
          description="Views aid in saving your issues by applying various filters and grouping options."
          image={emptyView}
          primaryButton={{
            icon: <Plus size={14} strokeWidth={2} />,
            text: "New View",
            onClick: () => {
              const e = new KeyboardEvent("keydown", {
                key: "v",
              });
              document.dispatchEvent(e);
            },
          }}
        />
      )}
    </>
  );
});
