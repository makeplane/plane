import { type } from "os";

export type TSlackConfig = {
  team_id: string;
  access_token: string;
};

export type TSlackMetadata = {
  ok: boolean;
  team: {
    id: string;
    name: string;
  };
  scope: string;
  app_id: string;
  enterprise?: any;
  token_type: string;
  authed_user: {
    id: string;
  };
  bot_user_id: string;
  access_token: string;
  incoming_webhook: Incomingwebhook;
  is_enterprise_install: boolean;
};
export type Incomingwebhook = {
  url: string;
  channel: string;
  channel_id: string;
  configuration_url: string;
};

export type TSlackPayload =
  | TBlockActionPayload
  | TViewSubmissionPayload
  | TViewClosedPayload;

export type TBlockActionPayload = {
  type: "block_actions";
  team: ISlackTeam;
  user: ISlackUser;
  api_app_id: string;
  token: string;
  hash: string;
  interactivity: any;
  bot_access_token: string;
  container: ISlackContainer;
  trigger_id: string;
  actions: ISlackAction[];
};

export type TViewSubmissionPayload = {
  type: "view_submission";
  team: ISlackTeam;
  user: ISlackUser;
  api_app_id: string;
  token: string;
  trigger_id: string;
  view: ISlackView;
};

export type TViewClosedPayload = {
  type: "view_closed";
};

export type TBlockActionMessagePayload = TBlockActionPayload & {
  message: ISlackMessage;
  channel_id: string;
};

export type TBlockActionModalPayload = TBlockActionPayload & {
  view: ISlackView;
};

export interface ISlackView {
  id: string;
  team_id: string;
  type: string;
  blocks: any[];
  private_metadata: string;
  callback_id: string;
  state: {
    values: Record<string, any>;
  };
  hash: string;
  title: ISlackText;
  clear_on_close: boolean;
  notify_on_close: boolean;
  close: ISlackText;
  submit: ISlackText;
  previous_view_id?: any;
  root_view_id: string;
  app_id: string;
  external_id: string;
  app_installed_team_id: string;
  bot_id: string;
}

export interface ISlackTeam {
  id: string;
  domain: string;
}

export interface ISlackUser {
  id: string;
  username: string;
  team_id: string;
}

export interface ISlackContainer {
  type: string;
  message_ts: string;
  attachment_id: number;
  channel_id: string;
  is_ephemeral: boolean;
  is_app_unfurl: boolean;
}

export interface ISlackChannel {
  id: string;
  name: string;
}

export interface ISlackMessage {
  bot_id: string;
  type: string;
  text: string;
  user: string;
  ts: string;
}

export interface ISlackAction {
  action_id: string;
  block_id: string;
  selected_option?: {
    text: ISlackText;
    value: string;
  };
  type: string;
  action_ts: string;
}

export interface ISlackText {
  type: string;
  text: string;
  emoji: boolean;
}
