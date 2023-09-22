import React, { useState } from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// ui
import { Avatar } from "components/ui";

type Props = { onClick: (stateId: string) => void };

export const FilterAssignees: React.FC<Props> = observer((props) => {
  const { onClick } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const router = useRouter();
  const { projectId } = router.query;

  const store = useMobxStore();
  const { issueFilter: issueFilterStore, project: projectStore } = store;

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
              onClick={() => onClick(member.member?.id)}
              icon={<Avatar user={member.member} height="18px" width="18px" />}
              title={member.member?.display_name}
            />
          ))}
        </div>
      )}
    </div>
  );
});
