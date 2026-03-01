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
import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TInitiativeStates } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import useKeypress from "@/hooks/use-keypress";
import usePeekOverviewOutsideClickDetector from "@/hooks/use-peek-overview-outside-click";
// plane web hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import { InitiativeMainContentRoot } from "../details/main/root";
import { InitiativeSidebarRoot } from "../details/sidebar/root";
import { InitiativePeekOverviewError } from "./error";
import type { TPeekModes } from "./header";
import { InitiativePeekOverviewHeader } from "./header";
import { InitiativePeekOverviewLoader } from "./loader";

interface IInitiativeView {
  workspaceSlug: string;
  initiativeId: string;
  isLoading?: boolean;
  isError?: boolean;
  disabled?: boolean;
  handleInitiativeStateUpdate: (stateId: TInitiativeStates) => void;
  handleInitiativeLabelUpdate: (labelIds: string[]) => void;
}

export const InitiativeView = observer(function InitiativeView(props: IInitiativeView) {
  const {
    workspaceSlug,
    initiativeId,
    isLoading,
    isError,
    disabled = false,
    handleInitiativeStateUpdate,
    handleInitiativeLabelUpdate,
  } = props;
  // states
  const [peekMode, setPeekMode] = useState<TPeekModes>("side-peek");
  // ref
  const initiativePeekOverviewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const {
    initiative: { isAnyModalOpen, setPeekInitiative, getInitiativeById },
  } = useInitiatives();

  const initiative = getInitiativeById(initiativeId);

  // remove peek id
  const removeRoutePeekId = () => {
    setPeekInitiative(undefined);
  };

  usePeekOverviewOutsideClickDetector(
    initiativePeekOverviewRef,
    () => {
      const isAnyDropbarOpen = editorRef.current?.isAnyDropbarOpen();
      // Don't close peek overview if any modal is open or if any dropbar is open
      if (!isAnyModalOpen && !isAnyDropbarOpen) {
        removeRoutePeekId();
      }
    },
    initiativeId
  );

  const handleKeyDown = () => {
    const dropdownElement = document.activeElement?.tagName === "INPUT";
    const isAnyDropbarOpen = editorRef.current?.isAnyDropbarOpen();
    // Don't close peek overview if any modal is open, if input is focused, or if any dropbar is open
    if (!dropdownElement && !isAnyModalOpen && !isAnyDropbarOpen) {
      removeRoutePeekId();
      const initiativeElement = document.getElementById(`initiative-${initiativeId}`);
      if (initiativeElement) initiativeElement?.focus();
    }
  };

  useKeypress("Escape", handleKeyDown);

  const peekOverviewInitiativeClassName = cn(
    "absolute z-[25] flex flex-col overflow-hidden rounded border border-subtle bg-surface-1 transition-all duration-300",
    {
      "top-0 bottom-0 right-0 w-full md:w-[80%] lg:w-[75%] border-0 border-l": peekMode === "side-peek",
      "size-5/6 top-[8.33%] left-[8.33%]": peekMode === "modal",
      "inset-0 m-4 absolute": peekMode === "full-screen",
    }
  );

  const portalContainer = document.getElementById("full-screen-portal") as HTMLElement;

  const content = (
    <div className="w-full !text-14">
      {initiativeId && (
        <div
          ref={initiativePeekOverviewRef}
          className={peekOverviewInitiativeClassName}
          style={{
            boxShadow:
              "0px 4px 8px 0px rgba(0, 0, 0, 0.12), 0px 6px 12px 0px rgba(16, 24, 40, 0.12), 0px 1px 16px 0px rgba(16, 24, 40, 0.12)",
          }}
        >
          {isError ? (
            <div className="relative h-screen w-full overflow-hidden">
              <InitiativePeekOverviewError removeRoutePeekId={removeRoutePeekId} />
            </div>
          ) : (
            isLoading && <InitiativePeekOverviewLoader removeRoutePeekId={removeRoutePeekId} />
          )}
          {!isLoading && !isError && initiative && (
            <>
              {/* header */}
              <InitiativePeekOverviewHeader
                peekMode={peekMode}
                setPeekMode={(value) => setPeekMode(value)}
                removeRoutePeekId={removeRoutePeekId}
                workspaceSlug={workspaceSlug}
                initiativeId={initiativeId}
                disabled={disabled}
              />
              {/* content - reuse the exact same detail layout */}
              <div className="relative flex h-full w-full overflow-hidden">
                <div className="h-full w-full overflow-y-auto">
                  <InitiativeMainContentRoot
                    editorRef={editorRef}
                    workspaceSlug={workspaceSlug}
                    initiativeId={initiativeId}
                    disabled={disabled}
                  />
                </div>
                <InitiativeSidebarRoot
                  workspaceSlug={workspaceSlug}
                  initiativeId={initiativeId}
                  disabled={disabled}
                  handleInitiativeStateUpdate={handleInitiativeStateUpdate}
                  handleInitiativeLabelUpdate={handleInitiativeLabelUpdate}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  return <>{portalContainer ? createPortal(content, portalContainer) : content}</>;
});
