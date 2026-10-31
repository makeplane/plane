/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useSearchParams } from "react-router";
import { cn } from "@plane/utils";
// hooks
import { useCalendarSettings } from "@/hooks/team-ops/use-work-calendar";
// local imports
import { FlowControl } from "./flow-control";
import { HubControl } from "./hub-control";
import { TeamControl } from "./team-control";

type Props = { workspaceSlug: string };

/** Control: managers watch tasks and hours; admins also watch the Hub and the flows. */
export const ControlRoot = observer(function ControlRoot({ workspaceSlug }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { permissions, isLoading } = useCalendarSettings(workspaceSlug);
  const canTeam = permissions?.can_view_team ?? false;
  const isAdmin = permissions?.can_manage ?? false;

  const tabs = [
    ...(canTeam ? [{ key: "team", label: "Team control", hint: "Tasks and working hours" }] : []),
    ...(isAdmin
      ? [
          { key: "hub", label: "Hub control", hint: "Channels and messages" },
          { key: "flows", label: "Teamflow control", hint: "Project flows and hand-offs" },
        ]
      : []),
  ];
  const requested = searchParams.get("tab");
  const tab = tabs.find((item) => item.key === requested)?.key ?? tabs[0]?.key;

  if (!isLoading && tabs.length === 0) {
    return (
      <p className="mx-auto max-w-xl p-6 text-body-sm-regular text-secondary">
        Control is for admins and team leads. Ask an admin if you need to see how the team is working.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <header>
        <h1 className="text-h4-medium text-primary">Control</h1>
        <p className="text-body-sm-regular text-secondary">
          See how the team works: who is on what, for how long, and where things are stuck.
        </p>
      </header>
      <nav aria-label="Control" className="flex gap-1 border-b border-subtle">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-current={tab === item.key ? "page" : undefined}
            title={item.hint}
            onClick={() => setSearchParams(item.key === tabs[0].key ? {} : { tab: item.key })}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-body-sm-medium transition-colors",
              tab === item.key
                ? "border-accent-strong text-primary"
                : "border-transparent text-tertiary hover:text-secondary"
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {tab === "team" ? <TeamControl workspaceSlug={workspaceSlug} /> : null}
      {tab === "hub" ? <HubControl workspaceSlug={workspaceSlug} /> : null}
      {tab === "flows" ? <FlowControl workspaceSlug={workspaceSlug} /> : null}
    </div>
  );
});
