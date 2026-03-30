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
import { observer } from "mobx-react";
import { EpicIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { WorkspaceEpicsListModal } from "@/components/initiatives/details/main/collapsible-section/epics/workspace-epic-modal";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiative } from "@/types/initiative";

type Props = {
  initiative: TInitiative;
  workspaceSlug: string;
  onEpicsUpdated: (epicIds: string[]) => Promise<void>;
};

export const InitiativeEpicsField = observer(function InitiativeEpicsField(props: Props) {
  const { initiative, workspaceSlug, onEpicsUpdated } = props;
  const { isMobile } = usePlatformOS();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    initiative: {
      scope: {
        epics: { fetchInitiativeEpicsDetail },
      },
    },
  } = useInitiatives();

  const epicIds = initiative.epic_ids ?? [];
  const epicButtonLabel = epicIds.length === 0 ? "Epic" : epicIds.length === 1 ? "1 epic" : `${epicIds.length} epics`;
  const epicTooltipContent =
    epicIds.length === 0 ? "Epic" : epicIds.length === 1 ? "1 epic" : `${epicIds.length} epics`;

  const handleOpenModal = async () => {
    await fetchInitiativeEpicsDetail(workspaceSlug, initiative.id);
    setIsModalOpen(true);
  };

  const epicModal = isModalOpen ? (
    <WorkspaceEpicsListModal
      workspaceSlug={workspaceSlug}
      isOpen
      handleClose={() => setIsModalOpen(false)}
      searchParams={{}}
      selectedEpicIds={epicIds}
      handleOnSubmit={async (data) => {
        await onEpicsUpdated(data.map((epic) => epic.id));
      }}
    />
  ) : null;

  return (
    <>
      <div className="h-full max-w-40 truncate">
        <Tooltip
          tooltipHeading="Epic"
          tooltipContent={epicTooltipContent}
          disabled={false}
          isMobile={isMobile}
          renderByDefault
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-full w-full max-w-full justify-start gap-1.5 border-[0.5px] border-strong",
              isModalOpen && "bg-layer-transparent-active"
            )}
            onClick={() => void handleOpenModal()}
          >
            <EpicIcon className="h-4 w-4 shrink-0 text-tertiary" />
            <span className="min-w-0 grow truncate">{epicButtonLabel}</span>
          </Button>
        </Tooltip>
      </div>
      {epicModal}
    </>
  );
});
