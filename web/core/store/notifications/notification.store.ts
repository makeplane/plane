/* eslint-disable no-useless-catch */
import set from "lodash/set";
import { action, computed, makeObservable, observable } from "mobx";
import { IUserLite, TNotification, TNotificationData } from "@plane/types";
// store
import { CoreRootStore } from "../root.store";

export interface INotification extends TNotification {
  // observables
  // computed
  asJson: TNotification;
  // computed functions
  // actions
  updateNotification: (notification: Partial<TNotification>) => void;
  markNotificationAsRead: () => Promise<void>;
  markNotificationAsUnRead: () => Promise<void>;
  archiveNotification: () => Promise<void>;
  unArchiveNotification: () => Promise<void>;
  snoozeNotification: (snoozeTill: Date) => Promise<void>;
}

export class Notification implements INotification {
  // observables
  id: string | undefined = undefined;
  title: string | undefined = undefined;
  data: TNotificationData | undefined = undefined;
  entity_identifier: string | undefined = undefined;
  entity_name: string | undefined = undefined;
  message_html: string | undefined = undefined;
  message: undefined = undefined;
  message_stripped: undefined = undefined;
  sender: string | undefined = undefined;
  receiver: string | undefined = undefined;
  triggered_by: string | undefined = undefined;
  triggered_by_details: IUserLite | undefined = undefined;
  read_at: Date | undefined = undefined;
  archived_at: string | undefined = undefined;
  snoozed_till: Date | undefined = undefined;
  workspace: string | undefined = undefined;
  project: string | undefined = undefined;
  created_at: Date | undefined = undefined;
  updated_at: Date | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_by: string | undefined = undefined;

  constructor(
    private store: CoreRootStore,
    private notification: TNotification
  ) {
    makeObservable(this, {
      // observables
      id: observable.ref,
      title: observable.ref,
      data: observable,
      entity_identifier: observable.ref,
      entity_name: observable.ref,
      message_html: observable.ref,
      message: observable.ref,
      message_stripped: observable.ref,
      sender: observable.ref,
      receiver: observable.ref,
      triggered_by: observable.ref,
      triggered_by_details: observable,
      read_at: observable.ref,
      archived_at: observable.ref,
      snoozed_till: observable.ref,
      workspace: observable.ref,
      project: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      created_by: observable.ref,
      updated_by: observable.ref,
      // computed
      asJson: computed,
      // actions
      markNotificationAsRead: action,
      markNotificationAsUnRead: action,
      archiveNotification: action,
      unArchiveNotification: action,
      snoozeNotification: action,
    });
    this.id = this.notification.id;
    this.title = this.notification.title;
    this.data = this.notification.data;
    this.entity_identifier = this.notification.entity_identifier;
    this.entity_name = this.notification.entity_name;
    this.message_html = this.notification.message_html;
    this.message = this.notification.message;
    this.message_stripped = this.notification.message_stripped;
    this.sender = this.notification.sender;
    this.receiver = this.notification.receiver;
    this.triggered_by = this.notification.triggered_by;
    this.triggered_by_details = this.notification.triggered_by_details;
    this.read_at = this.notification.read_at;
    this.archived_at = this.notification.archived_at;
    this.snoozed_till = this.notification.snoozed_till;
    this.workspace = this.notification.workspace;
    this.project = this.notification.project;
    this.created_at = this.notification.created_at;
    this.updated_at = this.notification.updated_at;
    this.created_by = this.notification.created_by;
    this.updated_by = this.notification.updated_by;
  }

  // helper functions
  updateNotification = (notification: Partial<TNotification>) => {
    Object.entries(notification).forEach(([key, value]) => {
      if (key in this) {
        set(this, key, value);
      }
    });
  };

  // computed
  /**
   * @description get notification as json
   */
  get asJson() {
    return {
      id: this.id,
      title: this.title,
      data: this.data,
      entity_identifier: this.entity_identifier,
      entity_name: this.entity_name,
      message_html: this.message_html,
      message: this.message,
      message_stripped: this.message_stripped,
      sender: this.sender,
      receiver: this.receiver,
      triggered_by: this.triggered_by,
      triggered_by_details: this.triggered_by_details,
      read_at: this.read_at,
      archived_at: this.archived_at,
      snoozed_till: this.snoozed_till,
      workspace: this.workspace,
      project: this.project,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by,
    };
  }

  // computed functions

  // actions
  /**
   * @description mark notification as read
   * @returns { void }
   */
  markNotificationAsRead = async () => {
    try {
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description mark notification as unread
   * @returns { void }
   */
  markNotificationAsUnRead = async () => {
    try {
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description archive notification
   * @returns { void }
   */
  archiveNotification = async () => {
    try {
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description unarchive notification
   * @returns { void }
   */
  unArchiveNotification = async () => {
    try {
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description snooze notification
   * @param { Date } snoozeTill
   * @returns { void }
   */
  snoozeNotification = async (snoozeTill: Date) => {
    try {
      console.log("snoozeTill", snoozeTill);
    } catch (error) {
      throw error;
    }
  };
}
