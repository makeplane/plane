import React from "react";

export const DropdownOptionsLoader = () => (
  <div className="flex flex-col gap-1 animate-pulse">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="flex h-[1.925rem] w-full rounded px-1 py-1.5 bg-custom-background-90" />
    ))}
  </div>
);
