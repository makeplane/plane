import { action, makeObservable, observable } from "mobx";
import { ViewFlags, TLoader, TIssue } from "@plane/types";
import { WorkspaceDraftService } from "@/services/workspace-draft.service";

export interface IWorkspaceDraftStore {
  viewFlags: ViewFlags;
  drafts: TIssue[]
  createWorkspaceDraft(workspaceSlug: string, data: Partial<TIssue>): Promise<TIssue>;
  getWorkspaceDrafts(workspaceSlug: string) : Promise<TIssue[]>;
  getWorkspaceDraftById: (workspaceSlug: string, draftId: string, loadType?: TLoader) => Promise<TIssue>;
  deleteWorkspaceDraft: (workspaceSlug: string, draftId: string) => Promise<void>;
}

export class WorkspaceDraftStore implements IWorkspaceDraftStore {
  drafts: TIssue[] = [];
  viewFlags = {
      enableQuickAdd: false,
      enableIssueCreation: true,
      enableInlineEditing: true,
  };
  workspaceDraftService: WorkspaceDraftService;

  constructor() {
    makeObservable(this, {
      drafts: observable,
      createWorkspaceDraft: action,
      getWorkspaceDrafts: action,
      getWorkspaceDraftById: action,
      deleteWorkspaceDraft: action,
    });
    this.workspaceDraftService = new WorkspaceDraftService();
  }


  addDraft = (draft: TIssue) => {
    if(draft && !this.drafts.some(existingDraft => existingDraft.id === draft.id))
      this.drafts.push(draft);
  }

  removeDraft = (draftId: string) => {
    if (draftId) {
      const index = this.drafts.findIndex(existingDraft => existingDraft.id === draftId);
      if (index !== -1) {
        this.drafts.splice(index, 1);
      }
    }
  };

  createWorkspaceDraft = async (
    workspaceSlug: string,
    data: Partial<TIssue>,
  ) => {
   try{
     //perform an API call
     const response = await this.workspaceDraftService.createDraftIssue(workspaceSlug,data);

     // add Issue to Store
     this.addDraft(response);

     return response;

   } catch(error){
    console.error(error)
    throw error;
   }
  }

  getWorkspaceDrafts = async (
    workspaceSlug: string,
  ) => {
    try{
      // call the fetch issues API with the params
      const response = await this.workspaceDraftService.getDraftIssues(workspaceSlug);
      if(Array.isArray(response))
        response.forEach((draft)=>{
          this.addDraft(draft);
        })
      // after fetching issues, call the base method to process the response further
      return response;
    } catch (error){
      console.error(error)
      throw error;
    }
  }

  getWorkspaceDraftById = async (
    workspaceSlug: string,
    draftId: string,
  ) => {
    try{
      // call the fetch issues API with the params
      const response = await this.workspaceDraftService.getDraftIssueById(workspaceSlug, draftId);
      this.addDraft(response);
      return response;
    } catch (error){
      console.error(error)
      throw error;
    }
  }

  deleteWorkspaceDraft = async (workspaceSlug: string, draftId: string) => {
    //Make API call
    try{
      await this.workspaceDraftService.deleteDraftIssue(workspaceSlug,draftId);
      this.removeDraft(draftId);
    } catch (error){
      console.error(error)
      throw error;
    }
  }

  // TODO IMPLEMENT UPDATE
  // async updateWorkspaceDraft(){
  // }

}