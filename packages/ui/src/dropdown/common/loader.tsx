import { range } from "lodash-es";
import React from "react";

export function DropdownOptionsLoader() {
  return (
    <div className="flex animate-pulse flex-col gap-1">
      {range(6).map((index) => (
        <div key={index} className="flex h-[1.925rem] w-full rounded-sm bg-surface-2 px-1 py-1.5" />
      ))}
    </div>
  );
}
