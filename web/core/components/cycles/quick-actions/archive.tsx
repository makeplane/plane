"use client";

import { FC } from "react";
import { observer } from "mobx-react";

type TCycleQuickActionArchive = {
  cycleId: string;
};

export const CycleQuickActionArchive: FC<TCycleQuickActionArchive> = observer((props) => {
  const {} = props;

  return <div>CycleQuickActionArchive</div>;
});
