/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Button } from "@plane/propel/button";
import { GlobeIcon, NewTabIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectView } from "@plane/types";
// ui
import { EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { copyTextToClipboard, getPublishViewLink } from "@plane/utils";
// hooks
import { useProjectView } from "@/hooks/store/use-project-view";
// services
import { ViewService } from "@/services/view.service";

type Props = {
  isOpen: boolean;
  view: IProjectView;
  onClose: () => void;
};

const viewService = new ViewService();

export const PublishViewModal = observer(function PublishViewModal(props: Props) {
  const { isOpen, view, onClose } = props;
  // states
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnPublishing, setIsUnPublishing] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getViewById, fetchViewDetails } = useProjectView();
  // derived values
  const currentView = getViewById(view.id) ?? view;
  const anchor = currentView?.anchor;
  const isViewPublished = !!anchor;
  const publishLink = getPublishViewLink(anchor);

  const handleClose = () => {
    onClose();
  };

  const handlePublishView = async () => {
    if (!workspaceSlug) return;

    setIsPublishing(true);

    await viewService
      .publishView(workspaceSlug.toString(), view.project, view.id, {
        is_comments_enabled: false,
        is_reactions_enabled: false,
        is_votes_enabled: false,
      })
      .then(() => fetchViewDetails(workspaceSlug.toString(), view.project, view.id))
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong while publishing the view.",
        })
      )
      .finally(() => setIsPublishing(false));
  };

  const handleUnPublishView = async () => {
    if (!workspaceSlug) return;

    setIsUnPublishing(true);

    await viewService
      .unPublishView(workspaceSlug.toString(), view.project, view.id)
      .then(() => fetchViewDetails(workspaceSlug.toString(), view.project, view.id))
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong while unpublishing the view.",
        })
      )
      .finally(() => setIsUnPublishing(false));
  };

  const handleCopyLink = () => {
    if (!publishLink) return;

    copyTextToClipboard(publishLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "",
        message: "Published view link copied successfully.",
      })
    );
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXL}>
      <div className="flex items-center justify-between gap-2 p-5">
        <h5 className="text-18 font-medium text-secondary">Publish view</h5>
        {isViewPublished && (
          <Button variant="error-fill" size="lg" onClick={handleUnPublishView} loading={isUnPublishing}>
            {isUnPublishing ? "Unpublishing" : "Unpublish"}
          </Button>
        )}
      </div>

      {/* content */}
      <div className="space-y-4 px-5">
        {isViewPublished && publishLink ? (
          <>
            <div className="flex items-center justify-between gap-2 rounded-md border border-strong py-1.5 pr-1 pl-4">
              <a
                href={publishLink}
                className="truncate text-13 text-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                {publishLink}
              </a>
              <div className="flex flex-shrink-0 items-center gap-1">
                <a
                  href={publishLink}
                  className="grid size-8 place-items-center rounded-sm bg-layer-3 hover:bg-layer-3-hover"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <NewTabIcon className="size-4" />
                </a>
                <button
                  type="button"
                  className="h-8 rounded-sm bg-layer-3 px-3 py-2 text-11 font-medium hover:bg-layer-3-hover"
                  onClick={handleCopyLink}
                >
                  Copy link
                </button>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1 text-13 font-medium text-accent-primary">
              <span className="relative grid size-2.5 place-items-center">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-primary opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-accent-primary" />
              </span>
              This view is now live on web
            </p>
          </>
        ) : (
          <p className="text-13 text-secondary">
            Publish this view to the web. The work items visible on the published page always follow the filters of this
            view.
          </p>
        )}
      </div>

      {/* modal handlers */}
      <div className="relative mt-4 flex items-center justify-between border-t border-subtle px-5 py-4">
        <div className="flex items-center gap-1 text-13 text-placeholder">
          <GlobeIcon className="size-3.5" />
          <div className="text-13">Anyone with the link can access</div>
        </div>
        <div className="relative flex items-center gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          {!isViewPublished && (
            <Button variant="primary" size="lg" onClick={handlePublishView} loading={isPublishing}>
              {isPublishing ? "Publishing" : "Publish"}
            </Button>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
