import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
// ui
import { StateGroupIcon } from "@plane/ui";

export interface IStateGroupHeader {
  column_id: string;
  column_value: any;
  issues_count: number;
}

export const Icon = ({ stateGroup, color }: { stateGroup: any; color?: any }) => (
  <div className="w-[14px] h-[14px] rounded-full">
    <StateGroupIcon stateGroup={stateGroup} color={color || null} width="14" height="14" />
  </div>
);

export const StateGroupHeader: FC<IStateGroupHeader> = observer((props) => {
  const { column_id, column_value, issues_count } = props;

  const stateGroup = column_value ?? null;

  return (
    <>
      {stateGroup && (
        <HeaderGroupByCard
          icon={<Icon stateGroup={stateGroup?.key} />}
          title={stateGroup?.key || ""}
          count={issues_count}
          issuePayload={{}}
        />
      )}
    </>
  );
});
