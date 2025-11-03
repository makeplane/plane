"use client";

import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";
import { cn } from "@plane/utils";
import { RepositorySelect } from "./repository-select";
import { isTMOverviewActive } from "./route-helpers";

type TMenuItem = {
  key: string;
  label: string;
  href: (workspaceSlug: string) => string;
  isActive: (pathname: string, workspaceSlug: string) => boolean;
};

const MENU_ITEMS: TMenuItem[] = [
  {
    key: "overview",
    label: "测试用例库",
    href: (ws) => `/${ws}/test-management`,
    isActive: (pathname, ws) => isTMOverviewActive(pathname, ws),
  },
  {
    key: "plans",
    label: "测试计划",
    href: (ws) => `/${ws}/test-management/plans`,
    isActive: (pathname, ws) => pathname.startsWith(`/${ws}/test-management/plans`),
  },
  {
    key: "cases",
    label: "测试用例",
    href: (ws) => `/${ws}/test-management/cases`,
    isActive: (pathname, ws) => pathname.startsWith(`/${ws}/test-management/cases`),
  },
  {
    key: "runs",
    label: "执行",
    href: (ws) => `/${ws}/test-management/runs`,
    isActive: (pathname, ws) => pathname.startsWith(`/${ws}/test-management/runs`),
  },
  {
    key: "reports",
    label: "报告",
    href: (ws) => `/${ws}/test-management/reports`,
    isActive: (pathname, ws) => pathname.startsWith(`/${ws}/test-management/reports`),
  },
];

export const TestManagementMenuBar = () => {
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRepositoryId, setSelectedRepositoryId] = React.useState<string | null>(null);
  const [repositoryIdFromStorage, setRepositoryIdFromStorage] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  const ws = workspaceSlug?.toString() || "";
  const isOverviewActive = isTMOverviewActive(pathname, ws);

  // 从URL参数中获取repositoryId（保留作为备用）
  const repositoryIdFromUrl = searchParams.get("repositoryId");

  // 确保在客户端环境下才访问sessionStorage
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // 从sessionStorage获取repositoryId
  React.useEffect(() => {
    if (!isClient) return;

    const storedRepositoryId = sessionStorage.getItem("selectedRepositoryId");
    setRepositoryIdFromStorage(storedRepositoryId);
  }, [isClient, pathname]); // 当路径变化时重新获取

  // 优先使用sessionStorage中的repositoryId，其次使用URL参数中的
  const defaultRepositoryId = repositoryIdFromStorage || repositoryIdFromUrl;

  // 处理测试库选择变更
  const handleRepositoryChange = React.useCallback(
    (repositoryId: string | null) => {
      setSelectedRepositoryId(repositoryId);

      // 更新sessionStorage
      if (repositoryId) {
        sessionStorage.setItem("selectedRepositoryId", repositoryId);
      } else {
        sessionStorage.removeItem("selectedRepositoryId");
        sessionStorage.removeItem("selectedRepositoryName");
      }

      // 如果选择了"全部测试库"（repositoryId为null），跳转回主页面
      if (repositoryId === null) {
        router.push(`/${ws}/test-management`);
      } else {
        // 这里可以触发数据刷新或其他业务逻辑
        console.log("选中的测试库ID:", repositoryId);
      }
    },
    [router, ws]
  );

  return (
    <div className="w-full border-b border-custom-border-200 bg-custom-background-100">
      <div className="px-3 py-2 flex items-center gap-2">
        {/* 测试库选择器（仅非"测试用例库"路由时展示） */}
        {!isOverviewActive && isClient && (
          <RepositorySelect
            key={`repository-select-${defaultRepositoryId || "all"}`} // 添加key强制重新渲染
            workspaceSlug={ws}
            className="flex-shrink-0"
            defaultRepositoryId={defaultRepositoryId}
            onRepositoryChange={handleRepositoryChange}
          />
        )}

        {(isOverviewActive ? MENU_ITEMS.filter((i) => i.key === "overview") : MENU_ITEMS).map((item) => {
          const href = item.href(ws);
          const active = item.isActive(pathname, ws);
          return (
            <Link
              key={item.key}
              href={href}
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
