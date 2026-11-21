/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import type { ComponentType } from "react";
import { observer } from "mobx-react";
import {
  ArrowNarrowRightOutline,
  FullScreenPeekOutline,
  LinkOutline,
  ModalPeekOutline,
  SidePeekOutline,
} from "@makeplane/propel/icons";
// plane imports
import { Select } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import useClipboardWritePermission from "@/hooks/use-clipboard-write-permission";
// types
import type { IIssue, IPeekMode } from "@/types/issue";

type Props = {
  handleClose: () => void;
  issueDetails: IIssue | undefined;
};

type TPeekModeOption = {
  key: IPeekMode;
  icon: ComponentType<{ className?: string }>;
  label: string;
};

const PEEK_MODES: TPeekModeOption[] = [
  { key: "side", icon: SidePeekOutline, label: "Side Peek" },
  {
    key: "modal",
    icon: ModalPeekOutline,
    label: "Modal",
  },
  {
    key: "full",
    icon: FullScreenPeekOutline,
    label: "Full Screen",
  },
];

export const PeekOverviewHeader = observer(function PeekOverviewHeader(props: Props) {
  const { handleClose } = props;
  // plane hooks
  const { t } = useTranslation();

  const { peekMode, setPeekMode } = useIssueDetails();
  const isClipboardWriteAllowed = useClipboardWritePermission();

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToast({
        type: "success",
        title: "Link copied!",
        message: "Work item link copied to clipboard.",
      });
    });
  };

  const selectedPeekMode = PEEK_MODES.find((m) => m.key === peekMode) ?? null;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {peekMode === "side" && (
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              aria-label={t("close")}
              icon={<Icon icon={ArrowNarrowRightOutline} />}
            />
          )}
          <Select<TPeekModeOption>
            getValues={() => PEEK_MODES}
            value={selectedPeekMode}
            onChange={(val) => setPeekMode(val as IPeekMode)}
            showSearch={false}
            pinSelected={false}
            getOptionValue={(mode) => mode.key}
            getOptionLabel={(mode) => mode.label}
            getOptionIcon={(mode) => <mode.icon className="size-4 shrink-0" />}
          >
            <Select.Trigger<TPeekModeOption>
              variant="icon-sm"
              className={cn("text-tertiary hover:text-secondary", { "rotate-45": peekMode === "full" })}
              prependIcon={(modes) => {
                const SelectedIcon = modes[0]?.icon ?? SidePeekOutline;
                return <SelectedIcon className="size-4" />;
              }}
            />
          </Select>
        </div>
        {isClipboardWriteAllowed && (peekMode === "side" || peekMode === "modal") && (
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            aria-label={t("copy_link")}
            icon={<Icon icon={<LinkOutline className="-rotate-45" />} />}
          />
        )}
      </div>
    </>
  );
});
