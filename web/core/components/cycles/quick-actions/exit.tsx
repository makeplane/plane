"use client";

import { FC } from "react";
import { observer } from "mobx-react";

type TCycleQuickActionEdit = {
  cycleId: string;
};

export const CycleQuickActionEdit: FC<TCycleQuickActionEdit> = observer((props) => {
  const {} = props;

  return <div>CycleQuickActionEdit</div>;
});
