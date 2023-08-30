import { makeObservable, observable, action, runInAction } from "mobx";
// store
import { RootStore } from "./root";
// services
import IssueService from "services/issue.service";

export type IPeekMode = "side" | "modal" | "full";

export interface IIssueDetailStore {
  loader: boolean;
  error: any;
  // peek info
  peekId: string | null;
  peekMode: IPeekMode;
  details: any;
  // actions
  setPeekId: (issueId: string | null) => void;
  setPeekMode: (mode: IPeekMode) => void;
  fetchIssueDetails: (workspaceId: string, projectId: string, issueId: string) => void;
}

class IssueDetailStore implements IssueDetailStore {
  loader: boolean = false;
  error: any = null;
  peekId: string | null = null;
  peekMode: IPeekMode = "side";
  details: any = {};
  issueService: any;
  rootStore: RootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,
      // peek
      peekId: observable.ref,
      peekMode: observable.ref,
      details: observable.ref,
      // actions
      setPeekId: action,
      fetchIssueDetails: action,
      setPeekMode: action,
    });
    this.issueService = new IssueService();
    this.rootStore = _rootStore;
  }

  setPeekId = (issueId: string | null) => {
    this.peekId = issueId;
  };

  setPeekMode = (mode: IPeekMode) => {
    this.peekMode = mode;
  };

  fetchIssueDetails = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const issueDetails = this.rootStore.issue.issues?.find((i) => i.id === issueId);
      const reactionsResponse = await this.issueService.getIssueReactions(workspaceSlug, projectId, issueId);
      const commentsResponse = await this.issueService.getIssueComments(workspaceSlug, projectId, issueId);
      const votesResponse = await this.issueService.getIssueVotes(workspaceSlug, projectId, issueId);

      if (issueDetails) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...issueDetails,
              comments: commentsResponse,
              reactions: reactionsResponse,
              votes: votesResponse,
            },
          };
        });
      }
    } catch (error) {
      this.loader = false;
      this.error = error;

      const issueDetails = this.rootStore.issue.issues?.find((i) => i.id === issueId);

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueId]: {
            ...issueDetails,
            comments: [],
            reactions: [],
            votes: [],
          },
        };
      });
    }
  };
}

export default IssueDetailStore;
