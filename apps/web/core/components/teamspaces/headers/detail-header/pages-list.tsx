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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EPageAccess } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

type TeamspacePagesListHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspacePagesListHeaderActions = observer(function TeamspacePagesListHeaderActions(
  props: TeamspacePagesListHeaderActionsProps
) {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // plane web hooks
  const { filters, createPage } = usePageStore(EPageStoreType.TEAMSPACE);

  const handleCreatePage = async () => {
    setIsCreatingPage(true);
    // Create page
    await createPage({
      access: EPageAccess.PUBLIC,
    })
      .then((res) => {
        const pageRedirectionLink = `/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${res?.id}`;
        router.push(pageRedirectionLink);
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        });
      })
      .finally(() => setIsCreatingPage(false));
  };

  if (!workspaceSlug || !teamspaceId || !filters) return;

  return (
    <>
      {isEditingAllowed && (
        <Button variant="primary" onClick={handleCreatePage} loading={isCreatingPage} size="lg">
          {isCreatingPage ? "Adding" : "Add page"}
        </Button>
      )}
    </>
  );
});
