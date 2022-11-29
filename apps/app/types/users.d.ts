export interface IUser {
  id: readonly string;
  last_login: readonly Date;
  avatar: string;
  username: string;
  mobile_number: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: readonly Date;
  created_at: readonly Date;
  updated_at: readonly Date;
  last_location: readonly string;
  created_location: readonly string;
  is_email_verified: boolean;
  token: string;
  [...rest: string]: any;
}
