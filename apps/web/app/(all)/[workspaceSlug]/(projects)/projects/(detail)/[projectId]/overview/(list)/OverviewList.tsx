import { observer } from "mobx-react";
import { TNameDescriptionLoader } from "@plane/types";
import type { IProject } from "@plane/types";
import { useState } from "react";
// plane web hooks
import { cn, getFileURL } from "@plane/utils";
import { useProject } from "@/hooks/store/use-project";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { Logo } from "@/components/common/logo";
import { ProjectDescriptionInput } from "@/components/project/project-description-input";
import { ProjectProperties } from "@/components/project/project-properties";
import { ProjectActivity } from "@/components/project/project-activity";
import { WorkItemStats } from "@/components/project/work-item-stats";
import { BadgeInfo, Lock, Activity } from "lucide-react";

type TPageView = {
  children: React.ReactNode;
  project: IProject;
  workspaceSlug: string;
};

export const OverviewListView: React.FC<TPageView> = observer((props) => {
  const { children, project, workspaceSlug } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<TNameDescriptionLoader>("submitted");
  const [activeTab, setActiveTab] = useState<"properties" | "activity">("activity");

  // store hooks
  const { overviewPeek } = useAppTheme();

  // pages loader
  return (
    <div className="w-full">
      {/* 主要布局：左右两栏 */}
      <div className="flex gap-6 min-h-[600px]">
        {/* 左侧区域 - 根据右侧是否显示调整宽度 */}
        <div className={cn("flex flex-col", overviewPeek ? "w-3/4" : "w-full")}>
          {/* 背景图区域 - 固定高度 */}
          <div className="relative h-[140px] flex-shrink-0 overflow-hidden">
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/60 to-transparent" />

            <img
              src={getFileURL(
                project?.cover_image_url ??
                  "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
              )}
              alt={project?.name}
              className="absolute left-0 top-0 h-full w-full object-cover"
            />

            <div className="absolute bottom-4 z-[1] flex h-10 w-full items-center justify-between gap-3 px-4">
              <div className="flex flex-grow items-center gap-2.5 truncate">
                <div className="h-9 w-9 flex-shrink-0 grid place-items-center rounded bg-white/10">
                  <Logo logo={project?.logo_props} size={18} />
                </div>

                <div className="flex w-full flex-col justify-between gap-0.5 truncate">
                  <h3 className="truncate font-semibold text-white">{project.name}</h3>
                  <span className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-white">{project.identifier} </p>
                    {project.network === 0 && <Lock className="h-2.5 w-2.5 text-white " />}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 左侧底部两个功能区域 - 无间隔，用虚线分隔 */}
          <div className="flex flex-col">
            {/* 功能区域 1 - 项目描述编辑器 */}
            <div className="min-h-[300px] bg-white rounded-none p-4">
              <div className="h-full">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">项目描述</h4>
                  {isSubmitting === "submitting" && <div className="text-xs text-gray-500">保存中...</div>}
                </div>
                <div className="min-h-[250px]">
                  <ProjectDescriptionInput
                    workspaceSlug={workspaceSlug}
                    projectId={project.id}
                    initialValue={project?.description_html}
                    setIsSubmitting={setIsSubmitting}
                    swrProjectDescription={project?.description_html}
                    containerClassName="min-h-[250px]"
                  />
                </div>
              </div>
            </div>

            {/* 实线分隔线 */}
            <div className="border-b border-custom-border-200 mx-8"></div>

            {/* 功能区域 2 */}
            <div className="min-h-[160px] rounded-b-lg p-4">
              <WorkItemStats workspaceSlug={workspaceSlug} projectId={project.id} />
            </div>
          </div>
        </div>

        {/* 右侧功能区域 - 根据 overviewPeek 状态条件渲染 */}
        {overviewPeek && (
          <div className="w-1/4 bg-custom-background-100 rounded-lg flex flex-col sticky top-4 h-fit max-h-[calc(100vh-2rem)] self-start">
            {/* 切换按钮 */}
            <div className="flex justify-center px-4 py-2 ">
              <button
                onClick={() => setActiveTab("properties")}
                className={cn(
                  "w-1/2 h-8 text-sm font-medium transition-colors flex items-center justify-center rounded-l-md",
                  activeTab === "properties"
                    ? "bg-white text-black shadow-sm border "
                    : "bg-custom-background-90 text-custom-text-300 hover:bg-custom-background-80 hover:text-custom-text-200"
                )}
              >
                <BadgeInfo className="h-4 w-4 flex-shrink-0" />
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={cn(
                  "w-1/2 h-8 text-sm font-medium transition-colors flex items-center justify-center rounded-r-md",
                  activeTab === "activity"
                    ? "bg-white text-black shadow-sm border border-custom-border-200"
                    : "bg-custom-background-90 text-custom-text-300 hover:bg-custom-background-80 hover:text-custom-text-200"
                )}
              >
                <Activity className="h-4 w-4 flex-shrink-0" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {activeTab === "properties" ? (
                <ProjectProperties workspaceSlug={workspaceSlug} projectId={project.id} />
              ) : (
                <ProjectActivity workspaceSlug={workspaceSlug} projectId={project.id} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
