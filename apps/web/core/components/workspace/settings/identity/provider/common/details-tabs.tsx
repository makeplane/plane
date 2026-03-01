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

// plane imports
import { Tabs } from "@plane/propel/tabs";
import { cn } from "@plane/utils";

type TTab<TKey extends string> = {
  key: TKey;
  label: string;
  content: React.ReactNode;
};

type TProviderDetailsTabsProps<TKey extends string> = {
  tabs: readonly TTab<TKey>[];
};

export function ProviderDetailsTabs<TKey extends string>(props: TProviderDetailsTabsProps<TKey>) {
  const { tabs } = props;
  const firstTabKey = tabs[0]?.key;
  // derived values
  const hasMultipleTabs = tabs.length > 1;

  if (!firstTabKey) {
    return null;
  }

  return (
    <Tabs defaultValue={firstTabKey}>
      {hasMultipleTabs ? (
        <Tabs.List className="w-fit">
          {tabs.map((tab) => (
            <Tabs.Trigger key={tab.key} value={tab.key} className="px-1.5">
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      ) : null}
      {tabs.map((tab) => (
        <Tabs.Content
          key={tab.key}
          value={tab.key}
          className={cn({
            "pt-4": hasMultipleTabs,
          })}
        >
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs>
  );
}
