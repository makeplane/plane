/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { redirect } from "react-router";
// helpers
import { resolveDesktopHandoffRedirect } from "@/helpers/desktop-handoff.helper";
// types
import type { Route } from "./+types/desktop-handoff";

export const clientLoader = ({ request }: Route.ClientLoaderArgs) => {
  const handoffUrl = new URL(request.url);
  const destination = resolveDesktopHandoffRedirect(handoffUrl.searchParams, handoffUrl.origin);

  throw redirect(destination ?? "/");
};

export default function DesktopHandoff() {
  return null;
}
