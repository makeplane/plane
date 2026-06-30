/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { CopyIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
// helpers
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  token: string;
};

/**
 * Renders a ready-to-copy `claude mcp add` command so a freshly created API token
 * can be wired into Claude Code (or any MCP client) without leaving the app.
 *
 * Nothing is hardcoded: the API host comes from API_BASE_URL (falling back to the
 * current origin) and the workspace slug comes from the workspace store.
 */
export const ConnectAgentCommand = observer(function ConnectAgentCommand(props: Props) {
  const { token } = props;
  // store hooks
  const { workspaces, currentWorkspace } = useWorkspace();
  const { isMobile } = usePlatformOS();

  // every workspace the user can target with this token
  const workspaceList = useMemo(() => Object.values(workspaces ?? {}), [workspaces]);

  // default to the active workspace, otherwise the first one available
  const [selectedSlug, setSelectedSlug] = useState<string>(
    () => currentWorkspace?.slug ?? workspaceList[0]?.slug ?? ""
  );

  // resolve the API host dynamically (env-configured, with a same-origin fallback)
  const baseUrl = useMemo(() => {
    if (API_BASE_URL && API_BASE_URL.length > 0) return API_BASE_URL;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);

  const command = useMemo(
    () =>
      [
        "claude mcp add hangar",
        `-e PLANE_API_KEY=${token}`,
        `-e PLANE_WORKSPACE_SLUG=${selectedSlug}`,
        `-e PLANE_BASE_URL=${baseUrl}`,
        "-- uvx plane-mcp-server stdio",
      ].join(" "),
    [token, selectedSlug, baseUrl]
  );

  const copyCommand = () => {
    copyTextToClipboard(command).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Copied!",
        message: "Command copied — paste it in your terminal to connect.",
      })
    );
  };

  // no workspace yet → nothing meaningful to connect to
  if (!selectedSlug) return null;

  return (
    <div className="mt-5 space-y-2 rounded-md border-[0.5px] border-subtle bg-surface-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-13 font-medium text-primary">Connect to Claude Code</p>
        {workspaceList.length > 1 && (
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="rounded border-[0.5px] border-subtle bg-surface-1 px-2 py-1 text-11 text-secondary outline-none"
            aria-label="Select workspace"
          >
            {workspaceList.map((workspace) => (
              <option key={workspace.id} value={workspace.slug}>
                {workspace.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <p className="text-11 text-placeholder">
        Run this in your terminal to let Claude Code read and manage this workspace.
      </p>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 overflow-x-auto rounded bg-surface-1 px-3 py-2 text-11 whitespace-nowrap text-secondary">
          {command}
        </code>
        <button
          type="button"
          onClick={copyCommand}
          className="flex flex-shrink-0 items-center rounded border-[0.5px] border-subtle px-2 outline-none hover:bg-surface-1"
        >
          <Tooltip tooltipContent="Copy command" isMobile={isMobile}>
            <CopyIcon className="h-4 w-4 text-placeholder" />
          </Tooltip>
        </button>
      </div>
    </div>
  );
});
