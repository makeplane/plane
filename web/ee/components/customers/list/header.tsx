"use client";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Button, CustomersIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useWorkspace, useUserPermissions, useCommandPalette } from "@/hooks/store";
// plane web components
import { CustomerSearch } from "@/plane-web/components/customers/list";

export const CustomersListHeader = observer(() => {
  const { workspaceSlug } = useParams();
  // i18n
  const { t } = useTranslation();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  const { toggleCreateCustomerModal } = useCommandPalette();
  // derived values
  const workspaceId = currentWorkspace?.id || undefined;
  const hasAdminLevelPermissions = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!workspaceSlug || !workspaceId) return <></>;

  return (
    <>
      <div className="flex-shrink-0 relative z-10 flex h-[3.75rem] w-full">
        <div className="w-full h-full relative flex justify-between items-center gap-x-2 gap-y-4">
          <div className="flex items-center gap-4">
            {/* bread crumps */}
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    label={t("customers.label", { count: 2 })} // count for pluralization
                    icon={<CustomersIcon className="h-4 w-4 text-custom-text-300" />}
                  />
                }
              />
            </Breadcrumbs>
          </div>
          <div className="flex items-center gap-4">
            <CustomerSearch />
            {hasAdminLevelPermissions && (
              <Button
                size="sm"
                onClick={() => toggleCreateCustomerModal({ isOpen: true, customerId: undefined })}
                className="items-center gap-1"
              >
                <span className="hidden md:inline-block">{t("customers.create.label")}</span>
                <span className="inline-block md:hidden">{t("customers.label", { count: 1 })}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
