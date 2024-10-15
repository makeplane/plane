import { set } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";
import { ICycle } from "@plane/types";
import { RootStore } from "@/plane-web/store/root.store";
import { ICycleStore as ICeCycleStore, CycleStore as CeCycleStore } from "@/store/cycle.store";
import { CycleUpdateService } from "../services/cycle.service";
import { TCycleUpdateReaction, TCycleUpdates } from "../types";

export interface ICycleStore extends ICeCycleStore {
  cycleUpdateIds: string[];
  cycleUpdateMap: Record<string, TCycleUpdates>;
  fetchUpdates: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<TCycleUpdates[]>;
  addUpdate: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    payload: Partial<TCycleUpdates>
  ) => Promise<TCycleUpdates>;
  editUpdate: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    cycleUpdateId: string,
    payload: Partial<TCycleUpdates>
  ) => Promise<TCycleUpdates>;
  deleteUpdate: (workspaceSlug: string, projectId: string, cycleId: string, cycleUpdateId: string) => Promise<void>;
  addReaction: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    cycleUpdateId: string,
    reactionData: TCycleUpdateReaction
  ) => Promise<void>;
  deleteReaction: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    cycleUpdateId: string,
    reaction: string
  ) => Promise<void>;
}

export class CycleStore extends CeCycleStore implements ICycleStore {
  cycleUpdateIds: string[] = [];
  cycleUpdateMap: {
    [cycleUpdateId: string]: TCycleUpdates;
  } = {};
  //services
  cycleUpdateService;

  constructor(public store: RootStore) {
    super(store);
    makeObservable(this, {
      //observables
      cycleUpdateIds: observable,
      cycleUpdateMap: observable,
      // actions
      fetchUpdates: action,
      addUpdate: action,
      editUpdate: action,
      deleteUpdate: action,
      addReaction: action,
      deleteReaction: action,
    });

    //services
    this.cycleUpdateService = new CycleUpdateService();
  }

  fetchUpdates = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    const updates = await this.cycleUpdateService.getCycleUpdates(workspaceSlug, projectId, cycleId);
    runInAction(() => {
      updates.forEach((update: TCycleUpdates) => {
        set(this.cycleUpdateMap, [update.update_id], update);
        this.cycleUpdateIds.push(update.update_id);
      });
    });
    return updates;
  };

  addUpdate = async (workspaceSlug: string, projectId: string, cycleId: string, data: Partial<TCycleUpdates>) => {
    const update = await this.cycleUpdateService.createCycleUpdate(workspaceSlug, projectId, cycleId, data);
    runInAction(() => {
      set(this.cycleUpdateMap, [update.update_id], update);
      this.cycleUpdateIds.push(update.update_id);
    });
    return update;
  };

  editUpdate = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    cycleUpdateId: string,
    data: Partial<TCycleUpdates>
  ) => {
    const update = await this.cycleUpdateService.updateCycleUpdate(
      workspaceSlug,
      projectId,
      cycleId,
      cycleUpdateId,
      data
    );
    runInAction(() => {
      set(this.cycleUpdateMap, [update.id], update);
    });
    return update;
  };

  deleteUpdate = async (workspaceSlug: string, projectId: string, cycleId: string, cycleUpdateId: string) => {
    await this.cycleUpdateService.deleteCycleUpdate(workspaceSlug, projectId, cycleId, cycleUpdateId);
    runInAction(() => {
      this.cycleUpdateIds = this.cycleUpdateIds.filter((id) => id !== cycleUpdateId);
      delete this.cycleUpdateMap[cycleUpdateId];
    });
  };

  addReaction = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    cycleUpdateId: string,
    reactionData: TCycleUpdateReaction
  ) => {
    const reaction = await this.cycleUpdateService.createCycleUpdateReaction(
      workspaceSlug,
      projectId,
      cycleId,
      cycleUpdateId,
      reactionData
    );
    runInAction(() => {
      set(
        this.cycleUpdateMap[cycleUpdateId],
        ["reactions"],
        [...this.cycleUpdateMap[cycleUpdateId].reactions, reaction]
      );
    });
  };

  deleteReaction = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    cycleUpdateId: string,
    reactionId: string
  ) => {
    await this.cycleUpdateService.deleteCycleUpdateReaction(
      workspaceSlug,
      projectId,
      cycleId,
      cycleUpdateId,
      reactionId
    );
    runInAction(() => {
      set(
        this.cycleUpdateMap[cycleUpdateId],
        ["reactions"],
        this.cycleUpdateMap[cycleUpdateId].reactions.filter((reaction) => reaction.reactionId !== reactionId)
      );
    });
  };

  /**
   * @description fetches active cycle progress for pro users
   * @param workspaceSlug
   * @param projectId
   * @param cycleId
   *  @returns
   */
  fetchActiveCycleProgressPro = action(async (workspaceSlug: string, projectId: string, cycleId: string) => {
    this.progressLoader = true;
    await this.cycleService.workspaceActiveCyclesProgressPro(workspaceSlug, projectId, cycleId).then((progress) => {
      runInAction(() => {
        set(this.cycleMap, [cycleId], { ...this.cycleMap[cycleId], progress });
        this.progressLoader = false;
      });
      return progress;
    });
  });

  /**
   * @description creates a new cycle
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns
   */
  createCycle = action(async (workspaceSlug: string, projectId: string, data: Partial<ICycle>) => {
    const version =
      (this.rootStore as RootStore)["workspaceSubscription"]?.currentWorkspaceSubscribedPlanDetail?.product === "PRO"
        ? 2
        : 1;
    return await this.cycleService.createCycle(workspaceSlug, projectId, { ...data, version }).then((response) => {
      runInAction(() => {
        set(this.cycleMap, [response.id], response);
      });
      return response;
    });
  });
}
