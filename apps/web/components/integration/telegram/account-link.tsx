/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@makeplane/propel/components/button";
import { TelegramIntegrationService } from "@/services/integrations/telegram.service";

const service = new TelegramIntegrationService();

export function TelegramAccountLink({ workspaceSlug }: { workspaceSlug: string }) {
  const { data: link, mutate } = useSWR(`telegram-link-${workspaceSlug}`, () => service.getLinkStatus(workspaceSlug));
  const [linkUrl, setLinkUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!link?.available) return null;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch {
      setError("Could not update your Telegram link. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-8 border-t border-subtle py-6">
      <h3 className="text-body-sm-medium">Telegram account</h3>
      <p className="mt-1 text-body-xs-regular text-secondary">
        Link your account to create work items in Telegram using your Plane project permissions.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {link.linked ? (
          <>
            <span className="text-body-xs-regular">Linked to Telegram user {link.telegram_user_id}</span>
            <Button
              variant="danger"
              size="sm"
              stretch="auto"
              loading={busy}
              onClick={() =>
                run(async () => {
                  await service.unlink(workspaceSlug);
                  setLinkUrl("");
                  await mutate();
                })
              }
              label="Unlink"
            />
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            loading={busy}
            onClick={() => run(async () => setLinkUrl(await service.createLink(workspaceSlug)))}
            label="Link Telegram"
          />
        )}
        {linkUrl && !link.linked && (
          <a className="text-body-xs-medium text-primary" href={linkUrl} target="_blank" rel="noreferrer">
            Open @{link.bot_username} to finish linking
          </a>
        )}
        <Button variant="secondary" size="sm" stretch="auto" onClick={() => mutate()} label="Refresh status" />
      </div>
      {error && <p className="mt-2 text-body-xs-regular text-danger-primary">{error}</p>}
    </section>
  );
}
