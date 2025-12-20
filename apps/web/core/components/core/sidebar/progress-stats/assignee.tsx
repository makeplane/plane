import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// assets
import emptyMembers from "@/app/assets/empty-state/empty_members.svg?url";
import userImage from "@/app/assets/user.png?url";
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
                  <div className="flex items-center gap-2">
                    <Avatar name={assignee?.title ?? undefined} src={getFileURL(assignee?.avatar_url ?? "")} />
                    <span>{assignee?.title ?? ""}</span>
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
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-subtle bg-layer-1">
                      <img src={userImage} className="rounded-full w-full h-full object-cover" alt="User" />
                    </div>
                    <span>{t("no_assignee")}</span>
                  </div>
                }
                completed={assignee?.completed ?? 0}
                total={assignee?.total ?? 0}
              />
            );
        })
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-layer-1">
            <img src={emptyMembers} className="h-12 w-12 object-contain" alt="empty members" />
          </div>
          <h6 className="text-14 text-tertiary">{t("no_assignee")}</h6>
        </div>
      )}
    </div>
  );
});
