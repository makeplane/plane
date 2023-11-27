import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
import { EProjectStore } from "store/command-palette.store";

export interface ILabelHeader {
  column_id: string;
  column_value: any;
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
  kanBanToggle: any;
  handleKanBanToggle: any;
  disableIssueCreation?: boolean;
  currentStore?: EProjectStore;
}

const Icon = ({ color }: any) => (
  <div className="w-[12px] h-[12px] rounded-full" style={{ backgroundColor: color ? color : "#666" }} />
);

export const LabelHeader: FC<ILabelHeader> = observer((props) => {
  const {
    column_id,
    column_value,
    sub_group_by,
    group_by,
    header_type,
    issues_count,
    kanBanToggle,
    handleKanBanToggle,
    disableIssueCreation,
    currentStore,
  } = props;

  const label = column_value ?? null;

  return (
    <>
      {label &&
        (sub_group_by && header_type === "sub_group_by" ? (
          <HeaderSubGroupByCard
            column_id={column_id}
            icon={<Icon color={label?.color} />}
            title={label?.name || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        ) : (
          <HeaderGroupByCard
            sub_group_by={sub_group_by}
            group_by={group_by}
            column_id={column_id}
            icon={<Icon />}
            title={label?.name || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            issuePayload={{ labels: [label?.id] }}
            disableIssueCreation={disableIssueCreation}
            currentStore={currentStore}
          />
        ))}
    </>
  );
});
