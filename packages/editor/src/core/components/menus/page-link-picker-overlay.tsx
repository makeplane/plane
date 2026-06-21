/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useRef } from "react";
import { FloatingOverlay } from "@floating-ui/react";
import { useOutsideClickDetector } from "@plane/hooks";
import { setLinkEditor } from "@/helpers/editor-commands";
import type { TPageLinkSearchResult } from "@/types";
import { PageLinkSearchPanel } from "./page-link-search-panel";

export type PageLinkPickerOverlayProps = {
  editor: Editor;
  searchPages: (query: string) => Promise<TPageLinkSearchResult[]>;
  buildPageLink: (pageId: string, projectId?: string) => string;
  onClose: () => void;
};

export function PageLinkPickerOverlay(props: PageLinkPickerOverlayProps) {
  const { editor, searchPages, buildPageLink, onClose } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(containerRef, onClose);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onClose]);

  const handlePageSelect = useCallback(
    (page: TPageLinkSearchResult) => {
      const href = buildPageLink(page.id, page.project_id);
      setLinkEditor(editor, href, page.name, { isInternal: true });
      onClose();
    },
    [buildPageLink, editor, onClose]
  );

  return (
    <>
      <FloatingOverlay
        style={{
          zIndex: 99,
        }}
        lockScroll
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-label="Search pages"
        className="relative w-72 rounded-md border-[0.5px] border-strong bg-surface-1 shadow-raised-200"
        style={{
          zIndex: 100,
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <PageLinkSearchPanel searchPages={searchPages} onPageSelect={handlePageSelect} focusOnMount />
      </div>
    </>
  );
}
