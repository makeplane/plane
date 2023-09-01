// mobx
import { observable, action, computed, makeObservable, runInAction, reaction } from "mobx";
// service
import IssueService from "services/issue.service";
// types
import { IssueDetailType, TIssueBoardKeys, IIssueLabel, IIssueState, IIssue } from "types/issue";

export interface IIssueStore {
  currentIssueBoardView: TIssueBoardKeys | null;
  loader: boolean;
  error: any | null;
  states: IIssueState[] | null;
  labels: IIssueLabel[] | null;
  issues: IIssue[] | null;
  issue_detail: IssueDetailType;
  userSelectedStates: string[];
  userSelectedLabels: string[];
  userSelectedPriorities: string[];
  activePeekOverviewIssueId: string | null;
  getCountOfIssuesByState: (state: string) => number;
  getFilteredIssuesByState: (state: string) => IIssue[];
  getUserSelectedFilter: (key: "state" | "priority" | "label", value: string) => boolean;
  checkIfFilterExistsForKey: (key: "state" | "priority" | "label") => boolean;
  clearUserSelectedFilter: (key: "state" | "priority" | "label" | "all") => void;
  getIfFiltersIsEmpty: () => boolean;
  getURLDefinition: (
    workspaceSlug: string,
    projectId: string,
    action?: {
      key: "state" | "priority" | "label" | "all";
      value?: string;
      removeAll?: boolean;
    }
  ) => string;
  setActivePeekOverviewIssueId: (value: any) => void;
  setCurrentIssueBoardView: (view: TIssueBoardKeys) => void;
  fetchPublicIssues: (workspaceSlug: string, projectId: string, params: any) => Promise<void>;
  getIssueByIdAsync: (workspaceSlug: string, projectId: string, issueId: string) => Promise<IssueDetailType>;
}

class IssueLegacyStore {
  currentIssueBoardView: TIssueBoardKeys | null = null;

  loader: boolean = false;
  error: any | null = null;

  states: IIssueState[] | null = null;
  labels: IIssueLabel[] | null = null;
  issues: IIssue[] | null = null;

  issue_detail: IssueDetailType = {};

  activePeekOverviewIssueId: string | null = null;

  userSelectedStates: string[] = [];
  userSelectedLabels: string[] = [];
  userSelectedPriorities: string[] = [];
  // root store
  rootStore;
  // service
  issueService;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      currentIssueBoardView: observable,

      loader: observable,
      error: observable,

      states: observable.ref,
      labels: observable.ref,
      issues: observable.ref,
      issue_detail: observable.ref,

      activePeekOverviewIssueId: observable.ref,

      userSelectedStates: observable.ref,
      userSelectedLabels: observable.ref,
      userSelectedPriorities: observable.ref,
      // action
      setCurrentIssueBoardView: action,
      fetchPublicIssues: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  // computed
  getCountOfIssuesByState(state_id: string): number {
    return this.issues?.filter((issue) => issue.state == state_id).length || 0;
  }

  getFilteredIssuesByState(state_id: string): IIssue[] | [] {
    return this.issues?.filter((issue) => issue.state == state_id) || [];
  }

  setActivePeekOverviewIssueId = (issueId: string | null) => (this.activePeekOverviewIssueId = issueId);

  /**
   *
   * @param key Is the key of the filter, i.e. state, label, priority
   * @param value Is the value of the filter, i.e. state_id, label_id, priority
   * @returns boolean
   */

  getUserSelectedFilter(key: "state" | "priority" | "label", value: string): boolean {
    if (key == "state") {
      return this.userSelectedStates.includes(value);
    } else if (key == "label") {
      return this.userSelectedLabels.includes(value);
    } else if (key == "priority") {
      return this.userSelectedPriorities.includes(value);
    } else {
      return false;
    }
  }

  checkIfFilterExistsForKey: (key: "state" | "priority" | "label") => boolean = (key) => {
    if (key == "state") {
      return this.userSelectedStates.length > 0;
    } else if (key == "label") {
      return this.userSelectedLabels.length > 0;
    } else if (key == "priority") {
      return this.userSelectedPriorities.length > 0;
    } else {
      return false;
    }
  };

  clearUserSelectedFilter(key: "state" | "priority" | "label" | "all") {
    if (key == "state") {
      this.userSelectedStates = [];
    } else if (key == "label") {
      this.userSelectedLabels = [];
    } else if (key == "priority") {
      this.userSelectedPriorities = [];
    } else if (key == "all") {
      this.userSelectedStates = [];
      this.userSelectedLabels = [];
      this.userSelectedPriorities = [];
    }
  }

  getIfFiltersIsEmpty: () => boolean = () =>
    this.userSelectedStates.length === 0 &&
    this.userSelectedLabels.length === 0 &&
    this.userSelectedPriorities.length === 0;

  getURLDefinition = (
    workspaceSlug: string,
    projectId: string,
    action?: {
      key: "state" | "priority" | "label" | "all";
      value?: string;
      removeAll?: boolean;
    }
  ) => {
    let url = `/${workspaceSlug}/${projectId}?board=${this.currentIssueBoardView}`;

    if (action) {
      if (action.key === "state")
        this.userSelectedStates = action.removeAll
          ? []
          : [...this.userSelectedStates].filter((state) => state !== action.value);
      if (action.key === "label")
        this.userSelectedLabels = action.removeAll
          ? []
          : [...this.userSelectedLabels].filter((label) => label !== action.value);
      if (action.key === "priority")
        this.userSelectedPriorities = action.removeAll
          ? []
          : [...this.userSelectedPriorities].filter((priority) => priority !== action.value);
      if (action.key === "all") {
        this.userSelectedStates = [];
        this.userSelectedLabels = [];
        this.userSelectedPriorities = [];
      }
    }

    if (this.checkIfFilterExistsForKey("state")) {
      url += `&states=${this.userSelectedStates.join(",")}`;
    }
    if (this.checkIfFilterExistsForKey("label")) {
      url += `&labels=${this.userSelectedLabels.join(",")}`;
    }
    if (this.checkIfFilterExistsForKey("priority")) {
      url += `&priorities=${this.userSelectedPriorities.join(",")}`;
    }

    return url;
  };

  // action
  setCurrentIssueBoardView = async (view: TIssueBoardKeys) => {
    this.currentIssueBoardView = view;
  };

  fetchPublicIssues = async (workspaceSlug: string, projectId: string, params: any) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.issueService.getPublicIssues(workspaceSlug, projectId, params);

      if (response) {
        const _states: IIssueState[] = [...response?.states];
        const _labels: IIssueLabel[] = [...response?.labels];
        const _issues: IIssue[] = [...response?.issues];
        runInAction(() => {
          this.states = _states;
          this.labels = _labels;
          this.issues = _issues;
          this.loader = false;
        });
        return response;
      }
    } catch (error) {
      this.loader = false;
      this.error = error;
      return error;
    }
  };

  getIssueByIdAsync = async (workspaceSlug: string, projectId: string, issueId: string): Promise<IssueDetailType> => {
    try {
      const response = this.issues?.find((issue) => issue.id === issueId);

      if (response) {
        const _issue_detail = {
          ...this.issue_detail,
          [issueId]: {
            issue: response,
            comments: [],
            reactions: [],
            votes: [],
          },
        };
        runInAction(() => {
          this.issue_detail = _issue_detail;
        });

        this.getIssueReactionsAsync(workspaceSlug, projectId, issueId);
        this.getIssueVotesAsync(workspaceSlug, projectId, issueId);
        this.getIssueCommentsAsync(workspaceSlug, projectId, issueId);
      }

      return this.issue_detail[issueId] as any;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  getIssueVotesAsync = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueService.getIssueVotes(workspaceSlug, projectId, issueId);

      if (response) {
        const _issue_detail = {
          ...this.issue_detail,
          [issueId]: {
            ...this.issue_detail[issueId],
            votes: response,
          },
        };
        runInAction(() => {
          this.issue_detail = _issue_detail;
        });
      }

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  createIssueVoteAsync = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: {
      vote: 1 | -1;
    }
  ) => {
    try {
      const response = await this.issueService.createIssueVote(workspaceSlug, projectId, issueId, data);

      if (response) {
        const _issue_detail = {
          ...this.issue_detail,
          [issueId]: {
            ...this.issue_detail[issueId],
            votes: [
              ...{ ...this.issue_detail }[issueId].votes.filter(
                (vote) => vote.actor !== this.rootStore?.user?.currentUser?.id
              ),
              response,
            ],
          },
        };
        runInAction(() => {
          this.issue_detail = _issue_detail;
        });
      }

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  deleteIssueVoteAsync = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const _votes = (this.issue_detail[issueId].votes = this.issue_detail[issueId].votes.filter(
        (vote) => vote.actor !== this.rootStore?.user?.user?.id
      ));

      runInAction(() => {
        this.issue_detail[issueId].votes = _votes;
      });

      const response = await this.issueService.deleteIssueVote(workspaceSlug, projectId, issueId);

      const votesAfterCall = await this.issueService.getIssueVotes(workspaceSlug, projectId, issueId);

      if (votesAfterCall)
        runInAction(() => {
          this.issue_detail[issueId].votes = votesAfterCall;
        });

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  getIssueReactionsAsync = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueService.getIssueReactions(workspaceSlug, projectId, issueId);

      if (response) {
        const _issue_detail = {
          ...this.issue_detail,
          [issueId]: {
            ...this.issue_detail[issueId],
            reactions: response,
          },
        };
        runInAction(() => {
          this.issue_detail = _issue_detail;
        });
      }

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  createIssueReactionAsync = async (workspaceSlug: string, projectId: string, issueId: string, data: any) => {
    try {
      const response = await this.issueService.createIssueReaction(workspaceSlug, projectId, issueId, data);

      if (response) {
        const _issue_detail = {
          ...this.issue_detail,
          [issueId]: {
            ...this.issue_detail[issueId],
            reactions: [...this.issue_detail[issueId].reactions, response],
          },
        };
        runInAction(() => {
          this.issue_detail = _issue_detail;
        });
      }

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  deleteIssueReactionAsync = async (workspaceSlug: string, projectId: string, issueId: string, reactionHex: string) => {
    try {
      const newReactionsList = this.issue_detail[issueId].reactions.filter(
        (reaction) => reaction.reaction !== reactionHex
      );

      const _issue_detail = {
        ...this.issue_detail,
        [issueId]: {
          ...this.issue_detail[issueId],
          reactions: newReactionsList,
        },
      };

      runInAction(() => {
        this.issue_detail = _issue_detail;
      });

      const response = await this.issueService.deleteIssueReaction(workspaceSlug, projectId, issueId, reactionHex);

      const reactionsAfterCall = await this.issueService.getIssueReactions(workspaceSlug, projectId, issueId);

      if (reactionsAfterCall) {
        const _issue_detail = {
          ...this.issue_detail,
          [issueId]: {
            ...this.issue_detail[issueId],
            reactions: reactionsAfterCall,
          },
        };
        runInAction(() => {
          this.issue_detail = _issue_detail;
        });
      }

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  getIssueCommentsAsync = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueService.getIssueComments(workspaceSlug, projectId, issueId);

      if (response) {
        const _issue_detail = {
          ...this.issue_detail,
          [issueId]: {
            ...this.issue_detail[issueId],
            comments: response,
          },
        };
        runInAction(() => {
          this.issue_detail = _issue_detail;
        });
      }

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  createIssueCommentAsync = async (workspaceSlug: string, projectId: string, issueId: string, data: any) => {
    try {
      const response = await this.issueService.createIssueComment(workspaceSlug, projectId, issueId, data);

      if (response) {
        const _issue_detail = {
          ...this.issue_detail,
          [issueId]: {
            ...this.issue_detail[issueId],
            comments: [...this.issue_detail[issueId].comments, response],
          },
        };
        runInAction(() => {
          this.issue_detail = _issue_detail;
        });
      }

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  updateIssueCommentAsync = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: any
  ) => {
    try {
      const response = await this.issueService.updateIssueComment(workspaceSlug, projectId, issueId, commentId, data);

      if (response) {
        const _issue_detail = {
          ...this.issue_detail,
          [issueId]: {
            ...this.issue_detail[issueId],
            comments: [
              ...this.issue_detail[issueId].comments.filter((comment) => comment.id !== response.id),
              response,
            ],
          },
        };
        runInAction(() => {
          this.issue_detail = _issue_detail;
        });
      }

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  deleteIssueCommentAsync = async (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => {
    try {
      const newCommentsList = this.issue_detail[issueId].comments.filter((comment) => comment.id !== commentId);

      const _issue_detail = {
        ...this.issue_detail,
        [issueId]: {
          ...this.issue_detail[issueId],
          comments: newCommentsList,
        },
      };

      runInAction(() => {
        this.issue_detail = _issue_detail;
      });

      const response = await this.issueService.deleteIssueComment(workspaceSlug, projectId, issueId, commentId);

      const commentsAfterCall = await this.issueService.getIssueComments(workspaceSlug, projectId, issueId);

      if (commentsAfterCall) {
        const _issue_detail = {
          ...this.issue_detail,
          [issueId]: {
            ...this.issue_detail[issueId],
            comments: commentsAfterCall,
          },
        };
        runInAction(() => {
          this.issue_detail = _issue_detail;
        });
      }

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };
}

export default IssueLegacyStore;
