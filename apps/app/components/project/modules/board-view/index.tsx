// components
import SingleBoard from "components/project/modules/board-view/single-board";
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
  openCreateIssueModal: (issue?: IIssue, actionType?: "create" | "edit" | "delete") => void;
  openIssuesListModal: () => void;
  removeIssueFromModule: (issueId: string) => void;
  partialUpdateIssue: (formData: Partial<IIssue>, issueId: string) => void;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  setPreloadedData: React.Dispatch<
    React.SetStateAction<
      | (Partial<IIssue> & {
          actionType: "createIssue" | "edit" | "delete";
        })
      | undefined
    >
  >;
};

const ModulesBoardView: React.FC<Props> = ({
  groupedByIssues,
  properties,
  selectedGroup,
  members,
  openCreateIssueModal,
  openIssuesListModal,
  removeIssueFromModule,
  partialUpdateIssue,
  handleDeleteIssue,
  setPreloadedData,
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
                    removeIssueFromModule={removeIssueFromModule}
                    openIssuesListModal={openIssuesListModal}
                    openCreateIssueModal={openCreateIssueModal}
                    partialUpdateIssue={partialUpdateIssue}
                    handleDeleteIssue={handleDeleteIssue}
                    setPreloadedData={setPreloadedData}
                    stateId={
                      selectedGroup === "state_detail.name"
                        ? states?.find((s) => s.name === singleGroup)?.id ?? null
                        : null
                    }
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

export default ModulesBoardView;
