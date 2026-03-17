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

import type { PlainTextOption } from "../slack-options";
import { buildOptionGroups } from "../slack-options";

const createOption = (value: string, text = value): PlainTextOption => ({
  text: {
    type: "plain_text",
    text,
    emoji: true,
  },
  value,
});

describe("buildOptionGroups", () => {
  it("should return empty option groups when no items are passed", () => {
    expect(buildOptionGroups([], 50, "project-1")).toEqual({
      option_groups: [],
    });
  });

  it("should split items into groups of 50 by default and label ranges correctly", () => {
    const options = Array.from({ length: 51 }, (_, index) => createOption(`project-${index + 1}`));

    const result = buildOptionGroups(options);

    expect(result.option_groups).toHaveLength(2);
    expect(result.option_groups[0].label.text).toBe("1-50");
    expect(result.option_groups[0].options).toHaveLength(50);
    expect(result.option_groups[1].label.text).toBe("51-51");
    expect(result.option_groups[1].options).toHaveLength(1);
  });

  it("should respect custom group size", () => {
    const options = Array.from({ length: 5 }, (_, index) => createOption(`project-${index + 1}`));

    const result = buildOptionGroups(options, 2);

    expect(result.option_groups.map((group) => group.label.text)).toEqual(["1-2", "3-4", "5-5"]);
    expect(result.option_groups.map((group) => group.options.length)).toEqual([2, 2, 1]);
  });

  it("should include initial_option when selected value exists", () => {
    const options = [createOption("alpha", "Alpha"), createOption("beta", "Beta")];

    const result = buildOptionGroups(options, 50, "beta");

    expect(result.initial_option).toEqual(options[1]);
  });

  it("should not include initial_option when selected value does not exist", () => {
    const options = [createOption("alpha", "Alpha"), createOption("beta", "Beta")];

    const result = buildOptionGroups(options, 50, "gamma");

    expect(result).toEqual({
      option_groups: [
        {
          label: { type: "plain_text", text: "1-2" },
          options,
        },
      ],
    });
  });
});
