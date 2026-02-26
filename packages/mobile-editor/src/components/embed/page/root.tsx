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

import { FileText } from "lucide-react";
import { observer } from "mobx-react";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
// ui
import { ArchiveIcon, EmptyPageIcon, RestrictedPageIcon } from "@plane/propel/icons";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { Loader } from "@plane/ui";
// utils
import { cn } from "@plane/utils";
// components
import { Badge } from "@/components/common";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
// helpers
import { getPageName, callNative } from "@/helpers";
// store
import { usePages } from "@/hooks/store";

type Props = {
  pageId: string;
  workspaceSlug: string;
  projectId?: string;
  currentUserId: string;
  isNestedPagesEnabled: boolean;
  onPageDrop?: (droppedPageId: string) => void;
};

type PageDisplayState = {
  logo?: React.ReactNode;
  badge?: React.ReactNode;
  text: string;
};

export const PageEmbedCardRoot: React.FC<Props> = observer((props) => {
  const { workspaceSlug, pageId, projectId, isNestedPagesEnabled } = props;
  // store hooks
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { getSubPageById, fetchPageDetails } = usePages();
  // computed values
  const page = getSubPageById(pageId);

  // Touch handling state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const [displayState, setDisplayState] = useState<PageDisplayState>({
    text: getPageName(page?.name),
  });

  const canCurrentUserAccessPage = useMemo(() => page?.canCurrentUserAccessPage(), [page]);

  const fetchPageEmbed = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetchPageDetails({
        workspaceSlug: workspaceSlug,
        pageId: pageId,
        projectId: projectId,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug, pageId, projectId, fetchPageDetails]);

  useEffect(() => {
    if (!pageId || !workspaceSlug) return;
    if (!page) void fetchPageEmbed();
  }, [pageId, projectId, workspaceSlug, page, fetchPageEmbed]);

  useEffect(() => {
    const getDisplayState = (): PageDisplayState => {
      if (!isNestedPagesEnabled) {
        return {
          text: "Upgrade your plan to view this nested page",
          logo: <RestrictedPageIcon className="size-4" />,
        };
      } else if (page?.archivedAt && canCurrentUserAccessPage) {
        return {
          text: getPageName(page?.name),
          badge: <Badge text="Archived" icon={<ArchiveIcon className="size-2.5 text-custom-text-300" />} />,
        };
      } else if (!canCurrentUserAccessPage && page?.id) {
        return {
          logo: <RestrictedPageIcon className="size-4" />,
          text: "Restricted Page",
        };
      }
      return {
        text: getPageName(page?.name),
      };
    };

    setDisplayState(getDisplayState());
  }, [
    page?.name,
    page?.archivedAt,
    canCurrentUserAccessPage,
    page?.id,
    page?.isDescriptionEmpty,
    isNestedPagesEnabled,
  ]);

  // Function to determine the appropriate logo to display
  const pageEmbedLogo = useMemo(() => {
    let logo;
    if (displayState.logo) {
      logo = displayState.logo;
    } else if (page?.logoProps?.in_use) {
      logo = <Logo logo={page?.logoProps} size={16} type="lucide" />;
    } else if (!page?.isDescriptionEmpty) {
      logo = <FileText size={16} type="lucide" />;
    } else {
      logo = <EmptyPageIcon className="size-4" />;
    }
    return logo;
  }, [displayState, page?.logoProps, page?.isDescriptionEmpty]);

  // Handle the actual click/tap action
  const handlePageEmbedClick = useCallback(() => {
    if (!isNestedPagesEnabled) return;
    void callNative(
      CallbackHandlerStrings.onPageEmbedClick,
      JSON.stringify({
        pageId: pageId,
        projectId: projectId,
        pageTitle: page?.name,
      })
    );
  }, [pageId, projectId, page?.name, isNestedPagesEnabled]);

  if (page?.name == null) {
    return (
      <Loader className="not-prose relative h-10 page-embed cursor-pointer rounded-md py-2 px-2 my-1.5 transition-colors flex items-center gap-1.5 !no-underline hover:bg-custom-background-80 w-full bg-custom-background-80">
        <Loader.Item className="h-9" />
      </Loader>
    );
  }

  if (!page && isLoading)
    return (
      <div className="rounded-md my-4">
        <Loader>
          <Loader.Item height="30px" />
          <div className="mt-3 space-y-2">
            <Loader.Item height="15px" width="70%" />
          </div>
        </Loader>
      </div>
    );

  if (!page && !isLoading)
    return (
      <div className="flex items-center justify-start gap-2 py-3 px-2 rounded-lg text-danger-primary bg-danger-subtle border border-dashed border-danger-strong/20 transition-all duration-200 ease-in-out cursor-default">
        Error loading page
      </div>
    );

  return (
    <div
      className={cn(
        "not-prose relative page-embed cursor-pointer rounded-md py-2 px-2 my-1.5 transition-colors flex items-center gap-1.5 !no-underline bg-custom-background-90"
      )}
      onTouchStart={(event) => {
        // Record touch start position and time
        const touch = event.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
        event.preventDefault();
        event.stopPropagation();
      }}
      onTouchEnd={(event) => {
        // Check if this is a valid tap
        if (!touchStartRef.current) return;

        const touch = event.changedTouches[0];
        const timeDiff = Date.now() - touchStartRef.current.time;
        const distance = Math.sqrt(
          Math.pow(touch.clientX - touchStartRef.current.x, 2) + Math.pow(touch.clientY - touchStartRef.current.y, 2)
        );

        // Valid tap: quick touch (< 500ms) and minimal movement (< 10px)
        if (timeDiff < 500 && distance < 10) {
          event.preventDefault();
          event.stopPropagation();
          handlePageEmbedClick();
        }

        // Reset touch state
        touchStartRef.current = null;
      }}
      onTouchMove={(event) => {
        // If user moves finger too much, cancel the tap
        if (!touchStartRef.current) return;

        const touch = event.touches[0];
        const distance = Math.sqrt(
          Math.pow(touch.clientX - touchStartRef.current.x, 2) + Math.pow(touch.clientY - touchStartRef.current.y, 2)
        );

        // If moved more than 10px, cancel the tap
        if (distance > 10) {
          touchStartRef.current = null;
        }
      }}
    >
      <div className="flex-shrink-0">{pageEmbedLogo}</div>
      <div className="flex items-center gap-3 truncate">
        <p className="not-prose text-base font-medium break truncate underline decoration-custom-text-300 underline-offset-4">
          {displayState.text}
        </p>
        <div className="flex-shrink-0">{displayState?.badge}</div>
      </div>
    </div>
  );
});
