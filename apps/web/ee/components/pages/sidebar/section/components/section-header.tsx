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

import { CollapsibleTrigger } from "@plane/propel/collapsible";
import { ChevronRightIcon, PlusIcon } from "@plane/propel/icons";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
// utils
import { cn } from "@plane/utils";
// types
import { SECTION_DETAILS } from "../constants";
import type { SectionHeaderProps } from "../types";

/**
 * Component for rendering section header with label, icon and actions
 */
export const SectionHeader = React.memo(function SectionHeader({
  sectionType,
  sectionDetails,
  isCreatingPage,
  handleCreatePage,
  buttonRef,
  onButtonClick,
  isOpen,
}: SectionHeaderProps & { isOpen?: boolean }) {
  const { workspaceSlug } = useParams();

  return (
    <div
      className={cn(
        "group w-full flex items-center justify-between px-2 py-0.5 rounded text-placeholder hover:bg-surface-2"
      )}
    >
      <Link
        href={`/${workspaceSlug}/wiki/${sectionType}`}
        className={cn("flex-grow text-13 font-semibold text-placeholder")}
      >
        {sectionDetails.label === SECTION_DETAILS.public.label ? "Workspace" : sectionDetails.label}
      </Link>

      <div className="flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
        {sectionType !== "archived" && sectionType !== "shared" && (
          <button
            className="grid place-items-center hover:bg-layer-transparent-hover p-0.5 rounded"
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
        <CollapsibleTrigger
          ref={buttonRef}
          type="button"
          className="grid place-items-center hover:bg-layer-transparent-hover p-0.5 rounded"
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
        </CollapsibleTrigger>
      </div>
    </div>
  );
});
SectionHeader.displayName = "SectionHeader";
