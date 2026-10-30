/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TSticky } from "@plane/types";

export const STICKY_COLORS_LIST: {
  key: string;
  label: string;
  backgroundColor: string;
}[] = [
  {
    key: "gray",
    label: "Gray",
    backgroundColor: "var(--editor-colors-gray-background)",
  },
  {
    key: "peach",
    label: "Peach",
    backgroundColor: "var(--editor-colors-peach-background)",
  },
  {
    key: "pink",
    label: "Pink",
    backgroundColor: "var(--editor-colors-pink-background)",
  },
  {
    key: "orange",
    label: "Orange",
    backgroundColor: "var(--editor-colors-orange-background)",
  },
  {
    key: "green",
    label: "Green",
    backgroundColor: "var(--editor-colors-green-background)",
  },
  {
    key: "light-blue",
    label: "Light blue",
    backgroundColor: "var(--editor-colors-light-blue-background)",
  },
  {
    key: "dark-blue",
    label: "Dark blue",
    backgroundColor: "var(--editor-colors-dark-blue-background)",
  },
  {
    key: "purple",
    label: "Purple",
    backgroundColor: "var(--editor-colors-purple-background)",
  },
];

type TProps = {
  handleUpdate: (data: Partial<TSticky>) => Promise<void>;
};

export function ColorPalette(props: TProps) {
  const { handleUpdate } = props;
  return (
    <div className="space-y-1.5">
      <p className="text-caption-sm-semibold text-tertiary">Background colors</p>
      <div role="group" aria-label="Background colors" className="flex items-center gap-2">
        {STICKY_COLORS_LIST.map((color) => (
          <button
            key={color.key}
            type="button"
            aria-label={color.label}
            onClick={() => {
              handleUpdate({
                background_color: color.key,
              });
            }}
            className="h-6 w-6 rounded-md transition-all hover:ring-2 hover:ring-accent-strong focus:ring-2 focus:ring-accent-strong focus:outline-none"
            style={{
              backgroundColor: color.backgroundColor,
            }}
          />
        ))}
      </div>
    </div>
  );
}
