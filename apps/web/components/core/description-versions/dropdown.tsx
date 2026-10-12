/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Menu, MenuContent, MenuGroup, MenuLabel, MenuTrigger } from "@makeplane/propel/components/menu";
import { ChevronDownOutline, HistoryOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { TDescriptionVersion } from "@plane/types";
import { calculateTimeAgo, cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { DescriptionVersionsDropdownItem } from "./dropdown-item";
import type { TDescriptionVersionEntityInformation } from "./root";

type Props = {
  disabled: boolean;
  entityInformation: TDescriptionVersionEntityInformation;
  onVersionClick: (versionId: string) => void;
  versions: TDescriptionVersion[] | undefined;
};

export const DescriptionVersionsDropdown = observer(function DescriptionVersionsDropdown(props: Props) {
  const { disabled, entityInformation, onVersionClick, versions } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const latestVersion = versions?.[0];
  const lastUpdatedAt = latestVersion?.created_at ?? entityInformation.createdAt;
  const lastUpdatedByUserDisplayName = latestVersion?.owned_by
    ? getUserDetails(latestVersion?.owned_by)?.display_name
    : entityInformation.createdByDisplayName;
  // translation
  const { t } = useTranslation();

  return (
    <Menu>
      <MenuTrigger
        disabled={disabled}
        render={
          <button
            type="button"
            className={cn(
              "flex items-center justify-between gap-1 rounded-md px-2.5 py-1 text-11 whitespace-nowrap text-secondary duration-300 data-[popup-open]:text-primary",
              disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-layer-transparent-hover"
            )}
          />
        }
      >
        <div className="flex items-center gap-1 text-tertiary">
          <span className="grid size-4 flex-shrink-0 place-items-center">
            <HistoryOutline className="size-3.5" />
          </span>
          <p className="text-11">
            {t("description_versions.last_edited_by")}{" "}
            <span className="font-medium">{lastUpdatedByUserDisplayName ?? t("common.deactivated_user")}</span>{" "}
            {calculateTimeAgo(lastUpdatedAt)}
          </p>
        </div>
        {!disabled && <ChevronDownOutline className="size-3.5" />}
      </MenuTrigger>
      <MenuContent side="bottom" align="end">
        <MenuGroup>
          <MenuLabel>{t("description_versions.previously_edited_by")}</MenuLabel>
          {versions?.map((version) => (
            <DescriptionVersionsDropdownItem key={version.id} onClick={onVersionClick} version={version} />
          ))}
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
});
