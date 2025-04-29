import { FC } from "react";
import { observer } from "mobx-react";
import { TWorkItemAdditionalWidgets } from "@/ce/components/issues/issue-detail-widgets";
import { useIssueDetail } from "@/hooks/store";
import { CustomerRequestsCollapsible } from "@/plane-web/components/issues/issue-detail-widgets";
import { useCustomers } from "@/plane-web/hooks/store";

export const WorkItemAdditionalWidgets: FC<TWorkItemAdditionalWidgets> = observer((props) => {
  const { workspaceSlug, workItemId, disabled } = props;
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { isCustomersFeatureEnabled } = useCustomers();

  // derived values
  const issue = getIssueById(workItemId);
  const shouldRenderCustomerRequest = Boolean(issue?.customer_request_count) && !issue?.is_epic;
  return (
    <>
      {shouldRenderCustomerRequest && isCustomersFeatureEnabled && (
        <CustomerRequestsCollapsible workItemId={workItemId} workspaceSlug={workspaceSlug} disabled={disabled} />
      )}
    </>
  );
});
