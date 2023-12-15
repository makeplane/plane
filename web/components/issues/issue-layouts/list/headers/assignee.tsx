import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
// ui
import { Avatar } from "@plane/ui";
import { EProjectStore } from "store/command-palette.store";
import { IIssue } from "types";

export interface IAssigneesHeader {
  column_id: string;
  column_value: any;
  issues_count: number;
  disableIssueCreation?: boolean;
  currentStore: EProjectStore;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
}

export const Icon = ({ user }: any) => <Avatar name={user.display_name} src={user.avatar} size="md" />;

export const AssigneesHeader: FC<IAssigneesHeader> = observer((props) => {
  const { column_value, issues_count, disableIssueCreation, currentStore, addIssuesToView } = props;

  const assignee = column_value ?? null;

  return (
    <>
      {assignee && (
        <HeaderGroupByCard
          icon={<Icon user={assignee} />}
          title={assignee?.display_name || ""}
          count={issues_count}
          issuePayload={{ assignees: [assignee?.member?.id] }}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
          addIssuesToView={addIssuesToView}
        />
      )}
    </>
  );
});
