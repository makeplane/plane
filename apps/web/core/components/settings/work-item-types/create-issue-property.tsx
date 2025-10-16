"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
// ui
import { Button, CustomSelect, ToggleSwitch } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useProjectIssueTypes } from "@/hooks/store/use-project-issue-types";
// services
import { ProjectIssueTypeService, TIssueTypeProperty } from "@/services/project/project-issue-type.service";

interface CreateIssuePropertyButtonProps {
  issueTypeId: string;
  onCreated?: () => void;
  onClosed?: () => void;
}

const PROPERTY_TYPE_OPTIONS = [
  { value: "TEXT", label: "文本" },
  // { value: "NUMBER", label: "数字" },
  // { value: "SELECT", label: "选择" },
  // { value: "MULTI_SELECT", label: "多选" },
  // { value: "DATE", label: "日期" },
  // { value: "DATETIME", label: "日期时间" },
  // { value: "BOOLEAN", label: "布尔值" },
  // { value: "URL", label: "链接" },
  // { value: "EMAIL", label: "邮箱" },
];

export const CreateIssuePropertyButton = ({ issueTypeId, onCreated, onClosed }: CreateIssuePropertyButtonProps) => {
  const { workspaceSlug, projectId } = useParams();
  const { forceRefetch } = useProjectIssueTypes(workspaceSlug?.toString(), projectId?.toString());

  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState<TIssueTypeProperty["property_type"]>("TEXT");
  const [isRequired, setIsRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMulti, setIsMulti] = useState(false);
  const [settings, setSettings] = useState({});
  const [textMulti, setTextMulti] = useState(false);

  const projectIssueTypeService = new ProjectIssueTypeService();

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    setDisplayName("");
    setDescription("");
    setPropertyType("TEXT");
    setIsRequired(false);
    setIsMulti(false);
    onClosed?.();
  };

  const handleSubmit = async () => {
    if (!workspaceSlug || !projectId || !displayName.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "错误",
        message: "请填写属性名称",
      });
      return;
    }

    setSubmitting(true);

    // 用局部变量计算 settings，避免读取到旧的 state 值
    const settingsPayload = propertyType === "TEXT" ? { display_format: textMulti ? "multi-line" : "single-line" } : {};

    try {
      const propertyData: Partial<TIssueTypeProperty> = {
        display_name: displayName.trim(),
        property_type: propertyType,
        is_required: isRequired,
        is_active: true,
        is_multi: isMulti,
        default_value: [],
        options: [],
        sort_order: 0,
        settings: settingsPayload,
        logo_props: {
          in_use: "icon",
          icon: {
            name: "AlignLeft",
            color: "#6d7b8a",
          },
        },
      };

      await projectIssueTypeService.createIssueTypeProperty(
        workspaceSlug.toString(),
        projectId.toString(),
        issueTypeId,
        propertyData
      );

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "成功",
        message: "属性创建成功",
      });

      await forceRefetch();
      close();
      onCreated?.();
    } catch (error) {
      console.error("创建属性失败:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "错误",
        message: "创建属性失败，请重试",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="neutral-primary" size="sm" onClick={open}>
        新增属性
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-custom-backdrop bg-opacity-50">
      <div className="relative mx-4 w-full max-w-xl rounded-lg border border-custom-border-200 bg-custom-background-100 p-5 shadow-custom-shadow-md">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-xl font-medium text-custom-text-100">新增属性</h3>
          <button
            onClick={close}
            className="flex h-6 w-6 items-center justify-center rounded text-custom-text-400 hover:text-custom-text-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-custom-text-200">
                属性名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="输入属性名称"
                className="w-full rounded-md border border-custom-border-300 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 placeholder-custom-text-400 focus:border-custom-border-400 focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-custom-text-200">属性类型</label>
              <CustomSelect
                value={propertyType}
                onChange={(value: TIssueTypeProperty["property_type"]) => setPropertyType(value)}
                label={PROPERTY_TYPE_OPTIONS.find((option) => option.value === propertyType)?.label || "选择类型"}
                placement="bottom-start"
                optionsClassName="w-[16rem]"
                buttonClassName="!w-[16rem]"
                input
              >
                {PROPERTY_TYPE_OPTIONS.map((option) => (
                  <CustomSelect.Option key={option.value} value={option.value}>
                    {option.label}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          </div>

          {propertyType === "TEXT" && (
            <div className="rounded-md border border-custom-border-200 bg-custom-background-90 p-4">
              <label className="mb-2 block text-sm font-medium text-custom-text-200">文本格式</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-custom-text-300">
                  <input
                    type="radio"
                    name="text-format"
                    className="h-4 w-4"
                    checked={!textMulti}
                    onChange={() => setTextMulti(false)}
                  />
                  单行
                </label>
                <label className="flex items-center gap-2 text-sm text-custom-text-300">
                  <input
                    type="radio"
                    name="text-format"
                    className="h-4 w-4"
                    checked={textMulti}
                    onChange={() => setTextMulti(true)}
                  />
                  段落（多行）
                </label>
              </div>
              <p className="mt-2 text-xs text-custom-text-400">选择“单行”适用于短文本，“段落”适用于较长描述。</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-custom-text-200">是否必填</label>
            <ToggleSwitch value={isRequired} onChange={setIsRequired} size="sm" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-6">
          <Button variant="neutral-primary" size="sm" onClick={close} disabled={submitting}>
            取消
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!displayName.trim()}
          >
            {submitting ? "创建中..." : "确定"}
          </Button>
        </div>
      </div>
    </div>
  );
};
