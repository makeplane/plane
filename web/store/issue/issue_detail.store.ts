import { observable, action, makeObservable, runInAction, computed } from "mobx";
// services
import { IssueService, IssueReactionService } from "services/issue";
// types
import { RootStore } from "../root";
import { IUser, IIssue } from "types";
// constants
import { groupReactionEmojis } from "constants/issue";

export interface IIssueDetailStore {
  loader: boolean;
  error: any | null;

  peekId: string | null;
  issues: {
    [issueId: string]: IIssue;
  };
  issue_reactions: {
    [issueId: string]: any;
  };
  issue_comments: {
    [issueId: string]: any;
  };
  issue_comment_reactions: {
    [issueId: string]: any;
  };

  setPeekId: (issueId: string | null) => void;

  // computed
  getIssue: IIssue | null;
  getIssueReactions: any | null;
  getIssueComments: any | null;
  getIssueCommentReactions: any | null;

  // fetch issue details
  fetchIssueDetails: (workspaceSlug: string, projectId: string, issueId: string) => Promise<IIssue>;
  // creating issue
  createIssue: (workspaceSlug: string, projectId: string, data: Partial<IIssue>, user: IUser) => Promise<IIssue>;
  // updating issue
  updateIssue: (
    workspaceId: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    user: IUser | undefined
  ) => void;
  // deleting issue
  deleteIssue: (workspaceSlug: string, projectId: string, issueId: string, user: IUser) => void;

  fetchPeekIssueDetails: (workspaceSlug: string, projectId: string, issueId: string) => Promise<IIssue>;

  fetchIssueReactions: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  createIssueReaction: (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => Promise<void>;
  removeIssueReaction: (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => Promise<void>;

  fetchIssueComments: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  createIssueComment: (workspaceSlug: string, projectId: string, issueId: string, data: any) => Promise<void>;
  updateIssueComment: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: any
  ) => Promise<void>;
  removeIssueComment: (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => Promise<void>;

  fetchIssueCommentReactions: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string
  ) => Promise<void>;
  addIssueCommentReaction: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    reaction: string
  ) => Promise<void>;
  removeIssueCommentReaction: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    reaction: string
  ) => Promise<void>;
}

export class IssueDetailStore implements IIssueDetailStore {
  loader: boolean = false;
  error: any | null = null;

  peekId: string | null = null;
  issues: {
    [issueId: string]: IIssue;
  } = {};
  issue_reactions: {
    [issueId: string]: any;
  } = {};
  issue_comments: {
    [issueId: string]: any;
  } = {};
  issue_comment_reactions: {
    [issueId: string]: any;
  } = {};

  // root store
  rootStore;
  // service
  issueService;
  issueReactionService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,

      peekId: observable.ref,
      issues: observable.ref,
      issue_reactions: observable.ref,
      issue_comments: observable.ref,
      issue_comment_reactions: observable.ref,

      getIssue: computed,
      getIssueReactions: computed,
      getIssueComments: computed,
      getIssueCommentReactions: computed,

      setPeekId: action,

      fetchIssueDetails: action,
      createIssue: action,
      updateIssue: action,
      deleteIssue: action,

      fetchPeekIssueDetails: action,

      fetchIssueReactions: action,
      createIssueReaction: action,
      removeIssueReaction: action,

      fetchIssueComments: action,
      createIssueComment: action,
      updateIssueComment: action,
      removeIssueComment: action,

      fetchIssueCommentReactions: action,
      addIssueCommentReaction: action,
      removeIssueCommentReaction: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
    this.issueReactionService = new IssueReactionService();
  }

  get getIssue() {
    if (!this.peekId) return null;
    const _issue = this.issues[this.peekId];
    return _issue || null;
  }

  get getIssueReactions() {
    if (!this.peekId) return null;
    const _reactions = this.issue_reactions[this.peekId];
    return _reactions || null;
  }

  get getIssueComments() {
    if (!this.peekId) return null;
    const _comments = this.issue_comments[this.peekId];
    return _comments || null;
  }

  get getIssueCommentReactions() {
    if (!this.peekId) return null;
    const _reactions = this.issue_comment_reactions[this.peekId];
    return _reactions || null;
  }

  setPeekId = (issueId: string | null) => (this.peekId = issueId);

  fetchIssueDetails = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      this.loader = true;
      this.error = null;
      this.peekId = issueId;

      const issueDetailsResponse = await this.issueService.retrieve(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.issues = {
          ...this.issues,
          [issueId]: issueDetailsResponse,
        };
      });

      return issueDetailsResponse;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<IIssue>, user: IUser) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.issueService.createIssue(workspaceSlug, projectId, data, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.issues = {
          ...this.issues,
          [response.id]: response,
        };
      });

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;

      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<IIssue>,
    user: IUser | undefined
  ) => {
    const newIssues = { ...this.issues };
    newIssues[issueId] = {
      ...newIssues[issueId],
      ...data,
    };

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
        this.issues = newIssues;
      });

      const response = await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.issues = {
          ...this.issues,
          [issueId]: {
            ...this.issues[issueId],
            ...response,
          },
        };
      });
    } catch (error) {
      this.fetchIssueDetails(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      return error;
    }
  };

  deleteIssue = async (workspaceSlug: string, projectId: string, issueId: string, user: IUser) => {
    const newIssues = { ...this.issues };
    delete newIssues[issueId];

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
        this.issues = newIssues;
      });

      await this.issueService.deleteIssue(workspaceSlug, projectId, issueId, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      this.fetchIssueDetails(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      return error;
    }
  };

  fetchPeekIssueDetails = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      this.loader = true;
      this.error = null;

      this.peekId = issueId;

      const issueDetailsResponse = await this.issueService.retrieve(workspaceSlug, projectId, issueId);
      await this.fetchIssueReactions(workspaceSlug, projectId, issueId);
      await this.fetchIssueComments(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.issues = {
          ...this.issues,
          [issueId]: issueDetailsResponse,
        };
      });

      return issueDetailsResponse;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  // reactions
  fetchIssueReactions = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const _reactions = await this.issueReactionService.listIssueReactions(workspaceSlug, projectId, issueId);

      const _issue_reactions = {
        ...this.issue_reactions,
        [issueId]: groupReactionEmojis(_reactions),
      };

      runInAction(() => {
        this.issue_reactions = _issue_reactions;
      });
    } catch (error) {
      console.warn("error creating the issue reaction", error);
      throw error;
    }
  };
  createIssueReaction = async (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => {
    let _currentReactions = this.getIssueReactions;

    try {
      const _reaction = await this.issueReactionService.createIssueReaction(workspaceSlug, projectId, issueId, {
        reaction,
      });

      _currentReactions = {
        ..._currentReactions,
        [reaction]: [..._currentReactions[reaction], { ..._reaction }],
      };

      runInAction(() => {
        this.issue_reactions = {
          ...this.issue_reactions,
          [issueId]: _currentReactions,
        };
      });
    } catch (error) {
      runInAction(() => {
        this.issue_reactions = {
          ...this.issue_reactions,
          [issueId]: _currentReactions,
        };
      });
      console.warn("error creating the issue reaction", error);
      throw error;
    }
  };
  removeIssueReaction = async (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => {
    let _currentReactions = this.getIssueReactions;

    try {
      const user = this.rootStore.user.currentUser;

      if (user) {
        _currentReactions = {
          ..._currentReactions,
          [reaction]: [..._currentReactions[reaction].filter((r: any) => r.actor !== user.id)],
        };

        runInAction(() => {
          this.issue_reactions = {
            ...this.issue_reactions,
            [issueId]: _currentReactions,
          };
        });

        await this.issueReactionService.deleteIssueReaction(workspaceSlug, projectId, issueId, reaction);
      }
    } catch (error) {
      runInAction(() => {
        this.issue_reactions = {
          ...this.issue_reactions,
          [issueId]: _currentReactions,
        };
      });
      console.warn("error removing the issue reaction", error);
      throw error;
    }
  };

  // comments
  fetchIssueComments = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
    } catch (error) {
      console.warn("error creating the issue comment", error);
      throw error;
    }
  };
  createIssueComment = async (workspaceSlug: string, projectId: string, issueId: string, data: any) => {
    try {
    } catch (error) {
      console.warn("error creating the issue comment", error);
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
    } catch (error) {
      console.warn("error updating the issue comment", error);
      throw error;
    }
  };
  removeIssueComment = async (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => {
    try {
    } catch (error) {
      console.warn("error removing the issue comment", error);
      throw error;
    }
  };

  // comment reaction
  fetchIssueCommentReactions = async (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => {
    try {
    } catch (error) {
      console.warn("error removing the issue comment", error);
      throw error;
    }
  };
  addIssueCommentReaction = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    reaction: string
  ) => {
    try {
    } catch (error) {
      console.warn("error removing the issue comment", error);
      throw error;
    }
  };
  removeIssueCommentReaction = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    reaction: string
  ) => {
    try {
    } catch (error) {
      console.warn("error removing the issue comment", error);
      throw error;
    }
  };
}
