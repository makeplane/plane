import React from "react";
import { ToggleSwitch } from "@plane/ui";

export const WebhooksListItem = () => {
  return (
    <div>
      {/* <div class="flex  items-center py-3.5 border-b border-custom-border-200"></div> */}
      <div className="flex justify-between px-3.5 py-[18px]">
        <div>
          <h4 className="text-base font-medium">Webhook Name</h4>
          <h5 className="text-base text-neutral-700">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          </h5>
        </div>
        <ToggleSwitch value={true} onChange={(value) => console.log("change")} />
      </div>
    </div>
  );
};
