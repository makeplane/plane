/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { CubeOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent } from "./";

type Props = { activityId: string; ends: "top" | "bottom" | undefined };

/** Changes of the kind and of the product fields. */
export const IssueProductActivity = observer(function IssueProductActivity(props: Props) {
  const { activityId, ends } = props;
  const { t } = useTranslation();
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const activity = getActivityById(activityId);
  if (!activity?.field) return <></>;

  const format = (value: string | null | undefined) => {
    if (!value) return "—";
    if (activity.field === "kind") return t(value === "product" ? "product.kinds.product" : "product.kinds.task");
    return activity.field === "manual_progress" ? `${value}%` : value;
  };

  return (
    <IssueActivityBlockComponent
      icon={<CubeOutline className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {t(`product.history.${activity.field}`)}: {format(activity.old_value)} →{" "}
        <span className="font-medium text-primary">{format(activity.new_value)}</span>
      </>
    </IssueActivityBlockComponent>
  );
});
