"use client";

import React, { FC, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EmojiPicker } from "@plane/propel/emoji-icon-picker";
import { EFileAssetType } from "@plane/types";
import { EmojiIconPickerTypes, InitiativeIcon } from "@plane/ui";
// plane web components
import { Logo } from "@/components/common/logo";
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
  toggleProjectModal: (value?: boolean) => void;
  toggleEpicModal: (value?: boolean) => void;
};

export const InitiativeInfoSection: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false, toggleProjectModal, toggleEpicModal } = props;
  const [isOpen, setIsOpen] = useState(false);
  // store hooks
  const {
    initiative: { getInitiativeById, updateInitiative, getInitiativeAnalyticsById },
  } = useInitiatives();
  const { handleUpdateOperations } = useInitiativeUpdates(workspaceSlug, initiativeId);

  // derived values
  const initiative = initiativeId ? getInitiativeById(initiativeId) : undefined;
  const initiativeAnalytics = initiativeId ? getInitiativeAnalyticsById(initiativeId) : undefined;

  if (!initiative) return <></>;

  const logoValue = initiative?.logo_props;

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
        <InitiativeInfoActionItems
          workspaceSlug={workspaceSlug}
          initiativeId={initiativeId}
          disabled={disabled}
          toggleProjectModal={toggleProjectModal}
          toggleEpicModal={toggleEpicModal}
        />
      }
      fileAssetType={EFileAssetType.INITIATIVE_DESCRIPTION}
      disabled={disabled}
      iconElement={
        <div className="flex-shrink-0 size-11 bg-custom-background-80 rounded-md flex items-center justify-center text-custom-text-300">
          <EmojiPicker
            iconType="lucide"
            isOpen={isOpen}
            handleToggle={(val: boolean) => setIsOpen(val)}
            className="flex items-center justify-center flex-shrink0"
            buttonClassName="flex items-center justify-center"
            label={
              <>
                {logoValue?.in_use ? (
                  <Logo logo={logoValue} size={18} type="lucide" />
                ) : (
                  <InitiativeIcon className="h-4 w-4 flex-shrink-0 text-custom-text-300" />
                )}
              </>
            }
            onChange={(val: any) => {
              let logoValue = {};

              if (val?.type === "emoji")
                logoValue = {
                  value: val.value,
                };
              else if (val?.type === "icon") logoValue = val.value;

              updateInitiative(workspaceSlug, initiativeId, {
                logo_props: {
                  in_use: val?.type,
                  [val?.type]: logoValue,
                },
              });
              setIsOpen(false);
            }}
            defaultIconColor={logoValue?.in_use && logoValue?.in_use === "icon" ? logoValue?.icon?.color : undefined}
            defaultOpen={
              logoValue?.in_use && logoValue?.in_use === "emoji"
                ? EmojiIconPickerTypes.EMOJI
                : EmojiIconPickerTypes.ICON
            }
          />
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
