import { concat, find, orderBy, pull, set, uniq, update } from "lodash-es";
import { action, autorun, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { E_SORT_ORDER } from "@plane/constants";
import {
  TIssueCommentReaction,
  TIssueCommentReactionIdMap,
  TIssueCommentReactionMap,
  TLoader,
  TTeamspaceActivity,
  TTeamspaceReaction,
  TIssueComment,
} from "@plane/types";
// plane web imports
import { groupReactions } from "@plane/utils";
import { TeamspaceUpdatesService } from "@/plane-web/services/teamspace/teamspace-updates.service";
import { RootStore } from "@/plane-web/store/root.store";

export interface ITeamspaceUpdatesStore {
  // observables
  teamspaceActivityLoader: Record<string, TLoader>; // teamspaceId => loader
  teamspaceCommentLoader: Record<string, TLoader>; // teamspaceId => loader
  teamspaceActivityMap: Record<string, TTeamspaceActivity[]>; // teamspaceId => activities
  teamspaceCommentsMap: Record<string, TIssueComment[]>; // teamspaceId => comments
  teamspaceActivitySortOrder: E_SORT_ORDER | undefined; // teamspaceId => sortOrder
  teamspaceCommentsSortOrder: E_SORT_ORDER | undefined; // teamspaceId => sortOrder
  commentReactions: TIssueCommentReactionIdMap;
  commentReactionMap: TIssueCommentReactionMap;

  // computed functions
  getTeamspaceActivitiesLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspaceCommentsLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspaceActivities: (teamspaceId: string) => TTeamspaceActivity[] | undefined;
  getTeamspaceComments: (teamspaceId: string) => TIssueComment[] | undefined;
  getTeamspaceActivitySortOrder: () => E_SORT_ORDER;
  getTeamspaceCommentsSortOrder: () => E_SORT_ORDER;
  // helper action
  toggleTeamspaceActivitySortOrder: () => void;
  toggleTeamspaceCommentsSortOrder: () => void;
  // actions
  fetchTeamActivities: (workspaceSlug: string, teamspaceId: string) => Promise<TTeamspaceActivity[]>;
  fetchTeamspaceComments: (workspaceSlug: string, teamspaceId: string) => Promise<TIssueComment[]>;
  createTeamspaceComment: (
    workspaceSlug: string,
    teamspaceId: string,
    payload: Partial<TIssueComment>
  ) => Promise<TIssueComment>;
  updateTeamspaceComment: (
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string,
    payload: Partial<TIssueComment>
  ) => Promise<void>;
  deleteTeamspaceComment: (workspaceSlug: string, teamspaceId: string, commentId: string) => Promise<void>;
  addCommentReaction: (
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string,
    payload: Partial<TTeamspaceReaction>
  ) => Promise<TTeamspaceReaction>;
  deleteCommentReaction: (
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string,
    reactionId: string,
    reactionEmoji: string
  ) => Promise<void>;
  getCommentReactionsByCommentId: (commentId: string) => { [reaction: string]: string[] } | undefined;
  getCommentReactionById: (reactionId: string) => TIssueCommentReaction | undefined;
  commentReactionsByUser: (commentId: string, userId: string) => TIssueCommentReaction[];
}

export class TeamspaceUpdatesStore implements ITeamspaceUpdatesStore {
  // observables
  teamspaceActivityLoader: Record<string, TLoader> = {}; // teamspaceId => loader
  teamspaceCommentLoader: Record<string, TLoader> = {}; // teamspaceId => loader
  teamspaceActivityMap: Record<string, TTeamspaceActivity[]> = {}; // teamspaceId => activities
  teamspaceCommentsMap: Record<string, TIssueComment[]> = {}; // teamspaceId => comments
  teamspaceActivitySortOrder: ITeamspaceUpdatesStore["teamspaceActivitySortOrder"] = undefined; // teamspaceId => sortOrder
  teamspaceCommentsSortOrder: ITeamspaceUpdatesStore["teamspaceCommentsSortOrder"] = undefined; // teamspaceId => sortOrder
  commentReactions: TIssueCommentReactionIdMap = {};
  commentReactionMap: TIssueCommentReactionMap = {};
  // store
  rootStore: RootStore;
  // service
  teamspaceUpdatesService: TeamspaceUpdatesService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      teamspaceActivityLoader: observable,
      teamspaceCommentLoader: observable,
      teamspaceCommentsMap: observable,
      teamspaceActivityMap: observable,
      teamspaceActivitySortOrder: observable,
      teamspaceCommentsSortOrder: observable,
      commentReactions: observable,
      commentReactionMap: observable,
      // helper action
      toggleTeamspaceActivitySortOrder: action,
      toggleTeamspaceCommentsSortOrder: action,
      // actions
      fetchTeamActivities: action,
      fetchTeamspaceComments: action,
      createTeamspaceComment: action,
      updateTeamspaceComment: action,
      deleteTeamspaceComment: action,
      addCommentReaction: action,
      deleteCommentReaction: action,
    });
    // store
    this.rootStore = _rootStore;
    // service
    this.teamspaceUpdatesService = new TeamspaceUpdatesService();

    // autorun to get or set teamspace activity sort order to local storage
    autorun(() => {
      if (typeof localStorage === "undefined") return;
      if (this.teamspaceActivitySortOrder === undefined) {
        // Initialize sort order if not set
        const storedSortOrder =
          (localStorage.getItem(`teamspace-activity-sort-order`) as E_SORT_ORDER | undefined) ?? E_SORT_ORDER.ASC;
        this.teamspaceActivitySortOrder = storedSortOrder;
      } else {
        // Update local storage if sort order is set
        localStorage.setItem(`teamspace-activity-sort-order`, this.teamspaceActivitySortOrder);
      }
    });

    // autorun to get or set teamspace comments sort order to local storage
    autorun(() => {
      if (typeof localStorage === "undefined") return;
      if (this.teamspaceCommentsSortOrder === undefined) {
        // Initialize sort order if not set
        const storedSortOrder =
          (localStorage.getItem(`teamspace-comments-sort-order`) as E_SORT_ORDER | undefined) ?? E_SORT_ORDER.DESC;
        this.teamspaceCommentsSortOrder = storedSortOrder;
      } else {
        // Update local storage if sort order is set
        localStorage.setItem(`teamspace-comments-sort-order`, this.teamspaceCommentsSortOrder);
      }
    });
  }

  // helper methods
  getCommentReactionsByCommentId = (commentId: string) => {
    if (!commentId) return undefined;
    return this.commentReactions[commentId] ?? undefined;
  };

  getCommentReactionById = (reactionId: string) => {
    if (!reactionId) return undefined;
    return this.commentReactionMap[reactionId] ?? undefined;
  };

  commentReactionsByUser = (commentId: string, userId: string) => {
    if (!commentId || !userId) return [];

    const reactions = this.getCommentReactionsByCommentId(commentId);
    if (!reactions) return [];

    const _userReactions: TIssueCommentReaction[] = [];
    Object.keys(reactions).forEach((reaction) => {
      if (reactions?.[reaction])
        reactions?.[reaction].map((reactionId) => {
          const currentReaction = this.getCommentReactionById(reactionId);
          if (currentReaction && currentReaction.actor === userId) _userReactions.push(currentReaction);
        });
    });

    return _userReactions;
  };

  // computed functions
  /**
   * Get teamspace activities loader
   * @param teamspaceId
   */
  getTeamspaceActivitiesLoader = computedFn((teamspaceId: string) => this.teamspaceActivityLoader[teamspaceId]);

  /**
   * Get teamspace comments loader
   * @param teamspaceId
   */
  getTeamspaceCommentsLoader = computedFn((teamspaceId: string) => this.teamspaceCommentLoader[teamspaceId]);

  /**
   * Get teamspace activities
   * @param teamspaceId
   */
  getTeamspaceActivities = computedFn((teamspaceId: string) =>
    orderBy(this.teamspaceActivityMap[teamspaceId], "created_at", this.teamspaceActivitySortOrder)
  );

  /**
   * Get teamspace comments
   * @param teamspaceId
   */
  getTeamspaceComments = computedFn((teamspaceId: string) =>
    orderBy(this.teamspaceCommentsMap[teamspaceId], "created_at", this.teamspaceCommentsSortOrder)
  );

  /**
   * Get teamspace activity sort order
   * @param teamspaceId
   */
  getTeamspaceActivitySortOrder = computedFn(() => this.teamspaceActivitySortOrder ?? E_SORT_ORDER.ASC);

  /**
   * Get teamspace comments sort order
   * @param teamspaceId
   */
  getTeamspaceCommentsSortOrder = computedFn(() => this.teamspaceCommentsSortOrder ?? E_SORT_ORDER.DESC);

  // helper actions
  /**
   * Merge activities
   * @param currentActivities
   * @param newActivities
   */
  mergeActivities = (
    currentActivities: TTeamspaceActivity[],
    newActivities: TTeamspaceActivity[]
  ): TTeamspaceActivity[] => {
    // Create a map for lookups of new activities
    const newActivitiesMap = new Map(newActivities.map((activity) => [activity.id, activity]));

    // Update existing activities if they exist in new activities
    const updatedActivities = currentActivities.map((activity) => {
      const matchingNewActivity = newActivitiesMap.get(activity.id);
      return matchingNewActivity
        ? {
            ...activity,
            created_at: matchingNewActivity.created_at,
          }
        : activity;
    });

    // Find activities that don't exist in current activities
    const existingIdsSet = new Set(currentActivities.map((activity) => activity.id));
    const activitiesToAdd = newActivities.filter((activity) => !existingIdsSet.has(activity.id));

    // Combine and deduplicate
    return uniq(concat(updatedActivities, activitiesToAdd));
  };

  /**
   * Toggle teamspace activity sort order
   * @param teamspaceId
   */
  toggleTeamspaceActivitySortOrder = () => {
    this.teamspaceActivitySortOrder =
      this.teamspaceActivitySortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC;
  };

  /**
   * Toggle teamspace comments sort order
   * @param teamspaceId
   */
  toggleTeamspaceCommentsSortOrder = () => {
    this.teamspaceCommentsSortOrder =
      this.teamspaceCommentsSortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC;
  };

  // actions
  /**
   * Fetch teamspace activities
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<TTeamspaceActivity[]>
   *
   */
  fetchTeamActivities = async (workspaceSlug: string, teamspaceId: string) => {
    try {
      // Generate props
      let props = {};
      const currentActivities = this.teamspaceActivityMap[teamspaceId];
      if (currentActivities && currentActivities.length > 0) {
        // set the loader
        set(this.teamspaceActivityLoader, teamspaceId, "mutation");
        // Get last activity
        const currentActivity = currentActivities[currentActivities.length - 1];
        if (currentActivity) props = { created_at__gt: currentActivity.created_at };
      } else {
        set(this.teamspaceActivityLoader, teamspaceId, "init-loader");
      }
      // Fetch teamspace activities
      const activities = await this.teamspaceUpdatesService.getTeamspaceActivities(workspaceSlug, teamspaceId, props);
      // Update teamspace activities store
      runInAction(() => {
        update(this.teamspaceActivityMap, teamspaceId, (currentActivities) => {
          if (!currentActivities) return activities;
          return this.mergeActivities(currentActivities, activities);
        });
      });
      return activities;
    } catch (error) {
      console.log("error while fetching teamspace activities", error);
      throw error;
    } finally {
      set(this.teamspaceActivityLoader, teamspaceId, "loaded");
    }
  };

  /**
   * Fetch teamspace comments
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<TIssueComment[]>
   */
  fetchTeamspaceComments = async (workspaceSlug: string, teamspaceId: string): Promise<TIssueComment[]> => {
    try {
      // Set loader
      set(this.teamspaceCommentLoader, teamspaceId, "init-loader");
      // Fetch teamspace comments
      const response = await this.teamspaceUpdatesService.getTeamspaceComments(workspaceSlug, teamspaceId);
      // Update teamspace comments store
      runInAction(() => {
        set(this.teamspaceCommentsMap, teamspaceId, response);
        response.map((comment) => {
          const groupedReactions = groupReactions(comment.comment_reactions || [], "reaction");

          const commentReactionIdsMap: { [reaction: string]: string[] } = {};

          Object.keys(groupedReactions).map((reactionId) => {
            const reactionIds = (groupedReactions[reactionId] || []).map((reaction) => reaction.id);
            commentReactionIdsMap[reactionId] = reactionIds;
          });

          runInAction(() => {
            set(this.commentReactions, comment.id, commentReactionIdsMap);
            (comment.comment_reactions || []).forEach((reaction) =>
              set(this.commentReactionMap, reaction.id, reaction)
            );
          });
        });
      });
      return response;
    } catch (e) {
      console.log("error while fetching teamspace comments", e);
      throw e;
    } finally {
      set(this.teamspaceCommentLoader, teamspaceId, "loaded");
    }
  };

  /**
   * Create teamspace comment
   * @param workspaceSlug
   * @param teamspaceId
   * @param payload
   * @returns Promise<TIssueComment>
   */
  createTeamspaceComment = async (
    workspaceSlug: string,
    teamspaceId: string,
    payload: Partial<TIssueComment>
  ): Promise<TIssueComment> => {
    try {
      // set the loader to mutation
      set(this.teamspaceCommentLoader, teamspaceId, "mutation");
      // Create teamspace comment
      const response = await this.teamspaceUpdatesService.createTeamspaceComment(workspaceSlug, teamspaceId, payload);
      // Update teamspace comments store
      runInAction(() => {
        if (!this.teamspaceCommentsMap[teamspaceId] || !Array.isArray(this.teamspaceCommentsMap[teamspaceId]))
          this.teamspaceCommentsMap[teamspaceId] = [];
        this.teamspaceCommentsMap[teamspaceId].push(response);
      });
      return response;
    } catch (e) {
      console.log("error while creating teamspace comment", e);
      throw e;
    } finally {
      set(this.teamspaceCommentLoader, teamspaceId, "loaded");
    }
  };

  /**
   * Update teamspace comment
   * @param workspaceSlug
   * @param teamspaceId
   * @param commentId
   * @param payload
   * @returns Promise<void>
   */
  updateTeamspaceComment = async (
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string,
    payload: Partial<TIssueComment>
  ): Promise<void> => {
    try {
      // set the loader to mutation
      set(this.teamspaceCommentLoader, teamspaceId, "mutation");
      // Update teamspace comment
      const response = await this.teamspaceUpdatesService.updateTeamspaceComment(
        workspaceSlug,
        teamspaceId,
        commentId,
        payload
      );
      // Update teamspace comments store
      runInAction(() => {
        // Check if teamspace comments exist
        if (!this.teamspaceCommentsMap[teamspaceId] || !Array.isArray(this.teamspaceCommentsMap[teamspaceId])) return;
        // Find and update teamspace comment store data
        const teamspaceCommentIndex = this.teamspaceCommentsMap[teamspaceId].findIndex(
          (teamspaceComment) => teamspaceComment.id === commentId
        );
        if (teamspaceCommentIndex < 0) return;
        const teamspaceComment = this.teamspaceCommentsMap[teamspaceId][teamspaceCommentIndex];
        this.teamspaceCommentsMap[teamspaceId][teamspaceCommentIndex] = { ...teamspaceComment, ...response };
      });
    } catch (e) {
      console.log("error while updating teamspace Comment", e);
      throw e;
    } finally {
      set(this.teamspaceCommentLoader, teamspaceId, "loaded");
    }
  };

  /**
   * Delete teamspace comment
   * @param workspaceSlug
   * @param teamspaceId
   * @param commentId
   * @returns Promise<void>
   */
  deleteTeamspaceComment = async (workspaceSlug: string, teamspaceId: string, commentId: string): Promise<void> => {
    try {
      // set the loader to mutation
      set(this.teamspaceCommentLoader, teamspaceId, "mutation");
      // Delete teamspace comment
      await this.teamspaceUpdatesService.deleteTeamspaceComment(workspaceSlug, teamspaceId, commentId);
      runInAction(() => {
        // Check if teamspace comments exist
        if (!this.teamspaceCommentsMap[teamspaceId] || !Array.isArray(this.teamspaceCommentsMap[teamspaceId])) return;
        // Find and remove teamspace comment
        update(this.teamspaceCommentsMap, [teamspaceId], (comments: TIssueComment[]) =>
          comments.filter((comment) => comment.id !== commentId)
        );
      });
    } catch (e) {
      console.log("error while updating teamspace Comment", e);
      throw e;
    } finally {
      set(this.teamspaceCommentLoader, teamspaceId, "loaded");
    }
  };

  /**
   * Add teamspace comment reaction
   * @param workspaceSlug
   * @param teamspaceId
   * @param commentId
   * @param payload
   * @returns Promise<TTeamspaceReaction>
   */
  addCommentReaction = async (
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string,
    payload: Partial<TTeamspaceReaction>
  ): Promise<TTeamspaceReaction> => {
    try {
      // Add teamspace comment reaction
      const response = await this.teamspaceUpdatesService.createTeamspaceCommentReaction(
        workspaceSlug,
        teamspaceId,
        commentId,
        payload
      );
      runInAction(() => {
        update(this.commentReactions, `${commentId}.${payload.reaction}`, (reactionId) => {
          if (!reactionId) return [response.id];
          return concat(reactionId, response.id);
        });
        set(this.commentReactionMap, response.id, response);
      });
      return response;
    } catch (e) {
      console.error("error while adding reaction to teamspace comment", e);
      throw e;
    }
  };

  /**
   * Delete a reaction from a teamspace comment
   * @param workspaceSlug
   * @param teamspaceId
   * @param commentId
   * @param reactionId
   * @param reactionEmoji
   */
  deleteCommentReaction = async (
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string,
    userId: string,
    reactionEmoji: string
  ): Promise<void> => {
    try {
      const userReactions = this.commentReactionsByUser(commentId, userId);
      const currentReaction = find(userReactions, { actor: userId, reaction: reactionEmoji });

      if (currentReaction && currentReaction.id) {
        runInAction(() => {
          pull(this.commentReactions[commentId][reactionEmoji], currentReaction.id);
          delete this.commentReactionMap[reactionEmoji];
        });
      }
      // Delete teamspace comment reaction
      await this.teamspaceUpdatesService.deleteTeamspaceCommentReaction(
        workspaceSlug,
        teamspaceId,
        commentId,
        reactionEmoji
      );
    } catch (e) {
      console.error("error while deleting reaction to teamspace Comment", e);
      throw e;
    }
  };
}
