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

import { useState } from "react";
import preview from "#.storybook/preview";
import {
  ArrowUpDown,
  Calendar,
  CalendarPlus,
  CheckCircle,
  FilePlus,
  GitBranch,
  Link,
  ListFilter,
  Paperclip,
  RefreshCw,
  Signal,
  SquareStack,
  Tag,
  Timer,
  UserCircle,
} from "lucide-react";
import { Avatar, AvatarGroup } from "@plane/propel/avatar";
import { Button } from "@plane/propel/button";
import { LabelFilledIcon } from "@plane/propel/icons";
import { ActivityHeader, TimelineContainer, TimelineItem, CommentBlock } from "../activity";
import { EntityDetailLayout } from "./layout";
import { EntityDetailContentHeader } from "./content-header";
import { EntityDetailPrimaryProperties, PropertyDivider } from "./primary-properties";
import { EntityDetailContentFooter } from "./content-footer";
import { EntityDetailVotes } from "./votes";
import { EntityDetailWidgetToolbar } from "./widget-toolbar";
import { EntityDetailWidgetSection } from "./widget-section";
import { EntityDetailSidebarPanel } from "./sidebar-panel";
import { EntityDetailSidebarGroup } from "./sidebar-group";
import { EntityDetailPropertyField } from "./property-field";
import { EntityDetailAuditInfo } from "./audit-info";
import { EntityDetailDivider } from "./divider";
import {
  MOCK_WORK_ITEM,
  MOCK_STATE,
  MOCK_PRIORITY,
  MOCK_ASSIGNEES,
  MOCK_DATES,
  MOCK_LABELS,
  MOCK_VOTES,
  MOCK_LAST_EDITED,
  MOCK_WIDGET_SECTIONS,
  MOCK_ACTIVITY_TABS,
  MOCK_TIMELINE,
  MOCK_SIDEBAR,
  MOCK_AUDIT,
  MOCK_DESCRIPTION,
} from "./_mock-data";

const meta = preview.meta({
  title: "EntityDetail/ComposedPage",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", width: "100%" }}>
        <Story />
      </div>
    ),
  ],
});

const PropertyPill = ({ label, color }: { label: string; color?: string }) => (
  <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-layer-transparent-hover cursor-pointer">
    {color && <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />}
    <span className="text-body-xs-medium text-primary whitespace-nowrap">{label}</span>
  </div>
);

const activityTabs = MOCK_ACTIVITY_TABS.map((t) => ({ key: t.key, label: t.label }));

function ComposedPage() {
  const [widgetSections, setWidgetSections] = useState<Record<string, boolean>>({
    "Sub-work items": true,
    Dependencies: false,
    Relations: false,
    Links: false,
    Attachments: false,
  });
  const [activeTab, setActiveTab] = useState("all");

  const toggleWidget = (title: string) => setWidgetSections((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <EntityDetailLayout
      mainContent={
        <div className="flex flex-col gap-4 py-6">
          {/* Section 1: Header + Properties + Description + Footer */}
          <div className="flex flex-col gap-5">
            <EntityDetailContentHeader
              breadcrumb={{
                parentElement: (
                  <span className="text-body-xs-medium text-secondary hover:underline cursor-pointer">
                    {MOCK_WORK_ITEM.parentTitle}
                  </span>
                ),
                identifierElement: (
                  <span className="text-body-xs-medium text-primary">{MOCK_WORK_ITEM.identifier}</span>
                ),
              }}
              titleElement={<h2 className="text-h3-semibold text-primary leading-tight">{MOCK_WORK_ITEM.title}</h2>}
            />

            <EntityDetailPrimaryProperties>
              <PropertyPill label={MOCK_STATE.label} color={MOCK_STATE.color} />
              <PropertyDivider />
              <PropertyPill label={MOCK_PRIORITY.label} />
              <PropertyDivider />
              <PropertyPill label={MOCK_ASSIGNEES.map((a) => a.name).join(", ")} />
              <PropertyDivider />
              <PropertyPill label={MOCK_DATES.startDate} />
              <PropertyPill label={MOCK_DATES.dueDate} />
            </EntityDetailPrimaryProperties>

            {/* Description (static HTML) */}
            <div className="flex flex-col gap-2">
              <p className="text-body-sm-regular text-primary leading-relaxed">{MOCK_DESCRIPTION}</p>
            </div>

            <EntityDetailContentFooter
              leftElement={
                <EntityDetailVotes
                  upVotesCount={MOCK_VOTES.upVotesCount}
                  downVotesCount={MOCK_VOTES.downVotesCount}
                  isUpVotedByUser={MOCK_VOTES.isUpVotedByUser}
                  isDownVotedByUser={MOCK_VOTES.isDownVotedByUser}
                  onUpVote={() => {}}
                  onDownVote={() => {}}
                  onCountClick={(voteType) => console.log("count-click:", voteType)}
                />
              }
              rightElement={
                <span className="text-caption-md-regular text-placeholder">
                  Last edited by {MOCK_LAST_EDITED.name} &middot; {MOCK_LAST_EDITED.timeAgo}
                </span>
              }
            />
          </div>

          {/* Section 2: Widget Toolbar */}
          <div className="py-3">
            <EntityDetailWidgetToolbar>
              <EntityDetailWidgetToolbar.Section>
                <EntityDetailWidgetToolbar.TextButton
                  icon={<SquareStack className="size-4" />}
                  label="Sub-work item"
                  onClick={() => console.log("toolbar:sub-work-item")}
                />
              </EntityDetailWidgetToolbar.Section>
              <EntityDetailWidgetToolbar.Section>
                <EntityDetailWidgetToolbar.DropdownButton
                  icon={<GitBranch className="size-4" />}
                  onClick={() => console.log("toolbar:dependencies")}
                  ariaLabel="Dependencies"
                />
                <EntityDetailWidgetToolbar.DropdownButton
                  icon={<Link className="size-4" />}
                  onClick={() => console.log("toolbar:relations")}
                  ariaLabel="Relations"
                />
              </EntityDetailWidgetToolbar.Section>
              <EntityDetailWidgetToolbar.Section>
                <EntityDetailWidgetToolbar.IconButton
                  icon={<Link className="size-4" />}
                  onClick={() => console.log("toolbar:links")}
                  ariaLabel="Links"
                />
                <EntityDetailWidgetToolbar.IconButton
                  icon={<Paperclip className="size-4" />}
                  onClick={() => console.log("toolbar:attachments")}
                  ariaLabel="Attachments"
                />
              </EntityDetailWidgetToolbar.Section>
              <EntityDetailWidgetToolbar.Section>
                <EntityDetailWidgetToolbar.IconButton
                  icon={<FilePlus className="size-4" />}
                  onClick={() => console.log("toolbar:pages")}
                  ariaLabel="Pages"
                />
              </EntityDetailWidgetToolbar.Section>
            </EntityDetailWidgetToolbar>
          </div>

          {/* Section 3: Collapsible Widget Sections */}
          <div className="flex flex-col">
            {MOCK_WIDGET_SECTIONS.map((section) => (
              <EntityDetailWidgetSection
                key={section.title}
                title={section.title}
                count={section.count}
                isOpen={!!widgetSections[section.title]}
                onToggle={() => toggleWidget(section.title)}
              >
                <div className="text-body-sm-regular text-tertiary p-2 border border-dashed border-subtle rounded-lg">
                  {section.title} content placeholder ({section.count} items)
                </div>
              </EntityDetailWidgetSection>
            ))}
          </div>

          {/* Section 4: Activity Feed */}
          <div className="flex flex-col gap-6 py-6">
            <ActivityHeader
              tabs={activityTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              actionsElement={
                <div className="flex items-center gap-2">
                  <Button
                    variant="tertiary"
                    size="base"
                    prependIcon={<Timer className="size-3.5" />}
                    onClick={() => console.log("add-log")}
                  >
                    Add log
                  </Button>
                </div>
              }
            />

            <TimelineContainer>
              <TimelineItem icon={<UserCircle className="w-3.5 h-3.5" />} timestamp={MOCK_TIMELINE.created.timeAgo}>
                <span className="text-body-xs-medium text-primary">{MOCK_TIMELINE.created.user}</span>{" "}
                <span className="text-caption-sm-regular text-secondary">{MOCK_TIMELINE.created.action}</span>
              </TimelineItem>

              <CommentBlock
                avatar={<div className="size-4 rounded-full bg-layer-3" />}
                authorName={MOCK_TIMELINE.comment.user}
                timestamp={MOCK_TIMELINE.comment.timeAgo}
                body={<p>{MOCK_TIMELINE.comment.text}</p>}
              />

              <TimelineItem
                icon={<Tag className="w-3.5 h-3.5" />}
                timestamp={MOCK_TIMELINE.stateChange.timeAgo}
                showConnector={false}
              >
                <span className="text-body-xs-medium text-primary">{MOCK_TIMELINE.stateChange.user}</span>{" "}
                <span className="text-caption-sm-regular text-secondary">{MOCK_TIMELINE.stateChange.action}</span>
              </TimelineItem>
            </TimelineContainer>

            <div className="p-3 text-body-xs-regular text-tertiary">Comment composer placeholder</div>
          </div>
        </div>
      }
      sidebarContent={
        <EntityDetailSidebarPanel title="Properties" subtitle="Updated 3d ago">
          <EntityDetailSidebarGroup label="Details" defaultOpen>
            <EntityDetailPropertyField icon={Signal} label="Priority">
              <span className="text-body-xs-medium text-primary">{MOCK_PRIORITY.label}</span>
            </EntityDetailPropertyField>
            <EntityDetailPropertyField icon={UserCircle} label="Assignees">
              <AvatarGroup max={3} size="sm">
                {MOCK_ASSIGNEES.map((a) => (
                  <Avatar
                    key={a.id}
                    name={a.name}
                    src={a.avatarUrl}
                    fallbackBackgroundColor={a.fallbackColor}
                    size="sm"
                  />
                ))}
              </AvatarGroup>
              <span className="text-body-xs-medium text-primary">{MOCK_ASSIGNEES.map((a) => a.name).join(", ")}</span>
            </EntityDetailPropertyField>
            <EntityDetailPropertyField icon={Calendar} label="Start date">
              <span className="text-body-xs-medium text-primary">{MOCK_DATES.startDate}</span>
            </EntityDetailPropertyField>
            <EntityDetailPropertyField icon={Calendar} label="Due date">
              <span className="text-body-xs-medium text-primary">{MOCK_DATES.dueDate}</span>
            </EntityDetailPropertyField>
            <EntityDetailPropertyField icon={Tag} label="Labels">
              {MOCK_LABELS.map((l) => (
                <Button key={l.id} variant="tertiary" size="base" prependIcon={<LabelFilledIcon color={l.color} />}>
                  {l.name}
                </Button>
              ))}
            </EntityDetailPropertyField>
            <EntityDetailPropertyField icon={Timer} label="Estimate">
              <span className="text-body-xs-medium text-primary">{MOCK_SIDEBAR.estimate}</span>
            </EntityDetailPropertyField>
          </EntityDetailSidebarGroup>

          <EntityDetailDivider />

          <EntityDetailSidebarGroup label="Project structure" defaultOpen>
            <EntityDetailPropertyField icon={SquareStack} label="Cycle">
              <span className="text-body-xs-medium text-primary">{MOCK_SIDEBAR.cycle}</span>
            </EntityDetailPropertyField>
            <EntityDetailPropertyField icon={SquareStack} label="Module">
              <span className="text-body-xs-medium text-primary">{MOCK_SIDEBAR.module}</span>
            </EntityDetailPropertyField>
          </EntityDetailSidebarGroup>

          <EntityDetailDivider />

          <EntityDetailAuditInfo
            rows={[
              { icon: UserCircle, text: `Created by ${MOCK_AUDIT.createdBy}` },
              { icon: CalendarPlus, text: `Created on ${MOCK_AUDIT.createdOn}` },
              { icon: RefreshCw, text: `Updated on ${MOCK_AUDIT.updatedOn}` },
              { icon: CheckCircle, text: `Completed on ${MOCK_AUDIT.completedOn}` },
            ]}
          />
        </EntityDetailSidebarPanel>
      }
    />
  );
}

export const Default = meta.story({
  render: () => <ComposedPage />,
});

function PeekModePage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="flex flex-col gap-4 p-6 max-w-3xl mx-auto">
      <EntityDetailContentHeader
        titleElement={
          <div className="flex flex-col gap-1">
            <span className="text-body-xs-medium text-secondary">{MOCK_WORK_ITEM.identifier}</span>
            <h2 className="text-h3-semibold text-primary leading-tight">{MOCK_WORK_ITEM.title}</h2>
          </div>
        }
      />

      <EntityDetailPrimaryProperties>
        <PropertyPill label={MOCK_STATE.label} color={MOCK_STATE.color} />
        <PropertyDivider />
        <PropertyPill label={MOCK_PRIORITY.label} />
        <PropertyDivider />
        <PropertyPill label={MOCK_ASSIGNEES.map((a) => a.name).join(", ")} />
      </EntityDetailPrimaryProperties>

      <div className="flex flex-col gap-2">
        <p className="text-body-sm-regular text-primary leading-relaxed">{MOCK_DESCRIPTION}</p>
      </div>

      <EntityDetailContentFooter
        leftElement={
          <EntityDetailVotes
            upVotesCount={MOCK_VOTES.upVotesCount}
            downVotesCount={MOCK_VOTES.downVotesCount}
            isUpVotedByUser={MOCK_VOTES.isUpVotedByUser}
            isDownVotedByUser={MOCK_VOTES.isDownVotedByUser}
            onUpVote={() => {}}
            onDownVote={() => {}}
            onCountClick={(voteType) => console.log("count-click:", voteType)}
          />
        }
        rightElement={
          <span className="text-caption-md-regular text-placeholder">
            Last edited by {MOCK_LAST_EDITED.name} &middot; {MOCK_LAST_EDITED.timeAgo}
          </span>
        }
      />

      <div className="flex flex-col gap-6 py-6">
        <ActivityHeader tabs={activityTabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export const PeekMode = meta.story({
  render: () => <PeekModePage />,
});
