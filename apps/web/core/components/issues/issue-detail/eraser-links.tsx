/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { EraserService } from "@/services/integrations/eraser.service";

const eraserService = new EraserService();

function isEraserFile(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.host === "app.eraser.io" &&
      /^\/workspace\/[A-Za-z0-9_-]+$/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

function EraserLink({ workspaceSlug, url, title }: { workspaceSlug: string; url: string; title: string }) {
  const { data } = useSWR(["eraser-metadata", workspaceSlug, url], () => eraserService.getMetadata(workspaceSlug, url));

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block truncate py-1 text-body-xs-regular text-primary"
    >
      {data?.title || title || url}
    </a>
  );
}

export const EraserIssueLinks = observer(function EraserIssueLinks({
  workspaceSlug,
  issueId,
  isEditable,
}: {
  workspaceSlug: string;
  issueId: string;
  isEditable: boolean;
}) {
  const {
    link: { getLinksByIssueId, getLinkById },
    toggleIssueLinkModal,
  } = useIssueDetail();
  const links = (getLinksByIssueId(issueId) ?? [])
    .map((id) => getLinkById(id))
    .filter((link) => link && isEraserFile(link.url));

  if (links.length === 0 && !isEditable) return null;

  return (
    <section className="mt-6 border-t border-subtle pt-4">
      <div className="flex items-center justify-between">
        <h5 className="text-body-xs-medium">Eraser diagrams</h5>
        {isEditable && (
          <button type="button" onClick={() => toggleIssueLinkModal(true)} className="text-body-xs-medium text-primary">
            Add link
          </button>
        )}
      </div>
      {links.length ? (
        <div className="mt-2">
          {links.map(
            (link) =>
              link && <EraserLink key={link.id} workspaceSlug={workspaceSlug} url={link.url} title={link.title} />
          )}
        </div>
      ) : (
        <p className="mt-2 text-body-xs-regular text-secondary">No Eraser diagrams linked.</p>
      )}
    </section>
  );
});
