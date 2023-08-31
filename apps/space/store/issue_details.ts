import { makeObservable, observable, action, runInAction } from "mobx";
// store
import { RootStore } from "./root";
// services
import IssueService from "services/issue.service";
import { IIssue } from "types";

export type IPeekMode = "side" | "modal" | "full";

export interface IIssueDetailStore {
  loader: boolean;
  error: any;
  // peek info
  peekId: string | null;
  peekMode: IPeekMode;
  details: {
    [key: string]: IIssue;
  };
  // peek actions
  setPeekId: (issueId: string | null) => void;
  setPeekMode: (mode: IPeekMode) => void;
  // issue details
  fetchIssueDetails: (workspaceId: string, projectId: string, issueId: string) => void;
  // issue comments
  addIssueComment: (workspaceId: string, projectId: string, issueId: string, data: any) => Promise<void>;
  deleteIssueComment: (workspaceId: string, projectId: string, issueId: string) => void;
  // issue reactions
  addIssueReaction: (workspaceId: string, projectId: string, issueId: string, data: any) => void;
  removeIssueReaction: (workspaceId: string, projectId: string, issueId: string, data: any) => void;
  // issue votes
  addIssueVote: (workspaceId: string, projectId: string, issueId: string, data: { vote: 1 | -1 }) => Promise<void>;
  removeIssueVote: (workspaceId: string, projectId: string, issueId: string) => Promise<void>;
}

class IssueDetailStore implements IssueDetailStore {
  loader: boolean = false;
  error: any = null;
  peekId: string | null = null;
  peekMode: IPeekMode = "side";
  details: {
    [key: string]: IIssue;
  } = {};
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
      const commentsResponse = await this.issueService.getIssueComments(workspaceSlug, projectId, issueId);

      if (issueDetails) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...issueDetails,
              comments: commentsResponse,
            },
          };
        });
      }
    } catch (error) {
      this.loader = false;
      this.error = error;
    }
  };

  addIssueComment = async (workspaceSlug: string, projectId: string, issueId: string, data: any) => {
    try {
      const issueDetails = this.rootStore.issue.issues?.find((i) => i.id === issueId);
      const issueCommentResponse = await this.issueService.createIssueComment(workspaceSlug, projectId, issueId, data);
      console.log("issueCommentResponse", issueCommentResponse);
      if (issueDetails) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...issueDetails,
              comments: [...this.details[issueId].comments, issueCommentResponse],
            },
          };
        });
      }
      return issueCommentResponse;
    } catch (error) {
      console.log("Failed to add issue comment");
      throw error;
    }
  };

  updateIssueComment = async (workspaceSlug: string, projectId: string, issueId: string, data: any) => {
    try {
      const issueVoteResponse = await this.issueService.updateIssueComment(workspaceSlug, projectId, issueId, data);
      if (issueVoteResponse) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...issueDetails,
              comments: commentsResponse,
            },
          };
        });
      }
    } catch (error) {
      console.log("Failed to add issue comment");
    }
  };

  deleteIssueComment = async () => {
    try {
      const issueVoteResponse = await this.issueService.deleteIssueComment(workspaceSlug, projectId, issueId, data);
      // const issueDetails = await this.issueService.fetchIssueDetails(workspaceSlug, projectId, issueId);

      if (issueVoteResponse) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...issueDetails,
            },
          };
        });
      }
    } catch (error) {
      console.log("Failed to add issue vote");
    }
  };

  addIssueReaction = async (workspaceSlug: string, projectId: string, issueId: string, data: any) => {
    try {
      const issueVoteResponse = await this.issueService.createIssueReaction(workspaceSlug, projectId, issueId, data);
      const issueDetails = await this.issueService.getIssueById(workspaceSlug, projectId, issueId);

      if (issueVoteResponse) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...issueDetails,
            },
          };
        });
      }
    } catch (error) {
      console.log("Failed to add issue vote");
    }
  };

  removeIssueReaction = async (workspaceSlug: string, projectId: string, issueId: string, data: any) => {
    try {
      const issueVoteResponse = await this.issueService.deleteIssueReaction(workspaceSlug, projectId, issueId, data);
      const issueDetails = await this.issueService.getIssueById(workspaceSlug, projectId, issueId);

      if (issueVoteResponse && issueDetails) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...issueDetails,
            },
          };
        });
      }
    } catch (error) {
      console.log("Failed to add issue vote");
    }
  };

  addIssueVote = async (workspaceSlug: string, projectId: string, issueId: string, data: { vote: 1 | -1 }) => {
    try {
      const issueVoteResponse = await this.issueService.createIssueVote(workspaceSlug, projectId, issueId, data);
      const issueDetails = await this.issueService.getIssueById(workspaceSlug, projectId, issueId);

      if (issueVoteResponse) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...issueDetails,
            },
          };
        });
      }
    } catch (error) {
      console.log("Failed to add issue vote");
    }
  };

  removeIssueVote = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const issueVoteResponse = await this.issueService.deleteIssueVote(workspaceSlug, projectId, issueId);
      const issueDetails = await this.issueService.getIssueById(workspaceSlug, projectId, issueId);

      if (issueVoteResponse) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...issueDetails,
            },
          };
        });
      }
    } catch (error) {
      console.log("Failed to remove issue vote");
    }
  };
}

export default IssueDetailStore;
