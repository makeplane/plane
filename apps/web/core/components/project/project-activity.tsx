"use client";

import { FC, useState, useEffect } from "react";
import { observer } from "mobx-react";
// plane package imports
import { E_SORT_ORDER } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
// i18n
import { useTranslation } from "@plane/i18n";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
// icons
import { Clock, User, Edit3, Settings, ChevronUp, ChevronDown } from "lucide-react";

type TProjectActivity = {
  workspaceSlug: string;
  projectId: string;
  disabled?: boolean;
};

interface IProjectActivityItem {
  id: string;
  actor_detail: {
    id: string;
    display_name: string;
    avatar?: string;
  };
  verb: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  comment: string;
  created_at: string;
  project_detail: {
    id: string;
    name: string;
    identifier: string;
  };
}

export const ProjectActivity: FC<TProjectActivity> = observer((props) => {
  const { workspaceSlug, projectId, disabled = false } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const { setValue: setSortOrder, storedValue: sortOrder } = useLocalStorage(
    "project_activity_sort_order",
    E_SORT_ORDER.DESC
  );
  // store hooks
  const { getProjectById, fetchProjectHistory } = useProject();
  const { data: currentUser } = useUser();

  // states
  const [activities, setActivities] = useState<IProjectActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // derived values
  const project = getProjectById(projectId);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);
  };

  const fetchActivities = async () => {
    if (!workspaceSlug || !projectId) return;

    setIsLoading(true);
    try {
      const response = await fetchProjectHistory(workspaceSlug, projectId);
      console.log("🚀 ~ fetchActivities ~ responsess:", response);
      // 由于后端返回的是模拟数据，我们需要处理单个对象或数组
      const activityData = Array.isArray(response) ? response : [response];
      setActivities(activityData);
    } catch (error) {
      console.error("Error fetching project activities:", error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [workspaceSlug, projectId]);

  const formatActivityMessage = (activity: IProjectActivityItem) => {
    const { verb, field, old_value, new_value, comment } = activity;

    switch (field) {
      case "description":
        return comment || `更新了项目描述`;
      case "name":
        return `将项目名称从 "${old_value}" 更改为 "${new_value}"`;
      case "project_lead":
        return `更改了项目负责人`;
      case "network":
        return `更改了项目可见性`;
      default:
        return comment || `更新了 ${field}`;
    }
  };

  const getActivityIcon = (field: string) => {
    switch (field) {
      case "description":
        return <Edit3 className="h-4 w-4" />;
      case "name":
        return <Settings className="h-4 w-4" />;
      case "project_lead":
        return <User className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === E_SORT_ORDER.ASC ? dateA - dateB : dateB - dateA;
  });

  if (!project) return <></>;

  return (
    <div className="space-y-4 pt-3">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="text-lg text-custom-text-100">项目活动</div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-custom-background-80"
            disabled={disabled}
          >
            {sortOrder === E_SORT_ORDER.ASC ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <span>{sortOrder === E_SORT_ORDER.ASC ? "最旧在前" : "最新在前"}</span>
          </button>
        </div>
      </div>

      {/* activity list */}
      <div className="space-y-3">
        <div className="min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-custom-text-400">加载中...</div>
            </div>
          ) : sortedActivities.length > 0 ? (
            <div className="space-y-3">
              {sortedActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3 border-b border-custom-border-200 pb-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <ButtonAvatars showTooltip userIds={activity.actor_detail.id} />
                  </div>

                  {/* Activity content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.field)}</div>
                      <div className="flex-grow">
                        <div className="text-sm">
                          <span className="font-medium text-custom-text-100">{activity.actor_detail.display_name}</span>
                          <span className="text-custom-text-300 ml-1">{formatActivityMessage(activity)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-custom-text-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(activity.created_at).toLocaleString("zh-CN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-custom-text-400 mb-2" />
              <div className="text-sm text-custom-text-400">暂无活动记录</div>
              <div className="text-xs text-custom-text-500 mt-1">项目的更改和活动将在这里显示</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
