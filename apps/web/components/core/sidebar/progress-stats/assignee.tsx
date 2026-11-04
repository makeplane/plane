/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { getFileURL } from "@plane/utils";
// components
import { SingleProgressStats } from "@/components/core/sidebar/single-progress-stats";

export type TAssigneeData = {
  id: string | undefined;
  title: string | undefined;
  avatar_url: string | undefined;
  completed: number;
  total: number;
}[];

type TAssigneeStatComponent = {
  selectedAssigneeIds: string[];
  handleAssigneeFiltersUpdate: (assigneeId: string | undefined) => void;
  distribution: TAssigneeData;
  isEditable?: boolean;
};

export const AssigneeStatComponent = observer(function AssigneeStatComponent(props: TAssigneeStatComponent) {
  const { distribution, isEditable, selectedAssigneeIds, handleAssigneeFiltersUpdate } = props;
  const { t } = useTranslation();
  return (
    <div>
      {distribution && distribution.length > 0 ? (
        distribution.map((assignee, index) => {
          if (assignee?.id)
            return (
              <SingleProgressStats
                key={assignee?.id}
                title={
                  <div className="flex items-center gap-2 truncate">
                    <Avatar
                      alt={assignee?.title ?? undefined}
                      fallback={assignee?.title?.[0]?.toUpperCase()}
                      src={getFileURL(assignee?.avatar_url ?? "")}
                      size="2xs"
                    />
                    <span className="truncate">{assignee?.title ?? ""}</span>
                  </div>
                }
                completed={assignee?.completed ?? 0}
                total={assignee?.total ?? 0}
                {...(isEditable && {
                  onClick: () => handleAssigneeFiltersUpdate(assignee.id),
                  selected: assignee.id ? selectedAssigneeIds.includes(assignee.id) : false,
                })}
              />
            );
          else
            return (
              <SingleProgressStats
                key={`unassigned-${index}`}
                title={
                  <div className="flex items-center gap-2 truncate">
                    <Avatar size="2xs" />
                    <span className="truncate">{t("no_assignee")}</span>
                  </div>
                }
                completed={assignee?.completed ?? 0}
                total={assignee?.total ?? 0}
              />
            );
        })
      ) : (
        <EmptyStateCompact assetKey="members" title={t("no_assignee")} />
      )}
    </div>
  );
});
