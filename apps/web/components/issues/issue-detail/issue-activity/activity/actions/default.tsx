/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
// plane imports
import { WorkItemsOutline } from "@makeplane/propel/icons";
import { EInboxIssueSource } from "@plane/types";
// hooks
import { capitalizeFirstLetter } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { IssueActivityBlockComponent } from "./";

type TIssueDefaultActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueDefaultActivity = observer(function IssueDefaultActivity(props: TIssueDefaultActivity) {
  const { t } = useTranslation();

  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  const source = activity.source_data?.source;

  return (
    <IssueActivityBlockComponent
      activityId={activityId}
      icon={<WorkItemsOutline width={14} height={14} className="text-secondary" aria-hidden="true" />}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          source && source !== EInboxIssueSource.IN_APP ? (
            <span>
              {t("web_ui.created_the_work_item_via")}{" "}
              <span className="font-medium">{capitalizeFirstLetter(source.toLowerCase() || "")}</span>.
            </span>
          ) : (
            <span> {t("web_ui.created_the_work_item")}</span>
          )
        ) : (
          <span> {t("web_ui.deleted_a_work_item")}</span>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
