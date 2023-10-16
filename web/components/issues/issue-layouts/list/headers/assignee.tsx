// mobx
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { Avatar } from "components/ui";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IAssigneesHeader {
  column_id: string;
  issues_count: number;
}

export const Icon = ({ user }: any) => <Avatar user={user} height="22px" width="22px" fontSize="12px" />;

export const AssigneesHeader: React.FC<IAssigneesHeader> = observer(({ column_id, issues_count }) => {
  const { project: projectStore }: RootStore = useMobxStore();

  const assignee = (column_id && projectStore?.getProjectMemberByUserId(column_id)) ?? null;

  return (
    <>
      {assignee && (
        <HeaderGroupByCard
          icon={<Icon user={assignee?.member} />}
          title={assignee?.member?.display_name || ""}
          count={issues_count}
        />
      )}
    </>
  );
});
