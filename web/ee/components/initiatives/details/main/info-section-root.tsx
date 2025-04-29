"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { EFileAssetType } from "@plane/types/src/enums";
// components
import { InitiativeIcon } from "@plane/ui";
import { InfoSection } from "@/plane-web/components/common/layout/main/sections/info-root";
import { UpdateStatusPills } from "@/plane-web/components/initiatives/common/update-status";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { useInitiativeUpdates } from "../sidebar/use-updates";
import { InitiativeInfoActionItems } from "./info-section/action-items";
import { InitiativeInfoIndicatorItem } from "./info-section/indicator-item";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeInfoSection: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // store hooks
  const {
    initiative: { getInitiativeById, updateInitiative, getInitiativeAnalyticsById },
  } = useInitiatives();
  const { handleUpdateOperations } = useInitiativeUpdates(workspaceSlug, initiativeId);

  // derived values
  const initiative = initiativeId ? getInitiativeById(initiativeId) : undefined;
  const initiativeAnalytics = initiativeId ? getInitiativeAnalyticsById(initiativeId) : undefined;

  if (!initiative) return <></>;

  return (
    <InfoSection
      workspaceSlug={workspaceSlug}
      itemId={initiativeId}
      titleValue={initiative.name}
      descriptionValue={initiative.description_html ?? undefined}
      onTitleSubmit={async (value) => updateInitiative(workspaceSlug, initiativeId, { name: value })}
      onDescriptionSubmit={async (value) => updateInitiative(workspaceSlug, initiativeId, { description_html: value })}
      indicatorElement={<InitiativeInfoIndicatorItem initiativeId={initiativeId} />}
      actionElement={
        <InitiativeInfoActionItems workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={disabled} />
      }
      fileAssetType={EFileAssetType.INITIATIVE_DESCRIPTION}
      disabled={disabled}
      iconElement={
        <div className="flex-shrink-0 size-11 bg-custom-background-80 rounded-md flex items-center justify-center text-custom-text-300">
          <InitiativeIcon width={24} height={24} />
        </div>
      }
      titleElement={
        <UpdateStatusPills
          handleUpdateOperations={handleUpdateOperations}
          workspaceSlug={workspaceSlug}
          initiativeId={initiativeId}
          analytics={initiativeAnalytics}
        />
      }
    />
  );
});
