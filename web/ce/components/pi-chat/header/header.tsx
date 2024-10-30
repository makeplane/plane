"use-client";

import { PiChatLogo } from "@plane/ui/src/icons/pi-chat";

export const Header = () => (
  <div className="flex justify-between h-8">
    {/* Breadcrumb */}
    <div className="flex">
      <PiChatLogo className="size-4 text-custom-text-200 fill-current m-auto align-center" />
      <span className="font-medium text-sm my-auto"> Pi Chat</span>
    </div>
  </div>
);
