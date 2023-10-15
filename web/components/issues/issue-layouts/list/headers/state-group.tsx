// mobx
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { StateGroupIcon } from "components/icons";
// constants
import { issueStateGroupByKey } from "constants/issue";

export interface IStateGroupHeader {
  column_id: string;
  issues_count: number;
}

export const Icon = ({ stateGroup, color }: { stateGroup: any; color?: any }) => (
  <div className="w-[14px] h-[14px] rounded-full">
    <StateGroupIcon stateGroup={stateGroup} color={color || null} width="14" height="14" />
  </div>
);

export const StateGroupHeader: React.FC<IStateGroupHeader> = observer(({ column_id, issues_count }) => {
  const stateGroup = column_id && issueStateGroupByKey(column_id);

  return (
    <>
      {stateGroup && (
        <HeaderGroupByCard
          icon={<Icon stateGroup={stateGroup?.key} />}
          title={stateGroup?.key || ""}
          count={issues_count}
        />
      )}
    </>
  );
});
