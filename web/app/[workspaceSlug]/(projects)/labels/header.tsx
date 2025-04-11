"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { Home, Tag } from "lucide-react";
// images
import githubBlackImage from "/public/logos/github-black.png";
import githubWhiteImage from "/public/logos/github-white.png";
// ui
import { EUserPermissions, EUserPermissionsLevel, GITHUB_REDIRECTED } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// constants
// hooks
import { useUserPermissions } from "@/hooks/store";
import { labelFormState } from "@/components/labels/stores";

export const WorkspaceLabelHeader = () => {
  // hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isEditable = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE);

  const newLabel = () => {
    labelFormState.setIsUpdating(false);
    labelFormState.setLabelForm(true);
  };
  return (
    <>
      <Header>
        <Header.LeftItem>
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink label={t("labels")} icon={<Tag className="h-4 w-4 text-custom-text-300" />} />
                }
              />
            </Breadcrumbs>
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          {isEditable && (
            <Button variant="primary" onClick={newLabel} size="sm">
              {t("common.add_label")}
            </Button>
          )}
        </Header.RightItem>
      </Header>
    </>
  );
};
