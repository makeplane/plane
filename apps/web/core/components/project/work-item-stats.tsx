"use client";

import { FC, useState, useEffect } from "react";
import { observer } from "mobx-react";
// hooks
import { useProject } from "@/hooks/store/use-project";

type TWorkItemStats = {
  workspaceSlug: string;
  projectId: string;
};

interface IWorkItemData {
  total_work_items: { count: number };
  started_work_items: { count: number };
  backlog_work_items: { count: number };
  un_started_work_items: { count: number };
  completed_work_items: { count: number };
  cancelled_work_items: { count: number };
}

interface IWorkItemType {
  label: string;
  key: keyof Omit<IWorkItemData, "total_work_items">;
  color: string;
  count: number;
  percentage: number;
}

export const WorkItemStats: FC<TWorkItemStats> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  const [workItemData, setWorkItemData] = useState<IWorkItemData | null>(null);
  const [loading, setLoading] = useState(true);

  const { fetchProjectAnalyze } = useProject();

  // 定义工作项类型配置
  const workItemTypes: Omit<IWorkItemType, "count" | "percentage">[] = [
    { label: "Backlog", key: "backlog_work_items", color: "#ebedf2" },
    { label: "Unstarted", key: "un_started_work_items", color: "#b6b6b6" },
    { label: "Started", key: "started_work_items", color: "#ffc099" },
    { label: "Completed", key: "completed_work_items", color: "#92eca7" },
    { label: "Cancelled", key: "cancelled_work_items", color: "#ffbfbf" },
  ];

  // 获取工作项统计数据
  const fetchWorkItemStats = async () => {
    try {
      setLoading(true);
      const response = await fetchProjectAnalyze(workspaceSlug, projectId);
      setWorkItemData(response);
    } catch (error) {
      console.error("Error fetching work item stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceSlug && projectId) {
      fetchWorkItemStats();
    }
  }, [workspaceSlug, projectId]);

  // 计算工作项统计信息
  const getWorkItemStats = (): IWorkItemType[] => {
    if (!workItemData) return [];

    const totalCount = workItemData.total_work_items.count;
    if (totalCount === 0) return [];

    return workItemTypes.map((type) => ({
      ...type,
      count: workItemData[type.key].count,
      percentage: (workItemData[type.key].count / totalCount) * 100,
    })); // 只显示有数据的类型
  };

  const stats = getWorkItemStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="text-sm text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!workItemData || workItemData.total_work_items.count === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <div className="text-sm font-medium">暂无工作项数据</div>
        <div className="text-xs mt-1">该项目还没有创建任何工作项</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">进度</h3>
      </div>

      {/* 进度条 - 分离式设计 */}
      <div className="w-full">
        <div className="flex gap-1">
          {stats.map((item, index) => (
            <div
              key={item.key}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: item.color,
                width: `${item.percentage}%`,
                minWidth: item.percentage > 0 ? "8px" : "0px",
              }}
              title={`${item.label}: ${item.count} (${item.percentage.toFixed(1)}%)`}
            />
          ))}
        </div>
      </div>

      {/* 图例 - 上下结构布局 */}
      <div className="grid grid-cols-5 gap-6">
        {stats.map((item) => (
          <div key={item.key} className="flex-1 flex flex-col gap-1 px-3 py-2 min-w-24">
            {/* 上行：颜色块和标签 */}
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-medium leading-4">{item.label}</span>
            </div>
            {/* 下行：数量和百分比 */}
            <div className="flex gap-3">
              <span className="text-md font-bold">{item.count}</span>
              <span className="text-sm font-medium text-custom-text-350 my-auto">{item.percentage.toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
