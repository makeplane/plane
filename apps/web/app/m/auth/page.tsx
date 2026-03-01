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
import type { TInstanceConfig } from "@plane/types";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
// components
import { AuthRoot } from "@/components/mobile";
import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = () => [
  { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
];

function MobileAuth() {
  // hooks
  const { config } = useInstance();

  return (
    <div className="isolate relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
      <div className="flex flex-col justify-center items-center flex-grow w-full py-6 mt-10">
        <div className="relative flex flex-col gap-6 max-w-[22.5rem] w-full">
          <AuthRoot config={config as TInstanceConfig} />
        </div>
      </div>
    </div>
  );
}

export default observer(MobileAuth);
