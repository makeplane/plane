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
import { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { MoveDiagonal, MoveRight } from "lucide-react";
import { CenterPanelIcon, FullScreenPanelIcon, SidePanelIcon, CopyLinkIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomSelect } from "@plane/ui";
import { copyUrlToClipboard } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { InitiativeOverviewHeaderActions } from "../header/actions/overview-header-actions";

export type TPeekModes = "side-peek" | "modal" | "full-screen";

const PEEK_OPTIONS: { key: TPeekModes; icon: any; i18n_title: string }[] = [
  {
    key: "side-peek",
    icon: SidePanelIcon,
    i18n_title: "common.side_peek",
  },
  {
    key: "modal",
    icon: CenterPanelIcon,
    i18n_title: "common.modal",
  },
  {
    key: "full-screen",
    icon: FullScreenPanelIcon,
    i18n_title: "common.full_screen",
  },
];

export type InitiativePeekOverviewHeaderProps = {
  peekMode: TPeekModes;
  setPeekMode: (value: TPeekModes) => void;
  removeRoutePeekId: () => void;
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
};

export const InitiativePeekOverviewHeader = observer(function InitiativePeekOverviewHeader(
  props: InitiativePeekOverviewHeaderProps
) {
  const { peekMode, setPeekMode, workspaceSlug, initiativeId, removeRoutePeekId } = props;
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  // store hooks
  const {
    initiative: { setPeekInitiative, getIsInitiativePeeked },
  } = useInitiatives();
  // hooks
  const { isMobile } = usePlatformOS();

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(`${workspaceSlug}/initiatives/${initiativeId}`).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("initiatives.toast.link_copied"),
      });
    });
  };

  const redirectToInitiative = () => {
    setPeekInitiative(undefined);
  };

  const isInitiativePeeked = getIsInitiativePeeked(initiativeId);

  return (
    <div
      ref={parentRef}
      className="relative flex h-12 w-full items-center justify-between gap-x-2 gap-y-4 border-b border-subtle p-4 transition-all bg-surface-1 px-6 py-3"
    >
      <div className="flex flex-wrap items-center gap-3.5">
        <div className="flex items-center gap-x-2">
          <Tooltip tooltipContent="Close the peek view" isMobile={isMobile}>
            <button onClick={removeRoutePeekId}>
              <MoveRight className="h-4 w-4 text-tertiary hover:text-secondary" />
            </button>
          </Tooltip>
        </div>
        {isInitiativePeeked && (
          <Link href={`/${workspaceSlug}/initiatives/${initiativeId}`} onClick={redirectToInitiative}>
            <Tooltip tooltipContent={t("common.open_in_full_screen", { page: "Initiative" })} isMobile={isMobile}>
              <MoveDiagonal className="h-4 w-4 text-tertiary hover:text-secondary" />
            </Tooltip>
          </Link>
        )}
        <CustomSelect
          value={peekMode}
          onChange={(val: TPeekModes) => setPeekMode(val)}
          customButton={
            <button type="button" className="">
              {PEEK_OPTIONS.find((option) => option.key === peekMode)?.icon({
                className: "h-4 w-4 text-tertiary hover:text-secondary flex-shrink-0",
              })}
            </button>
          }
        >
          <>
            {PEEK_OPTIONS.map((option) => (
              <CustomSelect.Option key={option.key} value={option.key}>
                <div className="flex items-center gap-1.5">
                  {<option.icon className="h-4 w-4 flex-shrink-0" />}
                  {t(option.i18n_title)}
                </div>
              </CustomSelect.Option>
            ))}
          </>
        </CustomSelect>
      </div>
      <div className="flex items-center gap-x-3.5">
        <InitiativeOverviewHeaderActions />
        <Tooltip tooltipContent="Copy link" isMobile={isMobile}>
          <IconButton variant="secondary" size="lg" onClick={handleCopyText} icon={CopyLinkIcon} />
        </Tooltip>
      </div>
    </div>
  );
});
