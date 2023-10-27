import { useRouter } from "next/router";
// components
import { BreadcrumbItem, Breadcrumbs } from "@plane/ui";

export const ProfilePreferencesHeader = () => {
  const router = useRouter();

  return (
    <div
      className={`relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
    >
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div>
          <Breadcrumbs onBack={() => router.back()}>
            <BreadcrumbItem title="My Profile Preferences" />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
};
