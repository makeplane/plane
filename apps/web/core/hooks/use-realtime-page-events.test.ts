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

import { describe, expect, it } from "vitest";
import { getMovedPageRedirectLink } from "./page-move-routing";

describe("getMovedPageRedirectLink", () => {
  it("does not redirect for collection moves", () => {
    expect(
      getMovedPageRedirectLink({
        workspaceSlug: "plane",
        pageId: "page-1",
        moveType: "collection_to_collection",
        newEntityIdentifier: "collection-1",
      })
    ).toBeNull();
  });

  it("routes project moves to the project page detail route", () => {
    expect(
      getMovedPageRedirectLink({
        workspaceSlug: "plane",
        pageId: "page-1",
        moveType: "workspace_to_project",
        newEntityIdentifier: "project-1",
      })
    ).toBe("/plane/projects/project-1/pages/page-1");
  });

  it("routes teamspace moves to the teamspace page detail route", () => {
    expect(
      getMovedPageRedirectLink({
        workspaceSlug: "plane",
        pageId: "page-1",
        moveType: "workspace_to_teamspace",
        newEntityIdentifier: "teamspace-1",
      })
    ).toBe("/plane/teamspaces/teamspace-1/pages/page-1");
  });
});
