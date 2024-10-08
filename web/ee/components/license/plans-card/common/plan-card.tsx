"use client";

import { observer } from "mobx-react";

type TPlanCard = {
  planName: React.ReactNode;
  planDescription: React.ReactNode;
  button: React.ReactNode;
};

export const PlanCard = observer(({ planName, planDescription, button }: TPlanCard) => (
  <div className="flex gap-2 font-medium items-center justify-between">
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <h4 className="text-xl leading-6 font-bold">{planName}</h4>
      </div>
      <div className="text-sm text-custom-text-200 font-medium">{planDescription}</div>
    </div>
    <div className="flex flex-col gap-1 items-center justify-center">{button}</div>
  </div>
));
