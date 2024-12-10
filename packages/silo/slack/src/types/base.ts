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
  | TViewClosedPayload
  | TMessageActionPayload
  | SlackEventPayload;

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
  channel: ISlackChannel;
  trigger_id: string;
  message: {
    thread_ts: string;
  };
  actions: ISlackAction[];
};

export type TMessageActionPayload = {
  type: "message_action";
  token: string;
  action_ts: string;
  team: ISlackTeam;
  user: ISlackUser & {
    name: string; // Additional field specific to message_action
  };
  channel: ISlackChannel;
  is_enterprise_install: boolean;
  enterprise: any;
  callback_id: string;
  trigger_id: string;
  response_url: string;
  message_ts: string;
  message: ISlackMessageAction;
};

export interface ISlackMessageAction {
  user: string;
  type: string;
  ts: string;
  client_msg_id?: string;
  text: string;
  team: string;
  blocks: ISlackBlock[];
}

// Add Block interface
export interface ISlackBlock {
  type: string;
  block_id: string;
  elements: ISlackBlockElement[];
}

// Add Block Element interface
export interface ISlackBlockElement {
  type: string;
  elements: {
    type: string;
    text: string;
  }[];
}

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
  trigger_id: string;
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

export interface ISlackButtonAction extends ISlackActionBase {
  text: ISlackText;
  value: string;
  type: "button"; // Specific type for button actions
}

export interface ISlackSelectAction extends ISlackActionBase {
  selected_option: {
    text: ISlackText;
    value: string;
  };
  type: "static_select";
}

export interface ISlackActionBase {
  action_id: string;
  block_id: string;
  action_ts: string;
  type: string;
}

// Union type to represent different action types
export type ISlackAction = ISlackButtonAction | ISlackSelectAction;

export interface ISlackText {
  type: string;
  text: string;
  emoji: boolean;
}

interface Icons {
  // Since icons is shown as [Object], we'll create a generic structure
  [key: string]: string;
}

interface BotProfile {
  id: string;
  app_id: string;
  name: string;
  icons: Icons;
  deleted: boolean;
  updated: number;
  team_id: string;
}

interface MetadataEventPayload {
  // Since event_payload is shown as [Object], we'll create a generic structure
  [key: string]: any;
}

interface Block {
  // Since blocks contains [Object], we'll create a generic structure
  [key: string]: any;
}

interface Message {
  user: string;
  type: string;
  ts: string;
  bot_id: string;
  app_id: string;
  text: string;
  team: string;
  bot_profile: BotProfile;
  thread_ts: string;
  parent_user_id: string;
  metadata: Metadata;
  blocks: Block[];
}

interface ResponseMetadata {
  warnings: string[];
}

export interface SlackMessageResponse {
  ok: boolean;
  channel: string;
  ts: string;
  message: Message;
  warning: string;
  response_metadata: ResponseMetadata;
}

export interface SlackEvent {
  user: string;
  type: string;
  ts: string;
  text: string;
  team: string;
  thread_ts?: string;
  parent_user_id: string;
  blocks: object[];
  channel: string;
  event_ts: string;
  channel_type: string;
  bot_id?: string;
  app_id?: string;
  bot_profile?: BotProfile;
  metadata?: Metadata;
}

export interface Metadata {
  event_type: string;
  event_payload: object;
}

export interface SlackEventPayload {
  type: "message";
  token: string;
  team_id: string;
  context_team_id: string;
  context_enterprise_id: string | null;
  api_app_id: string;
  event: SlackEvent;
  event_id: string;
  event_time: number;
  authorizations: Authorization[];
  is_ext_shared_channel: boolean;
  event_context: string;
}

export interface Authorization {
  enterprise_id: string | null;
  team_id: string;
  user_id: string;
  is_bot: boolean;
  is_enterprise_install: boolean;
}

// Type guard for BotMessage
export function isBotMessage(
  payload: SlackEventPayload,
): payload is SlackEventPayload & { event: { bot_id: string } } {
  return !!payload.event.bot_id;
}

// Type guard for UserMessage
export function isUserMessage(
  payload: SlackEventPayload,
): payload is SlackEventPayload & { event: { bot_id?: undefined } } {
  return !payload.event.bot_id;
}
