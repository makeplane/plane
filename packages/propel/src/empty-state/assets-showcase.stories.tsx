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

import preview from "#.storybook/preview";
import { HorizontalStackAssetsMap } from "./assets/horizontal-stack/constant";
import { IllustrationMap } from "./assets/illustration/constant";
import { VerticalStackAssetsMap } from "./assets/vertical-stack/constant";

// Meta for asset showcase
const meta = preview.meta({
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Visual catalog of all available empty state assets organized by type.",
      },
    },
  },
});

export const HorizontalStackAssets = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          "Horizontal stack assets designed for compact empty states. These are optimized for smaller, inline empty state scenarios.",
      },
    },
  },
  render(_args) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-18 font-semibold text-primary">Horizontal Stack Assets</h2>
          <p className="text-13 text-tertiary">Used primarily in EmptyStateCompact component</p>
        </div>
        <div className="grid w-full grid-cols-12 gap-6">
          {HorizontalStackAssetsMap.map((item) => (
            <div
              key={item.title}
              className="col-span-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-subtle bg-surface-1 p-6 sm:col-span-4 lg:col-span-3"
            >
              <div className="flex h-24 w-24 items-center justify-center">{item.asset}</div>
              <p className="text-center text-11 font-medium text-secondary">{item.title}</p>
              <code className="rounded-sm bg-layer-1 px-2 py-1 text-11 text-tertiary">
                {item.title.toLowerCase().replace(/\s+/g, "-")}
              </code>
            </div>
          ))}
        </div>
      </div>
    );
  },
});

export const VerticalStackAssets = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          "Vertical stack assets designed for detailed empty states. These are larger and more prominent, suitable for feature-specific empty states.",
      },
    },
  },
  render(_args) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-18 font-semibold text-primary">Vertical Stack Assets</h2>
          <p className="text-13 text-tertiary">Used primarily in EmptyStateDetailed component</p>
        </div>
        <div className="grid w-full grid-cols-12 gap-6">
          {VerticalStackAssetsMap.map((item) => (
            <div
              key={item.title}
              className="col-span-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-subtle bg-surface-1 p-6 sm:col-span-4 lg:col-span-3"
            >
              <div className="flex h-32 w-32 items-center justify-center">{item.asset}</div>
              <p className="text-center text-11 font-medium text-secondary">
                {item.title.replace(/VerticalStackIllustration$/, "")}
              </p>
              <code className="rounded-sm bg-layer-1 px-2 py-1 text-11 text-tertiary">
                {item.title
                  .replace(/VerticalStackIllustration$/, "")
                  .replace(/([A-Z])/g, "-$1")
                  .toLowerCase()
                  .slice(1)}
              </code>
            </div>
          ))}
        </div>
      </div>
    );
  },
});

export const IllustrationAssets = meta.story({
  parameters: {
    docs: {
      description: {
        story: "Illustration assets available for both compact and detailed empty states.",
      },
    },
  },
  render(_args) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-18 font-semibold text-primary">Illustration Assets</h2>
          <p className="text-13 text-tertiary">Available in both EmptyStateCompact and EmptyStateDetailed</p>
        </div>
        <div className="grid w-full grid-cols-12 gap-6">
          {IllustrationMap.map((item) => (
            <div
              key={item.title}
              className="col-span-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-subtle bg-surface-1 p-6 sm:col-span-4 lg:col-span-3"
            >
              <div className="flex h-24 w-24 items-center justify-center">{item.asset}</div>
              <p className="text-center text-11 font-medium text-secondary">{item.title}</p>
              <code className="rounded-sm bg-layer-1 px-2 py-1 text-11 text-tertiary">{item.title.toLowerCase()}</code>
            </div>
          ))}
        </div>
      </div>
    );
  },
});
