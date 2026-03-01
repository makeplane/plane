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

import { observer } from "mobx-react";
import { cn } from "@plane/utils";
import { AiMessage } from "./ai-message";
import { MyMessage } from "./my-message";

type TProps = {
  isLoading: boolean;
  isFullScreen: boolean;
};

export const Loading = observer(function Loading(props: TProps) {
  const { isLoading } = props;

  return (
    <div className={cn("flex flex-col gap-8 max-h-full h-full overflow-y-scroll w-full pb-[230px] pt-8")}>
      {/* Loading */}
      {isLoading && <MyMessage isLoading={isLoading} />}
      {isLoading && <AiMessage isLoading={isLoading} />}
    </div>
  );
});
