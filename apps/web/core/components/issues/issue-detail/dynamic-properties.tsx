"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
import * as LucideIcons from "lucide-react";
// types
import { TIssue } from "@plane/types";
// ui
import { Input } from "@plane/ui";
// hooks
import { useProjectIssueTypes } from "@/hooks/store/use-project-issue-types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// services
import { TIssueType, TIssueTypeProperty } from "@/services/project/project-issue-type.service";
// types
import { TIssueOperations } from "./root";

type TIssueDynamicPropertiesProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled?: boolean;
};

// 动态字段（编辑全屏模式，暂未使用）
export const IssueDynamicProperties: React.FC<TIssueDynamicPropertiesProps> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled = false } = props;

  // hooks - 这些必须在任何条件渲染之前调用
  const { issueTypes } = useProjectIssueTypes(workspaceSlug, projectId);
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  // 用于跟踪字段验证错误
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // 用于跟踪本地输入值（避免频繁调用接口）
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  // derived values
  const issue = getIssueById(issueId);
  const selectedIssueType = issueTypes?.find((type) => type.id === issue?.type_id) as TIssueType | undefined;

  // 初始化本地值
  useEffect(() => {
    if (issue?.dynamic_properties) {
      setLocalValues(issue.dynamic_properties);
    }
  }, [issue?.dynamic_properties]);

  // 渲染图标函数
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

  // 验证字段值
  const validateField = (property: TIssueTypeProperty, value: string | undefined): string | null => {
    if (property.is_required && (!value || value.trim() === "")) {
      return `${property.display_name}为必填字段`;
    }
    return null;
  };

  // 更新本地值（不调用接口）
  const updateLocalValue = (propertyId: string, value: string) => {
    setLocalValues((prev) => ({
      ...prev,
      [propertyId]: value,
    }));
  };

  // 保存动态字段值到服务器
  const saveDynamicProperty = async (propertyId: string, value: string, property: TIssueTypeProperty) => {
    if (!issue || disabled) return;

    // 验证字段
    const error = validateField(property, value);

    // 更新错误状态
    setFieldErrors((prev) => ({
      ...prev,
      [propertyId]: error || "",
    }));

    // 如果有验证错误且字段为必填，不进行保存
    if (error && property.is_required) {
      return;
    }

    const currentDynamicProperties = issue.dynamic_properties || {};
    const updatedDynamicProperties = {
      ...currentDynamicProperties,
      [propertyId]: value,
    };

    try {
      await issueOperations.update(workspaceSlug, projectId, issueId, {
        dynamic_properties: updatedDynamicProperties,
      });
    } catch (error) {
      console.error("更新动态字段失败:", error);
    }
  };

  // 条件渲染 - 在所有 hooks 之后
  if (!selectedIssueType?.properties || selectedIssueType.properties.length === 0) {
    return null;
  }

  // 渲染输入组件
  const renderInputComponent = (property: TIssueTypeProperty) => {
    // 优先使用本地值，如果没有则使用issue中的值
    const currentValue = localValues[property.id] ?? issue?.dynamic_properties?.[property.id] ?? "";
    const hasError = fieldErrors[property.id];

    // 根据property_type和is_multi渲染不同的输入组件
    if (property.property_type === "TEXT") {
      if (property.settings?.display_format === "multi-line") {
        return (
          <div className="w-full">
            <textarea
              value={currentValue}
              placeholder={`请输入${property.display_name}`}
              className={`w-full rounded-md border-[0.5px] border-custom-border-200 bg-transparent px-3 py-2 text-sm placeholder-custom-text-400 outline-none focus:ring-1 focus:ring-theme resize-none ${
                hasError ? "border-red-500" : ""
              }`}
              rows={4}
              disabled={disabled}
              onChange={(e) => updateLocalValue(property.id, e.target.value)}
              onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );
      } else {
        return (
          <div className="w-full">
            <Input
              value={currentValue}
              type="text"
              placeholder={`请输入${property.display_name}`}
              className={`w-full ${hasError ? "border-red-500" : ""}`}
              disabled={disabled}
              onChange={(e) => updateLocalValue(property.id, e.target.value)}
              onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );
      }
    }

    // 其他类型的输入组件
    const renderOtherInput = (type: string, inputType: string = "text") => (
      <div className="w-full">
        <Input
          value={currentValue}
          type={inputType}
          placeholder={`请输入${property.display_name}`}
          className={`w-full ${hasError ? "border-red-500" : ""}`}
          disabled={disabled}
          onChange={(e) => updateLocalValue(property.id, e.target.value)}
          onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
        />
        {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
      </div>
    );

    switch (property.property_type) {
      case "NUMBER":
        return renderOtherInput("NUMBER", "number");
      case "EMAIL":
        return renderOtherInput("EMAIL", "email");
      case "URL":
        return renderOtherInput("URL", "url");
      case "DATE":
        return renderOtherInput("DATE", "date");
      case "DATETIME":
        return renderOtherInput("DATETIME", "datetime-local");
      default:
        return renderOtherInput("TEXT", "text");
    }
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
          {activeProperties.map((property) => {
            const hasError = fieldErrors[property.id];

            return (
              <div
                key={property.id}
                className={`flex items-start gap-3 ${hasError ? "bg-red-50 border border-red-200 rounded p-2" : ""}`}
              >
                <div className="flex items-center gap-2 w-32 flex-shrink-0 pt-2">
                  {renderIcon(property.logo_props)}
                  <label className="text-sm font-medium text-custom-text-200 truncate">
                    {property.display_name}
                    {property.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
                <div className="flex-1">{renderInputComponent(property)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
