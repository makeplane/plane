import { makeObservable, runInAction, observable } from "mobx";
import set from "lodash/set";
// types
import { IUser } from "@plane/types";
// store
import { UserStore, IUserStore } from "./user.store";
// services
import { UserService } from "services/user.service";

interface ICurrentUserStore extends IUserStore {
  // fetch actions
  fetchCurrentUser: () => Promise<IUser>;
  fetchUserInstanceAdminStatus: () => Promise<boolean>;
  updateCurrentUser: (data: Partial<IUser>) => Promise<IUser>;
}

export class CurrentUserStore extends UserStore implements ICurrentUserStore {
  is_instance_admin: boolean = false;

  userService;

  constructor(user: IUser) {
    super(user);
    makeObservable(this, {
      is_instance_admin: observable.ref,
    });
    this.userService = new UserService();
  }

  /**
   * Fetches the current user
   * @returns Promise<IUser>
   */
  fetchCurrentUser = async () => {
    const response = await this.userService.currentUser();
    this.updateUserInfo(response);
    return response;
  };

  updateUserInfo = async (data: Partial<IUser>) => {
    runInAction(() => {
      Object.keys(data).forEach((key) => {
        set(this, key, data[key as keyof IUser]);
      });
    });
  };

  /**
   * Fetches the current user instance admin status
   * @returns Promise<boolean>
   */
  fetchUserInstanceAdminStatus = async () =>
    await this.userService.currentUserInstanceAdminStatus().then((response) => {
      runInAction(() => {
        this.is_instance_admin = response.is_instance_admin;
      });
      return response.is_instance_admin;
    });

  /**
   * Updates the current user
   * @param data
   * @returns Promise<IUser>
   */
  updateCurrentUser = async (data: Partial<IUser>) => {
    try {
      runInAction(() => {
        this.updateUserInfo(data);
      });
      const response = await this.userService.updateUser(data);
      runInAction(() => {
        this.updateUserInfo(response);
      });
      return response;
    } catch (error) {
      this.fetchCurrentUser();
      throw error;
    }
  };
}
