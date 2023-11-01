import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
import { Icon } from "./assignee";

export interface ICreatedByHeader {
  column_id: string;
  column_value: any;
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
  kanBanToggle: any;
  handleKanBanToggle: any;
}

export const CreatedByHeader: FC<ICreatedByHeader> = observer((props) => {
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

  const createdBy = column_value ?? null;

  return (
    <>
      {createdBy &&
        (sub_group_by && header_type === "sub_group_by" ? (
          <HeaderSubGroupByCard
            column_id={column_id}
            icon={<Icon user={createdBy?.member} />}
            title={createdBy?.member?.display_name || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        ) : (
          <HeaderGroupByCard
            sub_group_by={sub_group_by}
            group_by={group_by}
            column_id={column_id}
            icon={<Icon user={createdBy?.member} />}
            title={createdBy?.member?.display_name || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            issuePayload={{ created_by: createdBy?.member?.id }}
          />
        ))}
    </>
  );
});
