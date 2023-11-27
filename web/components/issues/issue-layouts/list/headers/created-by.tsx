import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { Icon } from "./assignee";
import { EProjectStore } from "store/command-palette.store";

export interface ICreatedByHeader {
  column_id: string;
  column_value: any;
  issues_count: number;
  disableIssueCreation?: boolean;
  currentStore: EProjectStore;
}

export const CreatedByHeader: FC<ICreatedByHeader> = observer((props) => {
  const { column_value, issues_count, disableIssueCreation, currentStore } = props;

  const createdBy = column_value ?? null;

  return (
    <>
      {createdBy && (
        <HeaderGroupByCard
          icon={<Icon user={createdBy} />}
          title={createdBy?.display_name || ""}
          count={issues_count}
          issuePayload={{ created_by: createdBy?.member?.id }}
          disableIssueCreation={disableIssueCreation}
          currentStore={currentStore}
        />
      )}
    </>
  );
});
