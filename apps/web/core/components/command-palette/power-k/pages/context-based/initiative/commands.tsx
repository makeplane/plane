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

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { UserCircle2 } from "lucide-react";
import { LinkIcon, InitiativeStateIcon } from "@plane/propel/icons";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TInitiativeStates } from "@plane/types";
import { EUserWorkspaceRoles } from "@plane/types";
import { copyTextToClipboard } from "@plane/utils";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useUser } from "@/hooks/store/user";
// plane web imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiative } from "@/types/initiative";

export const usePowerKInitiativeContextBasedActions = (): TPowerKCommandConfig[] => {
  // navigation
  const { workspaceSlug, initiativeId } = useParams();
  // store
  const {
    permission: { allowPermissions },
  } = useUser();
  const {
    initiative: { getInitiativeById, updateInitiative },
  } = useInitiatives();
  // derived values
  const initiativeDetails = initiativeId ? getInitiativeById(initiativeId.toString()) : null;
  // permission
  const isEditingAllowed = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  // translation
  const { t } = useTranslation();

  const handleUpdateInitiative = useCallback(
    async (payload: Partial<TInitiative>) => {
      if (!workspaceSlug || !initiativeDetails) return;
      await updateInitiative(workspaceSlug.toString(), initiativeDetails.id, payload).catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Initiative could not be updated. Please try again.",
        });
      });
    },
    [initiativeDetails, updateInitiative, workspaceSlug]
  );

  const copyInitiativeUrlToClipboard = useCallback(() => {
    const url = new URL(window.location.href);
    copyTextToClipboard(url.href)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("power_k.contextual_actions.initiative.copy_url_toast_success"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("power_k.contextual_actions.initiative.copy_url_toast_error"),
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [
    {
      id: "change-initiative-state",
      i18n_title: "power_k.contextual_actions.initiative.change_state",
      iconNode: <InitiativeStateIcon state="DRAFT" className="shrink-0 size-3.5" />,
      group: "contextual",
      contextType: "initiative",
      type: "change-page",
      page: "change-initiative-state",
      onSelect: (data) => {
        const state = data as TInitiativeStates;
        if (state === initiativeDetails?.state) return;
        handleUpdateInitiative({ state });
      },
      shortcut: "s",
      isEnabled: () => isEditingAllowed,
      isVisible: () => isEditingAllowed,
      closeOnSelect: true,
    },
    {
      id: "change-initiative-lead",
      i18n_title: "power_k.contextual_actions.initiative.change_lead",
      icon: UserCircle2,
      group: "contextual",
      contextType: "initiative",
      type: "change-page",
      page: "change-initiative-lead",
      onSelect: (data) => {
        const memberId = data as string | null;
        if (memberId === initiativeDetails?.lead) return;
        handleUpdateInitiative({ lead: memberId });
      },
      shortcut: "l",
      isEnabled: () => isEditingAllowed,
      isVisible: () => isEditingAllowed,
      closeOnSelect: true,
    },
    {
      id: "copy-initiative-url",
      i18n_title: "power_k.contextual_actions.initiative.copy_url",
      icon: LinkIcon,
      group: "contextual",
      contextType: "initiative",
      type: "action",
      action: copyInitiativeUrlToClipboard,
      modifierShortcut: "cmd+shift+,",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
