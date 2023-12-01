import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// emoji helper
import { renderEmoji } from "helpers/emoji.helper";
import { EProjectStore } from "store/command-palette.store";
import { IIssue } from "types";

export interface IProjectHeader {
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
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
}

const Icon = ({ emoji }: any) => <div className="w-6 h-6">{renderEmoji(emoji)}</div>;

export const ProjectHeader: FC<IProjectHeader> = observer((props) => {
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
    addIssuesToView,
  } = props;

  const project = column_value ?? null;

  return (
    <>
      {project &&
        (sub_group_by && header_type === "sub_group_by" ? (
          <HeaderSubGroupByCard
            column_id={column_id}
            icon={<Icon emoji={project?.emoji} />}
            title={project?.name || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        ) : (
          <HeaderGroupByCard
            sub_group_by={sub_group_by}
            group_by={group_by}
            column_id={column_id}
            icon={<Icon emoji={project?.emoji} />}
            title={project?.name || ""}
            count={issues_count}
            kanBanToggle={kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
            issuePayload={{ project: project?.id }}
            disableIssueCreation={disableIssueCreation}
            currentStore={currentStore}
            addIssuesToView={addIssuesToView}
          />
        ))}
    </>
  );
});
