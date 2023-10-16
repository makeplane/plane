import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
// components
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";

export const ProfilePreferencesHeader = () => {
  const router = useRouter();

  return (
    <div
      className={`relative flex w-full flex-shrink-0 flex-row z-10 items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
    >
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div className="block md:hidden">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded border border-custom-border-200"
            onClick={() => router.back()}
          >
            <ArrowLeft fontSize={14} strokeWidth={2} />
          </button>
        </div>
        <div>
          <Breadcrumbs>
            <BreadcrumbItem title="My Profile Preferences" />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
};
