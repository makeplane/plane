"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// Plane
import { EpicIcon, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane-web
import { SectionEmptyState } from "@/plane-web/components/common";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { EpicListItem } from "./epic-list-item/root";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  toggleEpicModal: (value: boolean) => void;
  disabled?: boolean;
};

export const InitiativeEpicsCollapsibleContent: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, toggleEpicModal, disabled = false } = props;
  // store hooks
  const {
    initiative: { getInitiativeEpicsById },
  } = useInitiatives();

  // derived values
  const initiativeEpicIds = getInitiativeEpicsById(initiativeId) ?? [];

  return (
    <div className="mt-3">
      {initiativeEpicIds.length > 0 ? (
        initiativeEpicIds.map((epicId) => (
          <EpicListItem
            key={epicId}
            workspaceSlug={workspaceSlug}
            epicId={epicId}
            initiativeId={initiativeId}
            disabled={disabled}
          />
        ))
      ) : (
        <SectionEmptyState
          heading="No epics yet"
          subHeading="Start adding epics to manage and track the progress."
          icon={<EpicIcon className="size-4" />}
          actionElement={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleEpicModal(true);
              }}
              disabled={disabled}
            >
              <span className={cn(getButtonStyling("accent-primary", "sm"), "font-medium px-2 py-1")}>Add issues</span>
            </button>
          }
        />
      )}
    </div>
  );
});
