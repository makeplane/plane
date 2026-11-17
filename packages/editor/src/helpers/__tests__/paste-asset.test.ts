/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it } from "vitest";
import { ECustomImageStatus } from "@/extensions/custom-image/types";
import { assetDuplicationHandlers } from "../asset-duplication";
import { processAssetDuplication } from "../paste-asset";

const ASSET_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("processAssetDuplication", () => {
  afterEach(() => {
    delete assetDuplicationHandlers["probe-component"];
  });

  it("hands the handlers elements of an inert document, never of the page", () => {
    const ownerDocuments: Document[] = [];
    assetDuplicationHandlers["probe-component"] = ({ element, originalHtml }) => {
      ownerDocuments.push(element.ownerDocument);
      return { modifiedHtml: originalHtml, shouldProcess: false };
    };

    processAssetDuplication(`<p>text</p><probe-component></probe-component>`);

    expect(ownerDocuments).toHaveLength(1);
    expect(ownerDocuments[0]).not.toBe(document);
  });

  it("marks an uploaded image-component for duplication under a new id", () => {
    const html = `<p>text</p><image-component src="${ASSET_ID}" id="old-id" width="35%"></image-component>`;

    const { processedHtml } = processAssetDuplication(html);

    const images = new DOMParser().parseFromString(processedHtml, "text/html").querySelectorAll("image-component");
    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("src")).toBe(ASSET_ID);
    expect(images[0].getAttribute("width")).toBe("35%");
    expect(images[0].getAttribute("status")).toBe(ECustomImageStatus.DUPLICATING);
    expect(images[0].getAttribute("id")).not.toBe("old-id");
    expect(processedHtml.startsWith("<p>text</p><image-component ")).toBe(true);
  });

  it("leaves an image-component with an external source untouched", () => {
    const html = `<image-component src="https://example.com/image.png" id="old-id"></image-component>`;

    expect(processAssetDuplication(html).processedHtml).toBe(html);
  });
});
