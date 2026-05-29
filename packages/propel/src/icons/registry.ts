// Action icons
import {
  AddIcon,
  AddReactionIcon,
  AddWorkItemIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  EditIcon,
  FilterAppliedIcon,
  FilterIcon,
  GlobeIcon,
  LinkIcon,
  LockIcon,
  NewTabIcon,
  PlusIcon,
  PreferencesIcon,
  SearchIcon,
  TrashIcon,
  UpgradeIcon,
} from "./actions";
// Arrow icons
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ReplyIcon } from "./arrows";
// Default icon
import { DefaultIcon } from "./default-icon";
// Layout icons
import {
  BoardLayoutIcon,
  CalendarLayoutIcon,
  CardLayoutIcon,
  GridLayoutIcon,
  ListLayoutIcon,
  SheetLayoutIcon,
  TimelineLayoutIcon,
} from "./layouts";
// Misc icons
import { InfoIcon } from "./misc";
// Project icons
import { CycleIcon, EpicIcon, IntakeIcon, ModuleIcon, PageIcon, ViewsIcon, WorkItemsIcon } from "./project";
// Property icons
import {
  BooleanPropertyIcon,
  DropdownPropertyIcon,
  DueDatePropertyIcon,
  DuplicatePropertyIcon,
  EstimatePropertyIcon,
  HashPropertyIcon,
  LabelPropertyIcon,
  MembersPropertyIcon,
  OverdueDatePropertyIcon,
  ParentPropertyIcon,
  PriorityPropertyIcon,
  RelatesToPropertyIcon,
  RelationPropertyIcon,
  ScopePropertyIcon,
  StartDatePropertyIcon,
  StatePropertyIcon,
  UserCirclePropertyIcon,
  UserPropertyIcon,
  UserSquarePropertyIcon,
  WorkflowsPropertyIcon,
} from "./properties";
// Sub-brand icons
import { CopyLinkIcon } from "./actions/copy-link";
import { LabelFilledIcon } from "./properties/label-filled-icon";
import { PiChatLogo, PlaneNewIcon, WikiIcon } from "./sub-brand";
// Workspace icons
import {
  AnalyticsIcon,
  ArchiveIcon,
  DashboardIcon,
  DraftIcon,
  HomeIcon,
  InboxIcon,
  MultipleStickyIcon,
  ProjectIcon,
  YourWorkIcon,
} from "./workspace";

export const ICON_REGISTRY = {
  // Sub-brand icons
  "sub-brand.plane": PlaneNewIcon,
  "sub-brand.wiki": WikiIcon,
  "sub-brand.pi-chat": PiChatLogo,

  // Workspace icons
  "workspace.analytics": AnalyticsIcon,
  "workspace.archive": ArchiveIcon,
  "workspace.cycle": CycleIcon,
  "workspace.dashboard": DashboardIcon,
  "workspace.draft": DraftIcon,
  "workspace.home": HomeIcon,
  "workspace.inbox": InboxIcon,
  "workspace.multiple-sticky": MultipleStickyIcon,
  "workspace.page": PageIcon,
  "workspace.project": ProjectIcon,
  "workspace.views": ViewsIcon,
  "workspace.your-work": YourWorkIcon,

  // Project icons
  "project.cycle": CycleIcon,
  "project.epic": EpicIcon,
  "project.intake": IntakeIcon,
  "project.module": ModuleIcon,
  "project.page": PageIcon,
  "project.view": ViewsIcon,
  "project.work-items": WorkItemsIcon,

  // Layout icons
  "layout.calendar": CalendarLayoutIcon,
  "layout.card": CardLayoutIcon,
  "layout.timeline": TimelineLayoutIcon,
  "layout.grid": GridLayoutIcon,
  "layout.board": BoardLayoutIcon,
  "layout.list": ListLayoutIcon,
  "layout.sheet": SheetLayoutIcon,

  // Property icons
  "property.boolean": BooleanPropertyIcon,
  "property.dropdown": DropdownPropertyIcon,
  "property.due-date": DueDatePropertyIcon,
  "property.duplicate": DuplicatePropertyIcon,
  "property.estimate": EstimatePropertyIcon,
  "property.hash": HashPropertyIcon,
  "property.label": LabelPropertyIcon,
  "property.members": MembersPropertyIcon,
  "property.overdue-date": OverdueDatePropertyIcon,
  "property.parent": ParentPropertyIcon,
  "property.priority": PriorityPropertyIcon,
  "property.relates-to": RelatesToPropertyIcon,
  "property.relation": RelationPropertyIcon,
  "property.scope": ScopePropertyIcon,
  "property.start-date": StartDatePropertyIcon,
  "property.state": StatePropertyIcon,
  "property.user-circle": UserCirclePropertyIcon,
  "property.user": UserPropertyIcon,
  "property.user-square": UserSquarePropertyIcon,
  "property.workflows": WorkflowsPropertyIcon,
  "property.label-filled": LabelFilledIcon,

  // Action icons
  "action.add": AddIcon,
  "action.add-workitem": AddWorkItemIcon,
  "action.add-reaction": AddReactionIcon,
  "action.check": CheckIcon,
  "action.close": CloseIcon,
  "action.copy": CopyIcon,
  "action.edit": EditIcon,
  "action.globe": GlobeIcon,
  "action.link": LinkIcon,
  "action.lock": LockIcon,
  "action.new-tab": NewTabIcon,
  "action.filter": FilterIcon,
  "action.filter-applied": FilterAppliedIcon,
  "action.search": SearchIcon,
  "action.plus": PlusIcon,
  "action.preferences": PreferencesIcon,
  "action.trash": TrashIcon,
  "action.copy-link": CopyLinkIcon,
  "action.upgrade": UpgradeIcon,

  // Arrow icons
  "arrow.chevron-down": ChevronDownIcon,
  "arrow.chevron-left": ChevronLeftIcon,
  "arrow.chevron-right": ChevronRightIcon,
  "arrow.chevron-up": ChevronUpIcon,

  // Misc icons
  "misc.info": InfoIcon,
  "arrow.reply": ReplyIcon,

  // Default fallback
  default: DefaultIcon,
} as const;

export type IconName = keyof typeof ICON_REGISTRY;
