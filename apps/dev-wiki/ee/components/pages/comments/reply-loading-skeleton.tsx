import { Loader } from "@plane/ui";

type PageCommentReplyLoadingSkeletonProps = {
  commentReplyCount: number;
};
export const PageCommentReplyLoadingSkeleton = ({ commentReplyCount }: PageCommentReplyLoadingSkeletonProps) => (
  <Loader className="space-y-3">
    {Array.from({ length: commentReplyCount }, (_, index) => (
      <div key={index} className="relative w-full">
        {index > 0 && (
          <div className="size-6 relative flex items-center justify-center">
            <div aria-hidden className="pointer-events-none h-5 w-0.5 bg-custom-border-300" />
          </div>
        )}
        <div className="space-y-2">
          {/* User avatar and timestamp */}
          <div className="flex items-center gap-2">
            <Loader.Item width="20px" height="20px" />
            <Loader.Item width={index % 2 === 0 ? "25%" : "30%"} height="12px" />
          </div>
          {/* Reply content */}
          <Loader.Item width={index % 3 === 0 ? "75%" : index % 3 === 1 ? "90%" : "60%"} height="14px" />
          <Loader.Item width={index % 2 === 0 ? "45%" : "60%"} height="14px" />
          {index % 3 === 1 && <Loader.Item width="35%" height="14px" />}
        </div>
      </div>
    ))}
    <div className="size-6 relative flex items-center justify-center pb-3">
      <div aria-hidden className="pointer-events-none h-5 w-0.5 bg-custom-border-300" />
    </div>
  </Loader>
);
