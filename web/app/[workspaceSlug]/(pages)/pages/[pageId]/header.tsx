"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
// types
import { TLogoProps } from "@plane/types";
// ui
import { Breadcrumbs, Button, EmojiIconPicker, EmojiIconPickerTypes, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
// helpers
import { SPACE_BASE_URL } from "@/helpers/common.helper";
import { convertHexEmojiToDecimal } from "@/helpers/emoji.helper";
import { getPageName } from "@/helpers/page.helper";
// plane web components
import { PublishPageModal } from "@/plane-web/components/pages";
// plane web hooks
import { usePublishPage, useWorkspacePageDetails } from "@/plane-web/hooks/store";

export interface IPagesHeaderProps {
  showButton?: boolean;
}

export const PageDetailsHeader = observer(() => {
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  // params
  const { workspaceSlug, pageId } = useParams();
  // store hooks
  const { anchor, isCurrentUserOwner, name, logo_props, updatePageLogo } = useWorkspacePageDetails(
    pageId?.toString() ?? ""
  );
  const { fetchWorkspacePagePublishSettings, getPagePublishSettings, publishWorkspacePage, unpublishWorkspacePage } =
    usePublishPage();
  // derived values
  const isDeployed = !!anchor;
  const pagePublishSettings = getPagePublishSettings(pageId.toString());

  const handlePageLogoUpdate = async (data: TLogoProps) => {
    if (data) {
      updatePageLogo(data)
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

  const publishLink = `${SPACE_BASE_URL}/pages/${anchor}`;

  return (
    <>
      <PublishPageModal
        anchor={anchor}
        fetchPagePublishSettings={async () => await fetchWorkspacePagePublishSettings(pageId.toString())}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        pagePublishSettings={pagePublishSettings}
        publishPage={(data) => publishWorkspacePage(pageId.toString(), data)}
        unpublishPage={() => unpublishWorkspacePage(pageId.toString())}
      />
      <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 py-4">
        <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href={`/${workspaceSlug}/pages`}
                    label="Pages"
                    icon={<FileText className="size-4 text-custom-text-300" />}
                  />
                }
              />
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    label={getPageName(name)}
                    icon={
                      <EmojiIconPicker
                        isOpen={isOpen}
                        handleToggle={(val: boolean) => setIsOpen(val)}
                        className="flex items-center justify-center"
                        buttonClassName="flex items-center justify-center"
                        label={
                          <>
                            {logo_props?.in_use ? (
                              <Logo logo={logo_props} size={16} type="lucide" />
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
                          logo_props?.in_use && logo_props.in_use === "icon" ? logo_props?.icon?.color : undefined
                        }
                        defaultOpen={
                          logo_props?.in_use && logo_props?.in_use === "emoji"
                            ? EmojiIconPickerTypes.EMOJI
                            : EmojiIconPickerTypes.ICON
                        }
                      />
                    }
                  />
                }
              />
            </Breadcrumbs>
          </div>
        </div>
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
            {isDeployed ? "Unpublish" : "Publish"}
          </Button>
        )}
      </div>
    </>
  );
});
