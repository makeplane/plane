import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
import { StateGroupIcon } from "@plane/ui";

export interface IStateGroupHeader {
  column_id: string;
  column_value: any;
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
  kanBanToggle: any;
  handleKanBanToggle: any;
}

export const Icon = ({ stateGroup, color }: { stateGroup: any; color?: any }) => (
  <div className="w-3.5 h-3.5 rounded-full">
    <StateGroupIcon stateGroup={stateGroup} color={color || null} width="14" height="14" />
  </div>
);

export const StateGroupHeader: FC<IStateGroupHeader> = observer((props) => {
  const {
    column_id,
    column_value,
    sub_group_by,
    group_by,
    header_type,
    issues_count,
    kanBanToggle,
    handleKanBanToggle,
  } = props;

  const stateGroup = column_value || null;

  return (
    <>
      {stateGroup &&
        (sub_group_by && header_type === "sub_group_by" ? (
          <HeaderSubGroupByCard
            column_id={column_id}
            icon={<Icon stateGroup={stateGroup?.key} />}
            title={stateGroup?.key || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        ) : (
          <HeaderGroupByCard
            sub_group_by={sub_group_by}
            group_by={group_by}
            column_id={column_id}
            icon={<Icon stateGroup={stateGroup?.key} />}
            title={stateGroup?.key || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            issuePayload={{}}
          />
        ))}
    </>
  );
});
