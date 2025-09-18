import { Loader } from "@plane/ui";

type PageCommentReplyLoadingSkeletonProps = {
  commentReplyCount: number;
};

export const PageCommentReplyLoadingSkeleton = ({ commentReplyCount }: PageCommentReplyLoadingSkeletonProps) => (
  <Loader>
    {Array.from({ length: commentReplyCount }, (_, index) => (
      <div key={index} className="relative w-full mb-4">
        <div className="space-y-2">
          {/* User avatar and timestamp */}
          <div className="flex items-center gap-2">
            <div className="rounded-full overflow-hidden">
              <Loader.Item width="24px" height="24px" />
            </div>
            <Loader.Item width={index % 2 === 0 ? "25%" : "30%"} height="12px" />
          </div>
          {/* Reply content */}
          <div className="pl-8 space-y-1">
            <Loader.Item width={index % 3 === 0 ? "75%" : index % 3 === 1 ? "90%" : "60%"} height="14px" />
            <Loader.Item width={index % 2 === 0 ? "45%" : "60%"} height="14px" />
            {index % 3 === 1 && <Loader.Item width="35%" height="14px" />}
          </div>
        </div>
      </div>
    ))}
  </Loader>
);
