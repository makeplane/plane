import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// ui
import { Avatar } from "components/ui";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const FilterAssignees: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { issueFilter: issueFilterStore, project: projectStore } = store;

  const handleUpdateAssignees = (value: string) => {
    const newValues = issueFilterStore.userFilters?.assignees ?? [];

    if (issueFilterStore.userFilters?.assignees?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
    else newValues.push(value);

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        assignees: newValues,
      },
    });
  };

  return (
    <div>
      <FilterHeader
        title={`Assignees (${issueFilterStore?.userFilters.assignees?.length ?? 0})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {projectStore.members?.[projectId?.toString() ?? ""]?.map((member) => (
            <FilterOption
              key={`assignees-${member?.member?.id}`}
              isChecked={
                issueFilterStore?.userFilters?.assignees != null &&
                issueFilterStore?.userFilters?.assignees.includes(member.member?.id)
                  ? true
                  : false
              }
              onClick={() => handleUpdateAssignees(member.member?.id)}
              icon={<Avatar user={member.member} height="18px" width="18px" />}
              title={member.member?.display_name}
            />
          ))}
        </div>
      )}
    </div>
  );
});
