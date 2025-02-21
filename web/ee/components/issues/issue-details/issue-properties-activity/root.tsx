import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { TIssuePropertyTypeKeys } from "@plane/types";
import { getIssuePropertyTypeKey } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web components
import {
  IssueActivityBlockComponent,
  IssueBooleanPropertyActivity,
  IssueDatePropertyActivity,
  IssueDropdownPropertyActivity,
  IssueMemberPropertyActivity,
  IssueNumberPropertyActivity,
  IssueTextPropertyActivity,
} from "@/plane-web/components/issues";
// plane web hooks
import { useIssuePropertiesActivity, useIssueTypes } from "@/plane-web/hooks/store";
// plane types

type TIssueAdditionalPropertiesActivity = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
};

export type TIssueAdditionalPropertiesActivityItem = {
  activityId: string;
  customPropertyId: string;
};

export const IssueAdditionalPropertiesActivity: FC<TIssueAdditionalPropertiesActivity> = observer((props) => {
  const { activityId, ends } = props;
  // hooks and derived values
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getIssuePropertyById } = useIssueTypes();
  const { getPropertyActivityById } = useIssuePropertiesActivity();
  // activity details
  const activityDetail = getPropertyActivityById(activityId);
  if (!activityDetail || !activityDetail.issue || !activityDetail.property) return <></>;
  // issue details
  const issueDetail = getIssueById(activityDetail?.issue);
  if (!issueDetail) return <></>;
  // property details
  const propertyDetail = getIssuePropertyById(activityDetail?.property);
  if (!propertyDetail?.id) return <></>;
  // property type key
  const propertyTypeKey = getIssuePropertyTypeKey(propertyDetail?.property_type, propertyDetail?.relation_type);

  const ISSUE_PROPERTY_ACTIVITY_COMPONENTS: Partial<
    Record<TIssuePropertyTypeKeys, FC<TIssueAdditionalPropertiesActivityItem>>
  > = {
    TEXT: IssueTextPropertyActivity,
    DECIMAL: IssueNumberPropertyActivity,
    OPTION: IssueDropdownPropertyActivity,
    BOOLEAN: IssueBooleanPropertyActivity,
    DATETIME: IssueDatePropertyActivity,
    RELATION_USER: IssueMemberPropertyActivity,
  };

  const IssuePropertyActivityComponent = ISSUE_PROPERTY_ACTIVITY_COMPONENTS[propertyTypeKey];

  if (!IssuePropertyActivityComponent) return <></>;

  return (
    <IssueActivityBlockComponent activityId={activityId} propertyId={propertyDetail.id} ends={ends}>
      <IssuePropertyActivityComponent activityId={activityId} customPropertyId={propertyDetail.id} />
    </IssueActivityBlockComponent>
  );
});
