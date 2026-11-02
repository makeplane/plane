/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const groupReactions = <T extends { reaction: string }>(reactions: T[], key: string) => {
  const groupedReactions = reactions.reduce(
    (acc: { [key: string]: T[] }, reaction: any) => {
      if (!acc[reaction[key]]) {
        acc[reaction[key]] = [];
      }
      acc[reaction[key]].push(reaction);
      return acc;
    },
    {} as { [key: string]: T[] }
  );

  return groupedReactions;
};
