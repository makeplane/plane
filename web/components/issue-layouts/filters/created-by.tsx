import React from "react";
// lucide icons
import { Check, ChevronDown, ChevronUp } from "lucide-react";
// components
import { MemberIcons } from "./assignees";
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const FilterCreatedBy = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(false);

  return (
    <div>
      <FilterHeader
        title={"Created By"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={setPreviewEnabled}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.projectMembers &&
            issueFilterStore?.projectMembers.length > 0 &&
            issueFilterStore?.projectMembers.map((_member) => (
              <FilterOption
                key={`create-by-${_member?.member?.id}`}
                isChecked={false}
                icon={
                  <MemberIcons
                    display_name={_member?.member.display_name}
                    avatar={_member?.member.avatar}
                  />
                }
                title={`${_member?.member?.display_name} (${_member?.member?.first_name} ${_member?.member?.last_name})`}
              />
            ))}
        </div>
      )}
    </div>
  );
});
