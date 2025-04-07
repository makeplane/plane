import concat from "lodash/concat";
import orderBy from "lodash/orderBy";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, autorun, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { E_SORT_ORDER } from "@plane/constants";
import { TLoader, TTeamspaceActivity, TTeamspaceReaction } from "@plane/types";
// plane web imports
import { TeamspaceUpdatesService } from "@/plane-web/services/teamspace/teamspace-updates.service";
import { RootStore } from "@/plane-web/store/root.store";
import { TTeamspaceComment } from "@/plane-web/types";

export interface ITeamspaceUpdatesStore {
  // observables
  teamspaceActivityLoader: Record<string, TLoader>; // teamspaceId => loader
  teamspaceCommentLoader: Record<string, TLoader>; // teamspaceId => loader
  teamspaceActivityMap: Record<string, TTeamspaceActivity[]>; // teamspaceId => activities
  teamspaceCommentsMap: Record<string, TTeamspaceComment[]>; // teamspaceId => comments
  teamspaceActivitySortOrder: E_SORT_ORDER | undefined; // teamspaceId => sortOrder
  teamspaceCommentsSortOrder: E_SORT_ORDER | undefined; // teamspaceId => sortOrder
  // computed functions
  getTeamspaceActivitiesLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspaceCommentsLoader: (teamspaceId: string) => TLoader | undefined;
  getTeamspaceActivities: (teamspaceId: string) => TTeamspaceActivity[] | undefined;
  getTeamspaceComments: (teamspaceId: string) => TTeamspaceComment[] | undefined;
  getTeamspaceActivitySortOrder: () => E_SORT_ORDER;
  getTeamspaceCommentsSortOrder: () => E_SORT_ORDER;
  // helper action
  toggleTeamspaceActivitySortOrder: () => void;
  toggleTeamspaceCommentsSortOrder: () => void;
  // actions
  fetchTeamActivities: (workspaceSlug: string, teamspaceId: string) => Promise<TTeamspaceActivity[]>;
  fetchTeamspaceComments: (workspaceSlug: string, teamspaceId: string) => Promise<TTeamspaceComment[]>;
  createTeamspaceComment: (
    workspaceSlug: string,
    teamspaceId: string,
    payload: Partial<TTeamspaceComment>
  ) => Promise<TTeamspaceComment>;
  updateTeamspaceComment: (
    workspaceSlug: string,
    teamspaceId: string,
    commentId: string,
    payload: Partial<TTeamspaceComment>
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
}

export class TeamspaceUpdatesStore implements ITeamspaceUpdatesStore {
  // observables
  teamspaceActivityLoader: Record<string, TLoader> = {}; // teamspaceId => loader
  teamspaceCommentLoader: Record<string, TLoader> = {}; // teamspaceId => loader
  teamspaceActivityMap: Record<string, TTeamspaceActivity[]> = {}; // teamspaceId => activities
  teamspaceCommentsMap: Record<string, TTeamspaceComment[]> = {}; // teamspaceId => comments
  teamspaceActivitySortOrder: ITeamspaceUpdatesStore["teamspaceActivitySortOrder"] = undefined; // teamspaceId => sortOrder
  teamspaceCommentsSortOrder: ITeamspaceUpdatesStore["teamspaceCommentsSortOrder"] = undefined; // teamspaceId => sortOrder
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
   * @returns Promise<TTeamspaceComment[]>
   */
  fetchTeamspaceComments = async (workspaceSlug: string, teamspaceId: string): Promise<TTeamspaceComment[]> => {
    try {
      // Set loader
      set(this.teamspaceCommentLoader, teamspaceId, "init-loader");
      // Fetch teamspace comments
      const response = await this.teamspaceUpdatesService.getTeamspaceComments(workspaceSlug, teamspaceId);
      // Update teamspace comments store
      runInAction(() => {
        set(this.teamspaceCommentsMap, teamspaceId, response);
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
   * @returns Promise<TTeamspaceComment>
   */
  createTeamspaceComment = async (
    workspaceSlug: string,
    teamspaceId: string,
    payload: Partial<TTeamspaceComment>
  ): Promise<TTeamspaceComment> => {
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
    payload: Partial<TTeamspaceComment>
  ): Promise<void> => {
    try {
      // set the loader to mutation
      set(this.teamspaceCommentLoader, teamspaceId, "mutation");
      // Update teamspace comment
      await this.teamspaceUpdatesService.updateTeamspaceComment(workspaceSlug, teamspaceId, commentId, payload);
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
        this.teamspaceCommentsMap[teamspaceId][teamspaceCommentIndex] = { ...teamspaceComment, ...payload };
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
        update(this.teamspaceCommentsMap, [teamspaceId], (comments: TTeamspaceComment[]) =>
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
        // Check if teamspace comments exist
        if (!this.teamspaceCommentsMap[teamspaceId] || !Array.isArray(this.teamspaceCommentsMap[teamspaceId])) return;
        // Find and update comment reaction
        const teamspaceCommentIndex = this.teamspaceCommentsMap[teamspaceId].findIndex(
          (teamspaceComment) => teamspaceComment.id === commentId
        );
        if (teamspaceCommentIndex < 0) return;
        const teamspaceComment = this.teamspaceCommentsMap[teamspaceId][teamspaceCommentIndex];
        if (!teamspaceComment.comment_reactions || !Array.isArray(teamspaceComment.comment_reactions))
          teamspaceComment.comment_reactions = [];
        teamspaceComment.comment_reactions.push(response);
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
    reactionId: string,
    reactionEmoji: string
  ): Promise<void> => {
    try {
      // Delete teamspace comment reaction
      await this.teamspaceUpdatesService.deleteTeamspaceCommentReaction(
        workspaceSlug,
        teamspaceId,
        commentId,
        reactionEmoji
      );
      runInAction(() => {
        // Check if teamspace comments exist
        if (!this.teamspaceCommentsMap[teamspaceId] || !Array.isArray(this.teamspaceCommentsMap[teamspaceId])) return;
        // Find and remove comment reaction
        const teamspaceCommentIndex = this.teamspaceCommentsMap[teamspaceId].findIndex(
          (teamspaceComment) => teamspaceComment.id === commentId
        );
        if (teamspaceCommentIndex < 0) return;
        const teamspaceComment = this.teamspaceCommentsMap[teamspaceId][teamspaceCommentIndex];
        if (!teamspaceComment.comment_reactions || !Array.isArray(teamspaceComment.comment_reactions)) return;
        update(
          this.teamspaceCommentsMap[teamspaceId][teamspaceCommentIndex],
          ["comment_reactions"],
          (reactions: TTeamspaceReaction[]) => reactions.filter((reaction) => reaction.id !== reactionId)
        );
      });
    } catch (e) {
      console.error("error while deleting reaction to teamspace Comment", e);
      throw e;
    }
  };
}
