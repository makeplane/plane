"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { EFileAssetType } from "@plane/types/src/enums";
// components
import { InfoSection } from "@/plane-web/components/common/layout/main/sections/info-root";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
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
    initiative: { getInitiativeById, updateInitiative },
  } = useInitiatives();

  // derived values
  const initiative = initiativeId ? getInitiativeById(initiativeId) : undefined;

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
    />
  );
});
