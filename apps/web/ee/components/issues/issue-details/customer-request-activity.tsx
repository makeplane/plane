import { FC } from "react";
import { CustomersIcon } from "@plane/ui";
import { IssueActivityBlockComponent } from "@/components/issues/issue-detail/issue-activity/activity/actions";
import { useIssueDetail } from "@/hooks/store";

type TCustomerRequestActivityProps = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
};

export const CustomerRequestActivity: FC<TCustomerRequestActivityProps> = (props) => {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<CustomersIcon className="h-3 w-3 flex-shrink-0 text-custom-text-300" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          <>
            <span>added this work item to the customer request </span>
            <a
              href={`/${activity.workspace_detail?.slug}/customers/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium text-custom-text-100 hover:underline"
            >
              <span className="truncate">{activity.new_value}</span>
            </a>
          </>
        ) : (
          <>
            <span>removed the work item from the customer request </span>
            <a
              href={`/${activity.workspace_detail?.slug}/customers/${activity.old_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium text-custom-text-100 hover:underline"
            >
              <span className="truncate"> {activity.old_value}</span>
            </a>
          </>
        )}
      </>
    </IssueActivityBlockComponent>
  );
};
