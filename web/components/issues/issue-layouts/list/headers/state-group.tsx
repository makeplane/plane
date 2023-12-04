import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
// ui
import { StateGroupIcon } from "@plane/ui";
// helpers
import { capitalizeFirstLetter } from "helpers/string.helper";
import { EProjectStore } from "store/command-palette.store";
import { IIssue } from "types";

export interface IStateGroupHeader {
  column_id: string;
  column_value: any;
  issues_count: number;
  disableIssueCreation?: boolean;
  currentStore: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
}

export const Icon = ({ stateGroup, color }: { stateGroup: any; color?: any }) => (
  <div className="w-[14px] h-[14px] rounded-full">
    <StateGroupIcon stateGroup={stateGroup} color={color || null} width="14" height="14" />
  </div>
);

export const StateGroupHeader: FC<IStateGroupHeader> = observer((props) => {
  const { column_value, issues_count, disableIssueCreation, currentStore, addIssuesToView } = props;

  const stateGroup = column_value ?? null;

  return (
    <>
      {stateGroup && (
        <HeaderGroupByCard
          icon={<Icon stateGroup={stateGroup?.key} />}
          title={capitalizeFirstLetter(stateGroup?.key) || ""}
          count={issues_count}
          issuePayload={{}}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
          addIssuesToView={addIssuesToView}
        />
      )}
    </>
  );
});
