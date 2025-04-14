"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
// plane imports
import { Breadcrumbs, EmojiIconPicker, EmojiIconPickerTypes, Header, Loader, TeamsIcon } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { PageEditInformationPopover } from "@/components/pages";
// helpers
import { getPageName } from "@/helpers/page.helper";
// plane web hooks
import { useTeamspaces, usePage, EPageStoreType } from "@/plane-web/hooks/store";

export const TeamspacePageDetailHeader: React.FC = observer(() => {
  // states
  const [isOpen, setIsOpen] = useState(false);
  // router
  const { workspaceSlug, teamspaceId, pageId } = useParams();
  // store hooks
  const { loader, getTeamspaceById } = useTeamspaces();
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType: EPageStoreType.TEAMSPACE,
  });
  // derived values
  const teamspace = getTeamspaceById(teamspaceId?.toString());

  if (!workspaceSlug) return;
  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-4">
          {/* bread crumps */}
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces`}
                  label="Teamspaces"
                  icon={<TeamsIcon className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <>
                  {loader === "init-loader" ? (
                    <Loader.Item height="20px" width="140px" />
                  ) : teamspace ? (
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/teamspaces/${teamspaceId}`}
                      label={teamspace.name}
                      icon={teamspace.logo_props && <Logo logo={teamspace.logo_props} />}
                    />
                  ) : null}
                </>
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces/${teamspaceId}/pages`}
                  label="Pages"
                  icon={<FileText className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={getPageName(page?.name)}
                  icon={
                    <EmojiIconPicker
                      isOpen={isOpen}
                      handleToggle={(val: boolean) => setIsOpen(val)}
                      className="flex items-center justify-center"
                      buttonClassName="flex items-center justify-center"
                      label={
                        <>
                          {page?.logo_props?.in_use ? (
                            <Logo logo={page.logo_props} size={16} type="lucide" />
                          ) : (
                            <FileText className="size-4 text-custom-text-300" />
                          )}
                        </>
                      }
                      onChange={(val) => page?.updatePageLogo?.(val)}
                      defaultIconColor={
                        page?.logo_props?.in_use && page.logo_props.in_use === "icon"
                          ? page.logo_props?.icon?.color
                          : undefined
                      }
                      defaultOpen={
                        page?.logo_props?.in_use && page.logo_props?.in_use === "emoji"
                          ? EmojiIconPickerTypes.EMOJI
                          : EmojiIconPickerTypes.ICON
                      }
                      disabled={!page?.isContentEditable}
                    />
                  }
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>{page && <PageEditInformationPopover page={page} />}</Header.RightItem>
    </Header>
  );
});
