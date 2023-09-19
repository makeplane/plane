import { useRouter } from "next/router";

// hooks
import useMyIssues from "hooks/my-issues/use-my-issues";
import useIssuesView from "hooks/use-issues-view";
import useProfileIssues from "hooks/use-profile-issues";
// components
import { SingleList } from "components/core/views/list-view/single-list";
import { IssuePeekOverview } from "components/issues";
// types
import { ICurrentUserResponse, IIssue, IIssueViewProps, IState, UserAuth } from "types";

// types
type Props = {
  states: IState[] | undefined;
  addIssueToGroup: (groupTitle: string) => void;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  handleDraftIssueAction?: (issue: IIssue, action: "edit" | "delete") => void;
  openIssuesListModal?: (() => void) | null;
  myIssueProjectId?: string | null;
  handleMyIssueOpen?: (issue: IIssue) => void;
  removeIssue: ((bridgeId: string, issueId: string) => void) | null;
  disableUserActions: boolean;
  disableAddIssueOption?: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  viewProps: IIssueViewProps;
};

export const AllLists: React.FC<Props> = ({
  addIssueToGroup,
  handleIssueAction,
  disableUserActions,
  disableAddIssueOption = false,
  openIssuesListModal,
  handleMyIssueOpen,
  myIssueProjectId,
  removeIssue,
  states,
  handleDraftIssueAction,
  user,
  userAuth,
  viewProps,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, userId } = router.query;

  const isProfileIssue =
    router.pathname.includes("assigned") ||
    router.pathname.includes("created") ||
    router.pathname.includes("subscribed");

  const isMyIssue = router.pathname.includes("my-issues");
  const { mutateIssues } = useIssuesView();
  const { mutateMyIssues } = useMyIssues(workspaceSlug?.toString());
  const { mutateProfileIssues } = useProfileIssues(workspaceSlug?.toString(), userId?.toString());

  const { displayFilters, groupedIssues } = viewProps;

  return (
    <>
      <IssuePeekOverview
        handleMutation={() =>
          isMyIssue ? mutateMyIssues() : isProfileIssue ? mutateProfileIssues() : mutateIssues()
        }
        projectId={myIssueProjectId ? myIssueProjectId : projectId?.toString() ?? ""}
        workspaceSlug={workspaceSlug?.toString() ?? ""}
        readOnly={disableUserActions}
      />
      {groupedIssues && (
        <div className="h-full overflow-y-auto">
          {Object.keys(groupedIssues).map((singleGroup) => {
            const currentState =
              displayFilters?.group_by === "state"
                ? states?.find((s) => s.id === singleGroup)
                : null;

            if (!displayFilters?.show_empty_groups && groupedIssues[singleGroup].length === 0)
              return null;

            return (
              <SingleList
                key={singleGroup}
                groupTitle={singleGroup}
                currentState={currentState}
                addIssueToGroup={() => addIssueToGroup(singleGroup)}
                handleDraftIssueAction={handleDraftIssueAction}
                handleIssueAction={handleIssueAction}
                handleMyIssueOpen={handleMyIssueOpen}
                openIssuesListModal={openIssuesListModal}
                removeIssue={removeIssue}
                disableUserActions={disableUserActions}
                disableAddIssueOption={disableAddIssueOption}
                user={user}
                userAuth={userAuth}
                viewProps={viewProps}
              />
            );
          })}
        </div>
      )}
    </>
  );
};
