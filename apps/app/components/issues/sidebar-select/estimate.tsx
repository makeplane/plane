import React from "react";

// ui
import { IssueEstimateSelect } from "components/issues/select";

// icons
import { BanknotesIcon } from "@heroicons/react/24/outline";

// types
import { UserAuth } from "types";
// constants

type Props = {
  value: number;
  onChange: (val: number) => void;
  userAuth: UserAuth;
};



export const SidebarEstimateSelect: React.FC<Props> = ({ value, onChange, userAuth }) => {
  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <BanknotesIcon className="h-4 w-4 flex-shrink-0" />
        <p>Estimate</p>
      </div>
      <div className="sm:basis-1/2">
        <IssueEstimateSelect chevron={true} value={value} onChange={onChange} />
      </div>
    </div>
  );
};