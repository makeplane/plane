import { useRouter } from "next/router";
import Link from "next/link";

// components
import { ProfileIssuesViewOptions } from "components/profile";

const tabsList = [
  {
    route: "",
    label: "Overview",
    selected: "/[workspaceSlug]/profile/[userId]",
  },
  {
    route: "assigned",
    label: "Assigned",
    selected: "/[workspaceSlug]/profile/[userId]/assigned",
  },
  {
    route: "created",
    label: "Created",
    selected: "/[workspaceSlug]/profile/[userId]/created",
  },
  {
    route: "subscribed",
    label: "Subscribed",
    selected: "/[workspaceSlug]/profile/[userId]/subscribed",
  },
];

export const ProfileNavbar = () => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  return (
    <div className="px-4 sm:px-5 flex items-center justify-between gap-4 border-b border-custom-border-300">
      <div className="flex items-center overflow-x-scroll">
        {tabsList.map((tab) => (
          <Link key={tab.route} href={`/${workspaceSlug}/profile/${userId}/${tab.route}`}>
            <a
              className={`border-b-2 p-4 text-sm font-medium outline-none whitespace-nowrap ${
                router.pathname === tab.selected
                  ? "border-custom-primary-100 text-custom-primary-100"
                  : "border-transparent"
              }`}
            >
              {tab.label}
            </a>
          </Link>
        ))}
      </div>
      <ProfileIssuesViewOptions />
    </div>
  );
};
