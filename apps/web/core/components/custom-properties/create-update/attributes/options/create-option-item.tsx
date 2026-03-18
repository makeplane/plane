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

import { forwardRef } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TIssuePropertyOptionCreateUpdateData } from "@plane/types";
// plane imports
import { IssuePropertyOptionItem } from "./option";

type TIssuePropertyCreateOptionItem = {
  propertyOptionCreateListData: TIssuePropertyOptionCreateUpdateData;
  updateCreateListData: (value: TIssuePropertyOptionCreateUpdateData) => void;
  scrollIntoNewOptionView: () => void;
  error?: string;
};

export const IssuePropertyCreateOptionItem = observer(
  forwardRef<HTMLDivElement, TIssuePropertyCreateOptionItem>(function IssuePropertyCreateOptionItem(
    props: TIssuePropertyCreateOptionItem,
    ref: React.Ref<HTMLDivElement>
  ) {
    const { propertyOptionCreateListData, updateCreateListData, scrollIntoNewOptionView, error } = props;

    return (
      <div ref={ref} className="w-full pr-2.5">
        <IssuePropertyOptionItem
          propertyOptionData={propertyOptionCreateListData}
          updateOptionData={updateCreateListData}
          scrollIntoNewOptionView={scrollIntoNewOptionView}
          error={error}
        />
      </div>
    );
  })
);
