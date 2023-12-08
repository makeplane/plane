import { observable, action, makeObservable, runInAction, computed, autorun } from "mobx";
// services
import { IssueService, IssueReactionService, IssueCommentService } from "services/issue";
import { NotificationService } from "services/notification.service";
// types
import { RootStore } from "../root";
import type { IIssue, IIssueActivity } from "types";
// constants
import { groupReactionEmojis } from "constants/issue";

export interface IIssueDetailStore {
  loader: boolean;
  error: any | null;

  peekId: string | null;
  issues: {
    [issueId: string]: IIssue;
  };
  issueReactions: {
    [issueId: string]: any;
  };
  issueActivity: {
    [issueId: string]: IIssueActivity[];
  };
  issueCommentReactions: {
    [issueId: string]: {
      [comment_id: string]: any;
    };
  };
  issueSubscription: {
    [issueId: string]: any;
  };

  setPeekId: (issueId: string | null) => void;

  // computed
  getIssue: IIssue | null;
  getIssueReactions: any | null;
  getIssueActivity: IIssueActivity[] | null;
  getIssueCommentReactions: any | null;
  getIssueSubscription: any | null;

  // fetch issue details
  fetchIssueDetails: (workspaceSlug: string, projectId: string, issueId: string) => Promise<IIssue>;
  // deleting issue
  deleteIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;

  fetchPeekIssueDetails: (workspaceSlug: string, projectId: string, issueId: string) => Promise<IIssue>;

  fetchIssueReactions: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  createIssueReaction: (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => Promise<void>;
  removeIssueReaction: (workspaceSlug: string, projectId: string, issueId: string, reaction: string) => Promise<void>;

  fetchIssueActivity: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
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
  issueReactions: {
    [issueId: string]: any;
  } = {};
  issueActivity: {
    [issueId: string]: IIssueActivity[];
  } = {};
  issueCommentReactions: {
    [issueId: string]: any;
  } = {};
  issueSubscription: {
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
      issueReactions: observable.ref,
      issueActivity: observable.ref,
      issueCommentReactions: observable.ref,
      issueSubscription: observable.ref,

      getIssue: computed,
      getIssueReactions: computed,
      getIssueActivity: computed,
      getIssueCommentReactions: computed,
      getIssueSubscription: computed,

      setPeekId: action,

      fetchIssueDetails: action,
      deleteIssue: action,

      fetchPeekIssueDetails: action,

      fetchIssueReactions: action,
      createIssueReaction: action,
      removeIssueReaction: action,

      fetchIssueActivity: action,
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

    autorun(() => {
      const projectId = this.rootStore?.project.projectId;
      const peekId = this.peekId;

      if (!projectId || !peekId) return;

      const issue = this.rootStore.projectIssues.issues?.[projectId]?.[peekId];

      if (issue && issue.id)
        runInAction(() => {
          this.issues = {
            ...this.issues,
            [issue.id]: {
              ...this.issues[issue.id],
              ...issue,
            },
          };
        });
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
    const _reactions = this.issueReactions[this.peekId];
    return _reactions || null;
  }

  get getIssueActivity() {
    if (!this.peekId) return null;
    const activity = this.issueActivity[this.peekId];
    return activity || null;
  }

  get getIssueCommentReactions() {
    if (!this.peekId) return null;
    const _commentReactions = this.issueCommentReactions[this.peekId];
    return _commentReactions || null;
  }

  get getIssueSubscription() {
    if (!this.peekId) return null;
    const _commentSubscription = this.issueSubscription[this.peekId];
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
      await this.fetchIssueActivity(workspaceSlug, projectId, issueId);

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

      const _issueReactions = {
        ...this.issueReactions,
        [issueId]: groupReactionEmojis(_reactions),
      };

      runInAction(() => {
        this.issueReactions = _issueReactions;
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
        this.issueReactions = {
          ...this.issueReactions,
          [issueId]: _currentReactions,
        };
      });
    } catch (error) {
      runInAction(() => {
        this.issueReactions = {
          ...this.issueReactions,
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
          this.issueReactions = {
            ...this.issueReactions,
            [issueId]: _currentReactions,
          };
        });

        await this.issueReactionService.deleteIssueReaction(workspaceSlug, projectId, issueId, reaction);
      }
    } catch (error) {
      runInAction(() => {
        this.issueReactions = {
          ...this.issueReactions,
          [issueId]: _currentReactions,
        };
      });
      console.warn("error removing the issue reaction", error);
      throw error;
    }
  };

  fetchIssueActivity = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const issueActivityResponse = await this.issueService.getIssueActivities(workspaceSlug, projectId, issueId);

      const _issueComments = {
        ...this.issueActivity,
        [issueId]: [...issueActivityResponse],
      };

      runInAction(() => {
        this.issueActivity = _issueComments;
      });
    } catch (error) {
      console.warn("error creating the issue comment", error);
      throw error;
    }
  };

  // comments
  createIssueComment = async (workspaceSlug: string, projectId: string, issueId: string, data: any) => {
    try {
      const _issueCommentResponse = await this.issueCommentService.createIssueComment(
        workspaceSlug,
        projectId,
        issueId,
        data
      );

      const _issueComments = {
        ...this.issueActivity,
        [issueId]: [...this.issueActivity[issueId], _issueCommentResponse],
      };

      runInAction(() => {
        this.issueActivity = _issueComments;
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
        ...this.issueActivity,
        [issueId]: this.issueActivity[issueId].map((comment) =>
          comment.id === commentId ? _issueCommentResponse : comment
        ),
      };

      runInAction(() => {
        this.issueActivity = _issueComments;
      });
    } catch (error) {
      console.warn("error updating the issue comment", error);
      throw error;
    }
  };

  removeIssueComment = async (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => {
    try {
      const _issueComments = {
        ...this.issueActivity,
        [issueId]: this.issueActivity[issueId]?.filter((comment) => comment.id != commentId),
      };

      await this.issueCommentService.deleteIssueComment(workspaceSlug, projectId, issueId, commentId);

      runInAction(() => {
        this.issueActivity = _issueComments;
      });
    } catch (error) {
      console.warn("error removing the issue comment", error);
      throw error;
    }
  };

  // comment reactions
  fetchIssueCommentReactions = async (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => {
    try {
      const _reactions = await this.issueReactionService.listIssueCommentReactions(workspaceSlug, projectId, commentId);

      const _issueCommentReactions = {
        ...this.issueCommentReactions,
        [issueId]: {
          ...this.issueCommentReactions[issueId],
          [commentId]: groupReactionEmojis(_reactions),
        },
      };

      runInAction(() => {
        this.issueCommentReactions = _issueCommentReactions;
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

      const _issueCommentReactions = {
        ...this.issueCommentReactions,
        [issueId]: {
          ...this.issueCommentReactions[issueId],
          [commentId]: _currentReactions,
        },
      };

      runInAction(() => {
        this.issueCommentReactions = _issueCommentReactions;
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

        const _issueCommentReactions = {
          ...this.issueCommentReactions,
          [issueId]: {
            ...this.issueCommentReactions[issueId],
            [commentId]: _currentReactions,
          },
        };

        runInAction(() => {
          this.issueCommentReactions = _issueCommentReactions;
        });

        await this.issueReactionService.deleteIssueCommentReaction(workspaceSlug, projectId, commentId, reaction);
      }
    } catch (error) {
      console.warn("error removing the issue comment", error);
      throw error;
    }
  };

  // subscriptions
  fetchIssueSubscription = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const _subscription = await this.notificationService.getIssueNotificationSubscriptionStatus(
        workspaceSlug,
        projectId,
        issueId
      );

      const _issueSubscription = {
        ...this.issueSubscription,
        [issueId]: _subscription,
      };

      runInAction(() => {
        this.issueSubscription = _issueSubscription;
      });
    } catch (error) {
      console.warn("error fetching the issue subscription", error);
      throw error;
    }
  };
  createIssueSubscription = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      await this.notificationService.subscribeToIssueNotifications(workspaceSlug, projectId, issueId);

      const _issueSubscription = {
        ...this.issueSubscription,
        [issueId]: { subscribed: true },
      };

      runInAction(() => {
        this.issueSubscription = _issueSubscription;
      });
    } catch (error) {
      console.warn("error creating the issue subscription", error);
      throw error;
    }
  };
  removeIssueSubscription = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const _issueSubscription = {
        ...this.issueSubscription,
        [issueId]: { subscribed: false },
      };

      runInAction(() => {
        this.issueSubscription = _issueSubscription;
      });

      await this.notificationService.unsubscribeFromIssueNotifications(workspaceSlug, projectId, issueId);
    } catch (error) {
      console.warn("error removing the issue subscription", error);
      throw error;
    }
  };
}
