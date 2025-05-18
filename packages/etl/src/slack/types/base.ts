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

export type TSlackIssueEntityData = {
  channel: string;
  message: {
    ts: string;
    team: string;
  };
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
  | TBlockSuggestionPayload
  | TSlackCommandPayload
  | TShortcutPayload
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
  message?: {
    thread_ts: string;
    text?: string;
  };
  response_url?: string;
  actions: ISlackAction[];
};

export type TSlackCommandPayload = {
  type: "command";
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  api_app_id: string;
  is_enterprise_install: string;
  response_url: string;
  trigger_id: string;
};

export type TShortcutPayload = {
  type: "shortcut";
  token: string;
  action_ts: string;
  team: ISlackTeam;
  user: ISlackUser;
  is_enterprise_install: boolean;
  callback_id: string;
  trigger_id: string;
};

export type TBlockSuggestionPayload = {
  type: "block_suggestion";
  user: ISlackUser;
  team: ISlackTeam;
  container: {
    type: "view";
    view_id: string;
  };
  api_app_id: string;
  token: string;
  action_id: string;
  block_id: string;
  value: string;
  enterprise: null | {
    id: string;
    name: string;
  };
  is_enterprise_install: boolean;
  view: ISlackView;
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
  callback_id: string;
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

export interface ISlackView<TBlocks extends Array<any> = any[]> {
  id: string;
  team_id: string;
  type: string;
  blocks: TBlocks;
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
  thread_ts?: string;
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

export interface ISlackDatepickerAction extends ISlackActionBase {
  type: "datepicker";
  selected_date: string;
  initial_date: string;
}

export interface ISlackOverflowAction extends ISlackActionBase {
  type: "overflow";
  selected_option: {
    text: ISlackText;
    value: string;
  };
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
export type ISlackAction = ISlackButtonAction | ISlackSelectAction | ISlackDatepickerAction | ISlackOverflowAction;

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

export interface Message {
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
  files?: MessageFile[];
}

export interface MessageFile {
  // Define file structure based on your needs
  id: string;
  name: string;
  url_private: string;
  // Add other file properties as needed
  [key: string]: any;
}

export interface ResponseMetadata {
  warnings: string[];
}

export interface SlackConversationHistoryResponse {
  ok: boolean;
  latest: string;
  messages: Message[];
  has_more: boolean;
  is_limited: boolean;
  pin_count: number;
  channel_actions_ts: string | null;
  channel_actions_count: number;
  response_metadata: ResponseMetadata;
}

export interface SlackMessageResponse {
  ok: boolean;
  channel: string;
  ts: string;
  message: Message;
  warning: string;
  response_metadata: ResponseMetadata;
}

export interface Metadata {
  event_type: string;
  event_payload: object;
}

export interface Authorization {
  enterprise_id: string | null;
  team_id: string;
  user_id: string;
  is_bot: boolean;
  is_enterprise_install: boolean;
}

/* ------------------ Slack Events ------------------------------ */
export interface SlackEventPayload {
  type: "event";
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

export type SlackEvent<TBlocks = any[]> = SlackMessageEvent<TBlocks> | SlackLinkSharedEvent;

export interface SlackMessageEvent<TBlocks = any[]> {
  type: "message";
  user: string;
  ts: string;
  text: string;
  team: string;
  thread_ts?: string;
  parent_user_id: string;
  blocks: TBlocks;
  channel: string;
  event_ts: string;
  channel_type: string;
  bot_id?: string;
  app_id?: string;
  bot_profile?: BotProfile;
  metadata?: Metadata;
}

export interface SlackLinkSharedEvent {
  type: "link_shared";
  user: string;
  channel: string;
  message_ts: string;
  source: string;
  unfurl_id: string;
  bot_id?: string;
  is_bot_user_member: boolean;
  event_ts: string;
  links: { url: string; domain: string }[];
}

// Common types used within conversations
export interface SlackTopicPurpose {
  value: string;
  creator: string;
  last_set: number;
}

// Base interface for all conversation types
export interface BaseConversation {
  id: string;
  created: number;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_archived?: boolean;
  is_general?: boolean;
  is_org_shared: boolean;
  priority: number;
}

// Interface for channel/group conversations
export interface ChannelGroupConversation extends BaseConversation {
  name: string;
  creator: string;
  unlinked?: number;
  name_normalized: string;
  is_shared: boolean;
  is_ext_shared: boolean;
  pending_shared: any[];
  is_pending_ext_shared: boolean;
  is_member: boolean;
  is_private: boolean;
  is_mpim?: boolean;
  is_open?: boolean;
  updated?: number;
  topic: SlackTopicPurpose;
  purpose: SlackTopicPurpose;
}

// Interface for direct message conversations
export interface DirectMessageConversation extends BaseConversation {
  user: string;
  is_user_deleted: boolean;
}

// Union type for all conversation types
export type SlackConversation = ChannelGroupConversation | DirectMessageConversation;

// The complete response type
export interface SlackConversationListResponse {
  ok: boolean;
  channels: SlackConversation[];
  response_metadata?: {
    next_cursor?: string;
  };
}

export interface Authorization {
  enterprise_id: string | null;
  team_id: string;
  user_id: string;
  is_bot: boolean;
  is_enterprise_install: boolean;
}

// Type guard for BotMessage
export function isBotMessage(payload: SlackEventPayload): payload is SlackEventPayload & { event: { bot_id: string } } {
  return !!payload.event?.bot_id;
}

// Type guard for UserMessage
export function isUserMessage(
  payload: SlackEventPayload
): payload is SlackEventPayload & { event: { bot_id?: undefined } } {
  return !payload.event?.bot_id;
}

/* ------------------ Parser Types --------------------------------- */
export interface BasePlaneResource {
  type: "issue" | "cycle" | "module" | "project";
  workspaceSlug: string;
}

export interface IssueResource extends BasePlaneResource {
  type: "issue";
  projectIdentifier: string;
  issueKey: string;
}

export interface CycleResource extends BasePlaneResource {
  type: "cycle";
  projectId: string;
  cycleId: string;
}

export interface ModuleResource extends BasePlaneResource {
  type: "module";
  projectId: string;
  moduleId: string;
}

export interface ProjectResource extends BasePlaneResource {
  projectId: string;
  type: "project";
}

export interface UnfurlMap {
  [url: string]: {
    blocks: any[];
    thread_ts?: string;
  };
}

export type PlaneResource = IssueResource | CycleResource | ModuleResource | ProjectResource;
