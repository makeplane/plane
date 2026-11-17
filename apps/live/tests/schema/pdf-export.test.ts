/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { Either, Schema } from "effect";
import { PdfExportRequestBody } from "@/schema/pdf-export";

const PAGE_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";

const isAccepted = (body: unknown) => Either.isRight(Schema.decodeUnknownEither(PdfExportRequestBody)(body));

describe("PdfExportRequestBody", () => {
  it("accepts a page id, a workspace slug and an optional project id", () => {
    expect(isAccepted({ pageId: PAGE_ID, workspaceSlug: "my-ws_1", projectId: PROJECT_ID })).toBe(true);
    expect(isAccepted({ pageId: PAGE_ID, workspaceSlug: "my.ws" })).toBe(true);
  });

  // the ids and the slug are placed in API request paths, so they must be exactly an id / a slug
  it.each([
    ["a page id that is not a UUID", { pageId: "not-a-uuid" }],
    ["a page id followed by a path", { pageId: `${PAGE_ID}/x` }],
    ["a project id that is not a UUID", { projectId: "not-a-uuid" }],
    ["a slug with a path separator", { workspaceSlug: "a/b" }],
    ["a slug with a backslash", { workspaceSlug: "a\\b" }],
    ["a slug with a query separator", { workspaceSlug: "a?b" }],
    ["a slug with an encoded character", { workspaceSlug: "a%2fb" }],
    ["a slug that is a dot segment", { workspaceSlug: ".." }],
    ["an empty slug", { workspaceSlug: "" }],
  ])("rejects %s", (_name, override) => {
    expect(isAccepted({ pageId: PAGE_ID, workspaceSlug: "ws", projectId: PROJECT_ID, ...override })).toBe(false);
  });
});
