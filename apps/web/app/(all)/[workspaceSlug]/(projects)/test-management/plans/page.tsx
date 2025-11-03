"use client";

import { useParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";

export default function TestPlansPage() {
  const { workspaceSlug } = useParams();

  return (
    <>
      <PageHead title="测试计划" />
      <div className="h-full w-full">
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 px-4 py-3 sm:px-5">
            <h3 className="text-lg font-medium">测试计划</h3>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full w-full p-4 sm:p-5">
              <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                  <h4 className="text-xl font-medium text-custom-text-100 mb-2">测试计划页面</h4>
                  <p className="text-custom-text-300">这是测试计划的首页，后续功能将在此基础上添加。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
