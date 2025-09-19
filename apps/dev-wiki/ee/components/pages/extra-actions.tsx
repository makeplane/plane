import React from "react";
import { observer } from "mobx-react";
// plane imports
import { TPageHeaderExtraActionsProps } from "@/ce/components/pages/extra-actions";
import { PagePublishActions } from "./publish-actions";

export const PageDetailsHeaderExtraActions: React.FC<TPageHeaderExtraActionsProps> = observer((props) => {
  const { page, storeType } = props;

  if (!page.canCurrentUserEditPage) return null;
  return <PagePublishActions page={page} storeType={storeType} />;
});
