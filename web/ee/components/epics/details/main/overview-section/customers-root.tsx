import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import useSWR from "swr";
// plane web
import { Loader } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
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
    issue: { getIssueById },
  } = useIssueDetail();
  const { isCustomersFeatureEnabled, toggleCreateUpdateRequestModal, fetchWorkItemRequests } = useCustomers();

  const handleFormOpen = () => {
    toggleCreateUpdateRequestModal(epicId);
  };

  // derived values
  const epic = getIssueById(epicId);
  const customerRequestCount = epic?.customer_request_count || 0;

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
        customerRequestCount === 0 && <CustomerRequestEmptyState addRequest={handleFormOpen} />
      )}
      <WorkItemRequestCollapsibleContent workItemId={epicId} workspaceSlug={workspaceSlug} disabled={disabled} isTabs />
    </>
  );
});
