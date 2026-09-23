/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseGroup,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { CloseOutline, SearchOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
// local imports
import { ShortcutRenderer } from "../renderer/shortcut";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ShortcutsModal(props: Props) {
  const { isOpen, onClose } = props;
  // states
  const [query, setQuery] = useState("");
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { commandRegistry } = usePowerK();

  // Get all commands from registry
  const allCommandsWithShortcuts = commandRegistry.getAllCommandsWithShortcuts();

  const handleClose = () => {
    onClose();
    setQuery("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Legacy headless `Dialog onClose={handleClose}`: Escape and outside press both close.
        if (!open) handleClose();
      }}
    >
      {/* legacy panel was `sm:w-[28rem]` (448px) -> `xs` (480px); the fixed `61vh` height lives on
          the wrapper so the sheet does not shrink while filtering. */}
      <DialogContent size="xs">
        <DialogCloseGroup>
          <IconButton
            variant="ghost"
            size="xs"
            aria-label={t("close")}
            icon={<Icon icon={CloseOutline} />}
            render={<DialogClose />}
          />
        </DialogCloseGroup>
        <div className="flex h-[61vh] min-h-0 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>{t("keyboard_shortcuts")}</DialogTitle>
              </DialogHeading>
            </DialogHeader>
            {/* search row stays pinned above the scrolling list, as in the legacy layout */}
            <InputGroup size="2xl">
              <Icon icon={SearchOutline} tint="secondary" />
              <Input
                size="2xl"
                id="search"
                name="search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for shortcuts"
                aria-label="Search for shortcuts"
                // oxlint-disable-next-line jsx-a11y/no-autofocus -- the shortcut sheet opens on the search field
                autoFocus
              />
            </InputGroup>
            <DialogBody tabIndex={0}>
              <ShortcutRenderer searchQuery={query} commands={allCommandsWithShortcuts} />
            </DialogBody>
          </DialogMain>
        </div>
      </DialogContent>
    </Dialog>
  );
}
