import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane utils
import { cn } from "@plane/utils";
// hooks
import { useSticky } from "@/hooks/use-stickies";
// components
import { ContentOverflowWrapper } from "../../core/content-overflow-HOC";
import { StickiesLayout } from "./stickies-list";

export const StickiesTruncated = observer(() => {
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { fetchWorkspaceStickies } = useSticky();

  useSWR(
    workspaceSlug ? `WORKSPACE_STICKIES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceStickies(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return (
    <ContentOverflowWrapper
      maxHeight={620}
      containerClassName="pb-2 box-border"
      fallback={null}
      customButton={
        <Link
          href={`/${workspaceSlug}/stickies`}
          className={cn(
            "gap-1 w-full text-custom-primary-100 text-sm font-medium transition-opacity duration-300 bg-custom-background-90/20"
          )}
        >
          Show all
        </Link>
      }
    >
      <StickiesLayout workspaceSlug={workspaceSlug?.toString()} />
    </ContentOverflowWrapper>
  );
});
