/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useSearchParams } from "react-router";
import { cn } from "@plane/utils";
// local imports
import { FlowsView } from "./flows-view";
import { HandoffsView } from "./teamflow-root";

const TABS = [
  { key: "flows", label: "Project flows" },
  { key: "handoffs", label: "Hand-offs between teams" },
] as const;

/** Teamflow: the flowcharts of projects drawn by admins, and the work handed from team to team. */
export const TeamflowRoot = observer(function TeamflowRoot({ workspaceSlug }: { workspaceSlug: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "handoffs" ? "handoffs" : "flows";
  return (
    <div className="flex w-full flex-col">
      <div className="mx-auto w-full max-w-5xl px-6 pt-6">
        <h1 className="text-h4-medium text-primary">Teamflow</h1>
        <nav aria-label="Teamflow" className="mt-3 flex gap-1 border-b border-subtle">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-current={tab === item.key ? "page" : undefined}
              onClick={() => setSearchParams(item.key === "flows" ? {} : { tab: item.key })}
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
      </div>
      {tab === "flows" ? (
        <div className="mx-auto w-full max-w-5xl p-6">
          <FlowsView workspaceSlug={workspaceSlug} />
        </div>
      ) : (
        <HandoffsView workspaceSlug={workspaceSlug} />
      )}
    </div>
  );
});
