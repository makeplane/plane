"use client";

import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { RecentStickyIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { StickySearch } from "@/components/stickies/modal/search";
import { useStickyOperations } from "@/components/stickies/sticky/use-operations";
// hooks
import { useSticky } from "@/hooks/use-stickies";

type Props = {
  workspaceSlug: string;
};

export const WorkspaceStickyHeader = observer(({ workspaceSlug }: Props) => {
  // hooks
  const { creatingSticky, toggleShowNewSticky } = useSticky();
  const { stickyOperations } = useStickyOperations({ workspaceSlug });

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
