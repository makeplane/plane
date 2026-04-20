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

import { ChevronRightIcon, PlusIcon } from "@plane/propel/icons";
import { LoaderCircle } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { useTranslation } from "@plane/i18n";
// utils
import { cn } from "@plane/utils";
// types
import { SECTION_DETAILS } from "../constants";
import type { SectionHeaderProps } from "../types";
import { SidebarSectionHeader } from "./sidebar-section";

/**
 * Component for rendering section header with label, icon and actions
 */
export const SectionHeader = React.memo(function SectionHeader({
  sectionType,
  sectionDetails,
  isCreatingPage,
  canCreatePage,
  handleCreatePage,
  buttonRef,
  onButtonClick,
  isOpen,
}: SectionHeaderProps & { isOpen?: boolean }) {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();

  return (
    <SidebarSectionHeader
      href={`/${workspaceSlug}/wiki/${sectionType}`}
      label={sectionDetails.label === SECTION_DETAILS.public.label ? t("common.general") : sectionDetails.label}
      actions={
        <>
          {canCreatePage && sectionType !== "archived" && sectionType !== "shared" && (
            <button
              className="grid size-5 place-items-center rounded-md hover:bg-layer-transparent-hover"
              onClick={() => {
                handleCreatePage(sectionType);
              }}
            >
              {isCreatingPage === sectionType ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <PlusIcon className="size-3.5" />
              )}
            </button>
          )}
          <button
            ref={buttonRef}
            type="button"
            className="grid size-5 place-items-center rounded-md hover:bg-layer-transparent-hover"
            aria-expanded={isOpen}
            onClick={(e) => {
              e.stopPropagation();
              if (onButtonClick) onButtonClick();
            }}
          >
            <ChevronRightIcon
              className={cn("size-3.5 transform transition-transform duration-300 ease-in-out", {
                "rotate-90": isOpen,
              })}
            />
          </button>
        </>
      }
    />
  );
});
SectionHeader.displayName = "SectionHeader";
