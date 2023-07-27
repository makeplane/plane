import { useRouter } from "next/router";
import Link from "next/link";

// components
import { ProfileIssuesViewOptions } from "components/profile";

const tabsList = [
  {
    route: "",
    label: "Overview",
  },
  {
    route: "assigned",
    label: "Assigned",
  },
  {
    route: "created",
    label: "Created",
  },
  {
    route: "subscribed",
    label: "Subscribed",
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
                router.pathname.includes(tab.route)
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
