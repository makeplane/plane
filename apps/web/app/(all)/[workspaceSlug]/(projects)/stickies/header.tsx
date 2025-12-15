import { observer } from "mobx-react";
import { useParams } from "next/navigation";
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

export const WorkspaceStickyHeader = observer(function WorkspaceStickyHeader() {
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
                    icon={<RecentStickyIcon className="size-5 rotate-90 text-secondary" />}
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
            size="lg"
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
