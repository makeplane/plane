import React from "react";
import { observer } from "mobx-react";
import { TPageEmbedConfig } from "@plane/editor";
import { EmptyPageIcon } from "@plane/propel/icons";
import { TPage } from "@plane/types";
// icons
// plane web store
import { EPageStoreType } from "@/plane-web/hooks/store";
// embed content component
import { PageEmbedContent } from "./content";

type Props = {
  embedPageId: string;
  previewDisabled?: boolean;
  storeType: EPageStoreType;
  redirectLink?: string;
  onPageDrop?: (droppedPageId: string) => void;
  isDroppable?: boolean;
  pageDetails?: TPage;
  updateAttributes?: Parameters<TPageEmbedConfig["widgetCallback"]>[0]["updateAttributes"];
  parentPage?: TPage;
};

export const PageEmbedCardRoot: React.FC<Props> = observer((props) => <PageEmbedContent {...props} />);

export const PlaceholderEmbed = () => (
  <div className="not-prose relative page-embed cursor-pointer rounded-md py-2 px-2 my-1.5 flex items-center gap-1.5 !no-underline group overflow-hidden">
    <div className="relative z-10">
      <EmptyPageIcon className="size-4" />
    </div>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-[shimmer_5s_var(--ease-out-cubic)_infinite]" />
  </div>
);
