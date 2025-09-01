import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Collapsible } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import {
  CustomerRequestsCollapsibleTitle,
  WorkItemRequestCollapsibleContent,
} from "@/plane-web/components/issues/issue-detail-widgets";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
};

export const CustomerRequestsCollapsible: FC<TProps> = observer((props) => {
  const { workspaceSlug, workItemId, disabled } = props;
  // store hooks
  const { openWidgets, toggleOpenWidget } = useIssueDetail();
  const {
    workItems: { fetchWorkItemRequests },
  } = useCustomers();

  // derived values
  const isCollapsibleOpen = openWidgets.includes("customer_requests");

  useSWR(
    workspaceSlug && workItemId ? `WORK_ITEM_REQUESTS${workspaceSlug}_${workItemId}` : null,
    workspaceSlug && workItemId ? () => fetchWorkItemRequests(workspaceSlug.toString(), workItemId) : null,
    { revalidateIfStale: false, revalidateOnFocus: true }
  );

  return (
    <Collapsible
      isOpen={isCollapsibleOpen}
      onToggle={() => toggleOpenWidget("customer_requests")}
      title={
        <CustomerRequestsCollapsibleTitle
          workspaceSlug={workspaceSlug}
          isOpen={isCollapsibleOpen}
          workItemId={workItemId}
          disabled={disabled}
        />
      }
      buttonClassName="w-full"
    >
      <WorkItemRequestCollapsibleContent workItemId={workItemId} workspaceSlug={workspaceSlug} disabled={disabled} />
    </Collapsible>
  );
});
