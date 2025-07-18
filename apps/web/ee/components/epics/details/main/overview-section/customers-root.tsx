import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import useSWR from "swr";
// plane web
import { Loader } from "@plane/ui";
import { CustomerRequestEmptyState } from "@/plane-web/components/customers";
import { WorkItemRequestCollapsibleContent } from "@/plane-web/components/issues/issue-detail-widgets";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  workspaceSlug: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicCustomersRoot: FC<TProps> = observer((props) => {
  const { workspaceSlug, epicId, disabled = false } = props;
  // store hooks
  const {
    isCustomersFeatureEnabled,
    toggleCreateUpdateRequestModal,
    workItems: { fetchWorkItemRequests, getFilteredWorkItemRequestIds },
  } = useCustomers();

  const handleFormOpen = () => {
    toggleCreateUpdateRequestModal(epicId);
  };

  // derived values
  const requestIds = getFilteredWorkItemRequestIds(epicId);

  const { isLoading } = useSWR(
    workspaceSlug && epicId ? `WORK_ITEM_REQUESTS${workspaceSlug}_${epicId}` : null,
    workspaceSlug && epicId ? () => fetchWorkItemRequests(workspaceSlug.toString(), epicId) : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  if (!isCustomersFeatureEnabled) return null;
  return (
    <>
      {isLoading ? (
        <>
          <Loader>
            <Loader.Item height="40px" />
          </Loader>
        </>
      ) : (
        requestIds.length === 0 && <CustomerRequestEmptyState addRequest={handleFormOpen} />
      )}
      <WorkItemRequestCollapsibleContent workItemId={epicId} workspaceSlug={workspaceSlug} disabled={disabled} isTabs />
    </>
  );
});
