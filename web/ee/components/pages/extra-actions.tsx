import React from "react";
import { observer } from "mobx-react";
// types
import { TPageHeaderExtraActionsProps } from "@/ce/components/pages";
import { PagePublishActions } from "./publish-actions";

export const PageDetailsHeaderExtraActions: React.FC<TPageHeaderExtraActionsProps> = observer((props) => {
  const { page, storeType } = props;

  if (!page.canCurrentUserEditPage) return null;
  return <PagePublishActions page={page} storeType={storeType} />;
});
