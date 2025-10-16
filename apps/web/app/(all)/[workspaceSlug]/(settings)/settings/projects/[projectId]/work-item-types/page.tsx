"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// 将 toast 的导入从 @plane/ui 改为 @plane/propel/toast，匹配应用中挂载的 Toast 提供者
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useProjectIssueTypes } from "@/hooks/store/use-project-issue-types";
// types
import { ProjectIssueTypeService, TIssueType, TIssueTypeProperty } from "@/services/project/project-issue-type.service";
import { CreateIssueTypeButton } from "@/components/settings/work-item-types/create-issue-type";
import { CreateIssuePropertyButton } from "@/components/settings/work-item-types/create-issue-property";
import { Spinner } from "@plane/ui";

// 工作项类型图标组件 - 增大图标尺寸
const WorkItemTypeIcon = ({ issueType }: { issueType: TIssueType }) => {
  if (!issueType.logo_props?.icon) return null;

  const { name, color, background_color } = issueType.logo_props.icon;
  const IconComp = (LucideIcons as any)[name] as React.FC<any> | undefined;

  return (
    <span
      className="inline-flex items-center justify-center rounded-sm"
      style={{
        backgroundColor: background_color || "transparent",
        color: color || "currentColor",
        width: "28px",
        height: "28px",
      }}
      aria-label={`Issue type: ${issueType.name}`}
    >
      {IconComp ? <IconComp className="h-6 w-6" strokeWidth={2} /> : <span className="h-6 w-6" />}
    </span>
  );
};

// 自定义属性图标组件 - 稍微增大图标尺寸
const PropertyIcon = ({ property }: { property: TIssueTypeProperty }) => {
  if (!property.logo_props?.icon) return null;

  const { name, color } = property.logo_props.icon;
  const IconComp = (LucideIcons as any)[name] as React.FC<any> | undefined;

  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        color: color || "currentColor",
        width: "20px",
        height: "20px",
      }}
    >
      {IconComp ? <IconComp className="h-4 w-4" strokeWidth={2} /> : <span className="h-4 w-4" />}
    </span>
  );
};

// 属性类型标签组件
const PropertyTypeLabel = ({ type }: { type: string }) => {
  const typeLabels: Record<string, string> = {
    TEXT: "文本",
    NUMBER: "数字",
    DATE: "日期",
    DATETIME: "日期时间",
    SELECT: "单选",
    MULTI_SELECT: "多选",
    BOOLEAN: "布尔值",
    URL: "链接",
    EMAIL: "邮箱",
  };

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-custom-background-80 text-custom-text-300">
      {typeLabels[type] || type}
    </span>
  );
};

// 工作项类型卡片组件 - 调整背景色和高度 + 新增操作按钮与删除逻辑
// WorkItemTypeCard 组件
const WorkItemTypeCard = ({
  issueType,
  workspaceSlug,
  projectId,
  onDeleted,
  onRefetch,
}: {
  issueType: TIssueType;
  workspaceSlug?: string;
  projectId?: string;
  onDeleted?: () => void;
  onRefetch?: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isPropActionOpen, setIsPropActionOpen] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPropConfirmOpen, setIsPropConfirmOpen] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingProperty, setIsDeletingProperty] = useState<string | null>(null);
  const { issueTypes, isLoading, error } = useProjectIssueTypes(workspaceSlug?.toString(), projectId?.toString());
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    // 收起动作菜单
    setIsActionOpen(false);
  };
  const handlePropertyDelete = async (propertyId: string) => {
    if (!workspaceSlug || !projectId) return;
    setIsDeletingProperty(propertyId);
    const service = new ProjectIssueTypeService();
    try {
      await service.deleteIssueTypeProperty(workspaceSlug, projectId, issueType.id, propertyId);
      setIsPropConfirmOpen(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "属性删除成功",
      });
      onRefetch?.();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error || "删除失败，请稍后重试",
      });
    } finally {
      setIsDeletingProperty(null);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !projectId) return;
    setIsDeleting(true);
    const service = new ProjectIssueTypeService();
    try {
      await service.deleteProjectIssueType(workspaceSlug, projectId, issueType.id);
      setIsConfirmOpen(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "删除成功",
      });
      onDeleted?.();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error || "删除失败，请稍后重试",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className=" rounded bg-custom-background-100 transition-all hover:bg-custom-background-90">
      {/* 工作项类型头部 */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-3">
          {/* 展开/折叠图标 */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-custom-text-300" />
            ) : (
              <ChevronRight className="h-4 w-4 text-custom-text-300" />
            )}
          </div>

          {/* 工作项类型图标 */}
          <div className="flex-shrink-0">
            <WorkItemTypeIcon issueType={issueType} />
          </div>

          {/* 工作项类型信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-custom-text-100">{issueType.name}</h3>
              {issueType.is_default && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  默认
                </span>
              )}
            </div>
            {issueType.description && <p className="text-xs text-custom-text-200 mt-1">{issueType.description}</p>}
          </div>
        </div>

        {/* 右侧操作按钮与菜单（阻止冒泡避免影响展开/折叠） */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label="操作"
            className="rounded-md p-2 hover:bg-custom-background-80 text-custom-text-300"
            onClick={() => setIsActionOpen((v) => !v)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {isActionOpen && (
            <div className="absolute right-0 top-9 z-20 min-w-[140px] rounded-md border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-md">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-custom-background-90"
                onClick={() => {
                  setIsActionOpen(false);
                  setIsConfirmOpen(true);
                }}
              >
                删除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 自定义属性列表 */}
      {isExpanded && (
        <div className="border-t border-custom-border-200 bg-custom-background-90">
          {issueType.properties && issueType.properties.length > 0 ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-custom-text-200">自定义属性</h4>
                <CreateIssuePropertyButton
                  issueTypeId={issueType.id}
                  onCreated={() => {
                    // 属性创建成功后的回调
                  }}
                  onClosed={onRefetch}
                />
              </div>
              {issueType.properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-3 bg-custom-background-100 rounded border border-custom-border-100"
                >
                  <div className="flex items-center gap-3">
                    {/* 属性图标 */}
                    <div className="flex-shrink-0">
                      <PropertyIcon property={property} />
                    </div>

                    {/* 属性信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-custom-text-100">{property.display_name}</span>
                        {property.is_required && <span className="text-xs text-red-500">*</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 属性类型 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PropertyTypeLabel type={property.property_type} />
                      {property.settings?.display_format && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-custom-background-80 text-custom-text-300">
                          {property.settings.display_format === "single-line" ? "单行" : "段落"}
                        </span>
                      )}
                    </div>

                    {/* 属性操作按钮 */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        aria-label="属性操作"
                        className="rounded-md p-2 hover:bg-custom-background-80 text-custom-text-300"
                        onClick={() => setIsPropActionOpen(isPropActionOpen === property.id ? null : property.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {isPropActionOpen === property.id && (
                        <div className="absolute right-0 top-9 z-20 min-w-[140px] rounded-md border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-md">
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-custom-background-90"
                            onClick={() => {
                              setIsPropActionOpen(null);
                              setIsPropConfirmOpen(property.id);
                            }}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 属性删除确认对话框 */}
                  {isPropConfirmOpen === property.id && (
                    <div className="fixed inset-0 z-30">
                      <div className="absolute inset-0 bg-custom-backdrop" onClick={() => setIsPropConfirmOpen(null)} />
                      <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-sm rounded-lg bg-custom-background-100 p-6 shadow-custom-shadow-md">
                          <h3 className="text-lg font-medium text-custom-text-100">是否删除该属性？</h3>
                          <p className="mt-2 text-sm text-custom-text-300">删除属性可能导致现有数据丢失。</p>
                          <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setIsPropConfirmOpen(null)}
                              className="rounded-md border border-custom-border-200 bg-custom-background-90 px-3 py-1.5 text-sm text-custom-text-200 hover:bg-custom-background-80"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePropertyDelete(property.id)}
                              disabled={isDeletingProperty === property.id}
                              className={cn(
                                "rounded-md bg-red-600 px-3 py-1.5 text-sm text-white",
                                isDeletingProperty === property.id
                                  ? "opacity-60 cursor-not-allowed"
                                  : "hover:bg-red-700"
                              )}
                            >
                              {isDeletingProperty === property.id ? "删除中..." : "删除"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-custom-text-200">自定义属性</h4>
                <CreateIssuePropertyButton
                  issueTypeId={issueType.id}
                  onCreated={() => {
                    // 属性创建成功后的回调（可选）
                  }}
                  onClosed={onRefetch}
                />
              </div>
              <div className="text-center text-custom-text-300 text-sm">该工作项类型暂无自定义属性</div>
            </div>
          )}
        </div>
      )}

      {/* 删除确认对话框 */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-custom-backdrop" onClick={() => setIsConfirmOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-sm rounded-lg bg-custom-background-100 p-6 shadow-custom-shadow-md">
              <h3 className="text-lg font-medium text-custom-text-100">是否删除该工作项类型？</h3>
              <p className="mt-2 text-sm text-custom-text-300">删除类型可能会导致现有数据丢失。</p>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="rounded-md border border-custom-border-200 bg-custom-background-90 px-3 py-1.5 text-sm text-custom-text-200 hover:bg-custom-background-80"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={cn(
                    "rounded-md bg-red-600 px-3 py-1.5 text-sm text-white",
                    isDeleting ? "opacity-60 cursor-not-allowed" : "hover:bg-red-700"
                  )}
                >
                  {isDeleting ? "删除中..." : "删除"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WorkItemTypesSettingsPage = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  // store
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  // hooks
  // 修改：解构出 refetch，用于创建成功后刷新列表
  const { issueTypes, isLoading, error, forceRefetch } = useProjectIssueTypes(
    workspaceSlug?.toString(),
    projectId?.toString()
  );

  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - 工作项类型` : undefined;
  const canPerformProjectMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  // 删除：原先用于创建弹窗的本地状态与 handleCreateIssueType 方法
  // 新增的创建逻辑已抽到 CreateIssueTypeButton 组件中

  if (workspaceUserInfo && !canPerformProjectMemberActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <SettingsHeading
          title="Work Item Types"
          description="Create and customize different types of work items with unique properties"
          // 修改：在标题右侧追加独立的创建组件（按钮+弹窗），成功后调用 refetch 刷新列表
          appendToRight={
            <CreateIssueTypeButton
              workspaceSlug={workspaceSlug?.toString()}
              projectId={projectId?.toString()}
              onClosed={forceRefetch}
            />
          }
        />

        {/* 删除：原有内联弹窗 JSX */}
        {/* 保留：列表渲染、加载与错误状态 */}
        {workspaceSlug && projectId && (
          <div className="mt-8">
            {/* 加载提示：保留列表渲染，避免卸载导致展开状态丢失 */}
            {isLoading && (
              <div className="flex items-center justify-center py-2">
                <Spinner />
              </div>
            )}
            {/* 错误状态（不卸载列表） */}
            {error && (
              <div className="text-center py-2">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
            {/* 工作项类型列表：始终渲染，依赖稳定 key 保留子组件状态 */}
            {issueTypes && (
              <div className="space-y-4">
                {issueTypes.length > 0 ? (
                  issueTypes.map((issueType) => (
                    <WorkItemTypeCard
                      key={issueType.id}
                      issueType={issueType}
                      workspaceSlug={workspaceSlug?.toString()}
                      projectId={projectId?.toString()}
                      onDeleted={forceRefetch}
                      onRefetch={forceRefetch}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-custom-text-300">
                    <p className="text-sm">暂无工作项类型</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </SettingsContentWrapper>
  );
});

export default WorkItemTypesSettingsPage;
