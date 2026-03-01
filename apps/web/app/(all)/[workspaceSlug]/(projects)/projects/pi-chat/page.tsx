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

import { useEffect } from "react";
import { observer } from "mobx-react";
import { PiChatDetail } from "@/components/pi-chat/detail";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";

function NewChatPage() {
  // store hooks
  const { initPiChat } = usePiChat();

  useEffect(() => {
    initPiChat();
  }, []);
  return <PiChatDetail isFullScreen isProjectLevel />;
}
export default observer(NewChatPage);
