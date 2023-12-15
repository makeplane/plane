import React from "react";
import Image from "next/image";
// ui
import { Button } from "@plane/ui";
// assets
import emptyApiTokens from "public/empty-state/api-token.svg";

type Props = {
  onClick: () => void;
};

export const ApiTokenEmptyState: React.FC<Props> = (props) => {
  const { onClick } = props;

  return (
    <div
      className={`mx-auto flex w-full items-center justify-center rounded-sm border border-custom-border-200 bg-custom-background-90 px-16 py-10 lg:w-3/4`}
    >
      <div className="flex w-full flex-col items-center text-center">
        <Image src={emptyApiTokens} className="w-52 sm:w-60" alt="empty" />
        <h6 className="mb-3 mt-6 text-xl font-semibold sm:mt-8">No API tokens</h6>
        <p className="mb-7 text-custom-text-300 sm:mb-8">
          Create API tokens for safe and easy data sharing with external apps, maintaining control and security.
        </p>
        <Button className="flex items-center gap-1.5" onClick={onClick}>
          Add token
        </Button>
      </div>
    </div>
  );
};
