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

import { WO_INPUT_SUFFIX } from "./constants";

export type PlainTextOption = {
  text: {
    type: "plain_text";
    text: string;
    emoji: true;
  };
  value: string;
};

export const removePrefixIfExists = (value: string): string => {
  if (value.includes(".")) {
    const parts = value.split(".");
    return value.includes(`.${WO_INPUT_SUFFIX}`) ? parts[0] : parts[parts.length - 1];
  }
  return value;
};

/**
 * Truncates a name if it exceeds the max length, adding ellipsis as needed
 * @param name The name to truncate
 * @param maxLength Maximum length of name
 * @returns The truncated name
 */
export const truncateName = (name: string, maxLength: number = 75): string =>
  name.length > maxLength ? name.substring(0, maxLength - 3) + "..." : name;

/**
 * Creates a formatted option for Slack with name truncation
 */
export const convertToSlackOption = (point: { id?: string; name?: string }, prefix?: string): PlainTextOption => {
  const displayText = truncateName(point.name || "");

  if (!point.id) {
    throw new Error("ID is required");
  }

  return {
    text: {
      type: "plain_text",
      text: displayText,
      emoji: true,
    },
    value: prefix ? `${prefix}.${point.id}` : point.id,
  };
};

export const convertToSlackOptions = (
  data: Array<{
    id?: string;
    name?: string;
  }>,
  prefix?: string
): Array<PlainTextOption> => data.map((point) => convertToSlackOption(point, prefix));

/**
 * Formats work item display info into Slack hyperlink markdown
 * @param displayText - Display text
 * @param url - URL
 * @returns Slack-formatted hyperlink string
 */
export const createSlackHyperlinkMarkdown = (displayText: string, url: string): string => `<${url}|${displayText}>`;

export type TSlackOptionGroup = {
  label: { type: "plain_text"; text: string };
  options: PlainTextOption[];
};

// Implement option groups for project dropdowns to accomodate more than 100 projects in a workspace.
export const buildOptionGroups = (
  items: PlainTextOption[],
  groupSize = 50,
  selectedValue?: string
): {
  option_groups: TSlackOptionGroup[];
  initial_option?: PlainTextOption;
} => {
  const option_groups: TSlackOptionGroup[] = [];

  for (let i = 0; i < items.length; i += groupSize) {
    const start = i + 1;
    const end = Math.min(i + groupSize, items.length);

    option_groups.push({
      label: {
        type: "plain_text",
        text: `${start}-${end}`,
      },
      options: items.slice(i, i + groupSize),
    });
  }

  const initial_option = items.find((item) => item.value === selectedValue);

  return {
    option_groups,
    ...((initial_option && { initial_option }) ?? {}),
  };
};
