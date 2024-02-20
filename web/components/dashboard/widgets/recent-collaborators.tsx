import { useState } from "react";
// components
import { CollaboratorsList, WidgetProps } from "components/dashboard/widgets";
8;
// ui
import { Button } from "@plane/ui";

const PER_PAGE = 8;

export const RecentCollaboratorsWidget: React.FC<WidgetProps> = (props) => {
  const { dashboardId, workspaceSlug } = props;
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);

  const updateTotalPages = (count: number) => setTotalPages(count);

  const updateResultsCount = (count: number) => setResultsCount(count);

  const handleLoadMore = () => setPageCount((prev) => prev + 1);

  const collaboratorsPages: JSX.Element[] = [];
  for (let i = 0; i < pageCount; i++)
    collaboratorsPages.push(
      <CollaboratorsList
        key={i}
        dashboardId={dashboardId}
        cursor={`${PER_PAGE}:${i}:0`}
        perPage={PER_PAGE}
        updateResultsCount={updateResultsCount}
        updateTotalPages={updateTotalPages}
        workspaceSlug={workspaceSlug}
      />
    );

  return (
    <div className="bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full hover:shadow-custom-shadow-4xl duration-300">
      <div className="px-7 pt-6">
        <h4 className="text-lg font-semibold text-custom-text-300">Most active members</h4>
        <p className="mt-2 text-xs font-medium text-custom-text-300">
          Top eight active members in your project by last activity
        </p>
      </div>
      {collaboratorsPages}
      {pageCount < totalPages && resultsCount !== 0 && (
        <div className="flex items-center justify-center text-xs w-full">
          <Button variant="accent-primary" size="sm" onClick={handleLoadMore}>
            Load more
          </Button>
        </div>
      )}
      {/* {widgetStats.length > 1 ? (
        <div className="mt-7 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-2 gap-y-8">
          {widgetStats.map((user) => (
            <CollaboratorListItem
              key={user.user_id}
              issueCount={user.active_issue_count}
              userId={user.user_id}
              workspaceSlug={workspaceSlug}
            />
          ))}
        </div>
      ) : (
        <div className="h-full grid place-items-center">
          <RecentCollaboratorsEmptyState />
        </div>
      )} */}
    </div>
  );
};
