import React from "react";
import { Loader } from "..";

type EmbedLoadingProps = {
  showLoading?: boolean;
};

export const EmbedLoading: React.FC<EmbedLoadingProps> = ({ showLoading = true }) => {
  if (!showLoading) return null;

  return (
    <div className="flex justify-center items-center w-full h-full my-2">
      <Loader className="w-full h-full">
        <Loader.Item width="100%" height="100%" className="min-h-[36px]" />
      </Loader>
    </div>
  );
};
