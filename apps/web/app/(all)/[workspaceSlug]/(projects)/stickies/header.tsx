"use client";

import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import { Breadcrumbs, Button, Header, RecentStickyIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";

// hooks
import { StickySearch } from "@/components/stickies/modal/search";
import { useStickyOperations } from "@/components/stickies/sticky/use-operations";
// plane-web
import { useSticky } from "@/hooks/use-stickies";

export const WorkspaceStickyHeader = observer(() => {
  const { workspaceSlug } = useParams();
  // hooks
  const { creatingSticky, toggleShowNewSticky } = useSticky();
  const { stickyOperations } = useStickyOperations({ workspaceSlug: workspaceSlug?.toString() });

  return (
    <>
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-2.5">
            <Breadcrumbs>
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    label={`Stickies`}
                    icon={<RecentStickyIcon className="size-5 rotate-90 text-custom-text-200" />}
                  />
                }
              />
            </Breadcrumbs>
          </div>
        </Header.LeftItem>

        <Header.RightItem>
          <StickySearch />
          <Button
            variant="primary"
            size="sm"
            className="items-center gap-1"
            onClick={() => {
              toggleShowNewSticky(true);
              stickyOperations.create();
            }}
            loading={creatingSticky}
          >
            Add sticky
          </Button>
        </Header.RightItem>
      </Header>
    </>
  );
});
