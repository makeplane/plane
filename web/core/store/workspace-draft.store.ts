import { ViewFlags, TLoader, IssuePaginationOptions, TIssuesResponse, TIssue, TBulkOperationsPayload } from "@plane/types";
import { BaseIssuesStore, IBaseIssuesStore } from "./issue/helpers/base-issues.store";
import { makeObservable, runInAction } from "mobx";
import { IIssueRootStore } from "./issue/root.store";
import { IDraftIssuesFilter } from "./issue/draft";
import { WorkspaceDraftService } from "@/services/workspace-draft.service";

export interface IWorkspaceDraftIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  createWorkspaceDraft(workspaceSlug: string, data: Partial<TIssue>, shouldUpdateList: boolean): Promise<TIssue>;
  getWorkspaceDrafts(workspaceSlug: string, loadType: TLoader) : Promise<TIssuesResponse>;
  getWorkspaceDraftById: (workspaceSlug: string, issueId: string, loadType?: TLoader) => Promise<TIssue>;
  deleteWorkspaceDraft: (workspaceSlug: string, issueId: string) => Promise<void>;
}


export class WorkspaceDraftIssues extends BaseIssuesStore implements IWorkspaceDraftIssues {
  viewFlags = {
      enableQuickAdd: false,
      enableIssueCreation: true,
      enableInlineEditing: true,
  };
  // filter store
  issueFilterStore: IDraftIssuesFilter; // TODO:: VERIFY IF THIS IS CORRECT OR NOT
  workspaceDraftService: WorkspaceDraftService;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IDraftIssuesFilter) {
    super(_rootStore, issueFilterStore);    // issueFilterStore is required for the super constructor
    makeObservable(this, {
    });
    // filter store
    this.issueFilterStore = issueFilterStore;
    this.workspaceDraftService = new WorkspaceDraftService();
  }

  /** Parent class had this as abstract method
   * Fetches the project details
   * @param workspaceSlug
   * @param projectId
   */
  fetchParentStats = async (workspaceSlug: string, projectId?: string) => {
    projectId && this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);
  };

  /** Parent class had this as abstract method*/
  updateParentStats = () => {};

  createWorkspaceDraft = async (
    workspaceSlug: string,
    data: Partial<TIssue>,
    shouldUpdateList = true,
  ) => {
    //perform an API call
    const response = await this.workspaceDraftService.createDraftIssue(workspaceSlug,data);

    // add Issue to Store
    this.addIssue(response, shouldUpdateList);

    return response; 
  }

  getWorkspaceDrafts = async (
    workspaceSlug: string, 
    loadType: TLoader = "init-loader",
  ) => {
    try{
      // set loader and clear store
      runInAction(() => {
        this.setLoader(loadType);
      });

      // call the fetch issues API with the params
      const response = await this.workspaceDraftService.getDraftIssues(workspaceSlug,{
        signal: this.controller.signal,
      });

      // after fetching issues, call the base method to process the response further
      return response;
    } catch (error){
      this.setLoader(undefined);
      throw error;
    }
  }

  getWorkspaceDraftById = async (
    workspaceSlug: string,
    issueId: string,
    loadType: TLoader = "init-loader",
  ) => {
    try{
      // set loader and clear store
      runInAction(() => {
        this.setLoader(loadType);
      });

      // call the fetch issues API with the params
      const response = await this.workspaceDraftService.getDraftIssueById(workspaceSlug, issueId,{
        signal: this.controller.signal,
      });

      return response;
    } catch (error){
      this.setLoader(undefined);
      throw error;
    }
  }

  deleteWorkspaceDraft = async (workspaceSlug: string, issueId: string) => {
    //Make API call
    await this.workspaceDraftService.deleteDraftIssue(workspaceSlug,issueId);

    // Remove from Respective issue Id list
    runInAction(() => {
      this.removeIssueFromList(issueId);
    });

    this.rootIssueStore.issues.removeIssue(issueId);

  }

  // TODO IMPLEMENT UPDATE
  // async updateWorkspaceDraft(){
  // }

}