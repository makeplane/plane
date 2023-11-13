import { FC } from "react";
import { useRouter } from "next/router";

// ui
import { Breadcrumbs } from "@plane/ui";
import { UserCircle2 } from "lucide-react";
// hooks
import { observer } from "mobx-react-lite";

export interface IUserProfileHeader {
  title: string;
}

export const UserProfileHeader: FC<IUserProfileHeader> = observer((props) => {
  const { title } = props;
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div className="relative flex w-full flex-shrink-0 flex-row z-10 h-[3.75rem] items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex items-center gap-2 flex-grow w-full whitespace-nowrap overflow-ellipsis">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              label="Profile"
              icon={<UserCircle2 className="h-4 w-4 text-custom-text-300" />}
              link={`/${workspaceSlug}/me/profile`}
            />
            <Breadcrumbs.BreadcrumbItem type="text" label={title} />
          </Breadcrumbs>
        </div>
      </div>
    </div>
  );
});
