import concat from "lodash/concat";
import orderBy from "lodash/orderBy";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { TLoader, TTeamActivity, TTeamReaction } from "@plane/types";
// plane web imports
import { TeamUpdatesService } from "@/plane-web/services/teams/team-updates.service";
import { RootStore } from "@/plane-web/store/root.store";
import { TTeamComment } from "@/plane-web/types";

export interface ITeamUpdatesStore {
  // observables
  teamActivityLoader: Record<string, TLoader>; // teamId => loader
  teamCommentLoader: Record<string, TLoader>; // teamId => loader
  teamActivityMap: Record<string, TTeamActivity[]>; // teamId => activities
  teamCommentsMap: Record<string, TTeamComment[]>; // teamId => comments
  teamActivitySortOrder: Record<string, "asc" | "desc">; // teamId => sortOrder
  teamCommentsSortOrder: Record<string, "asc" | "desc">; // teamId => sortOrder
  // computed functions
  getTeamActivitiesLoader: (teamId: string) => TLoader | undefined;
  getTeamCommentsLoader: (teamId: string) => TLoader | undefined;
  getTeamActivities: (teamId: string) => TTeamActivity[] | undefined;
  getTeamComments: (teamId: string) => TTeamComment[] | undefined;
  getTeamActivitySortOrder: (teamId: string) => "asc" | "desc";
  getTeamCommentsSortOrder: (teamId: string) => "asc" | "desc";
  // helper action
  toggleTeamActivitySortOrder: (teamId: string) => void;
  toggleTeamCommentsSortOrder: (teamId: string) => void;
  // actions
  fetchTeamActivities: (workspaceSlug: string, teamId: string) => Promise<TTeamActivity[]>;
  fetchTeamComments: (workspaceSlug: string, teamId: string) => Promise<TTeamComment[]>;
  createTeamComment: (workspaceSlug: string, teamId: string, payload: Partial<TTeamComment>) => Promise<TTeamComment>;
  updateTeamComment: (
    workspaceSlug: string,
    teamId: string,
    commentId: string,
    payload: Partial<TTeamComment>
  ) => Promise<void>;
  deleteTeamComment: (workspaceSlug: string, teamId: string, commentId: string) => Promise<void>;
  addCommentReaction: (
    workspaceSlug: string,
    teamId: string,
    commentId: string,
    payload: Partial<TTeamReaction>
  ) => Promise<TTeamReaction>;
  deleteCommentReaction: (
    workspaceSlug: string,
    teamId: string,
    commentId: string,
    reactionId: string,
    reactionEmoji: string
  ) => Promise<void>;
}

export class TeamUpdatesStore implements ITeamUpdatesStore {
  // observables
  teamActivityLoader: Record<string, TLoader> = {}; // teamId => loader
  teamCommentLoader: Record<string, TLoader> = {}; // teamId => loader
  teamActivityMap: Record<string, TTeamActivity[]> = {}; // teamId => activities
  teamCommentsMap: Record<string, TTeamComment[]> = {}; // teamId => comments
  teamActivitySortOrder: Record<string, "asc" | "desc"> = {}; // teamId => sortOrder
  teamCommentsSortOrder: Record<string, "asc" | "desc"> = {}; // teamId => sortOrder
  // store
  rootStore: RootStore;
  // service
  teamUpdatesService: TeamUpdatesService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      teamActivityLoader: observable,
      teamCommentLoader: observable,
      teamCommentsMap: observable,
      teamActivityMap: observable,
      teamActivitySortOrder: observable,
      teamCommentsSortOrder: observable,
      // helper action
      toggleTeamActivitySortOrder: action,
      toggleTeamCommentsSortOrder: action,
      // actions
      fetchTeamActivities: action,
      fetchTeamComments: action,
      createTeamComment: action,
      updateTeamComment: action,
      deleteTeamComment: action,
      addCommentReaction: action,
      deleteCommentReaction: action,
    });
    // store
    this.rootStore = _rootStore;
    // service
    this.teamUpdatesService = new TeamUpdatesService();
  }

  // computed functions
  /**
   * Get team activities loader
   * @param teamId
   */
  getTeamActivitiesLoader = computedFn((teamId: string) => this.teamActivityLoader[teamId]);

  /**
   * Get team comments loader
   * @param teamId
   */
  getTeamCommentsLoader = computedFn((teamId: string) => this.teamCommentLoader[teamId]);

  /**
   * Get team activities
   * @param teamId
   */
  getTeamActivities = computedFn((teamId: string) =>
    orderBy(this.teamActivityMap[teamId], "created_at", this.getTeamActivitySortOrder(teamId))
  );

  /**
   * Get team comments
   * @param teamId
   */
  getTeamComments = computedFn((teamId: string) =>
    orderBy(this.teamCommentsMap[teamId], "created_at", this.getTeamCommentsSortOrder(teamId))
  );

  /**
   * Get team activity sort order
   * @param teamId
   */
  getTeamActivitySortOrder = computedFn((teamId: string) => this.teamActivitySortOrder[teamId] ?? "asc");

  /**
   * Get team comments sort order
   * @param teamId
   */
  getTeamCommentsSortOrder = computedFn((teamId: string) => this.teamCommentsSortOrder[teamId] ?? "desc");

  // helper actions
  /**
   * Toggle team activity sort order
   * @param teamId
   */
  toggleTeamActivitySortOrder = (teamId: string) => {
    set(this.teamActivitySortOrder, teamId, this.teamActivitySortOrder[teamId] === "asc" ? "desc" : "asc");
  };

  /**
   * Toggle team comments sort order
   * @param teamId
   */
  toggleTeamCommentsSortOrder = (teamId: string) => {
    set(this.teamCommentsSortOrder, teamId, this.teamCommentsSortOrder[teamId] === "asc" ? "desc" : "asc");
  };

  // actions
  /**
   * Fetch team activities
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<TTeamActivity[]>
   *
   */
  fetchTeamActivities = async (workspaceSlug: string, teamId: string) => {
    try {
      // Generate props
      let props = {};
      const currentActivities = this.teamActivityMap[teamId];
      if (currentActivities && currentActivities.length > 0) {
        // set the loader
        set(this.teamActivityLoader, teamId, "mutation");
        // Get last activity
        const currentActivity = currentActivities[currentActivities.length - 1];
        if (currentActivity) props = { created_at__gt: currentActivity.created_at };
      } else {
        set(this.teamActivityLoader, teamId, "init-loader");
      }
      // Fetch team activities
      const activities = await this.teamUpdatesService.getTeamActivities(workspaceSlug, teamId, props);
      // Update team activities store
      runInAction(() => {
        update(this.teamActivityMap, teamId, (currentActivities) => {
          if (!currentActivities) return activities;
          return uniq(concat(currentActivities, activities));
        });
      });
      return activities;
    } catch (error) {
      console.log("error while fetching team activities", error);
      throw error;
    } finally {
      set(this.teamActivityLoader, teamId, "loaded");
    }
  };

  /**
   * Fetch team comments
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<TTeamComment[]>
   */
  fetchTeamComments = async (workspaceSlug: string, teamId: string): Promise<TTeamComment[]> => {
    try {
      // Set loader
      set(this.teamCommentLoader, teamId, "init-loader");
      // Fetch team comments
      const response = await this.teamUpdatesService.getTeamComments(workspaceSlug, teamId);
      // Update team comments store
      runInAction(() => {
        set(this.teamCommentsMap, teamId, response);
      });
      return response;
    } catch (e) {
      console.log("error while fetching team comments", e);
      throw e;
    } finally {
      set(this.teamCommentLoader, teamId, "loaded");
    }
  };

  /**
   * Create team comment
   * @param workspaceSlug
   * @param teamId
   * @param payload
   * @returns Promise<TTeamComment>
   */
  createTeamComment = async (
    workspaceSlug: string,
    teamId: string,
    payload: Partial<TTeamComment>
  ): Promise<TTeamComment> => {
    try {
      // set the loader to mutation
      set(this.teamCommentLoader, teamId, "mutation");
      // Create team comment
      const response = await this.teamUpdatesService.createTeamComment(workspaceSlug, teamId, payload);
      // Update team comments store
      runInAction(() => {
        if (!this.teamCommentsMap[teamId] || !Array.isArray(this.teamCommentsMap[teamId]))
          this.teamCommentsMap[teamId] = [];
        this.teamCommentsMap[teamId].push(response);
      });
      return response;
    } catch (e) {
      console.log("error while creating team comment", e);
      throw e;
    } finally {
      set(this.teamCommentLoader, teamId, "loaded");
    }
  };

  /**
   * Update team comment
   * @param workspaceSlug
   * @param teamId
   * @param commentId
   * @param payload
   * @returns Promise<void>
   */
  updateTeamComment = async (
    workspaceSlug: string,
    teamId: string,
    commentId: string,
    payload: Partial<TTeamComment>
  ): Promise<void> => {
    try {
      // set the loader to mutation
      set(this.teamCommentLoader, teamId, "mutation");
      // Update team comment
      await this.teamUpdatesService.updateTeamComment(workspaceSlug, teamId, commentId, payload);
      // Update team comments store
      runInAction(() => {
        // Check if team comments exist
        if (!this.teamCommentsMap[teamId] || !Array.isArray(this.teamCommentsMap[teamId])) return;
        // Find and update team comment store data
        const teamCommentIndex = this.teamCommentsMap[teamId].findIndex((teamComment) => teamComment.id === commentId);
        if (teamCommentIndex < 0) return;
        const teamComment = this.teamCommentsMap[teamId][teamCommentIndex];
        this.teamCommentsMap[teamId][teamCommentIndex] = { ...teamComment, ...payload };
      });
    } catch (e) {
      console.log("error while updating team Comment", e);
      throw e;
    } finally {
      set(this.teamCommentLoader, teamId, "loaded");
    }
  };

  /**
   * Delete team comment
   * @param workspaceSlug
   * @param teamId
   * @param commentId
   * @returns Promise<void>
   */
  deleteTeamComment = async (workspaceSlug: string, teamId: string, commentId: string): Promise<void> => {
    try {
      // set the loader to mutation
      set(this.teamCommentLoader, teamId, "mutation");
      // Delete team comment
      await this.teamUpdatesService.deleteTeamComment(workspaceSlug, teamId, commentId);
      runInAction(() => {
        // Check if team comments exist
        if (!this.teamCommentsMap[teamId] || !Array.isArray(this.teamCommentsMap[teamId])) return;
        // Find and remove team comment
        update(this.teamCommentsMap, [teamId], (comments: TTeamComment[]) =>
          comments.filter((comment) => comment.id !== commentId)
        );
      });
    } catch (e) {
      console.log("error while updating team Comment", e);
      throw e;
    } finally {
      set(this.teamCommentLoader, teamId, "loaded");
    }
  };

  /**
   * Add team comment reaction
   * @param workspaceSlug
   * @param teamId
   * @param commentId
   * @param payload
   * @returns Promise<TTeamReaction>
   */
  addCommentReaction = async (
    workspaceSlug: string,
    teamId: string,
    commentId: string,
    payload: Partial<TTeamReaction>
  ): Promise<TTeamReaction> => {
    try {
      // Add team comment reaction
      const response = await this.teamUpdatesService.createTeamCommentReaction(
        workspaceSlug,
        teamId,
        commentId,
        payload
      );
      runInAction(() => {
        // Check if team comments exist
        if (!this.teamCommentsMap[teamId] || !Array.isArray(this.teamCommentsMap[teamId])) return;
        // Find and update comment reaction
        const teamCommentIndex = this.teamCommentsMap[teamId].findIndex((teamComment) => teamComment.id === commentId);
        if (teamCommentIndex < 0) return;
        const teamComment = this.teamCommentsMap[teamId][teamCommentIndex];
        if (!teamComment.comment_reactions || !Array.isArray(teamComment.comment_reactions))
          teamComment.comment_reactions = [];
        teamComment.comment_reactions.push(response);
      });
      return response;
    } catch (e) {
      console.error("error while adding reaction to team comment", e);
      throw e;
    }
  };

  /**
   * Delete a reaction from a team comment
   * @param workspaceSlug
   * @param teamId
   * @param commentId
   * @param reactionId
   * @param reactionEmoji
   */
  deleteCommentReaction = async (
    workspaceSlug: string,
    teamId: string,
    commentId: string,
    reactionId: string,
    reactionEmoji: string
  ): Promise<void> => {
    try {
      // Delete team comment reaction
      await this.teamUpdatesService.deleteTeamCommentReaction(workspaceSlug, teamId, commentId, reactionEmoji);
      runInAction(() => {
        // Check if team comments exist
        if (!this.teamCommentsMap[teamId] || !Array.isArray(this.teamCommentsMap[teamId])) return;
        // Find and remove comment reaction
        const teamCommentIndex = this.teamCommentsMap[teamId].findIndex((teamComment) => teamComment.id === commentId);
        if (teamCommentIndex < 0) return;
        const teamComment = this.teamCommentsMap[teamId][teamCommentIndex];
        if (!teamComment.comment_reactions || !Array.isArray(teamComment.comment_reactions)) return;
        update(this.teamCommentsMap[teamId][teamCommentIndex], ["comment_reactions"], (reactions: TTeamReaction[]) =>
          reactions.filter((reaction) => reaction.id !== reactionId)
        );
      });
    } catch (e) {
      console.error("error while deleting reaction to team Comment", e);
      throw e;
    }
  };
}
