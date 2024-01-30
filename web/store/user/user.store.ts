import { IUser } from "@plane/types";
import { makeObservable, observable } from "mobx";

export interface IUserStore {
  avatar: string | undefined;
  cover_image: string | undefined;
  date_joined: string | undefined;
  display_name: string | undefined;
  email: string | undefined;
  first_name: string | undefined;
  id: string | undefined;
  is_active: boolean | undefined;
  is_bot: boolean | undefined;
  is_email_verified: boolean | undefined;
  is_managed: boolean | undefined;
  last_name: string | undefined;
}

export class UserStore implements IUserStore {
  avatar: string | undefined;
  cover_image: string | undefined;
  date_joined: string | undefined;
  display_name: string | undefined;
  email: string | undefined;
  first_name: string | undefined;
  id: string | undefined;
  is_active: boolean | undefined;
  is_bot: boolean | undefined;
  is_email_verified: boolean | undefined;
  is_managed: boolean | undefined;
  last_name: string | undefined;

  constructor(user: IUser) {
    makeObservable(this);
    this.avatar = user?.avatar;
    this.cover_image = user?.cover_image || undefined;
    this.date_joined = user?.date_joined;
    this.display_name = user?.display_name;
    this.email = user?.email;
    this.first_name = user?.first_name;
    this.id = user?.id;
    this.is_active = user?.is_active;
    this.is_bot = user?.is_bot;
    this.is_email_verified = user?.is_email_verified;
    this.is_managed = user?.is_managed;
    this.last_name = user?.last_name;
  }
}
