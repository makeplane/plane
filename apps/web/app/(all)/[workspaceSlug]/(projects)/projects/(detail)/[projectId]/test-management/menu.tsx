"use client";

import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";
import { cn } from "@plane/utils";
import { RepositorySelect } from "./repository-select";
import { isTMOverviewActive, tmProjectBasePath } from "./route-helpers";

type TMenuItem = {
  key: string;
  label: string;
  href: (workspaceSlug: string, projectId: string) => string;
  isActive: (pathname: string, workspaceSlug: string, projectId: string) => boolean;
};

const MENU_ITEMS: TMenuItem[] = [
  {
    key: "overview",
    label: "测试用例库",
    href: (ws, pid) => `/${ws}/projects/${pid}/test-management`,
    isActive: (pathname, ws, pid) => isTMOverviewActive(pathname, ws, pid),
  },
  {
    key: "plans",
    label: "测试计划",
    href: (ws, pid) => `/${ws}/projects/${pid}/test-management/plans`,
    isActive: (pathname, ws, pid) => pathname.startsWith(`/${ws}/projects/${pid}/test-management/plans`),
  },
  {
    key: "cases",
    label: "测试用例",
    href: (ws, pid) => `/${ws}/projects/${pid}/test-management/cases`,
    isActive: (pathname, ws, pid) => pathname.startsWith(`/${ws}/projects/${pid}/test-management/cases`),
  },
  {
    key: "reviews",
    label: "用例评审",
    href: (ws, pid) => `/${ws}/projects/${pid}/test-management/reviews`,
    isActive: (pathname, ws, pid) => pathname.startsWith(`/${ws}/projects/${pid}/test-management/reviews`),
  },
];

export const TestManagementMenuBar = () => {
  const pathname = usePathname();
  const { workspaceSlug, projectId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRepositoryId, setSelectedRepositoryId] = React.useState<string | null>(null);
  const [repositoryIdFromStorage, setRepositoryIdFromStorage] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  const ws = workspaceSlug?.toString() || "";
  const pid = projectId?.toString() || "";
  const isOverviewActive = isTMOverviewActive(pathname, ws, pid);

  const repositoryIdFromUrl = searchParams.get("repositoryId");

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!isClient) return;
    const storedRepositoryId = sessionStorage.getItem("selectedRepositoryId");
    setRepositoryIdFromStorage(storedRepositoryId);
  }, [isClient, pathname]);

  const defaultRepositoryId = repositoryIdFromStorage || repositoryIdFromUrl;

  const handleRepositoryChange = React.useCallback(
    (repo: { id: string | null; name?: string | null }) => {
      setSelectedRepositoryId(repo.id);
      if (repo.id) {
        sessionStorage.setItem("selectedRepositoryId", repo.id);
        if (repo.name) sessionStorage.setItem("selectedRepositoryName", repo.name);
        router.push(`/${ws}/projects/${pid}/test-management/plans?repositoryId=${encodeURIComponent(String(repo.id))}`);
      } else {
        sessionStorage.removeItem("selectedRepositoryId");
        sessionStorage.removeItem("selectedRepositoryName");
        router.push(tmProjectBasePath(ws, pid));
      }
    },
    [router, ws, pid]
  );

  return (
    <div className="w-full  border-custom-border-200 bg-custom-background-100">
      <div className="px-3 py-2 flex items-center gap-2">
        {!isOverviewActive && isClient && (
          <RepositorySelect
            key={`repository-select-${defaultRepositoryId || "all"}`}
            workspaceSlug={ws}
            className="flex-shrink-0"
            defaultRepositoryId={defaultRepositoryId}
            onRepositoryChange={handleRepositoryChange}
          />
        )}

        {(isOverviewActive ? MENU_ITEMS.filter((i) => i.key === "overview") : MENU_ITEMS).map((item) => {
          const href = item.href(ws, pid);
          const active = item.isActive(pathname, ws, pid);
          const finalHref =
            repositoryIdFromStorage && item.key !== "overview"
              ? `${href}?repositoryId=${encodeURIComponent(String(repositoryIdFromStorage))}`
              : href;
          return (
            <Link
              key={item.key}
              href={finalHref}
              className={cn(
                "px-2.5 py-1.5 rounded text-xs font-medium",
                active
                  ? "bg-custom-background-90 text-custom-text-100"
                  : "text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-100"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
