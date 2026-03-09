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

import React, { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Combobox } from "@headlessui/react";
// plane imports
import { EPageAccess } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TMovePageActions, TMovePageEntity } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// ce imports
import type { TMovePageModalProps } from "@/ce/components/pages";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local imports
import { MovePageModalBody } from "./body";
import { MovePageModalFooter } from "./footer";
import { MovePageModalInput } from "./input";

export type TMovePageSelectedValue = `project-${string}` | `teamspace-${string}` | "workspace";

export const MovePageModal = observer(function MovePageModal(props: TMovePageModalProps) {
  const { isOpen, onClose, page } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValue, setSelectedValue] = useState<TMovePageSelectedValue | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  // refs
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  // navigation
  const { workspaceSlug, teamspaceId, projectId } = useParams();
  // translation
  const { t } = useTranslation();
  // store hooks
  const { movePage } = usePageStore(EPageStoreType.PROJECT);
  // derived values
  const { access, id, is_shared } = page;
  const canPageBeMovedToTeamspace = access === EPageAccess.PUBLIC && !is_shared;

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setSearchTerm("");
      setSelectedValue(null);
    }, 300);
  }, [onClose]);

  const handleMovePage = useCallback(async () => {
    if (!selectedValue || !id) return;
    const moveSource: TMovePageEntity = teamspaceId ? "teamspace" : projectId ? "project" : "workspace";
    let moveTarget: TMovePageEntity | null = null;
    if (selectedValue.includes("teamspace")) {
      moveTarget = "teamspace";
    } else if (selectedValue.includes("project")) {
      moveTarget = "project";
    } else {
      moveTarget = "workspace";
    }

    const moveSourceIdentifier = teamspaceId ?? projectId ?? workspaceSlug;
    const moveTargetIdentifier =
      moveTarget === "workspace"
        ? workspaceSlug?.toString()
        : moveTarget === "project"
          ? selectedValue.replace("project-", "")
          : selectedValue.replace("teamspace-", "");
    if (!moveSourceIdentifier || !moveTargetIdentifier) return;

    await movePage({
      pageId: id,
      data: {
        move_type: `${moveSource}_to_${moveTarget}` as TMovePageActions,
        source_identifier: moveSourceIdentifier?.toString(),
        target_identifier: moveTargetIdentifier,
      },
    })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("page_actions.move_page.toasts.success.title"),
          message: t("page_actions.move_page.toasts.success.message"),
        });
        handleClose();
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("page_actions.move_page.toasts.error.title"),
          message: t("page_actions.move_page.toasts.error.message"),
        });
      });
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [handleClose, id, movePage, projectId, selectedValue, teamspaceId, workspaceSlug]);

  const handleMove = useCallback(async () => {
    setIsMoving(true);
    await handleMovePage();
    setIsMoving(false);
  }, [handleMovePage]);

  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={handleClose}>
      <Combobox
        as="div"
        value={selectedValue}
        onChange={(val: TMovePageSelectedValue) => {
          setSelectedValue(val);
          setSearchTerm("");
          moveButtonRef.current?.focus();
        }}
      >
        <MovePageModalInput
          canPageBeMovedToTeamspace={canPageBeMovedToTeamspace}
          searchTerm={searchTerm}
          updateSearchTerm={setSearchTerm}
        />
        <MovePageModalBody canPageBeMovedToTeamspace={canPageBeMovedToTeamspace} searchTerm={searchTerm} />
      </Combobox>
      <MovePageModalFooter onClose={handleClose} onMove={handleMove} isMoving={isMoving} disabled={!selectedValue} />
    </ModalCore>
  );
});
