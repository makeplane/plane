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

export const FilterCreatedBy: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { issueFilter: issueFilterStore, project: projectStore } = store;

  const handleUpdateCreatedBy = (value: string) => {
    const newValues = issueFilterStore.userFilters?.created_by ?? [];

    if (issueFilterStore.userFilters?.created_by?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
    else newValues.push(value);

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        created_by: newValues,
      },
    });
  };

  return (
    <div>
      <FilterHeader
        title={`Created By (${issueFilterStore?.userFilters.created_by?.length ?? 0})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-1 pt-1">
          {projectStore.members?.[projectId?.toString() ?? ""]?.map((member) => (
            <FilterOption
              key={`created-by-${member.member?.id}`}
              isChecked={issueFilterStore?.userFilters?.created_by?.includes(member.member?.id) ? true : false}
              onClick={() => handleUpdateCreatedBy(member.member?.id)}
              icon={<Avatar user={member.member} height="18px" width="18px" />}
              title={member.member?.display_name}
            />
          ))}
        </div>
      )}
    </div>
  );
});
