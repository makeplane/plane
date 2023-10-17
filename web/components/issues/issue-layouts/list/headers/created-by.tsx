import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { Icon } from "./assignee";

export interface ICreatedByHeader {
  column_id: string;
  column_value: any;
  issues_count: number;
}

export const CreatedByHeader: FC<ICreatedByHeader> = observer((props) => {
  const { column_id, column_value, issues_count } = props;

  const createdBy = column_value ?? null;

  return (
    <>
      {createdBy && (
        <HeaderGroupByCard
          icon={<Icon user={createdBy?.member} />}
          title={createdBy?.member?.display_name || ""}
          count={issues_count}
        />
      )}
    </>
  );
});
