import { AddIcon } from "./actions/add-icon";
import { CloseIcon } from "./actions/close-icon";
import { ChevronDownIcon } from "./arrows/chevron-down";
import { ChevronLeftIcon } from "./arrows/chevron-left";
import { ChevronRightIcon } from "./arrows/chevron-right";
import { ChevronUpIcon } from "./arrows/chevron-up";
import { DefaultIcon } from "./default-icon";
import { BoardLayoutIcon } from "./layouts/board-icon";
import { CalendarLayoutIcon } from "./layouts/calendar-icon";
import { CardLayoutIcon } from "./layouts/card-icon";
import { GridLayoutIcon } from "./layouts/grid-icon";
import { ListLayoutIcon } from "./layouts/list-icon";
import { SheetLayoutIcon } from "./layouts/sheet-icon";
import { TimelineLayoutIcon } from "./layouts/timeline-icon";
import { CycleIcon } from "./project/cycle-icon";
import { EpicIcon } from "./project/epic-icon";
import { IntakeIcon } from "./project/intake-icon";
import { ModuleIcon } from "./project/module-icon";
import { PageIcon } from "./project/page-icon";
import { ViewsIcon } from "./project/view-icon";
import { WorkItemsIcon } from "./project/work-items-icon";
import { BooleanPropertyIcon } from "./properties/boolean-icon";
import { DropdownPropertyIcon } from "./properties/dropdown-icon";
import { DueDatePropertyIcon } from "./properties/due-date-icon";
import { DuplicatePropertyIcon } from "./properties/duplicate-icon";
import { EstimatePropertyIcon } from "./properties/estimate-icon";
import { HashPropertyIcon } from "./properties/hash-icon";
import { LabelPropertyIcon } from "./properties/label-icon";
import { MembersPropertyIcon } from "./properties/members-icon";
import { OverdueDatePropertyIcon } from "./properties/overdue-date-icon";
import { ParentPropertyIcon } from "./properties/parent-icon";
import { PriorityPropertyIcon } from "./properties/priority-icon";
import { RelatesToPropertyIcon } from "./properties/relates-to-icon";
import { RelationPropertyIcon } from "./properties/relation-icon";
import { ScopePropertyIcon } from "./properties/scrope-icon";
import { StartDatePropertyIcon } from "./properties/start-date-icon";
import { StatePropertyIcon } from "./properties/state-icon";
import { UserCirclePropertyIcon } from "./properties/user-circle-icon";
import { UserPropertyIcon } from "./properties/user-icon";
import { UserSquarePropertyIcon } from "./properties/user-square-icon";
import { WorkflowsPropertyIcon } from "./properties/workflows-icon";
import { PiChatLogo } from "./sub-brand/pi-chat";
import { PlaneNewIcon } from "./sub-brand/plane-icon";
import { WikiIcon } from "./sub-brand/wiki-icon";
import { AnalyticsIcon } from "./workspace/analytics-icon";
import { ArchiveIcon } from "./workspace/archive-icon";
import { DashboardIcon } from "./workspace/dashboard-icon";
import { DraftIcon } from "./workspace/draft-icon";
import { HomeIcon } from "./workspace/home-icon";
import { InboxIcon } from "./workspace/inbox-icon";
import { ProjectIcon } from "./workspace/project-icon";
import { YourWorkIcon } from "./workspace/your-work-icon";

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

  // Action icons
  "action.add": AddIcon,
  "action.close": CloseIcon,

  // Arrow icons
  "arrow.chevron-down": ChevronDownIcon,
  "arrow.chevron-left": ChevronLeftIcon,
  "arrow.chevron-right": ChevronRightIcon,
  "arrow.chevron-up": ChevronUpIcon,

  // Default fallback
  default: DefaultIcon,
} as const;

export type IconName = keyof typeof ICON_REGISTRY;
