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
// plane imports
import { cn } from "@plane/utils";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useUser } from "@/hooks/store/user/user-user";
// plane web imports

import { InputBox } from "@/components/pi-chat/input";

function NewChatPage() {
  // store hooks
  const { data: currentUser } = useUser();

  return (
    <>
      <PageHead title="Plane AI" />
      <div className="relative flex flex-col h-full flex-1 align-middle justify-center max-w-[780px] md:m-auto w-full">
        <div className={cn("flex-1 my-auto flex flex-co h-full mx-6 relative")}>
          {/* Chat Input */}
          <InputBox isFullScreen />
        </div>
      </div>
    </>
  );
}

export default observer(NewChatPage);
