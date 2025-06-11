import { FC } from "react";
import { observer } from "mobx-react";
// ce imports
import { TWorkItemAdditionalWidgetCollapsiblesProps } from "@/ce/components/issues/issue-detail-widgets/collapsibles";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web imports
import { CustomerRequestsCollapsible } from "@/plane-web/components/issues/issue-detail-widgets";
import { useCustomers } from "@/plane-web/hooks/store";

export const WorkItemAdditionalWidgetCollapsibles: FC<TWorkItemAdditionalWidgetCollapsiblesProps> = observer(
  (props) => {
    const { disabled, issueServiceType, workspaceSlug, workItemId } = props;
    // store hooks
    const {
      issue: { getIssueById },
    } = useIssueDetail(issueServiceType);
    const { isCustomersFeatureEnabled } = useCustomers();

    // derived values
    const issue = getIssueById(workItemId);
    const shouldRenderCustomerRequest = Boolean(issue?.customer_request_ids?.length) && !issue?.is_epic;
    return (
      <>
        {shouldRenderCustomerRequest && isCustomersFeatureEnabled && (
          <CustomerRequestsCollapsible workItemId={workItemId} workspaceSlug={workspaceSlug} disabled={disabled} />
        )}
      </>
    );
  }
);
