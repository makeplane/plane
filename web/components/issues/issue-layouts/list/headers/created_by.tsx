// mobx
import { observer } from "mobx-react-lite";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { Icon } from "./assignee";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface ICreatedByHeader {
  column_id: string;
  issues_count: number;
}

export const CreatedByHeader: React.FC<ICreatedByHeader> = observer(({ column_id, issues_count }) => {
  const { project: projectStore }: RootStore = useMobxStore();

  const createdBy = (column_id && projectStore?.getProjectMemberByUserId(column_id)) ?? null;

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
