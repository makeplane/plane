/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import { EraserService } from "@/services/integrations/eraser.service";

const eraserService = new EraserService();

export function EraserIntegrationCard({ workspaceSlug }: { workspaceSlug: string }) {
  const { data, mutate } = useSWR(["eraser-connection", workspaceSlug], () =>
    eraserService.getConnection(workspaceSlug)
  );
  const [apiToken, setApiToken] = useState("");
  const [saving, setSaving] = useState(false);

  const connect = async () => {
    if (!apiToken.trim()) return;
    setSaving(true);
    try {
      await eraserService.connect(workspaceSlug, apiToken);
      setApiToken("");
      await mutate({ connected: true }, false);
      setToast({
        type: "success",
        title: "Eraser connected",
        message: "Diagrams can now be embedded in this workspace.",
      });
    } catch {
      setToast({
        type: "error",
        title: "Connection failed",
        message: "Check the Eraser team API token and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    setSaving(true);
    try {
      await eraserService.disconnect(workspaceSlug);
      await mutate({ connected: false }, false);
      setToast({ type: "success", title: "Eraser disconnected", message: "Existing diagram links remain in place." });
    } catch {
      setToast({ type: "error", title: "Could not disconnect Eraser", message: "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-b border-subtle bg-surface-1 px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-body-xs-medium">Eraser</h3>
          <p className="text-body-xs-regular text-secondary">
            {data?.connected
              ? "Connected. Workspace members can embed Eraser files and diagrams."
              : "Connect a paid Eraser team's API token to embed current diagrams."}
          </p>
        </div>
        {data?.connected && (
          <Button
            render={<button />}
            variant="danger"
            size="sm"
            stretch="auto"
            onClick={disconnect}
            disabled={saving}
            loading={saving}
            label="Disconnect"
          />
        )}
      </div>
      {data && !data.connected && (
        <form
          className="mt-4 flex max-w-xl items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void connect();
          }}
        >
          <label className="flex-1 text-body-xs-medium">
            Eraser team API token
            <input
              type="password"
              autoComplete="off"
              value={apiToken}
              onChange={(event) => setApiToken(event.target.value)}
              className="mt-1 w-full rounded border border-subtle bg-surface-1 px-3 py-2 text-body-xs-regular"
            />
          </label>
          <Button
            render={<button type="submit" />}
            variant="primary"
            size="sm"
            stretch="auto"
            disabled={!apiToken.trim() || saving}
            loading={saving}
            label="Connect"
          />
        </form>
      )}
    </div>
  );
}
