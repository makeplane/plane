"use client";

import { FC } from "react";
import { observer } from "mobx-react";

type TAppliedFilters = {
  workspaceSlug: string;
};

export const AppliedFilters: FC<TAppliedFilters> = observer((props) => {
  const { workspaceSlug } = props;

  if (workspaceSlug) return <></>;
  return <div className="border-b border-custom-border-200 px-5 py-3">Applied Filters</div>;
});
