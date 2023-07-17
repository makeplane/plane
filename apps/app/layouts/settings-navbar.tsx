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
    {
      label: "Automations",
      href: `/${workspaceSlug}/projects/${projectId}/settings/automations`,
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
              className={`rounded-full border px-5 py-1.5 text-sm outline-none ${
                (
                  link.label === "Import/Export"
                    ? router.asPath.includes(link.href)
                    : router.asPath === link.href
                )
                  ? "border-custom-primary bg-custom-primary text-white"
                  : "border-custom-border-300 bg-custom-background-100 hover:bg-custom-background-90"
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
