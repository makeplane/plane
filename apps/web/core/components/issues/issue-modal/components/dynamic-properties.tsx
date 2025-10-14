"use client";

import React from "react";
import { Control, Controller, useWatch } from "react-hook-form";
import { observer } from "mobx-react";
import * as LucideIcons from "lucide-react";
// types
import { TIssue } from "@plane/types";
// ui
import { Input, TextArea } from "@plane/ui";
// hooks
import { useProjectIssueTypesFromCache } from "@/hooks/store/use-project-issue-types-cache";
// services
import { TIssueType, TIssueTypeProperty } from "@/services/project/project-issue-type.service";

type TDynamicPropertiesProps = {
  control: Control<TIssue & { dynamic_properties?: Record<string, any> }>;
  projectId: string | null;
  workspaceSlug: string;
  handleFormChange: () => void;
};

export const IssueDynamicProperties: React.FC<TDynamicPropertiesProps> = observer((props) => {
  const { control, projectId, workspaceSlug, handleFormChange } = props;

  // 使用缓存版本的hook
  const { issueTypes } = useProjectIssueTypesFromCache(workspaceSlug, projectId ?? undefined);

  // 监听type_id的变化
  const typeId = useWatch({
    control,
    name: "type_id",
  });

  // 获取当前选中的工作项类型
  const selectedIssueType = issueTypes?.find((type) => type.id === typeId) as TIssueType | undefined;

  // 如果没有properties或properties为空数组，不渲染任何内容
  if (!selectedIssueType?.properties || selectedIssueType.properties.length === 0) {
    return null;
  }

  // 渲染图标
  const renderIcon = (logoProps: TIssueTypeProperty["logo_props"]) => {
    if (!logoProps?.icon?.name) {
      return <LucideIcons.FileText className="h-4 w-4 text-custom-text-300" />;
    }

    const IconComponent = (LucideIcons as any)[logoProps.icon.name];
    if (!IconComponent) {
      return <LucideIcons.FileText className="h-4 w-4 text-custom-text-300" />;
    }

    return <IconComponent className="h-4 w-4" style={{ color: logoProps.icon.color || "#6d7b8a" }} />;
  };

  // 渲染输入组件
  const renderInputComponent = (property: TIssueTypeProperty) => {
    const fieldName = `dynamic_properties.${property.id}` as const;

    return (
      <Controller
        key={property.id}
        name={fieldName}
        control={control}
        rules={{
          required: property.is_required ? `${property.display_name}为必填字段` : false,
        }}
        render={({ field, fieldState }) => {
          // 根据property_type和is_multi渲染不同的输入组件
          if (property.property_type === "TEXT") {
            if (property.is_multi || property.settings?.display_format === "multi-line") {
              return (
                <div className="space-y-1">
                  <textarea
                    {...field}
                    placeholder={`请输入${property.display_name}`}
                    className="w-full rounded-md border-[0.5px] border-custom-border-200 bg-transparent px-3 py-2 text-sm placeholder-custom-text-400 outline-none focus:ring-1 focus:ring-theme resize-none"
                    rows={property.is_multi ? 4 : 2}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleFormChange();
                    }}
                  />
                  {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
                </div>
              );
            } else {
              return (
                <div className="space-y-1">
                  <Input
                    {...field}
                    type="text"
                    placeholder={`请输入${property.display_name}`}
                    className="w-full"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleFormChange();
                    }}
                  />
                  {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
                </div>
              );
            }
          }

          // 其他类型的输入组件
          switch (property.property_type) {
            case "NUMBER":
              return (
                <div className="space-y-1">
                  <Input
                    {...field}
                    type="number"
                    placeholder={`请输入${property.display_name}`}
                    className="w-full"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleFormChange();
                    }}
                  />
                  {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
                </div>
              );
            case "EMAIL":
              return (
                <div className="space-y-1">
                  <Input
                    {...field}
                    type="email"
                    placeholder={`请输入${property.display_name}`}
                    className="w-full"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleFormChange();
                    }}
                  />
                  {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
                </div>
              );
            case "URL":
              return (
                <div className="space-y-1">
                  <Input
                    {...field}
                    type="url"
                    placeholder={`请输入${property.display_name}`}
                    className="w-full"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleFormChange();
                    }}
                  />
                  {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
                </div>
              );
            case "DATE":
              return (
                <div className="space-y-1">
                  <Input
                    {...field}
                    type="date"
                    placeholder={`请选择${property.display_name}`}
                    className="w-full"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleFormChange();
                    }}
                  />
                  {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
                </div>
              );
            case "DATETIME":
              return (
                <div className="space-y-1">
                  <Input
                    {...field}
                    type="datetime-local"
                    placeholder={`请选择${property.display_name}`}
                    className="w-full"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleFormChange();
                    }}
                  />
                  {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
                </div>
              );
            default:
              return (
                <div className="space-y-1">
                  <Input
                    {...field}
                    type="text"
                    placeholder={`请输入${property.display_name}`}
                    className="w-full"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      handleFormChange();
                    }}
                  />
                  {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
                </div>
              );
          }
        }}
      />
    );
  };

  // 过滤并排序活跃的属性
  const activeProperties = selectedIssueType.properties
    .filter((property) => property.is_active) // 仅渲染is_active为true的字段
    .sort((a, b) => a.sort_order - b.sort_order); // 按sort_order排序

  if (activeProperties.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="">
        <div className="space-y-3">
          {activeProperties.map((property) => (
            <div key={property.id} className="flex items-start gap-3 pl-4 pr-4">
              <div className="flex items-center gap-2 w-32 flex-shrink-0 pt-2">
                {renderIcon(property.logo_props)}
                <label className="text-sm font-medium text-custom-text-200 truncate">
                  {property.display_name}
                  {property.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>
              <div className="flex-1">{renderInputComponent(property)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
