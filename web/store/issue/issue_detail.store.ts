import { observable, action, makeObservable, runInAction, computed } from "mobx";
// services
import { IssueService, IssueReactionService, IssueCommentService } from "services/issue";
import { NotificationService } from "services/notification.service";
// types
import { RootStore } from "../root";
import { IIssue } from "types";
// constants
import { groupReactionEmojis } from "constants/issue";
// uuid
import { v4 as uuidv4 } from "uuid";

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
    [issueId: string]: {
      [comment_id: string]: any;
    };
  };
  issue_subscription: {
    [issueId: string]: any;
  };

  setPeekId: (issueId: string | null) => void;

  // computed
  getIssue: IIssue | null;
  getIssueReactions: any | null;
  getIssueComments: any | null;
  getIssueCommentReactions: any | null;
  getIssueSubscription: any | null;

  // fetch issue details
  fetchIssueDetails: (workspaceSlug: string, projectId: string, issueId: string) => Promise<IIssue>;
  // creating issue
  createIssue: (workspaceSlug: string, projectId: string, data: Partial<IIssue>) => Promise<IIssue>;
  optimisticallyCreateIssue: (workspaceSlug: string, projectId: string, data: Partial<IIssue>) => Promise<IIssue>;
  // updating issue
  updateIssue: (workspaceId: string, projectId: string, issueId: string, data: Partial<IIssue>) => Promise<IIssue>;
  // deleting issue
  deleteIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;

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
  creationIssueCommentReaction: (
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

  fetchIssueSubscription: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  createIssueSubscription: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  removeIssueSubscription: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
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
  issue_subscription: {
    [issueId: string]: any;
  } = {};

  // root store
  rootStore;
  // service
  issueService;
  issueReactionService;
  issueCommentService;
  notificationService;

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
      issue_subscription: observable.ref,

      getIssue: computed,
      getIssueReactions: computed,
      getIssueComments: computed,
      getIssueCommentReactions: computed,
      getIssueSubscription: computed,

      setPeekId: action,

      fetchIssueDetails: action,
      createIssue: action,
      optimisticallyCreateIssue: action,
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
      creationIssueCommentReaction: action,
      removeIssueCommentReaction: action,

      fetchIssueSubscription: action,
      createIssueSubscription: action,
      removeIssueSubscription: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
    this.issueReactionService = new IssueReactionService();
    this.issueCommentService = new IssueCommentService();
    this.notificationService = new NotificationService();
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
    const _commentReactions = this.issue_comment_reactions[this.peekId];
    return _commentReactions || null;
  }

  get getIssueSubscription() {
    if (!this.peekId) return null;
    const _commentSubscription = this.issue_subscription[this.peekId];
    return _commentSubscription || null;
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

  optimisticallyCreateIssue = async (workspaceSlug: string, projectId: string, data: Partial<IIssue>) => {
    const tempId = data?.id || uuidv4();

    runInAction(() => {
      this.loader = true;
      this.error = null;
      this.issues = {
        ...this.issues,
        [tempId]: data as IIssue,
      };
    });

    try {
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data);

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

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<IIssue>) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.issueService.createIssue(workspaceSlug, projectId, data);

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

  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<IIssue>) => {
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

      const user = this.rootStore.user.currentUser;

      if (!user) return;

      const response = await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);

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

      return response;
    } catch (error) {
      this.fetchIssueDetails(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      return error;
    }
  };

  deleteIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const newIssues = { ...this.issues };
    delete newIssues[issueId];

    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
        this.issues = newIssues;
      });

      const user = this.rootStore.user.currentUser;

      if (!user) return;

      const response = await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });

      return response;
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
      const _issueCommentResponse = await this.issueService.getIssueActivities(workspaceSlug, projectId, issueId);

      const _issueComments = {
        ...this.issue_comments,
        [issueId]: [..._issueCommentResponse],
      };

      runInAction(() => {
        this.issue_comments = _issueComments;
      });
    } catch (error) {
      console.warn("error creating the issue comment", error);
      throw error;
    }
  };
  createIssueComment = async (workspaceSlug: string, projectId: string, issueId: string, data: any) => {
    try {
      const _issueCommentResponse = await this.issueCommentService.createIssueComment(
        workspaceSlug,
        projectId,
        issueId,
        data
      );

      const _issueComments = {
        ...this.issue_comments,
        [issueId]: [...this.issue_comments[issueId], _issueCommentResponse],
      };

      runInAction(() => {
        this.issue_comments = _issueComments;
      });
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
      const _issueCommentResponse = await this.issueCommentService.patchIssueComment(
        workspaceSlug,
        projectId,
        issueId,
        commentId,
        data
      );

      const _issueComments = {
        ...this.issue_comments,
        [issueId]: this.issue_comments[issueId].map((comment: any) =>
          comment.id === commentId ? _issueCommentResponse : comment
        ),
      };

      runInAction(() => {
        this.issue_comments = _issueComments;
      });
    } catch (error) {
      console.warn("error updating the issue comment", error);
      throw error;
    }
  };
  removeIssueComment = async (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => {
    try {
      const _issueComments = {
        ...this.issue_comments,
        [issueId]: this.issue_comments[issueId].filter((comment: any) => comment.id != commentId),
      };

      await this.issueCommentService.deleteIssueComment(workspaceSlug, projectId, issueId, commentId);

      runInAction(() => {
        this.issue_comments = _issueComments;
      });
    } catch (error) {
      console.warn("error removing the issue comment", error);
      throw error;
    }
  };

  // comment reaction
  fetchIssueCommentReactions = async (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => {
    try {
      const _reactions = await this.issueReactionService.listIssueCommentReactions(workspaceSlug, projectId, commentId);

      const _issue_comment_reactions = {
        ...this.issue_comment_reactions,
        [issueId]: {
          ...this.issue_comment_reactions[issueId],
          [commentId]: groupReactionEmojis(_reactions),
        },
      };

      runInAction(() => {
        this.issue_comment_reactions = _issue_comment_reactions;
      });
    } catch (error) {
      console.warn("error removing the issue comment", error);
      throw error;
    }
  };
  creationIssueCommentReaction = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    reaction: string
  ) => {
    let _currentReactions = this.getIssueCommentReactions;
    _currentReactions = _currentReactions && commentId ? _currentReactions?.[commentId] : null;

    try {
      const _reaction = await this.issueReactionService.createIssueCommentReaction(
        workspaceSlug,
        projectId,
        commentId,
        {
          reaction,
        }
      );

      _currentReactions = {
        ..._currentReactions,
        [reaction]: [..._currentReactions?.[reaction], { ..._reaction }],
      };

      const _issue_comment_reactions = {
        ...this.issue_comment_reactions,
        [issueId]: {
          ...this.issue_comment_reactions[issueId],
          [commentId]: _currentReactions,
        },
      };

      runInAction(() => {
        this.issue_comment_reactions = _issue_comment_reactions;
      });
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
    let _currentReactions = this.getIssueCommentReactions;
    _currentReactions = _currentReactions && commentId ? _currentReactions?.[commentId] : null;

    try {
      const user = this.rootStore.user.currentUser;

      if (user) {
        _currentReactions = {
          ..._currentReactions,
          [reaction]: [..._currentReactions?.[reaction].filter((r: any) => r.actor !== user.id)],
        };

        const _issue_comment_reactions = {
          ...this.issue_comment_reactions,
          [issueId]: {
            ...this.issue_comment_reactions[issueId],
            [commentId]: _currentReactions,
          },
        };

        runInAction(() => {
          this.issue_comment_reactions = _issue_comment_reactions;
        });

        await this.issueReactionService.deleteIssueCommentReaction(workspaceSlug, projectId, commentId, reaction);
      }
    } catch (error) {
      console.warn("error removing the issue comment", error);
      throw error;
    }
  };

  // subscription
  fetchIssueSubscription = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const _subscription = await this.notificationService.getIssueNotificationSubscriptionStatus(
        workspaceSlug,
        projectId,
        issueId
      );

      const _issue_subscription = {
        ...this.issue_subscription,
        [issueId]: _subscription,
      };

      runInAction(() => {
        this.issue_subscription = _issue_subscription;
      });
    } catch (error) {
      console.warn("error fetching the issue subscription", error);
      throw error;
    }
  };
  createIssueSubscription = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      await this.notificationService.subscribeToIssueNotifications(workspaceSlug, projectId, issueId);

      const _issue_subscription = {
        ...this.issue_subscription,
        [issueId]: { subscribed: true },
      };

      runInAction(() => {
        this.issue_subscription = _issue_subscription;
      });
    } catch (error) {
      console.warn("error creating the issue subscription", error);
      throw error;
    }
  };
  removeIssueSubscription = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const _issue_subscription = {
        ...this.issue_subscription,
        [issueId]: { subscribed: false },
      };

      runInAction(() => {
        this.issue_subscription = _issue_subscription;
      });

      await this.notificationService.unsubscribeFromIssueNotifications(workspaceSlug, projectId, issueId);
    } catch (error) {
      console.warn("error removing the issue subscription", error);
      throw error;
    }
  };
}
