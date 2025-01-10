import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useSticky } from "@/hooks/use-stickies";
import { ContentOverflowWrapper } from "../../core/content-overflow-HOC";
import { StickiesLayout } from "./stickies-list";

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
      buttonClassName="bg-custom-background-90/20"
      customButtonAction={() => router.push(`/${workspaceSlug}/stickies`)}
    >
      <StickiesLayout workspaceSlug={workspaceSlug.toString()} />
    </ContentOverflowWrapper>
  );
});
