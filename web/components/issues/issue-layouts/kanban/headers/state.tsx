import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
import { Icon } from "./state-group";
import { EProjectStore } from "store/command-palette.store";

export interface IStateHeader {
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

export const StateHeader: FC<IStateHeader> = observer((props) => {
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

  const state = column_value ?? null;

  return (
    <>
      {state &&
        (sub_group_by && header_type === "sub_group_by" ? (
          <HeaderSubGroupByCard
            column_id={column_id}
            icon={<Icon stateGroup={state?.group} color={state?.color} />}
            title={state?.name || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        ) : (
          <HeaderGroupByCard
            sub_group_by={sub_group_by}
            group_by={group_by}
            column_id={column_id}
            icon={<Icon stateGroup={state?.group} color={state?.color} />}
            title={state?.name || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            issuePayload={{ state: state?.id }}
            disableIssueCreation={disableIssueCreation}
            currentStore={currentStore}
          />
        ))}
    </>
  );
});
