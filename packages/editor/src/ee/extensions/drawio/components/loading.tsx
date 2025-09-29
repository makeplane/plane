import { FC } from "react";

type DrawioIframeLoadingProps = {
  LoadingComponent?: React.ComponentType;
};

export const DrawioIframeLoading: FC<DrawioIframeLoadingProps> = ({ LoadingComponent }) => (
  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-custom-background-100 rounded-xl z-10">
    <div className="flex flex-col items-center gap-4">
      {LoadingComponent ? (
        <LoadingComponent />
      ) : (
        <div className="w-10 h-10 border-2 border-custom-border-200 border-t-custom-primary-300 rounded-full animate-spin" />
      )}
    </div>
  </div>
);
