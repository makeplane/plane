"use client";

import { FC } from "react";

export const UserMappingRoot: FC = (props) => {
  const {} = props;

  return (
    <div className="relative space-y-2">
      {/* heading */}
      <div className="text-sm font-medium text-custom-text-200">User Mapping</div>

      {/* content */}
      <div className="border border-custom-border-200 rounded divide-y divide-custom-border-200">
        <div className="relative text-base flex items-center bg-custom-background-90 font-medium">
          <div className="p-2 px-3 w-full">Plane Users</div>
          <div className="p-2 px-3 w-full">Github users</div>
        </div>
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="relative text-base flex items-center">
            <div className="p-2 px-3 w-full text-custom-text-200">Plane Member</div>
            <div className="p-2 px-3 w-full">Github Member Dropdown</div>
          </div>
        ))}
      </div>
    </div>
  );
};
