import Link from "next/link";
import { useRouter } from "next/router";

type Props = {
  profilePage?: boolean;
};

const SettingsNavbar: React.FC<Props> = ({ profilePage = false }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const workspaceLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: "General",
      href: `/${workspaceSlug}/settings`,
    },
    {
      label: "Members",
      href: `/${workspaceSlug}/settings/members`,
    },
    {
      label: "Billing & Plans",
      href: `/${workspaceSlug}/settings/billing`,
    },
    {
      label: "Integrations",
      href: `/${workspaceSlug}/settings/integrations`,
    },
    {
      label: "Import/Export",
      href: `/${workspaceSlug}/settings/import-export`,
    },
  ];

  const projectLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: "General",
      href: `/${workspaceSlug}/projects/${projectId}/settings`,
    },
    {
      label: "Control",
      href: `/${workspaceSlug}/projects/${projectId}/settings/control`,
    },
    {
      label: "Members",
      href: `/${workspaceSlug}/projects/${projectId}/settings/members`,
    },
    {
      label: "Features",
      href: `/${workspaceSlug}/projects/${projectId}/settings/features`,
    },
    {
      label: "States",
      href: `/${workspaceSlug}/projects/${projectId}/settings/states`,
    },
    {
      label: "Labels",
      href: `/${workspaceSlug}/projects/${projectId}/settings/labels`,
    },
    {
      label: "Integrations",
      href: `/${workspaceSlug}/projects/${projectId}/settings/integrations`,
    },
    {
      label: "Estimates",
      href: `/${workspaceSlug}/projects/${projectId}/settings/estimates`,
    },
  ];

  const profileLinks: Array<{
    label: string;
    href: string;
  }> = [
    {
      label: "General",
      href: `/${workspaceSlug}/me/profile`,
    },
    {
      label: "Activity",
      href: `/${workspaceSlug}/me/profile/activity`,
    },
    {
      label: "Preferences",
      href: `/${workspaceSlug}/me/profile/preferences`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {(profilePage ? profileLinks : projectId ? projectLinks : workspaceLinks).map((link) => (
        <Link key={link.href} href={link.href}>
          <a>
            <div
              className={`rounded-3xl border border-brand-base px-5 py-1.5 text-sm sm:px-7 sm:py-2 sm:text-base ${
                (
                  link.label === "Import/Export"
                    ? router.asPath.includes(link.href)
                    : router.asPath === link.href
                )
                  ? "border-brand-accent bg-brand-accent text-white"
                  : "border-brand-base bg-brand-surface-2 hover:bg-brand-surface-1"
              }`}
            >
              {link.label}
            </div>
          </a>
        </Link>
      ))}
    </div>
  );
};

export default SettingsNavbar;
