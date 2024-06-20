import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Button } from "@plane/ui";
// helpers
import { SPACE_BASE_URL } from "@/helpers/common.helper";
// hooks
import { usePage } from "@/hooks/store";
// plane web components
import { PublishPageModal } from "@/plane-web/components/pages";
// plane web hooks
import { usePublishPage } from "@/plane-web/hooks/store";

export const PageDetailsHeaderExtraActions = observer(() => {
  // states
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  // params
  const { projectId, pageId } = useParams();
  // store hooks
  const { anchor, isCurrentUserOwner } = usePage(pageId.toString());
  const { fetchProjectPagePublishSettings, getPagePublishSettings, publishProjectPage, unpublishProjectPage } =
    usePublishPage();
  // derived values
  const isDeployed = !!anchor;
  const pagePublishSettings = getPagePublishSettings(pageId.toString());

  const publishLink = `${SPACE_BASE_URL}/pages/${anchor}`;

  return (
    <>
      <PublishPageModal
        anchor={anchor}
        fetchPagePublishSettings={async () =>
          await fetchProjectPagePublishSettings(projectId.toString(), pageId.toString())
        }
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        pagePublishSettings={pagePublishSettings}
        publishPage={(data) => publishProjectPage(projectId.toString(), pageId.toString(), data)}
        unpublishPage={() => unpublishProjectPage(projectId.toString(), pageId.toString())}
      />
      {isDeployed && (
        <a
          href={publishLink}
          className="px-3 py-1.5 bg-green-500/20 text-green-500 rounded text-xs font-medium flex items-center gap-1.5"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="flex-shrink-0 rounded-full size-1.5 bg-green-500" />
          Live
        </a>
      )}
      {isCurrentUserOwner && (
        <Button variant="outline-primary" size="sm" onClick={() => setIsPublishModalOpen(true)}>
          Publish
        </Button>
      )}
    </>
  );
});
