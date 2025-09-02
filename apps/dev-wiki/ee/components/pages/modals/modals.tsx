"use client";

import React from "react";
import { observer } from "mobx-react";
// components
import { EPageStoreType } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";
import { DeleteMultiplePagesModal } from "./delete-multiple-pages-modal";

export type TPageModalsProps = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageModals: React.FC<TPageModalsProps> = observer((props) => {
  const { page, storeType } = props;

  return (
    <>
      <DeleteMultiplePagesModal
        editorRef={page.editor.editorRef}
        isOpen={page.deletePageModal.visible}
        onClose={page.closeDeletePageModal}
        pages={page.deletePageModal.pages}
        storeType={storeType}
      />
    </>
  );
});
