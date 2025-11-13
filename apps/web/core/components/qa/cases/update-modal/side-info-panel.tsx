"use client";
import React from "react";

type SideInfoPanelProps = {
  caseData: any;
};

export function SideInfoPanel({ caseData }: SideInfoPanelProps) {
  return (
    <div className="w-1/3 border-l px-6 py-4 h-full overflow-y-auto">
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">测试类型（test_type）</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入测试类型"
          defaultValue={caseData?.test_type || ""}
        />
      </div>
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">所属用例库（repository）（不可选）</label>
        <input
          type="text"
          className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm shadow-sm focus:outline-none"
          placeholder="将由系统自动填充"
          disabled
          value={caseData?.repository?.name || ""}
        />
      </div>
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">模块（module）</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入模块名称"
          defaultValue={caseData?.module || ""}
        />
      </div>
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">工作项（issues）</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入关联工作项"
          defaultValue={caseData?.issues || ""}
        />
      </div>
    </div>
  );
}

