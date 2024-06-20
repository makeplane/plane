import { makeObservable, observable, action, runInAction } from "mobx";
import { v4 as uuidv4 } from "uuid";
// services
import IssueService from "@/services/issue.service";
// store
import { CoreRootStore } from "@/store/root.store";
// types
import { IIssue, IPeekMode, IVote } from "@/types/issue";

export interface IIssueDetailStore {
  loader: boolean;
  error: any;
  // observables
  peekId: string | null;
  peekMode: IPeekMode;
  details: {
    [key: string]: IIssue;
  };
  // actions
  setPeekId: (issueID: string | null) => void;
  setPeekMode: (mode: IPeekMode) => void;
  // issue actions
  fetchIssueDetails: (anchor: string, issueID: string) => void;
  // comment actions
  addIssueComment: (anchor: string, issueID: string, data: any) => Promise<void>;
  updateIssueComment: (anchor: string, issueID: string, commentID: string, data: any) => Promise<any>;
  deleteIssueComment: (anchor: string, issueID: string, commentID: string) => void;
  addCommentReaction: (anchor: string, issueID: string, commentID: string, reactionHex: string) => void;
  removeCommentReaction: (anchor: string, issueID: string, commentID: string, reactionHex: string) => void;
  // reaction actions
  addIssueReaction: (anchor: string, issueID: string, reactionHex: string) => void;
  removeIssueReaction: (anchor: string, issueID: string, reactionHex: string) => void;
  // vote actions
  addIssueVote: (anchor: string, issueID: string, data: { vote: 1 | -1 }) => Promise<void>;
  removeIssueVote: (anchor: string, issueID: string) => Promise<void>;
}

export class IssueDetailStore implements IIssueDetailStore {
  loader: boolean = false;
  error: any = null;
  // observables
  peekId: string | null = null;
  peekMode: IPeekMode = "side";
  details: {
    [key: string]: IIssue;
  } = {};
  // root store
  rootStore: CoreRootStore;
  // services
  issueService: IssueService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,
      // observables
      peekId: observable.ref,
      peekMode: observable.ref,
      details: observable,
      // actions
      setPeekId: action,
      setPeekMode: action,
      // issue actions
      fetchIssueDetails: action,
      // comment actions
      addIssueComment: action,
      updateIssueComment: action,
      deleteIssueComment: action,
      addCommentReaction: action,
      removeCommentReaction: action,
      // reaction actions
      addIssueReaction: action,
      removeIssueReaction: action,
      // vote actions
      addIssueVote: action,
      removeIssueVote: action,
    });
    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  setPeekId = (issueID: string | null) => {
    this.peekId = issueID;
  };

  setPeekMode = (mode: IPeekMode) => {
    this.peekMode = mode;
  };

  /**
   * @description fetc
   * @param {string} anchor
   * @param {string} issueID
   */
  fetchIssueDetails = async (anchor: string, issueID: string) => {
    try {
      this.loader = true;
      this.error = null;

      const issueDetails = this.rootStore.issue.issues?.find((i) => i.id === issueID);
      const commentsResponse = await this.issueService.getIssueComments(anchor, issueID);

      if (issueDetails) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueID]: {
              ...(this.details[issueID] ?? issueDetails),
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

  addIssueComment = async (anchor: string, issueID: string, data: any) => {
    try {
      const issueDetails = this.rootStore.issue.issues?.find((i) => i.id === issueID);
      const issueCommentResponse = await this.issueService.createIssueComment(anchor, issueID, data);
      if (issueDetails) {
        runInAction(() => {
          this.details = {
            ...this.details,
            [issueID]: {
              ...issueDetails,
              comments: [...this.details[issueID].comments, issueCommentResponse],
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

  updateIssueComment = async (anchor: string, issueID: string, commentID: string, data: any) => {
    try {
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            comments: this.details[issueID].comments.map((c) => ({
              ...c,
              ...(c.id === commentID ? data : {}),
            })),
          },
        };
      });

      await this.issueService.updateIssueComment(anchor, issueID, commentID, data);
    } catch (error) {
      const issueComments = await this.issueService.getIssueComments(anchor, issueID);

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            comments: issueComments,
          },
        };
      });
    }
  };

  deleteIssueComment = async (anchor: string, issueID: string, commentID: string) => {
    try {
      await this.issueService.deleteIssueComment(anchor, issueID, commentID);
      const remainingComments = this.details[issueID].comments.filter((c) => c.id != commentID);
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            comments: remainingComments,
          },
        };
      });
    } catch (error) {
      console.log("Failed to add issue vote");
    }
  };

  addCommentReaction = async (anchor: string, issueID: string, commentID: string, reactionHex: string) => {
    const newReaction = {
      id: uuidv4(),
      comment: commentID,
      reaction: reactionHex,
      actor_detail: this.rootStore.user.currentActor,
    };
    const newComments = this.details[issueID].comments.map((comment) => ({
      ...comment,
      comment_reactions:
        comment.id === commentID ? [...comment.comment_reactions, newReaction] : comment.comment_reactions,
    }));

    try {
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            comments: [...newComments],
          },
        };
      });

      await this.issueService.createCommentReaction(anchor, commentID, {
        reaction: reactionHex,
      });
    } catch (error) {
      const issueComments = await this.issueService.getIssueComments(anchor, issueID);

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            comments: issueComments,
          },
        };
      });
    }
  };

  removeCommentReaction = async (anchor: string, issueID: string, commentID: string, reactionHex: string) => {
    try {
      const comment = this.details[issueID].comments.find((c) => c.id === commentID);
      const newCommentReactions = comment?.comment_reactions.filter((r) => r.reaction !== reactionHex) ?? [];

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            comments: this.details[issueID].comments.map((c) => ({
              ...c,
              comment_reactions: c.id === commentID ? newCommentReactions : c.comment_reactions,
            })),
          },
        };
      });

      await this.issueService.deleteCommentReaction(anchor, commentID, reactionHex);
    } catch (error) {
      const issueComments = await this.issueService.getIssueComments(anchor, issueID);

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            comments: issueComments,
          },
        };
      });
    }
  };

  addIssueReaction = async (anchor: string, issueID: string, reactionHex: string) => {
    try {
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            reactions: [
              ...this.details[issueID].reactions,
              {
                id: uuidv4(),
                issue: issueID,
                reaction: reactionHex,
                actor_detail: this.rootStore.user.currentActor,
              },
            ],
          },
        };
      });

      await this.issueService.createIssueReaction(anchor, issueID, {
        reaction: reactionHex,
      });
    } catch (error) {
      console.log("Failed to add issue vote");
      const issueReactions = await this.issueService.getIssueReactions(anchor, issueID);
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            reactions: issueReactions,
          },
        };
      });
    }
  };

  removeIssueReaction = async (anchor: string, issueID: string, reactionHex: string) => {
    try {
      const newReactions = this.details[issueID].reactions.filter(
        (_r) => !(_r.reaction === reactionHex && _r.actor_detail.id === this.rootStore.user.data?.id)
      );

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            reactions: newReactions,
          },
        };
      });

      await this.issueService.deleteIssueReaction(anchor, issueID, reactionHex);
    } catch (error) {
      console.log("Failed to remove issue reaction");
      const reactions = await this.issueService.getIssueReactions(anchor, issueID);
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            reactions: reactions,
          },
        };
      });
    }
  };

  addIssueVote = async (anchor: string, issueID: string, data: { vote: 1 | -1 }) => {
    const publishSettings = this.rootStore.publishList?.publishMap?.[anchor];
    const projectID = publishSettings?.project;
    const workspaceSlug = publishSettings?.workspace_detail?.slug;
    if (!projectID || !workspaceSlug) throw new Error("Publish settings not found");

    const newVote: IVote = {
      actor: this.rootStore.user.data?.id ?? "",
      actor_detail: this.rootStore.user.currentActor,
      issue: issueID,
      project: projectID,
      workspace: workspaceSlug,
      vote: data.vote,
    };

    const filteredVotes = this.details[issueID].votes.filter((v) => v.actor !== this.rootStore.user.data?.id);

    try {
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            votes: [...filteredVotes, newVote],
          },
        };
      });

      await this.issueService.createIssueVote(anchor, issueID, data);
    } catch (error) {
      console.log("Failed to add issue vote");
      const issueVotes = await this.issueService.getIssueVotes(anchor, issueID);

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            votes: issueVotes,
          },
        };
      });
    }
  };

  removeIssueVote = async (anchor: string, issueID: string) => {
    const newVotes = this.details[issueID].votes.filter((v) => v.actor !== this.rootStore.user.data?.id);

    try {
      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            votes: newVotes,
          },
        };
      });

      await this.issueService.deleteIssueVote(anchor, issueID);
    } catch (error) {
      console.log("Failed to remove issue vote");
      const issueVotes = await this.issueService.getIssueVotes(anchor, issueID);

      runInAction(() => {
        this.details = {
          ...this.details,
          [issueID]: {
            ...this.details[issueID],
            votes: issueVotes,
          },
        };
      });
    }
  };
}
