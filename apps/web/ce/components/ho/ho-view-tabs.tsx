import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import useSWR from "swr";
import { cn } from "@plane/utils";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useMyStaffProfile } from "@/plane-web/hooks/use-my-staff-profile";
import { UserService } from "@/services/user.service";

const userService = new UserService();

const HO_VIEW_TABS = [
  { key: "department", label: "Department" },
  { key: "datasheet", label: "Datasheet" },
  { key: "category", label: "Category" },
] as const;

type THoViewKey = (typeof HO_VIEW_TABS)[number]["key"];

export const HoViewTabs = function HoViewTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get("view") as THoViewKey) ?? "department";
  const { currentWorkspace } = useWorkspace();
  const { data: staffProfile, isLoading: profileLoading } = useMyStaffProfile(currentWorkspace?.slug);
  const { data: adminStatus, isLoading: adminLoading } = useSWR("INSTANCE_ADMIN_STATUS", () =>
    userService.currentUserInstanceAdminStatus()
  );

  const loaded = !profileLoading && !adminLoading;
  const isInstanceAdmin = adminStatus?.is_instance_admin ?? false;
  const canSeeDepartment = isInstanceAdmin || (staffProfile?.is_department_manager ?? false);

  // Redirect to datasheet when user has no access to department tab (e.g. first load with no ?view= param)
  useEffect(() => {
    if (loaded && !canSeeDepartment && activeView === "department") {
      setSearchParams({ view: "datasheet" }, { replace: true });
    }
  }, [loaded, canSeeDepartment, activeView, setSearchParams]);

  const visibleTabs = HO_VIEW_TABS.filter((tab) => tab.key !== "department" || canSeeDepartment);

  return (
    <div className="flex items-center gap-1 border-b border-subtle bg-surface-1 px-page-x">
      {visibleTabs.map((tab) => (
        <Link
          key={tab.key}
          to={`?view=${tab.key}`}
          className={cn(
            "px-4 py-2.5 text-13 font-medium border-b-2 -mb-[1px] transition-colors whitespace-nowrap",
            activeView === tab.key
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-secondary hover:text-primary"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};
