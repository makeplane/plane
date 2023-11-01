import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// ui
import { Avatar } from "@plane/ui";

export interface IAssigneesHeader {
  column_id: string;
  column_value: any;
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
  kanBanToggle: any;
  handleKanBanToggle: any;
}

export const Icon = ({ user }: any) => <Avatar name={user.display_name} src={user.avatar} size="base" />;

export const AssigneesHeader: FC<IAssigneesHeader> = observer((props) => {
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

  const assignee = column_value ?? null;

  return (
    <>
      {assignee &&
        (sub_group_by && header_type === "sub_group_by" ? (
          <HeaderSubGroupByCard
            column_id={column_id}
            icon={<Icon user={assignee?.member} />}
            title={assignee?.member?.display_name || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        ) : (
          <HeaderGroupByCard
            sub_group_by={sub_group_by}
            group_by={group_by}
            column_id={column_id}
            icon={<Icon user={assignee?.member} />}
            title={assignee?.member?.display_name || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            issuePayload={{ assignees: [assignee?.member?.id] }}
          />
        ))}
    </>
  );
});
