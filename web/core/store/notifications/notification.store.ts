/* eslint-disable no-useless-catch */
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { IUserLite, TNotification, TNotificationData } from "@plane/types";
// services
import workspaceNotificationService from "@/services/workspace-notification.service";
// store
import { CoreRootStore } from "../root.store";

export interface INotification extends TNotification {
  // observables
  // computed
  asJson: TNotification;
  // computed functions
  // helper functions
  mutateNotification: (notification: Partial<TNotification>) => void;
  // actions
  updateNotification: (payload: Partial<TNotification>) => Promise<TNotification | undefined>;
  markNotificationAsRead: () => Promise<TNotification | undefined>;
  markNotificationAsUnRead: () => Promise<TNotification | undefined>;
  archiveNotification: () => Promise<TNotification | undefined>;
  unArchiveNotification: () => Promise<TNotification | undefined>;
  snoozeNotification: (snoozeTill: Date) => Promise<TNotification | undefined>;
  unSnoozeNotification: () => Promise<TNotification | undefined>;
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
  read_at: string | undefined = undefined;
  archived_at: string | undefined = undefined;
  snoozed_till: string | undefined = undefined;
  workspace: string | undefined = undefined;
  project: string | undefined = undefined;
  created_at: string | undefined = undefined;
  updated_at: string | undefined = undefined;
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
      updateNotification: action,
      markNotificationAsRead: action,
      markNotificationAsUnRead: action,
      archiveNotification: action,
      unArchiveNotification: action,
      snoozeNotification: action,
      unSnoozeNotification: action,
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

  // helper functions
  mutateNotification = (notification: Partial<TNotification>) => {
    Object.entries(notification).forEach(([key, value]) => {
      if (key in this) {
        set(this, key, value);
      }
    });
  };

  // actions
  /**
   * @description update notification
   * @param { Partial<TNotification> } payload
   * @returns { TNotification | undefined }
   */
  updateNotification = async (payload: Partial<TNotification>): Promise<TNotification | undefined> => {
    if (!this.workspace || !this.id) return undefined;

    try {
      const notification = await workspaceNotificationService.updateNotificationById(this.workspace, this.id, payload);
      if (notification) {
        runInAction(() => this.mutateNotification(notification));
      }
      return notification;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description mark notification as read
   * @returns { TNotification | undefined }
   */
  markNotificationAsRead = async (): Promise<TNotification | undefined> => {
    if (!this.workspace || !this.id) return undefined;

    const currentNotificationReadAt = this.read_at;
    try {
      const payload: Partial<TNotification> = {
        read_at: new Date().toUTCString(),
      };
      runInAction(() => this.updateNotification(payload));
      const notification = await workspaceNotificationService.markNotificationAsRead(this.workspace, this.id);
      if (notification) {
        runInAction(() => this.updateNotification(notification));
      }
      return notification;
    } catch (error) {
      runInAction(() => this.mutateNotification({ read_at: currentNotificationReadAt }));
      throw error;
    }
  };

  /**
   * @description mark notification as unread
   * @returns { TNotification | undefined }
   */
  markNotificationAsUnRead = async (): Promise<TNotification | undefined> => {
    if (!this.workspace || !this.id) return undefined;

    const currentNotificationReadAt = this.read_at;
    try {
      const payload: Partial<TNotification> = {
        read_at: undefined,
      };
      runInAction(() => this.updateNotification(payload));
      const notification = await workspaceNotificationService.markNotificationAsArchived(this.workspace, this.id);
      if (notification) {
        runInAction(() => this.updateNotification(notification));
      }
      return notification;
    } catch (error) {
      runInAction(() => this.mutateNotification({ read_at: currentNotificationReadAt }));
      throw error;
    }
  };

  /**
   * @description archive notification
   * @returns { TNotification | undefined }
   */
  archiveNotification = async (): Promise<TNotification | undefined> => {
    if (!this.workspace || !this.id) return undefined;

    const currentNotificationArchivedAt = this.archived_at;
    try {
      const payload: Partial<TNotification> = {
        archived_at: new Date().toUTCString(),
      };
      runInAction(() => this.updateNotification(payload));
      const notification = await workspaceNotificationService.markNotificationAsArchived(this.workspace, this.id);
      if (notification) {
        runInAction(() => this.updateNotification(notification));
      }
      return notification;
    } catch (error) {
      runInAction(() => this.mutateNotification({ archived_at: currentNotificationArchivedAt }));
      throw error;
    }
  };

  /**
   * @description unarchive notification
   * @returns { TNotification | undefined }
   */
  unArchiveNotification = async (): Promise<TNotification | undefined> => {
    if (!this.workspace || !this.id) return undefined;

    const currentNotificationArchivedAt = this.archived_at;
    try {
      const payload: Partial<TNotification> = {
        archived_at: undefined,
      };
      runInAction(() => this.updateNotification(payload));
      const notification = await workspaceNotificationService.markNotificationAsUnArchived(this.workspace, this.id);
      if (notification) {
        runInAction(() => this.updateNotification(notification));
      }
      return notification;
    } catch (error) {
      runInAction(() => this.mutateNotification({ archived_at: currentNotificationArchivedAt }));
      throw error;
    }
  };

  /**
   * @description snooze notification
   * @param { Date } snoozeTill
   * @returns { TNotification | undefined }
   */
  snoozeNotification = async (snoozeTill: Date): Promise<TNotification | undefined> => {
    if (!this.workspace || !this.id) return undefined;

    const currentNotificationSnoozeTill = this.snoozed_till;
    try {
      const payload: Partial<TNotification> = {
        snoozed_till: snoozeTill.toUTCString(),
      };
      runInAction(() => this.mutateNotification(payload));
      const notification = await workspaceNotificationService.updateNotificationById(this.workspace, this.id, payload);
      return notification;
    } catch (error) {
      runInAction(() => this.mutateNotification({ snoozed_till: currentNotificationSnoozeTill }));
      throw error;
    }
  };

  /**
   * @description un snooze notification
   * @returns { TNotification | undefined }
   */
  unSnoozeNotification = async (): Promise<TNotification | undefined> => {
    if (!this.workspace || !this.id) return undefined;

    const currentNotificationSnoozeTill = this.snoozed_till;
    try {
      const payload: Partial<TNotification> = {
        snoozed_till: undefined,
      };
      runInAction(() => this.mutateNotification(payload));
      const notification = await workspaceNotificationService.updateNotificationById(this.workspace, this.id, payload);
      return notification;
    } catch (error) {
      runInAction(() => this.mutateNotification({ snoozed_till: currentNotificationSnoozeTill }));
      throw error;
    }
  };
}
