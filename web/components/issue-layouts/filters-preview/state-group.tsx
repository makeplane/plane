import React from "react";
import {
  StateGroupBacklogIcon,
  StateGroupCancelledIcon,
  StateGroupCompletedIcon,
  StateGroupStartedIcon,
  StateGroupUnstartedIcon,
} from "components/icons";
// components
import { FilterPreviewHeader } from "./helpers/header";
import { FilterPreviewContent } from "./helpers/content";
import { FilterPreviewClear } from "./helpers/clear";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// constants
import { STATE_GROUP_COLORS } from "constants/state";

export const StateGroupIcons = ({ stateGroup, color = null }: { stateGroup: string; color?: string | null }) => {
  if (stateGroup === "cancelled")
    return (
      <StateGroupCancelledIcon width={"12px"} height={"12px"} color={color ? color : STATE_GROUP_COLORS[stateGroup]} />
    );
  if (stateGroup === "completed")
    return (
      <StateGroupCompletedIcon width={"12px"} height={"12px"} color={color ? color : STATE_GROUP_COLORS[stateGroup]} />
    );
  if (stateGroup === "started")
    return (
      <StateGroupStartedIcon width={"12px"} height={"12px"} color={color ? color : STATE_GROUP_COLORS[stateGroup]} />
    );
  if (stateGroup === "unstarted")
    return (
      <StateGroupUnstartedIcon width={"12px"} height={"12px"} color={color ? color : STATE_GROUP_COLORS[stateGroup]} />
    );
  if (stateGroup === "backlog")
    return (
      <div className="flex-shrink-0 rounded-sm overflow-hidden w-[20px] h-[20px] flex justify-center items-center">
        <StateGroupBacklogIcon width={"12px"} height={"12px"} color={color ? color : STATE_GROUP_COLORS[stateGroup]} />
      </div>
    );
  return <></>;
};

export const stateStyles = (stateGroup: string, color: any) => {
  if (stateGroup === "cancelled") {
    return {
      color: color ? color : STATE_GROUP_COLORS[stateGroup],
      backgroundColor: `${color ? color : STATE_GROUP_COLORS[stateGroup]}20`,
    };
  }
  if (stateGroup === "completed") {
    return {
      color: color ? color : STATE_GROUP_COLORS[stateGroup],
      backgroundColor: `${color ? color : STATE_GROUP_COLORS[stateGroup]}20`,
    };
  }
  if (stateGroup === "started") {
    return {
      color: color ? color : STATE_GROUP_COLORS[stateGroup],
      backgroundColor: `${color ? color : STATE_GROUP_COLORS[stateGroup]}20`,
    };
  }
  if (stateGroup === "unstarted") {
    return {
      color: color ? color : STATE_GROUP_COLORS[stateGroup],
      backgroundColor: `${color ? color : STATE_GROUP_COLORS[stateGroup]}20`,
    };
  }
  if (stateGroup === "backlog") {
    return {
      color: color ? color : STATE_GROUP_COLORS[stateGroup],
      backgroundColor: `${color ? color : STATE_GROUP_COLORS[stateGroup]}20`,
    };
  }
};

export const FilterStateGroup = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore } = store;

  const handleFilter = (key: string, value: string) => {
    let _value =
      issueFilterStore?.userFilters?.filters?.[key] != null &&
      issueFilterStore?.userFilters?.filters?.[key].filter((p: string) => p != value);
    _value = _value && _value.length > 0 ? _value : null;
    issueFilterStore.handleUserFilter("filters", key, _value);
  };

  const clearFilter = () => {
    issueFilterStore.handleUserFilter("filters", "state_group", null);
  };

  return (
    <>
      {issueFilterStore?.userFilters?.filters?.state_group != null && (
        <div className="border border-custom-border-200 bg-custom-background-80 rounded-full overflow-hidden flex items-center gap-2 px-2 py-1">
          <div className="flex-shrink-0">
            <FilterPreviewHeader
              title={`State Group (${issueFilterStore?.userFilters?.filters?.state_group?.length || 0})`}
            />
          </div>
          <div className="relative flex items-center flex-wrap gap-2">
            {issueFilterStore?.issueRenderFilters?.state_group &&
              issueFilterStore?.issueRenderFilters?.state_group.length > 0 &&
              issueFilterStore?.issueRenderFilters?.state_group.map(
                (_stateGroup) =>
                  issueFilterStore?.userFilters?.filters?.state_group != null &&
                  issueFilterStore?.userFilters?.filters?.state_group.includes(_stateGroup?.key) && (
                    <FilterPreviewContent
                      key={_stateGroup?.key}
                      icon={<StateGroupIcons stateGroup={_stateGroup.key} />}
                      title={_stateGroup.title}
                      style={stateStyles(_stateGroup?.key, null)}
                      onClick={() => handleFilter("state_group", _stateGroup?.key)}
                    />
                  )
              )}
            <div className="flex-shrink-0">
              <FilterPreviewClear onClick={clearFilter} />
            </div>
          </div>
        </div>
      )}
    </>
  );
});
