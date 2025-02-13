"use client";
import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Sidebar } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// ui
import { Breadcrumbs, Header, InitiativeIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane-web
import { InitiativeQuickActions } from "@/plane-web/components/initiatives/components/quick-actions";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

export const InitiativesDetailsHeader = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, initiativeId } = useParams();
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const {
    initiative: { getInitiativeById },
  } = useInitiatives();
  const { initiativesSidebarCollapsed, toggleInitiativesSidebar } = useAppTheme();

  const { t } = useTranslation();
  // derived values
  const initiativesDetails = initiativeId ? getInitiativeById(initiativeId.toString()) : undefined;

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs onBack={router.back}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={t("initiatives.label")}
                  href={`/${workspaceSlug}/initiatives`}
                  icon={<InitiativeIcon className="size-4" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label={initiativesDetails?.name} />} />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        {initiativesDetails && (
          <div ref={parentRef} className="flex items-center gap-2">
            <InitiativeQuickActions
              workspaceSlug={workspaceSlug.toString()}
              parentRef={parentRef}
              initiative={initiativesDetails}
            />
            <Sidebar
              className={cn("size-4 cursor-pointer", {
                "text-custom-primary-100": !initiativesSidebarCollapsed,
              })}
              onClick={() => toggleInitiativesSidebar()}
            />
          </div>
        )}
      </Header.RightItem>
    </Header>
  );
});
