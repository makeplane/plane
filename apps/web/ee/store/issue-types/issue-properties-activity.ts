import { set } from "lodash-es";
import { action, computed, makeObservable, observable } from "mobx";
// plane imports
import { IIssuePropertiesActivity, IUserLite, TIssuePropertiesActivity, TIssuePropertyAction } from "@plane/types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

export class IssuePropertiesActivity implements IIssuePropertiesActivity {
  // properties
  id: string | undefined = undefined;
  old_value: string | undefined = undefined;
  new_value: string | undefined = undefined;
  old_identifier: string | undefined = undefined;
  new_identifier: string | undefined = undefined;
  action: TIssuePropertyAction | undefined = undefined;
  actor_detail: IUserLite | undefined = undefined;
  epoch: number | undefined = undefined;
  comment: string | undefined = undefined;
  issue: string | undefined = undefined;
  property: string | undefined = undefined;
  actor: string | undefined = undefined;
  project: string | undefined = undefined;
  workspace: string | undefined = undefined;
  created_at: string | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_at: string | undefined = undefined;
  updated_by: string | undefined = undefined;

  constructor(
    private store: RootStore,
    protected issueActivityData: TIssuePropertiesActivity
  ) {
    makeObservable(this, {
      id: observable.ref,
      old_value: observable.ref,
      new_value: observable.ref,
      old_identifier: observable.ref,
      new_identifier: observable.ref,
      action: observable.ref,
      actor_detail: observable.ref,
      epoch: observable.ref,
      comment: observable.ref,
      issue: observable.ref,
      property: observable.ref,
      actor: observable.ref,
      project: observable.ref,
      workspace: observable.ref,
      created_at: observable.ref,
      created_by: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      // computed
      asJSON: computed,
      // helper action
      updateActivityData: action,
    });

    this.id = issueActivityData.id;
    this.old_value = issueActivityData.old_value;
    this.new_value = issueActivityData.new_value;
    this.old_identifier = issueActivityData.old_identifier;
    this.new_identifier = issueActivityData.new_identifier;
    this.action = issueActivityData.action;
    this.epoch = issueActivityData.epoch;
    this.comment = issueActivityData.comment;
    this.issue = issueActivityData.issue;
    this.property = issueActivityData.property;
    this.actor = issueActivityData.actor;
    this.actor_detail = issueActivityData.actor_detail;
    this.project = issueActivityData.project;
    this.workspace = issueActivityData.workspace;
    this.created_at = issueActivityData.created_at;
    this.created_by = issueActivityData.created_by;
    this.updated_at = issueActivityData.updated_at;
    this.updated_by = issueActivityData.updated_by;
  }

  // computed
  /**
   * @description get issue properties activity as JSON
   * @returns {TIssuePropertiesActivity}
   */
  get asJSON(): TIssuePropertiesActivity {
    return {
      id: this.id,
      old_value: this.old_value,
      new_value: this.new_value,
      old_identifier: this.old_identifier,
      new_identifier: this.new_identifier,
      action: this.action,
      epoch: this.epoch,
      comment: this.comment,
      issue: this.issue,
      property: this.property,
      actor: this.actor,
      actor_detail: this.actor_detail,
      project: this.project,
      workspace: this.workspace,
      created_at: this.created_at,
      created_by: this.created_by,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
    };
  }

  // actions
  /**
   * @description Update issue properties activity data
   * @param {Partial<TIssuePropertiesActivity>} issueActivityData
   */
  updateActivityData = (issueActivityData: Partial<TIssuePropertiesActivity>) => {
    for (const key in issueActivityData) {
      if (issueActivityData.hasOwnProperty(key)) {
        const propertyKey = key as keyof TIssuePropertiesActivity;
        set(this, propertyKey, issueActivityData[propertyKey] ?? undefined);
      }
    }
  };
}
