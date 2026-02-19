/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import preview from "#.storybook/preview";
import { Icon } from "./icon";
import type { IconName } from "./registry";
import { ICON_REGISTRY } from "./registry";
// Standalone icons (root level, not in registry)
import { AiIcon } from "./ai-icon";
import { AiSearchIcon } from "./ai-search";
import { AiWriteIcon } from "./ai-write";
import { ApproverIcon } from "./approver-icon";
import { AtRiskIcon } from "./at-risk-icon";
import { BarIcon } from "./bar-icon";
import { BlockedIcon } from "./blocked-icon";
import { BlockerIcon } from "./blocker-icon";
import { BuildingsIcon } from "./buildings-icon";
import { CalendarAfterIcon } from "./calendar-after-icon";
import { CalendarBeforeIcon } from "./calendar-before-icon";
import { CenterPanelIcon } from "./center-panel-icon";
import { ChatIcon } from "./chat-icon";
import { CommentFillIcon } from "./comment-fill-icon";
import { CreateIcon } from "./create-icon";
import { CustomerRequestIcon } from "./customer-request-icon";
import { CustomersIcon } from "./customers-icon";
import { DiceIcon } from "./dice-icon";
import { DiscordIcon } from "./discord-icon";
import { DisplayPropertiesIcon } from "./display-properties";
import { DoneState } from "./done-icon";
import { DropdownIcon } from "./dropdown-icon";
import { EmptyPageIcon } from "./empty-page-icon";
import { FavoriteFolderIcon } from "./favorite-folder-icon";
import { FilledCheck } from "./filled-check";
import { FilledCross } from "./filled-cross";
import { FullScreenPanelIcon } from "./full-screen-panel-icon";
import { GithubIcon } from "./github-icon";
import { InfoFillIcon } from "./info-fill-icon";
import { InitiativeIcon } from "./initiative-icon";
import { LayerStackIcon } from "./layer-stack";
import { LayersIcon } from "./layers-icon";
import { LeadIcon } from "./lead-icon";
import { MonospaceIcon } from "./monospace-icon";
import { MovedIcon } from "./moved-icon";
import { MovedPageIcon } from "./moved-page-icon";
import { OffTrackIcon } from "./off-track-icon";
import { OnTrackIcon } from "./on-track-icon";
import { OverviewIcon } from "./overview-icon";
import { PhotoFilterIcon } from "./photo-filter-icon";
import { PiIcon } from "./pi";
import { PlaneAIIcon } from "./plane-ai-icon";
import { RelatedIcon } from "./related-icon";
import { RestrictedPageIcon } from "./restricted-page-icon";
import { SansSerifIcon } from "./sans-serif-icon";
import { ScopeIcon } from "./scope-icon";
import { SerifIcon } from "./serif-icon";
import { SetAsDefaultIcon } from "./set-as-default-icon";
import { SidePanelIcon } from "./side-panel-icon";
import { SlackIcon } from "./slack-icon";
import { StickyNoteIcon } from "./sticky-note-icon";
import { SubscribeIcon } from "./subscribe-icon";
import { SuspendedUserIcon } from "./suspended-user";
import { TeamsIcon } from "./teams";
import { TransferIcon } from "./transfer-icon";
import { TreeMapIcon } from "./tree-map-icon";
import { TriangleAlertIcon } from "./triangle-alert";
import { UserActivityIcon } from "./user-activity-icon";
import { WorkflowIcon } from "./workflow-icon";
import { WorkspaceIcon } from "./workspace-icon";
// Subdirectory icons not in registry
import { DoubleCircleIcon } from "./cycle/double-circle-icon";
import { ContrastIcon } from "./cycle/contrast-icon";
import { CircleDotFullIcon } from "./cycle/circle-dot-full-icon";
import { ModulePlannedIcon } from "./module/planned";
import { ModulePausedIcon } from "./module/paused";
import { ModuleInProgressIcon } from "./module/in-progress";
import { ModuleCompletedIcon } from "./module/completed";
import { ModuleCancelledIcon } from "./module/cancelled";
import { ModuleBacklogIcon } from "./module/backlog";
import { VideoIcon } from "./editor/video-icon";
import { FileAttachmentIcon } from "./editor/file-attachment";
import { ConvertToWorkItemsIcon } from "./editor/convert-to-work-items";
import { RecurringWorkItemIcon } from "./recurring-work-item/base";
import { RecurringWorkItemSuccessIcon } from "./recurring-work-item/success";
import { RecurringWorkItemFailureIcon } from "./recurring-work-item/failure";
import { VideoFileIcon } from "./attachments/video-file-icon";
import { AudioFileIcon } from "./attachments/audio-file-icon";
import { ImageFileIcon } from "./attachments/image-file-icon";
import { DocumentFileIcon } from "./attachments/document-file-icon";
import { CodeFileIcon } from "./attachments/code-file-icon";
import { BasicPieChartIcon } from "./widget/pie-chart";
import { BasicNumberIcon } from "./widget/number";
import { BasicLineChartIcon, MultiLineLineChartIcon } from "./widget/line-chart";
import { BasicBarChartIcon, GroupedBarChartIcon, StackedBarChartIcon } from "./widget/bar-chart";
import { BasicDonutChartIcon, ProgressDonutChartIcon } from "./widget/donut-chart";
import { BasicAreaChartIcon, StackedAreaChartIcon, ComparisonAreaChartIcon } from "./widget/area-chart";
import { BacklogGroupIcon } from "./state/backlog-group-icon";
import { TriageGroupIcon } from "./state/triage-group-icon";
import { PlaneIcon } from "./plane/plane-icon";
import { PlaneOneIcon } from "./plane/plane-one-icon";
import { CommandIcon } from "./actions/command-icon";
import { AddCircleIcon } from "./actions/add-circle-icon";
import { PlaneLogo } from "./brand/plane-logo";
import { PlaneWordmark } from "./brand/plane-wordmark";
import { PlaneLockup } from "./brand/plane-lockup";
import { LightIcon } from "./workspace/light-icon";
import { CommentIcon } from "./properties/comment-icon";
import { EyeOpenIcon } from "./properties/eye-open-icon";
import { PencilLeftIcon } from "./properties/pencil-left-icon";
import { ScopePropertyIcon } from "./properties/scrope-icon";
import { TransferHopIcon } from "./properties/transfer-hop";
import type { TIssuePriorities } from "./priority-icon";
import { PriorityIcon } from "./priority-icon";

const iconRegistryEntries = Object.keys(ICON_REGISTRY) as IconName[];

const standaloneIcons = [
  { name: "AiIcon", Component: AiIcon },
  { name: "AiSearchIcon", Component: AiSearchIcon },
  { name: "AiWriteIcon", Component: AiWriteIcon },
  { name: "ApproverIcon", Component: ApproverIcon },
  { name: "AtRiskIcon", Component: AtRiskIcon },
  { name: "BarIcon", Component: BarIcon },
  { name: "BlockedIcon", Component: BlockedIcon },
  { name: "BlockerIcon", Component: BlockerIcon },
  { name: "BuildingsIcon", Component: BuildingsIcon },
  { name: "CalendarAfterIcon", Component: CalendarAfterIcon },
  { name: "CalendarBeforeIcon", Component: CalendarBeforeIcon },
  { name: "CenterPanelIcon", Component: CenterPanelIcon },
  { name: "ChatIcon", Component: ChatIcon },
  { name: "CommentFillIcon", Component: CommentFillIcon },
  { name: "CreateIcon", Component: CreateIcon },
  { name: "CustomerRequestIcon", Component: CustomerRequestIcon },
  { name: "CustomersIcon", Component: CustomersIcon },
  { name: "DiceIcon", Component: DiceIcon },
  { name: "DiscordIcon", Component: DiscordIcon },
  { name: "DisplayPropertiesIcon", Component: DisplayPropertiesIcon },
  { name: "DoneState", Component: DoneState },
  { name: "DropdownIcon", Component: DropdownIcon },
  { name: "EmptyPageIcon", Component: EmptyPageIcon },
  { name: "FavoriteFolderIcon", Component: FavoriteFolderIcon },
  { name: "FilledCheck", Component: FilledCheck },
  { name: "FilledCross", Component: FilledCross },
  { name: "FullScreenPanelIcon", Component: FullScreenPanelIcon },
  { name: "GithubIcon", Component: GithubIcon },
  { name: "InfoFillIcon", Component: InfoFillIcon },
  { name: "InitiativeIcon", Component: InitiativeIcon },
  { name: "LayerStackIcon", Component: LayerStackIcon },
  { name: "LayersIcon", Component: LayersIcon },
  { name: "LeadIcon", Component: LeadIcon },
  { name: "MonospaceIcon", Component: MonospaceIcon },
  { name: "MovedIcon", Component: MovedIcon },
  { name: "MovedPageIcon", Component: MovedPageIcon },
  { name: "OffTrackIcon", Component: OffTrackIcon },
  { name: "OnTrackIcon", Component: OnTrackIcon },
  { name: "OverviewIcon", Component: OverviewIcon },
  { name: "PhotoFilterIcon", Component: PhotoFilterIcon },
  { name: "PiIcon", Component: PiIcon },
  { name: "PlaneAIIcon", Component: PlaneAIIcon },
  { name: "RelatedIcon", Component: RelatedIcon },
  { name: "RestrictedPageIcon", Component: RestrictedPageIcon },
  { name: "SansSerifIcon", Component: SansSerifIcon },
  { name: "ScopeIcon", Component: ScopeIcon },
  { name: "SerifIcon", Component: SerifIcon },
  { name: "SetAsDefaultIcon", Component: SetAsDefaultIcon },
  { name: "SidePanelIcon", Component: SidePanelIcon },
  { name: "SlackIcon", Component: SlackIcon },
  { name: "StickyNoteIcon", Component: StickyNoteIcon },
  { name: "SubscribeIcon", Component: SubscribeIcon },
  { name: "SuspendedUserIcon", Component: SuspendedUserIcon },
  { name: "TeamsIcon", Component: TeamsIcon },
  { name: "TransferIcon", Component: TransferIcon },
  { name: "TreeMapIcon", Component: TreeMapIcon },
  { name: "TriangleAlertIcon", Component: TriangleAlertIcon },
  { name: "UserActivityIcon", Component: UserActivityIcon },
  { name: "WorkflowIcon", Component: WorkflowIcon },
  { name: "WorkspaceIcon", Component: WorkspaceIcon },
];

const subdirectoryIcons = [
  { name: "DoubleCircleIcon", Component: DoubleCircleIcon },
  { name: "ContrastIcon", Component: ContrastIcon },
  { name: "CircleDotFullIcon", Component: CircleDotFullIcon },
  { name: "ModulePlannedIcon", Component: ModulePlannedIcon },
  { name: "ModulePausedIcon", Component: ModulePausedIcon },
  { name: "ModuleInProgressIcon", Component: ModuleInProgressIcon },
  { name: "ModuleCompletedIcon", Component: ModuleCompletedIcon },
  { name: "ModuleCancelledIcon", Component: ModuleCancelledIcon },
  { name: "ModuleBacklogIcon", Component: ModuleBacklogIcon },
  { name: "VideoIcon", Component: VideoIcon },
  { name: "FileAttachmentIcon", Component: FileAttachmentIcon },
  { name: "ConvertToWorkItemsIcon", Component: ConvertToWorkItemsIcon },
  { name: "RecurringWorkItemIcon", Component: RecurringWorkItemIcon },
  { name: "RecurringWorkItemSuccessIcon", Component: RecurringWorkItemSuccessIcon },
  { name: "RecurringWorkItemFailureIcon", Component: RecurringWorkItemFailureIcon },
  { name: "VideoFileIcon", Component: VideoFileIcon },
  { name: "AudioFileIcon", Component: AudioFileIcon },
  { name: "ImageFileIcon", Component: ImageFileIcon },
  { name: "DocumentFileIcon", Component: DocumentFileIcon },
  { name: "CodeFileIcon", Component: CodeFileIcon },
  { name: "BasicPieChartIcon", Component: BasicPieChartIcon },
  { name: "BasicNumberIcon", Component: BasicNumberIcon },
  { name: "BasicLineChartIcon", Component: BasicLineChartIcon },
  { name: "BasicBarChartIcon", Component: BasicBarChartIcon },
  { name: "BasicDonutChartIcon", Component: BasicDonutChartIcon },
  { name: "BasicAreaChartIcon", Component: BasicAreaChartIcon },
  { name: "StackedAreaChartIcon", Component: StackedAreaChartIcon },
  { name: "ComparisonAreaChartIcon", Component: ComparisonAreaChartIcon },
  { name: "GroupedBarChartIcon", Component: GroupedBarChartIcon },
  { name: "StackedBarChartIcon", Component: StackedBarChartIcon },
  { name: "ProgressDonutChartIcon", Component: ProgressDonutChartIcon },
  { name: "MultiLineLineChartIcon", Component: MultiLineLineChartIcon },
  { name: "BacklogGroupIcon", Component: BacklogGroupIcon },
  { name: "TriageGroupIcon", Component: TriageGroupIcon },
  { name: "PlaneIcon", Component: PlaneIcon },
  { name: "PlaneOneIcon", Component: PlaneOneIcon },
  { name: "CommandIcon", Component: CommandIcon },
  { name: "AddCircleIcon", Component: AddCircleIcon },
  { name: "PlaneLogo", Component: PlaneLogo },
  { name: "PlaneWordmark", Component: PlaneWordmark },
  { name: "PlaneLockup", Component: PlaneLockup },
  { name: "LightIcon", Component: LightIcon },
  { name: "CommentIcon", Component: CommentIcon },
  { name: "EyeOpenIcon", Component: EyeOpenIcon },
  { name: "PencilLeftIcon", Component: PencilLeftIcon },
  { name: "ScopePropertyIcon", Component: ScopePropertyIcon },
  { name: "TransferHopIcon", Component: TransferHopIcon },
];

const meta = preview.meta({
  parameters: {
    layout: "padded",
  },
});

const priorities: TIssuePriorities[] = ["urgent", "high", "medium", "low", "none"];

export const RegistryUsage = meta.story({
  render(_args) {
    return (
      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">All Registry Icons</h3>
        <p className="text-13 text-tertiary">
          Rendered via <code className="px-1 py-0.5 bg-layer-1 rounded-sm">{"<Icon name={...} />"}</code>
        </p>
        <div className="grid grid-cols-8 gap-4 w-full">
          {iconRegistryEntries.map((name) => (
            <div key={name} className="flex flex-col items-center justify-center gap-2 p-3">
              <Icon name={name} className="h-5 w-5 text-secondary" />
              <p className="text-11 text-tertiary text-center truncate w-full">{name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
});

export const StandaloneIcons = meta.story({
  render(_args) {
    return (
      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Standalone Icons (Direct Import)</h3>
        <div className="grid grid-cols-8 gap-4 w-full">
          {standaloneIcons.map(({ name, Component }) => (
            <div key={name} className="flex flex-col items-center justify-center gap-2 p-3">
              <Component className="h-5 w-5 text-secondary" />
              <p className="text-11 text-tertiary text-center truncate w-full">{name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
});

export const SubdirectoryIcons = meta.story({
  render(_args) {
    return (
      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Subdirectory Icons</h3>
        <div className="grid grid-cols-8 gap-4 w-full">
          {subdirectoryIcons.map(({ name, Component }) => (
            <div key={name} className="flex flex-col items-center justify-center gap-2 p-3">
              <Component className="h-5 w-5 text-secondary" />
              <p className="text-11 text-tertiary text-center truncate w-full">{name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
});

// Render icons without className to cover default parameter branches
export const IconsDefaultProps = meta.story({
  render(_args) {
    return (
      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Icons with Default Props</h3>
        <div className="grid grid-cols-8 gap-4 w-full">
          {standaloneIcons.map(({ name, Component }) => (
            <div key={name} className="flex flex-col items-center justify-center gap-2 p-3">
              <Component />
              <p className="text-11 text-tertiary text-center truncate w-full">{name}</p>
            </div>
          ))}
          {subdirectoryIcons.map(({ name, Component }) => (
            <div key={name} className="flex flex-col items-center justify-center gap-2 p-3">
              <Component />
              <p className="text-11 text-tertiary text-center truncate w-full">{name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
});

// Render icons with explicit height and width to cover "provided" branches
export const IconsExplicitSize = meta.story({
  render(_args) {
    return (
      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Icons with Explicit Size</h3>
        <div className="grid grid-cols-8 gap-4 w-full">
          {standaloneIcons.map(({ name, Component }) => (
            <div key={name} className="flex flex-col items-center justify-center gap-2 p-3">
              <Component height="20" width="20" className="text-secondary" />
              <p className="text-11 text-tertiary text-center truncate w-full">{name}</p>
            </div>
          ))}
          {subdirectoryIcons.map(({ name, Component }) => (
            <div key={name} className="flex flex-col items-center justify-center gap-2 p-3">
              <Component height="20" width="20" className="text-secondary" />
              <p className="text-11 text-tertiary text-center truncate w-full">{name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
});

// PriorityIcon stories - covers all priority branches and withContainer variants
export const PriorityIcons = meta.story({
  render(_args) {
    return (
      <div className="space-y-6">
        <h3 className="text-16 font-semibold text-primary">Priority Icons (without container)</h3>
        <div className="flex gap-6">
          {priorities.map((p) => (
            <div key={p} className="flex flex-col items-center gap-2">
              <PriorityIcon priority={p} />
              <p className="text-11 text-tertiary">{p}</p>
            </div>
          ))}
        </div>
        <h3 className="text-16 font-semibold text-primary">Priority Icons (with container)</h3>
        <div className="flex gap-6">
          {priorities.map((p) => (
            <div key={p} className="flex flex-col items-center gap-2">
              <PriorityIcon priority={p} withContainer />
              <p className="text-11 text-tertiary">{p}</p>
            </div>
          ))}
        </div>
        <h3 className="text-16 font-semibold text-primary">Priority Icons (custom size)</h3>
        <div className="flex gap-6">
          {priorities.map((p) => (
            <div key={p} className="flex flex-col items-center gap-2">
              <PriorityIcon priority={p} size={20} withContainer containerClassName="p-1" />
              <p className="text-11 text-tertiary">{p}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
});
