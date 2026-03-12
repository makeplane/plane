/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { MessageSquarePlus } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { useUser } from "@/hooks/store/user";
import { useOpinion } from "@/plane-web/hooks/store/use-opinion";
import { OpinionDisplay } from "./opinion-display";
import { OpinionPopover } from "./opinion-popover";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityId: string;
  actorId: string;
};

export const OpinionButton = observer(function OpinionButton(props: Props) {
  const { workspaceSlug, projectId, issueId, activityId, actorId } = props;
  const { t } = useTranslation();
  const store = useOpinion();
  const { data: currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const opinion = store.getOpinionForActivity(activityId);
  const isActor = currentUser?.id === actorId;

  // Non-actor: show read-only badge if opinion exists
  if (!isActor) {
    if (!opinion) return null;
    return <OpinionDisplay sentiment={opinion.sentiment} content={opinion.content} />;
  }

  return (
    <div className="relative flex-shrink-0">
      {opinion ? (
        <button type="button" onClick={() => setIsOpen(true)} className="flex-shrink-0">
          <OpinionDisplay sentiment={opinion.sentiment} content={opinion.content} />
        </button>
      ) : (
        <Tooltip tooltipContent={t("opinion.add_opinion")}>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs",
              "text-color-tertiary hover:text-color-secondary hover:bg-surface-2",
              "border border-transparent hover:border-color-subtle"
            )}
          >
            <MessageSquarePlus className="h-3 w-3" />
            {t("opinion.your_opinion")}
          </button>
        </Tooltip>
      )}

      {isOpen && (
        <OpinionPopover
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          activityId={activityId}
          existingOpinion={opinion}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
});
