import { useRouter } from "next/router";

// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { ProfileNavbar, ProfileSidebar } from "components/profile";
// ui
import { Breadcrumbs, BreadcrumbItem } from "components/breadcrumbs";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export const ProfileLayout: React.FC<Props> = ({ children, className }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`User Name`} />
        </Breadcrumbs>
      }
    >
      <div className="h-full w-full md:flex md:flex-row-reverse md:overflow-hidden">
        <ProfileSidebar />
        <div className="md:h-full w-full flex flex-col md:overflow-hidden">
          <ProfileNavbar />
          <div className={`md:h-full w-full overflow-hidden ${className}`}>{children}</div>
        </div>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};
