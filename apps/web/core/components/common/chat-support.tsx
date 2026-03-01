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
// custom events
import { CHAT_SUPPORT_EVENTS } from "@/custom-events/chat-support";
// store hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useUser } from "@/hooks/store/user";
import { getFileURL } from "@plane/utils";

// Pylon types
declare global {
  interface Window {
    Pylon?: (command: string, ...args: unknown[]) => void;
    pylon?: {
      chat_settings: {
        app_id: string;
        email: string;
        email_hash: string;
        name: string;
        avatar_url?: string;
      };
    };
  }
}

const PYLON_SCRIPT_LOADER = (appId: string) => `
  (function(){var e=window;var t=document;var n=function(){n.e(arguments)};n.q=[];n.e=function(e){n.q.push(e)};e.Pylon=n;var r=function(){var e=t.createElement("script");e.setAttribute("type","text/javascript");e.setAttribute("async","true");e.setAttribute("src","https://widget.usepylon.com/widget/${appId}");var n=t.getElementsByTagName("script")[0];n.parentNode.insertBefore(e,n)};if(t.readyState==="complete"){r()}else if(e.addEventListener){e.addEventListener("load",r,false)}})();
`;

const ChatSupportRoot = observer(function ChatSupportRoot() {
  // store hooks
  const { data: user } = useUser();
  const { config } = useInstance();
  // derived values
  const chatSupportAppId = config?.chat_support_app_id;
  const isEnabled = Boolean(user && config?.is_chat_support_enabled && chatSupportAppId);

  useEffect(() => {
    if (!isEnabled || !user || !chatSupportAppId || !user.email_hash) return;

    // Load Pylon script
    const script = document.createElement("script");
    script.id = "chat-support-widget-script";
    script.innerHTML = PYLON_SCRIPT_LOADER(chatSupportAppId);
    document.body.appendChild(script);

    // Configure Pylon with user settings
    window.pylon = {
      chat_settings: {
        app_id: chatSupportAppId,
        email: user.email,
        email_hash: user.email_hash,
        name: `${user.first_name} ${user.last_name}`,
        avatar_url: getFileURL(user?.avatar_url ?? ""),
      },
    };

    const handleOpenChatSupport = () => {
      // Call Pylon to show the chat widget
      if (window.Pylon) {
        window.Pylon("show");
      }
    };

    window.addEventListener(CHAT_SUPPORT_EVENTS.open, handleOpenChatSupport);

    return () => {
      window.removeEventListener(CHAT_SUPPORT_EVENTS.open, handleOpenChatSupport);
      // Remove chat support script
      const chatSupportScript = document.getElementById("chat-support-widget-script");
      if (chatSupportScript) {
        chatSupportScript.remove();
      }
      // Remove dynamically loaded chat widget script
      const chatWidgetScripts = document.querySelectorAll(`script[src*="widget.usepylon.com"]`);
      chatWidgetScripts.forEach((s) => s.remove());
      // Clean up window objects
      delete window.pylon;
      delete window.Pylon;
    };
  }, [user, chatSupportAppId, isEnabled]);

  return null;
});

export default ChatSupportRoot;
