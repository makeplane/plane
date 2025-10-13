"use client";

import { FC, useState, useEffect } from "react";
import { observer } from "mobx-react";
import * as LucideIcons from "lucide-react";
// hooks
import { useProjectIssueTypes } from "@/hooks/store/use-project-issue-types";
// services
import { TIssueType, TIssueTypeProperty } from "@/services/project/project-issue-type.service";
// types
import { TIssue } from "@plane/types";
import type { TIssueOperations } from "../issue-detail";

interface IPeekOverviewDynamicProperties {
  workspaceSlug: string;
  projectId: string;
  issue: TIssue;
  disabled: boolean;
  issueOperations: TIssueOperations;
}

export const PeekOverviewDynamicProperties: FC<IPeekOverviewDynamicProperties> = observer((props) => {
  const { workspaceSlug, projectId, issue, disabled, issueOperations } = props;

  // 用于跟踪字段验证错误
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // 用于跟踪本地输入值（避免频繁调用接口）
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  // hooks
  const { issueTypes } = useProjectIssueTypes(workspaceSlug, projectId);

  // 获取当前工作项类型
  const selectedIssueType = issueTypes?.find((type) => type.id === issue.type_id) as TIssueType | undefined;

  // 初始化本地值
  useEffect(() => {
    if (issue.dynamic_properties) {
      setLocalValues(issue.dynamic_properties);
    }
  }, [issue.dynamic_properties]);

  // 如果没有properties或properties为空数组，不渲染任何内容
  if (!selectedIssueType?.properties || selectedIssueType.properties.length === 0) {
    return null;
  }

  // 过滤并排序活跃的属性
  const activeProperties = selectedIssueType.properties
    .filter((property) => property.is_active) // 仅渲染is_active为true的字段
    .sort((a, b) => a.sort_order - b.sort_order); // 按sort_order排序

  if (activeProperties.length === 0) {
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
      await issueOperations.update(workspaceSlug, projectId, issue.id, {
        dynamic_properties: updatedDynamicProperties,
      });
    } catch (error) {
      console.error("更新动态字段失败:", error);
    }
  };

  // 渲染可编辑字段
  const renderEditableField = (property: TIssueTypeProperty, value: string | undefined) => {
    // 优先使用本地值，如果没有则使用传入的值
    const currentValue = localValues[property.id] ?? value ?? "";
    const hasError = fieldErrors[property.id];

    if (disabled) {
      return renderDisplayValue(property, value);
    }

    const inputClassName = `w-full bg-transparent border-none outline-none text-sm text-custom-text-200 placeholder-custom-text-400 ${
      hasError ? "border-red-500" : ""
    }`;

    const textareaClassName = `w-full bg-transparent border-none outline-none text-sm text-custom-text-200 placeholder-custom-text-400 resize-none min-h-[2rem] ${
      hasError ? "border-red-500" : ""
    }`;

    switch (property.property_type) {
      case "TEXT":
        return (
          <div className="w-full">
            <textarea
              value={currentValue}
              onChange={(e) => updateLocalValue(property.id, e.target.value)}
              onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
              className={textareaClassName}
              placeholder="输入文本..."
              rows={property.is_multi ? 4 : 2}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );

      case "NUMBER":
        return (
          <div className="w-full">
            <input
              type="number"
              value={currentValue}
              onChange={(e) => updateLocalValue(property.id, e.target.value)}
              onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
              className={inputClassName}
              placeholder="输入数字..."
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );

      case "DATE":
        return (
          <div className="w-full">
            <input
              type="date"
              value={currentValue}
              onChange={(e) => updateLocalValue(property.id, e.target.value)}
              onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
              className={inputClassName}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );

      case "DATETIME":
        return (
          <div className="w-full">
            <input
              type="datetime-local"
              value={currentValue}
              onChange={(e) => updateLocalValue(property.id, e.target.value)}
              onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
              className={inputClassName}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );

      case "URL":
        return (
          <div className="w-full">
            <input
              type="url"
              value={currentValue}
              onChange={(e) => updateLocalValue(property.id, e.target.value)}
              onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
              className={inputClassName}
              placeholder="https://..."
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );

      case "EMAIL":
        return (
          <div className="w-full">
            <input
              type="email"
              value={currentValue}
              onChange={(e) => updateLocalValue(property.id, e.target.value)}
              onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
              className={inputClassName}
              placeholder="email@example.com"
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );

      case "BOOLEAN":
        return (
          <div className="w-full">
            <select
              value={currentValue}
              onChange={(e) => {
                const newValue = e.target.value;
                updateLocalValue(property.id, newValue);
                saveDynamicProperty(property.id, newValue, property);
              }}
              className={inputClassName}
            >
              <option value="">选择...</option>
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );

      case "SELECT":
        if (!property.options || property.options.length === 0) {
          return (
            <div className="w-full">
              <input
                type="text"
                value={currentValue}
                onChange={(e) => updateLocalValue(property.id, e.target.value)}
                onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
                className={inputClassName}
                placeholder="输入值..."
              />
              {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
            </div>
          );
        }
        return (
          <div className="w-full">
            <select
              value={currentValue}
              onChange={(e) => {
                const newValue = e.target.value;
                updateLocalValue(property.id, newValue);
                saveDynamicProperty(property.id, newValue, property);
              }}
              className={inputClassName}
            >
              <option value="">选择选项...</option>
              {property.options.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );

      default:
        return (
          <div className="w-full">
            <input
              type="text"
              value={currentValue}
              onChange={(e) => updateLocalValue(property.id, e.target.value)}
              onBlur={(e) => saveDynamicProperty(property.id, e.target.value, property)}
              className={inputClassName}
              placeholder="输入值..."
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );
    }
  };

  // 格式化显示值（用于禁用状态）
  const renderDisplayValue = (property: TIssueTypeProperty, value: string | undefined) => {
    if (!value || value === "") {
      return <span className="text-custom-text-400">无</span>;
    }

    switch (property.property_type) {
      case "DATE":
        try {
          const date = new Date(value);
          return <span className="text-custom-text-200">{date.toLocaleDateString("zh-CN")}</span>;
        } catch {
          return <span className="text-custom-text-200 whitespace-pre-wrap">{value}</span>;
        }
      case "DATETIME":
        try {
          const date = new Date(value);
          return <span className="text-custom-text-200">{date.toLocaleString("zh-CN")}</span>;
        } catch {
          return <span className="text-custom-text-200 whitespace-pre-wrap">{value}</span>;
        }
      case "URL":
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline whitespace-pre-wrap"
          >
            {value}
          </a>
        );
      case "EMAIL":
        return (
          <a href={`mailto:${value}`} className="text-blue-500 hover:underline whitespace-pre-wrap">
            {value}
          </a>
        );
      case "BOOLEAN":
        return <span className="text-custom-text-200">{value === "true" ? "是" : "否"}</span>;
      case "SELECT":
        if (property.options && property.options.length > 0) {
          const selectedOption = property.options.find((option) => option.value === value);
          return <span className="text-custom-text-200 whitespace-pre-wrap">{selectedOption?.label || value}</span>;
        }
        return <span className="text-custom-text-200 whitespace-pre-wrap">{value}</span>;
      case "TEXT":
        // 对于文本类型，使用 pre-wrap 来保持换行符
        return <span className="text-custom-text-200 whitespace-pre-wrap">{value}</span>;
      default:
        // 对于其他类型，也使用 pre-wrap 以防包含换行符
        return <span className="text-custom-text-200 whitespace-pre-wrap">{value}</span>;
    }
  };

  return (
    <div className="space-y-2">
      {activeProperties.map((property) => {
        const value = (issue as any)?.dynamic_properties?.[property.id];
        const hasError = fieldErrors[property.id];

        return (
          <div key={property.id} className="flex w-full items-start gap-3 min-h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300 pt-1">
              {renderIcon(property.logo_props)}
              <span>
                {property.display_name}
                {property.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
            <div
              className={`w-3/4 flex-grow flex flex-col rounded px-2 py-0.5 text-sm ${
                disabled ? "opacity-60" : "hover:bg-custom-background-80"
              } ${hasError ? "bg-red-50 border border-red-200" : ""}`}
            >
              {renderEditableField(property, value)}
            </div>
          </div>
        );
      })}
    </div>
  );
});
