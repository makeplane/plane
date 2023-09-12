import React from "react";
// lucide icons
import { Check, ChevronDown, ChevronUp } from "lucide-react";
// components
import { FilterHeader } from "./filter-header";
import { FilterCard } from "./filter-card";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const MemberIcons = ({
  display_name,
  avatar,
}: {
  display_name: string;
  avatar: string | null;
}) => (
  <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] flex justify-center items-center bg-custom-background-80">
    {avatar ? (
      <img src={avatar} alt={display_name || ""} className="" />
    ) : (
      <div className="text-[12px] w-full h-full flex justify-center items-center capitalize font-medium bg-gray-700 text-white">
        {(display_name ?? "U")[0]}
      </div>
    )}
  </div>
);

export const FilterAssignees = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(false);

  return (
    <div>
      <FilterHeader
        title={"Assignees"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={setPreviewEnabled}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.projectMembers &&
            issueFilterStore?.projectMembers.length > 0 &&
            issueFilterStore?.projectMembers.map((_member) => (
              <FilterCard
                key={`assignees-${_member?.member?.id}`}
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
