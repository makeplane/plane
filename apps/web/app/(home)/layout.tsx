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

import { Outlet } from "react-router";
// lib
import { redirectIfUserIsAuthenticated } from "@/lib/middleware/auth-client-middleware";
// types
import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { name: "robots", content: "index, nofollow" },
  { name: "viewport", content: "width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover" },
];

export const clientMiddleware = [redirectIfUserIsAuthenticated];

export default function HomeLayout() {
  return <Outlet />;
}
