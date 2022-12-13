// components
import SingleBoard from "components/project/cycles/BoardView/single-board";
// ui
import { Spinner } from "ui";
// types
import { IIssue, IProjectMember, NestedKeyOf, Properties } from "types";
import useUser from "lib/hooks/useUser";

type Props = {
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  properties: Properties;
  selectedGroup: NestedKeyOf<IIssue> | null;
  members: IProjectMember[] | undefined;
  openCreateIssueModal: (
    sprintId: string,
    issue?: IIssue,
    actionType?: "create" | "edit" | "delete"
  ) => void;
  openIssuesListModal: (cycleId: string) => void;
  removeIssueFromCycle: (cycleId: string, bridgeId: string) => void;
};

const CyclesBoardView: React.FC<Props> = ({
  groupedByIssues,
  properties,
  selectedGroup,
  members,
  openCreateIssueModal,
  openIssuesListModal,
  removeIssueFromCycle,
}) => {
  const { states } = useUser();

  return (
    <>
      {groupedByIssues ? (
        <div className="h-full w-full">
          <div className="h-full w-full overflow-hidden">
            <div className="h-full w-full">
              <div className="flex gap-x-4 h-full overflow-x-auto overflow-y-hidden pb-3">
                {Object.keys(groupedByIssues).map((singleGroup) => (
                  <SingleBoard
                    key={singleGroup}
                    selectedGroup={selectedGroup}
                    groupTitle={singleGroup}
                    createdBy={
                      selectedGroup === "created_by"
                        ? members?.find((m) => m.member.id === singleGroup)?.member.first_name ??
                          "loading..."
                        : null
                    }
                    groupedByIssues={groupedByIssues}
                    bgColor={
                      selectedGroup === "state_detail.name"
                        ? states?.find((s) => s.name === singleGroup)?.color
                        : undefined
                    }
                    properties={properties}
                    removeIssueFromCycle={removeIssueFromCycle}
                    openIssuesListModal={openIssuesListModal}
                    openCreateIssueModal={openCreateIssueModal}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex justify-center items-center">
          <Spinner />
        </div>
      )}
    </>
  );
};

export default CyclesBoardView;
