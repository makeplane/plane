// react
import React from "react";
// next
import Image from "next/image";
import { useRouter } from "next/router";
// ui
import { Button } from "@plane/ui";
// assets
import emptyApiTokens from "public/empty-state/api-token.svg";

const ApiTokenEmptyState = () => {
  const router = useRouter();
  return (
    <div className={`flex items-center justify-center mx-auto rounded-sm border border-custom-border-200 bg-custom-background-90 py-10 px-16 w-full`}>
      <div className="text-center flex flex-col items-center w-full">
        <Image src={emptyApiTokens} className="w-52 sm:w-60" alt="empty" />
        <h6 className="text-xl font-semibold mt-6 sm:mt-8 mb-3">No API Tokens</h6>
        {
          <p className="text-custom-text-300 mb-7 sm:mb-8">
            Create API tokens for safe and easy data sharing with external apps, maintaining control and security
          </p>
        }
        <Button
          className="flex items-center gap-1.5"
          onClick={() => {
            router.push(`${router.asPath}/create/`);
          }}
        >
          Add Token
        </Button>
      </div>
    </div>
  );
};

export default ApiTokenEmptyState;
