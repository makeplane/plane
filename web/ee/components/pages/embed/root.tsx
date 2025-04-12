import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { EditorRefApi, TPageEmbedConfig } from "@plane/editor";
import { TPage } from "@plane/types";
import { EmptyPageIcon } from "@plane/ui";
// plane web store
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// embed content component
import { PageEmbedContent } from "./content";

type Props = {
  embedPageId: string;
  previewDisabled?: boolean;
  storeType: EPageStoreType;
  redirectLink?: string;
  editorRef?: React.RefObject<EditorRefApi>;
  onPageDrop?: (droppedPageId: string) => void;
  isDroppable?: boolean;
  pageDetails?: TPage;
  updateAttributes?: Parameters<TPageEmbedConfig["widgetCallback"]>[0]["updateAttributes"];
  parentPage?: TPage;
};

export const PageEmbedCardRoot: React.FC<Props> = observer((props) => {
  const { embedPageId, storeType, updateAttributes, parentPage } = props;
  const [isCreating, setIsCreating] = useState(!embedPageId);
  const [isAnimating, setIsAnimating] = useState(false);
  const { createPage } = usePageStore(storeType);

  // Handle initial creation using an async effect
  useEffect(() => {
    const createSubPage = async () => {
      if (!parentPage) return;

      // Start animation and creation process
      setIsCreating(true);
      setIsAnimating(true);

      // Create a sub-page
      const payload: Partial<TPage> = {
        access: parentPage.access,
        name: "",
        parent_id: parentPage.id,
      };
      const res = await createPage(payload);
      if (!res?.id) return;
      updateAttributes?.({ entity_identifier: res.id ?? "", workspace_identifier: res.workspace });

      // When creation is done, mark creation complete
      setIsCreating(false);
    };

    if (!embedPageId) {
      createSubPage();
    } else {
      setIsCreating(false);
      setIsAnimating(false);
    }
  }, [embedPageId, parentPage, createPage, updateAttributes]);

  return (
    <div className="relative">
      {isCreating ? (
        <div className="animate-[fadeIn_0.2s_var(--ease-out-quad)_forwards]">
          <PlaceholderEmbed />
        </div>
      ) : (
        <div className={isAnimating ? "animate-[fadeTransition_0.2s_var(--ease-out-cubic)_forwards]" : ""}>
          <PageEmbedContent {...props} />
        </div>
      )}
    </div>
  );
});

export const PlaceholderEmbed = () => (
  <div className="not-prose relative page-embed cursor-pointer rounded-md py-2 px-2 my-1.5 flex items-center gap-1.5 !no-underline group overflow-hidden">
    <div className="relative z-10">
      <EmptyPageIcon className="size-4" />
    </div>
    <div className="flex-shrink-0 flex items-center gap-3 flex-1 z-10">
      <p className="not-prose text-base font-medium break-words truncate underline decoration-custom-text-300 underline-offset-4">
        Untitled
      </p>
    </div>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-[shimmer_5s_var(--ease-out-cubic)_infinite]" />
  </div>
);
