"use client";

import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/core/app-header";
import { TestManagementMenuBar } from "./menu";
import { TestManagementSidebar } from "./_sidebar";
import useLocalStorage from "@/hooks/use-local-storage";
import { useParams, usePathname } from "next/navigation";
// 顶部：增加共享工具的导入
import { isTMOverviewActive } from "./route-helpers";
import { getEnums, globalEnums } from "./util"; // 新增：全局枚举初始化工具

export default function TestManagementLayout({ children }: { children: React.ReactNode }) {
  // 使用 localStorage 存储侧边栏宽度，所有子页面共享
  const { storedValue, setValue } = useLocalStorage<string>("test_management_sidebar_width", "280");
  const initialWidth = Number(storedValue || "280");

  const [sidebarWidth, setSidebarWidth] = useState<number>(Number.isFinite(initialWidth) ? initialWidth : 280);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setValue(String(sidebarWidth));
  }, [sidebarWidth, setValue]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      // 限制最小/最大宽度
      const next = Math.min(480, Math.max(200, sidebarWidth + e.movementX));
      setSidebarWidth(next);
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = "auto";
      document.body.style.userSelect = "auto";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarWidth]);

  const startDrag = () => {
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // 根据路径判断是否为“测试用例库”激活状态
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  const ws = workspaceSlug?.toString() || "";
  const isOverviewActive = isTMOverviewActive(pathname, ws);

  // 新增：模块进入时初始化全局枚举
  useEffect(() => {
    const initializeEnums = async () => {
      if (!workspaceSlug) return;
      try {
        const enumTypes = await getEnums(workspaceSlug.toString());
        globalEnums.setEnums(enumTypes);
      } catch (e) {
        console.error("初始化测试管理枚举失败：", e);
      }
    };
    initializeEnums();
  }, [workspaceSlug]);

  return (
    <>
      {/* 顶部菜单栏（共享于模块内所有子页面） */}
      <AppHeader header={<TestManagementMenuBar />} />

      {/* 主体区域：左侧共享侧边栏 + 可拖拽边框 + 右侧子页面内容 */}
      <div className="relative flex h-full w-full overflow-hidden">
        {/* 左侧共享侧边栏（仅非“测试用例库”时展示） */}
        {/* {!isOverviewActive && (
          <aside
            className="relative h-full flex-shrink-0 overflow-hidden bg-custom-background-90 border-r border-custom-border-200"
            style={{ width: sidebarWidth }}
          >
            <TestManagementSidebar />
            <div className="absolute top-0 right-0 h-full w-[1px] bg-custom-border-200 pointer-events-none" />
            <div
              className="absolute top-0 right-[-4px] h-full w-[8px] cursor-col-resize"
              onMouseDown={startDrag}
              aria-label="Resize test management sidebar"
            />
          </aside>
        )} */}

        {/* 右侧内容区域（子页面） */}
        <main className="relative h-full w-full overflow-hidden bg-custom-background-100">{children}</main>
      </div>
    </>
  );
}
