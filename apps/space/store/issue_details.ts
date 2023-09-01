import { makeObservable, observable, action, runInAction } from "mobx";
// store
import { RootStore } from "./root";
// services
import IssueService from "services/issue.service";
import { IIssue } from "types/issue";

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
  updateIssueComment: (
    workspaceId: string,
    projectId: string,
    issueId: string,
    comment_id: string,
    data: any
  ) => Promise<any>;
  deleteIssueComment: (workspaceId: string, projectId: string, issueId: string, comment_id: string) => void;
  // issue reactions
  addIssueReaction: (workspaceId: string, projectId: string, issueId: string, data: any) => void;
  removeIssueReaction: (workspaceId: string, projectId: string, issueId: string, reactionId: string) => void;
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
  issueService;
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

  updateIssueComment = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: any
  ) => {
    try {
      const issueCommentUpdateResponse = await this.issueService.updateIssueComment(
        workspaceSlug,
        projectId,
        issueId,
        commentId,
        data
      );

      if (issueCommentUpdateResponse) {
        const remainingComments = this.details[issueId].comments.filter((com) => com.id != commentId);
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...this.details[issueId],
              comments: [...remainingComments, issueCommentUpdateResponse],
            },
          };
        });
      }
      return issueCommentUpdateResponse;
    } catch (error) {
      console.log("Failed to add issue comment");
    }
  };

  deleteIssueComment = async (workspaceSlug: string, projectId: string, issueId: string, comment_id: string) => {
    try {
      await this.issueService.deleteIssueComment(workspaceSlug, projectId, issueId, comment_id);
      const remainingComments = this.details[issueId].comments.filter((c) => c.id != comment_id);
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueId]: {
            ...this.details[issueId],
            comments: remainingComments,
          },
        };
      });
    } catch (error) {
      console.log("Failed to add issue vote");
    }
  };

  addIssueReaction = async (workspaceSlug: string, projectId: string, issueId: string, data: any) => {
    try {
      const issueVoteResponse = await this.issueService.createIssueReaction(workspaceSlug, projectId, issueId, data);

      if (issueVoteResponse) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...this.details[issueId],
              reactions: [...this.details[issueId].reactions, issueVoteResponse],
            },
          };
        });
      }
    } catch (error) {
      console.log("Failed to add issue vote");
    }
  };

  removeIssueReaction = async (workspaceSlug: string, projectId: string, issueId: string, reactionId: string) => {
    try {
      await this.issueService.deleteIssueReaction(workspaceSlug, projectId, issueId, reactionId);
      const reactions = await this.issueService.getIssueReactions(workspaceSlug, projectId, issueId);

      if (reactions) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueId]: {
              ...this.details[issueId],
              reactions: reactions,
            },
          };
        });
      }
    } catch (error) {
      console.log("Failed to remove issue reaction");
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
      await this.issueService.deleteIssueVote(workspaceSlug, projectId, issueId);
      const issueDetails = await this.issueService.getIssueById(workspaceSlug, projectId, issueId);

      if (issueDetails) {
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
