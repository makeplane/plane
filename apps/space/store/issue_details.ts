import { makeObservable, observable, action, runInAction } from "mobx";
import { v4 as uuidv4 } from "uuid";
// store
import { RootStore } from "./root";
// services
import IssueService from "services/issue.service";
import { IIssue, IVote } from "types/issue";

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
  addIssueReaction: (workspaceId: string, projectId: string, issueId: string, reactionHex: string) => void;
  removeIssueReaction: (workspaceId: string, projectId: string, issueId: string, reactionHex: string) => void;
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
              ...(this.details[issueId] ?? issueDetails),
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

  addIssueReaction = async (workspaceSlug: string, projectId: string, issueId: string, reactionHex: string) => {
    try {
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueId]: {
            ...this.details[issueId],
            reactions: [
              ...this.details[issueId].reactions,
              {
                id: uuidv4(),
                issue: issueId,
                reaction: reactionHex,
                actor_detail: this.rootStore.user.currentActor,
              },
            ],
          },
        };
      });

      await this.issueService.createIssueReaction(workspaceSlug, projectId, issueId, {
        reaction: reactionHex,
      });
    } catch (error) {
      console.log("Failed to add issue vote");
      const issueReactions = await this.issueService.getIssueReactions(workspaceSlug, projectId, issueId);
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueId]: {
            ...this.details[issueId],
            reactions: issueReactions,
          },
        };
      });
    }
  };

  removeIssueReaction = async (workspaceSlug: string, projectId: string, issueId: string, reactionHex: string) => {
    try {
      const newReactions = this.details[issueId].reactions.filter(
        (_r) => !(_r.reaction === reactionHex && _r.actor_detail.id === this.rootStore.user.currentUser?.id)
      );

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueId]: {
            ...this.details[issueId],
            reactions: newReactions,
          },
        };
      });

      await this.issueService.deleteIssueReaction(workspaceSlug, projectId, issueId, reactionHex);
    } catch (error) {
      console.log("Failed to remove issue reaction");
      const reactions = await this.issueService.getIssueReactions(workspaceSlug, projectId, issueId);
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
  };

  addIssueVote = async (workspaceSlug: string, projectId: string, issueId: string, data: { vote: 1 | -1 }) => {
    const newVote: IVote = {
      actor: this.rootStore.user.currentUser?.id ?? "",
      actor_detail: this.rootStore.user.currentActor,
      issue: issueId,
      project: projectId,
      workspace: workspaceSlug,
      vote: data.vote,
    };

    const filteredVotes = this.details[issueId].votes.filter((v) => v.actor !== this.rootStore.user.currentUser?.id);

    try {
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueId]: {
            ...this.details[issueId],
            votes: [...filteredVotes, newVote],
          },
        };
      });

      await this.issueService.createIssueVote(workspaceSlug, projectId, issueId, data);
    } catch (error) {
      console.log("Failed to add issue vote");
      const issueVotes = await this.issueService.getIssueVotes(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueId]: {
            ...this.details[issueId],
            votes: issueVotes,
          },
        };
      });
    }
  };

  removeIssueVote = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const newVotes = this.details[issueId].votes.filter((v) => v.actor !== this.rootStore.user.currentUser?.id);

    try {
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueId]: {
            ...this.details[issueId],
            votes: newVotes,
          },
        };
      });

      await this.issueService.deleteIssueVote(workspaceSlug, projectId, issueId);
    } catch (error) {
      console.log("Failed to remove issue vote");
      const issueVotes = await this.issueService.getIssueVotes(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueId]: {
            ...this.details[issueId],
            votes: issueVotes,
          },
        };
      });
    }
  };
}

export default IssueDetailStore;
