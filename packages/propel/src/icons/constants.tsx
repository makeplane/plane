import { AddIcon } from "./actions/add-icon";
import { CalendarLayoutIcon } from "./layouts/calendar-icon";
import { CardLayoutIcon } from "./layouts/card-icon";
import { GanttLayoutIcon } from "./layouts/gantt-icon";
import { GridLayoutIcon } from "./layouts/grid-icon";
import { KanbanLayoutIcon } from "./layouts/kanban-icon";
import { ListLayoutIcon } from "./layouts/list-icon";
import { SheetLayoutIcon } from "./layouts/sheet-icon";
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

export const ActionsIconsMap = [{ icon: <AddIcon />, title: "AddIcon" }];

export const WorkspaceIconsMap = [
  { icon: <AnalyticsIcon />, title: "AnalyticsIcon" },
  { icon: <ArchiveIcon />, title: "ArchiveIcon" },
  { icon: <DashboardIcon />, title: "DashboardIcon" },
  { icon: <DraftIcon />, title: "DraftIcon" },
  { icon: <HomeIcon />, title: "HomeIcon" },
  { icon: <InboxIcon />, title: "InboxIcon" },
  { icon: <ProjectIcon />, title: "ProjectIcon" },
  { icon: <YourWorkIcon />, title: "YourWorkIcon" },
];

export const ProjectIconsMap = [
  { icon: <CycleIcon />, title: "CycleIcon" },
  { icon: <EpicIcon />, title: "EpicIcon" },
  { icon: <IntakeIcon />, title: "IntakeIcon" },
  { icon: <ModuleIcon />, title: "ModuleIcon" },
  { icon: <PageIcon />, title: "PageIcon" },
  { icon: <ViewsIcon />, title: "ViewIcon" },
  { icon: <WorkItemsIcon />, title: "WorkItemsIcon" },
];

export const SubBrandIconsMap = [
  { icon: <PiChatLogo />, title: "PiChatLogo" },
  { icon: <PlaneNewIcon />, title: "PlaneIcon" },
  { icon: <WikiIcon />, title: "WikiIcon" },
];

export const LayoutIconsMap = [
  { icon: <CalendarLayoutIcon />, title: "CalendarLayoutIcon" },
  { icon: <CardLayoutIcon />, title: "CardLayoutIcon" },
  { icon: <GanttLayoutIcon />, title: "GanttLayoutIcon" },
  { icon: <GridLayoutIcon />, title: "GridLayoutIcon" },
  { icon: <KanbanLayoutIcon />, title: "KanbanLayoutIcon" },
  { icon: <ListLayoutIcon />, title: "ListLayoutIcon" },
  { icon: <SheetLayoutIcon />, title: "SheetLayoutIcon" },
];

export const PropertyIconsMap = [
  { icon: <BooleanPropertyIcon />, title: "BooleanPropertyIcon" },
  { icon: <DropdownPropertyIcon />, title: "DropdownPropertyIcon" },
  { icon: <DueDatePropertyIcon />, title: "DueDatePropertyIcon" },
  { icon: <DuplicatePropertyIcon />, title: "DuplicatePropertyIcon" },
  { icon: <EstimatePropertyIcon />, title: "EstimatePropertyIcon" },
  { icon: <HashPropertyIcon />, title: "HashPropertyIcon" },
  { icon: <LabelPropertyIcon />, title: "LabelPropertyIcon" },
  { icon: <MembersPropertyIcon />, title: "MembersPropertyIcon" },
  { icon: <OverdueDatePropertyIcon />, title: "OverdueDatePropertyIcon" },
  { icon: <ParentPropertyIcon />, title: "ParentPropertyIcon" },
  { icon: <PriorityPropertyIcon />, title: "PriorityPropertyIcon" },
  { icon: <RelatesToPropertyIcon />, title: "RelatesToPropertyIcon" },
  { icon: <RelationPropertyIcon />, title: "RelationPropertyIcon" },
  { icon: <ScopePropertyIcon />, title: "ScopePropertyIcon" },
  { icon: <StartDatePropertyIcon />, title: "StartDatePropertyIcon" },
  { icon: <StatePropertyIcon />, title: "StatePropertyIcon" },
  { icon: <UserCirclePropertyIcon />, title: "UserCirclePropertyIcon" },
  { icon: <UserPropertyIcon />, title: "UserPropertyIcon" },
  { icon: <UserSquarePropertyIcon />, title: "UserSquarePropertyIcon" },
  { icon: <WorkflowsPropertyIcon />, title: "WorkflowsPropertyIcon" },
];
