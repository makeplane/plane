import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useMember, useWorkspace } from "@/hooks/store";
// plane web components
import { TIssueAdditionalPropertiesActivityItem } from "@/plane-web/components/issues";
// plane web hooks
import { useIssuePropertiesActivity, useIssueTypes } from "@/plane-web/hooks/store";

type TMemberDetail = {
  id: string;
};

export const IssueMemberPropertyActivity: FC<TIssueAdditionalPropertiesActivityItem> = observer((props) => {
  const { activityId, customPropertyId } = props;
  // hooks
  const { getUserDetails } = useMember();
  const { getWorkspaceById } = useWorkspace();
  // plane web hooks
  const { getIssuePropertyById } = useIssueTypes();
  const { getPropertyActivityById } = useIssuePropertiesActivity();
  // derived values
  const activityDetail = getPropertyActivityById(activityId);
  const propertyDetail = getIssuePropertyById(customPropertyId);
  const propertyName = propertyDetail?.display_name;
  const workspaceDetail = activityDetail?.workspace ? getWorkspaceById(activityDetail.workspace) : null;

  const MemberDetail = ({ id }: TMemberDetail) => {
    const userDetail = getUserDetails(id);
    return (
      <a
        href={`/${workspaceDetail?.slug}/profile/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center font-medium text-custom-text-100 hover:underline capitalize"
      >
        <span className="font-medium text-custom-text-100">{userDetail?.first_name + " " + userDetail?.last_name}</span>
      </a>
    );
  };

  if (!activityDetail) return <></>;
  return (
    <>
      {activityDetail.action === "created" && activityDetail.new_value ? (
        <>
          selected <MemberDetail id={activityDetail.new_value} /> as member(s) for{" "}
          <span className="font-medium text-custom-text-100">{propertyName}</span>.
        </>
      ) : (
        activityDetail.action === "deleted" &&
        activityDetail.old_value && (
          <>
            deselected <MemberDetail id={activityDetail.old_value} /> from the previous selection in{" "}
            <span className="font-medium text-custom-text-100">{propertyName}</span>.
          </>
        )
      )}
      {activityDetail.action === "updated" && activityDetail.old_value && activityDetail.new_value && (
        <>
          changed <MemberDetail id={activityDetail.old_value} /> to <MemberDetail id={activityDetail.new_value} /> in{" "}
          <span className="font-medium text-custom-text-100">{propertyName}</span>.
        </>
      )}
    </>
  );
});
