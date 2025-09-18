import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
// ce imports
import { TWorkItemAdditionalWidgetCollapsiblesProps } from "@/ce/components/issues/issue-detail-widgets/collapsibles";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { CustomerRequestsCollapsible } from "@/plane-web/components/issues/issue-detail-widgets";
import { useCustomers } from "@/plane-web/hooks/store";
// local imports
import { PagesCollapsible } from "./pages";

export const WorkItemAdditionalWidgetCollapsibles: FC<TWorkItemAdditionalWidgetCollapsiblesProps> = observer(
  (props) => {
    const { disabled, workspaceSlug, workItemId, hideWidgets, issueServiceType } = props;
    // store hooks
    const {
      issue: { getIssueById },
    } = useIssueDetail(issueServiceType);
    const { isCustomersFeatureEnabled } = useCustomers();

    // derived values
    const issue = getIssueById(workItemId);
    const shouldRenderCustomerRequest = Boolean(issue?.customer_request_ids?.length) && !issue?.is_epic;
    const shouldRenderPages = !hideWidgets?.includes("pages");
    return (
      <>
        {shouldRenderCustomerRequest && isCustomersFeatureEnabled && (
          <CustomerRequestsCollapsible workItemId={workItemId} workspaceSlug={workspaceSlug} disabled={disabled} />
        )}
        <WithFeatureFlagHOC workspaceSlug={workspaceSlug} flag={E_FEATURE_FLAGS.LINK_PAGES} fallback={<></>}>
          {shouldRenderPages && (
            <PagesCollapsible
              workItemId={workItemId}
              workspaceSlug={workspaceSlug}
              disabled={disabled}
              projectId={issue?.project_id}
              issueServiceType={issueServiceType}
            />
          )}
        </WithFeatureFlagHOC>
      </>
    );
  }
);
