import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
// components
import { IssueView } from "./view";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { IIssue } from "types";
import { RootStore } from "store/root";
// constants
import { ISSUE_PRIORITIES } from "constants/issue";

interface IIssuePeekOverview {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  handleIssue: (issue: Partial<IIssue>) => void;
  children: ReactNode;
}

export const IssuePeekOverview: FC<IIssuePeekOverview> = observer((props) => {
  const { workspaceSlug, projectId, issueId, handleIssue, children } = props;

  const { project: projectStore, issueDetail: issueDetailStore }: RootStore = useMobxStore();

  const states = projectStore?.projectStates || undefined;
  const members = projectStore?.projectMembers || undefined;
  const priorities = ISSUE_PRIORITIES || undefined;

  const issueUpdate = (_data: Partial<IIssue>) => {
    if (handleIssue) {
      handleIssue(_data);
      issueDetailStore.updateIssue(workspaceSlug, projectId, issueId, _data, undefined);
    }
  };

  return (
    <IssueView
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      states={states}
      members={members}
      priorities={priorities}
      issueUpdate={issueUpdate}
    >
      {children}
    </IssueView>
  );
});
