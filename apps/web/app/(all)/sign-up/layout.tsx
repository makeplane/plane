/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { BRAND_NAME } from "@plane/constants";
import type { Route } from "./+types/layout";

export const meta: Route.MetaFunction = () => [
  { title: `Sign up - ${BRAND_NAME}` },
  { name: "robots", content: "index, nofollow" },
];

export default function SignUpLayout() {
  return <Outlet />;
}
