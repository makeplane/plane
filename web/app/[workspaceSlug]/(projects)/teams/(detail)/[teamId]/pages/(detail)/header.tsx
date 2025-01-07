"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
// plane types
import { TLogoProps } from "@plane/types";
// ui
import {
  Breadcrumbs,
  EmojiIconPicker,
  EmojiIconPickerTypes,
  Header,
  Loader,
  setToast,
  TeamsIcon,
  TOAST_TYPE,
} from "@plane/ui";
// plane uitls
import { convertHexEmojiToDecimal } from "@plane/utils";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { PageEditInformationPopover } from "@/components/pages";
// helpers
import { getPageName } from "@/helpers/page.helper";
// plane web hooks
import { useTeams, useTeamPages } from "@/plane-web/hooks/store";

export const TeamPageDetailHeader: React.FC = observer(() => {
  // states
  const [isOpen, setIsOpen] = useState(false);
  // router
  const { workspaceSlug, teamId, pageId } = useParams();
  // store hooks
  const { loader, getTeamById } = useTeams();
  const { getPageById } = useTeamPages();
  // derived values
  const team = getTeamById(teamId?.toString());
  const page = team && pageId ? getPageById(team.id, pageId.toString()) : null;

  const handlePageLogoUpdate = async (data: TLogoProps) => {
    if (data) {
      page
        ?.updatePageLogo(data)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Logo Updated successfully.",
          });
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Something went wrong. Please try again.",
          });
        });
    }
  };

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
                  href={`/${workspaceSlug}/teams`}
                  label="Teams"
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
                  ) : team ? (
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/teams/${teamId}`}
                      label={team.name}
                      icon={team.logo_props && <Logo logo={team.logo_props} />}
                    />
                  ) : null}
                </>
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teams/${teamId}/pages`}
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
                      onChange={(val) => {
                        let logoValue = {};

                        if (val?.type === "emoji")
                          logoValue = {
                            value: convertHexEmojiToDecimal(val.value.unified),
                            url: val.value.imageUrl,
                          };
                        else if (val?.type === "icon") logoValue = val.value;

                        handlePageLogoUpdate({
                          in_use: val?.type,
                          [val?.type]: logoValue,
                        }).finally(() => setIsOpen(false));
                      }}
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
