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

import React, { useMemo } from "react";
// ui
import { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleButton } from "@plane/propel/collapsible";
// local components
import { SectionWrapper } from "../common/section-wrapper";

type TCollapsibleDetailSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  count: number;
  actionItemElement: React.ReactNode;
  collapsibleContent: React.ReactNode;
};

export function CollapsibleDetailSection(props: TCollapsibleDetailSectionProps) {
  const { title, actionItemElement, collapsibleContent, isOpen, count, onToggle } = props;

  const collapsibleButton = useMemo(
    () => (
      <CollapsibleButton
        isOpen={isOpen}
        title={title}
        titleClassName="font-medium text-tertiary text-14"
        indicatorElement={
          count > 0 && (
            <span className="flex items-center justify-center ">
              <p className="text-14 text-tertiary !leading-3">{count}</p>
            </span>
          )
        }
        actionItemElement={actionItemElement}
        className="border-none py-0 h-min"
      />
    ),
    [actionItemElement, count, isOpen, title]
  );

  return (
    <SectionWrapper>
      <Collapsible
        open={isOpen}
        onOpenChange={(open: boolean) => {
          if (open !== isOpen) {
            onToggle();
          }
        }}
      >
        <CollapsibleTrigger className="w-full">{collapsibleButton}</CollapsibleTrigger>
        <CollapsibleContent>{collapsibleContent}</CollapsibleContent>
      </Collapsible>
    </SectionWrapper>
  );
}
