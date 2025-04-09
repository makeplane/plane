"use client";
import { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PanelRight } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// ui
import { ICustomSearchSelectOption } from "@plane/types";
import { Breadcrumbs, CustomSearchSelect, Header, InitiativeIcon } from "@plane/ui";
// components
import { BreadcrumbLink, SwitcherLabel } from "@/components/common";
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
    initiative: { getInitiativeById, initiativeIds },
  } = useInitiatives();
  const { initiativesSidebarCollapsed, toggleInitiativesSidebar } = useAppTheme();

  const { t } = useTranslation();
  // derived values
  const initiativesDetails = initiativeId ? getInitiativeById(initiativeId.toString()) : undefined;

  const switcherOptions = initiativeIds
    .map((id) => {
      const _initiative = getInitiativeById(id);
      if (!_initiative?.id || !_initiative?.name) return null;
      return {
        value: _initiative.id,
        query: _initiative.name,
        content: (
          <Link href={`/${workspaceSlug}/initiatives/${_initiative.id}`}>
            <SwitcherLabel name={_initiative.name} LabelIcon={InitiativeIcon} />
          </Link>
        ),
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

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
            <Breadcrumbs.BreadcrumbItem
              type="component"
              component={
                <CustomSearchSelect
                  label={<SwitcherLabel name={initiativesDetails?.name} LabelIcon={InitiativeIcon} />}
                  value={initiativeId.toString()}
                  onChange={() => {}}
                  options={switcherOptions}
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        {initiativesDetails && (
          <div ref={parentRef} className="flex items-center gap-2">
            <button
              type="button"
              className="p-1 rounded outline-none hover:bg-custom-sidebar-background-80 bg-custom-background-80/70"
              onClick={() => toggleInitiativesSidebar()}
            >
              <PanelRight
                className={cn("size-4 cursor-pointer", {
                  "text-custom-primary-100": !initiativesSidebarCollapsed,
                })}
              />
            </button>
            <InitiativeQuickActions
              workspaceSlug={workspaceSlug.toString()}
              parentRef={parentRef}
              initiative={initiativesDetails}
              customClassName="p-1 rounded outline-none hover:bg-custom-sidebar-background-80 bg-custom-background-80/70"
            />
          </div>
        )}
      </Header.RightItem>
    </Header>
  );
});
