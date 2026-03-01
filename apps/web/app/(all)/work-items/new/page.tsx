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

import { redirect } from "react-router";
// store
import { store } from "@/lib/store-context";
// services
import userService from "@/services/user.service";
// types
import type { Route } from "./+types/page";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  // parse all query params from the incoming request
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  // convert search params to a plain object
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  try {
    // fetch user settings to get the last workspace
    const currentUserSettings = await userService.currentUserSettings();
    if (!currentUserSettings) {
      throw redirect("/");
    }
    const resolvedWorkspaceSlug = params.workspace || currentUserSettings.workspace.last_workspace_slug;
    if (!resolvedWorkspaceSlug) {
      throw redirect("/");
    }
    // store params in store and open the modal
    if (Object.keys(params).length > 0) {
      const { workspace, ...rest } = params;
      store.commandPalette.updateWorkItemModalDataFromQueryParams({
        params: rest,
      });
    }
    store.commandPalette.toggleCreateIssueModal(true);
    // redirect to projects page without query params
    const redirectUrl = `/${resolvedWorkspaceSlug}/`;
    throw redirect(redirectUrl);
  } catch (error) {
    // if it's a redirect, rethrow it
    if (error instanceof Response) {
      throw error;
    }
    throw redirect("/");
  }
}
