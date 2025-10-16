import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { Spinner } from "@plane/ui";
// services
import { ProjectIssueTypeService } from "@/services/project/project-issue-type.service";
import { EmojiPicker, EmojiIconPickerTypes } from "@plane/propel/emoji-icon-picker";
import { Logo } from "@/components/common/logo";

export type CreateIssueTypeButtonProps = {
  workspaceSlug?: string;
  projectId?: string;
  onCreated?: () => void;
  onClosed?: () => void;
};

export const CreateIssueTypeButton = ({
  workspaceSlug,
  projectId,
  onCreated,
  onClosed,
}: CreateIssueTypeButtonProps) => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 新增：图标选择器开关与值
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [logoProps, setLogoProps] = useState<any>({
    in_use: "icon",
    icon: {
      name: "Menu",
      color: "#6d7b8a",
    },
  });

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    setLogoProps({
      in_use: "icon",
      icon: {
        name: "Menu",
        color: "#6d7b8a",
      },
    });
    setName("");
    setDescription("");
    onClosed?.();
  };

  const handleSubmit = async () => {
    if (!workspaceSlug || !projectId) return;
    if (!name.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "名称不能为空",
      });
      return;
    }
    setSubmitting(true);

    const service = new ProjectIssueTypeService();
    try {
      await service.createProjectIssueType(workspaceSlug, projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        // 新增：提交图标选择结果
        logo_props: logoProps?.in_use ? logoProps : undefined,
      });
      // 成功后关闭弹窗并刷新列表
      close();
      onCreated?.();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "工作项类型创建成功",
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.message || "创建失败，请稍后重试",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={open}
        className="rounded-md bg-custom-primary px-3 py-1.5 text-sm text-white hover:bg-custom-primary-90"
      >
        添加工作项类型
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-30">
          <div className="absolute inset-0 bg-custom-backdrop" onClick={close} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-custom-background-100 p-6 shadow-custom-shadow-md">
              <h3 className="text-lg font-medium text-custom-text-100">添加工作项类型</h3>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center gap-3">
                    <EmojiPicker
                      isOpen={isIconPickerOpen}
                      handleToggle={setIsIconPickerOpen}
                      buttonClassName="flex items-center justify-center"
                      label={
                        <span className="grid h-9 w-9 place-items-center rounded-md border">
                          <Logo logo={logoProps} size={20} type="lucide" />
                        </span>
                      }
                      onChange={(val: any) => {
                        let logoValue = {};
                        if (val?.type === "emoji") {
                          logoValue = { value: val.value };
                        } else if (val?.type === "icon") {
                          logoValue = val.value; // { name, color }
                        }
                        setLogoProps({
                          in_use: val?.type,
                          [val?.type]: logoValue,
                        });
                      }}
                      defaultIconColor={logoProps?.in_use === "icon" ? logoProps?.icon?.color : undefined}
                      defaultOpen={EmojiIconPickerTypes.ICON}
                      iconType="lucide"
                      tabsToShow={["icon"]}
                    />

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="为此工作项类型取一个独特的名称"
                      className="flex-1 rounded-md border border-custom-border-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-custom-primary"
                    />
                  </div>
                </div>
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="描述此工作项类型的用途和使用时机"
                    rows={3}
                    className="w-full rounded-md border border-custom-border-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-custom-primary"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md border border-custom-border-200 bg-custom-background-90 px-3 py-1.5 text-sm text-custom-text-200 hover:bg-custom-background-80"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !name.trim()}
                  className={cn(
                    "rounded-md bg-custom-primary px-3 py-1.5 text-sm text-white",
                    submitting || !name.trim() ? "opacity-60 cursor-not-allowed" : "hover:bg-custom-primary-90"
                  )}
                >
                  {submitting ? <span className="inline-flex items-center gap-2">提交中...</span> : "确定"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
