import React from "react";
// lucide icons
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  StateGroupBacklogIcon,
  StateGroupCancelledIcon,
  StateGroupCompletedIcon,
  StateGroupStartedIcon,
  StateGroupUnstartedIcon,
} from "components/icons";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

export const StateGroupIcons = ({
  stateGroup,
  width = "14px",
  height = "14px",
  color = null,
}: {
  stateGroup: string;
  width?: string | undefined;
  height?: string | undefined;
  color?: string | null;
}) => {
  if (stateGroup === "cancelled")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] flex justify-center items-center">
        <StateGroupCancelledIcon
          width={width}
          height={height}
          color={color ? color : STATE_GROUP_COLORS[stateGroup]}
        />
      </div>
    );
  if (stateGroup === "completed")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] flex justify-center items-center">
        <StateGroupCompletedIcon
          width={width}
          height={height}
          color={color ? color : STATE_GROUP_COLORS[stateGroup]}
        />
      </div>
    );
  if (stateGroup === "started")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] flex justify-center items-center">
        <StateGroupStartedIcon
          width={width}
          height={height}
          color={color ? color : STATE_GROUP_COLORS[stateGroup]}
        />
      </div>
    );
  if (stateGroup === "unstarted")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] flex justify-center items-center">
        <StateGroupUnstartedIcon
          width={width}
          height={height}
          color={color ? color : STATE_GROUP_COLORS[stateGroup]}
        />
      </div>
    );
  if (stateGroup === "backlog")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] flex justify-center items-center">
        <StateGroupBacklogIcon
          width={width}
          height={height}
          color={color ? color : STATE_GROUP_COLORS[stateGroup]}
        />
      </div>
    );
  return <></>;
};

export const FilterStateGroup = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  return (
    <div>
      <FilterHeader
        title={"State Group"}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {issueFilterStore?.issueRenderFilters?.state_group &&
            issueFilterStore?.issueRenderFilters?.state_group.length > 0 &&
            issueFilterStore?.issueRenderFilters?.state_group.map((_stateGroup) => (
              <FilterOption
                key={_stateGroup?.key}
                isChecked={
                  issueFilterStore?.userFilters?.filters?.state_group != null &&
                  issueFilterStore?.userFilters?.filters?.state_group.includes(_stateGroup?.key)
                    ? true
                    : false
                }
                icon={<StateGroupIcons stateGroup={_stateGroup.key} />}
                title={_stateGroup.title}
              />
            ))}
        </div>
      )}
    </div>
  );
});
