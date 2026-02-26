/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { redirect } from "react-router";
import type { Route } from "./+types/workspace-account-settings";

export const clientLoader = ({ params, request }: Route.ClientLoaderArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const splat = params["*"] || "";
  throw redirect(`/settings/profile/${splat || "general"}?${searchParams.toString()}`);
};

export default function WorkspaceAccountSettings() {
  return null;
}
