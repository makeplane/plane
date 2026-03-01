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

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { EmojiIconPickerTypes, EmojiPicker, Logo } from "@plane/propel/emoji-icon-picker";
import { InitiativeIcon } from "@plane/propel/icons";
import { EFileAssetType } from "@plane/types";
// plane web components
import { InfoSection } from "@/components/common/layout/main/sections/info-root";
import { UpdateStatusPills } from "@/components/initiatives/common/update-status";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { useInitiativeUpdates } from "../sidebar/use-updates";
import { InitiativeInfoActionItems } from "./info-section/action-items";
import { InitiativeInfoIndicatorItem } from "./info-section/indicator-item";

type Props = {
  editorRef?: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeInfoSection = observer(function InitiativeInfoSection(props: Props) {
  const { editorRef, workspaceSlug, initiativeId, disabled = false } = props;
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
      editorRef={editorRef}
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
        <div className="flex-shrink-0 size-11 bg-layer-3 hover:bg-layer-3-hover rounded-md flex items-center justify-center text-tertiary">
          <EmojiPicker
            iconType="lucide"
            isOpen={isOpen}
            handleToggle={(val: boolean) => setIsOpen(val)}
            className="flex items-center justify-center flex-shrink0"
            buttonClassName="flex items-center justify-center"
            label={
              <>
                {logoValue?.in_use ? (
                  <Logo logo={logoValue} size={24} type="lucide" />
                ) : (
                  <InitiativeIcon className="h-6 w-6 flex-shrink-0 text-tertiary" />
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
