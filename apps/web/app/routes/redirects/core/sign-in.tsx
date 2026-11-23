/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { redirect } from "react-router";
import type { Route } from "./+types/sign-in";

export const clientLoader = ({ request }: Route.ClientLoaderArgs) => {
  // keep the query string (next_path, email) that links to /sign-in carry
  throw redirect(`/${new URL(request.url).search}`);
};

export default function SignIn() {
  return null;
}
