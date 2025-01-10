import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useSticky } from "@/hooks/use-stickies";
import { ContentOverflowWrapper } from "../../core/content-overflow-HOC";
import { StickiesLayout } from "./stickies-list";
import { cn } from "@plane/utils";
import Link from "next/link";

export const StickiesTruncated = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = useParams();
  // hooks
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
      fallback={<></>}
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
      <StickiesLayout workspaceSlug={workspaceSlug.toString()} />
    </ContentOverflowWrapper>
  );
});
