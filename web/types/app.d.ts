export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export interface IAppConfig {
  email_password_login: boolean;
  google_client_id: string | null;
  github_app_name: string | null;
  github_client_id: string | null;
  magic_login: boolean;
  slack_client_id: string | null;
}
