"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// ui
import { Logo, PhotoFilterIcon } from "@plane/ui";
// hooks
import { useView } from "@/plane-web/hooks/store/use-published-view";
// store
import { PublishStore } from "@/store/publish/publish.store";
import { ViewNavbarControls } from ".";

type Props = {
  publishSettings: PublishStore;
};

export const ViewNavbarRoot: FC<Props> = observer((props) => {
  const { publishSettings } = props;

  const { viewData } = useView();

  return (
    <div className="relative flex justify-between w-full gap-4 px-5">
      {/* project detail */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {viewData?.logo_props ? (
          <span className="h-7 w-7 flex-shrink-0 grid place-items-center">
            <Logo logo={viewData?.logo_props} size={16} type="lucide" />
          </span>
        ) : (
          <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
            <PhotoFilterIcon className="h-4 w-4" />
          </span>
        )}
        <div className="line-clamp-1 max-w-[300px] overflow-hidden text-lg font-medium">{viewData?.name || `...`}</div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <ViewNavbarControls publishSettings={publishSettings} />
      </div>
    </div>
  );
});
