import React, { useMemo, useState } from "react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { Input, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { CalendarDays } from "lucide-react";
import { DateDropdown } from "@/components/dropdowns/date";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { renderFormattedPayloadDate } from "@plane/utils";
// services
import { PlanService } from "@/services/qa/plan.service";

type TMode = "create" | "edit";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
  // 只读展示字段
  repositoryId: string;
  repositoryName: string;
  // 预留编辑模式
  mode?: TMode;
  planId?: string;
  initialData?: {
    name?: string;
    assignees?: string[];
    begin_time?: string | Date | null;
    end_time?: string | Date | null;
  } | null;
  // 创建成功/编辑成功回调（用于刷新列表或其它联动）
  onSuccess?: () => void | Promise<void>;
};

const planService = new PlanService();

export const CreateUpdatePlanModal: React.FC<Props> = (props) => {
  const {
    isOpen,
    handleClose,
    workspaceSlug,
    repositoryId,
    repositoryName,
    mode = "create",
    planId,
    initialData,
    onSuccess,
  } = props;

  // 表单状态
  const [name, setName] = useState<string>(initialData?.name ?? "");
  const [assignees, setAssignees] = useState<string[]>(initialData?.assignees ?? []);
  const [beginTime, setBeginTime] = useState<Date | null>(
    mode === "create" ? new Date() : initialData?.begin_time ? new Date(initialData?.begin_time as any) : null
  );
  const [endTime, setEndTime] = useState<Date | null>(
    mode === "create"
      ? new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000)
      : initialData?.end_time
        ? new Date(initialData?.end_time as any)
        : null
  );
  const [stateValue] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ name?: string; time?: string }>({});

  // 新增：关闭时重置所有字段
  const resetForm = () => {
    setName(initialData?.name ?? "");
    setAssignees(initialData?.assignees ?? []);
    if (mode === "create") {
      const today = new Date();
      setBeginTime(today);
      setEndTime(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000));
    } else {
      setBeginTime(initialData?.begin_time ? new Date(initialData?.begin_time as any) : null);
      setEndTime(initialData?.end_time ? new Date(initialData?.end_time as any) : null);
    }
    setErrors({});
    setSubmitting(false);
  };

  const onCloseWithReset = () => {
    resetForm();
    handleClose();
  };

  // 新增：当弹窗打开或依赖变更时，同步最新 props 到内部表单状态
  React.useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit") {
      setName(initialData?.name ?? "");
      setAssignees(initialData?.assignees ?? []);
      setBeginTime(initialData?.begin_time ? new Date(initialData?.begin_time as any) : null);
      setEndTime(initialData?.end_time ? new Date(initialData?.end_time as any) : null);
    } else {
      const today = new Date();
      setName("");
      setAssignees([]);
      setBeginTime(today);
      setEndTime(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000));
    }
    setErrors({});
    setSubmitting(false);
  }, [isOpen, mode, planId, initialData]);

  const title = useMemo(() => (mode === "edit" ? "编辑测试计划" : "新建测试计划"), [mode]);

  // 简单校验：名称必填、结束时间不早于开始时间
  const validate = (): boolean => {
    const nextErrors: { name?: string; time?: string } = {};
    if (!name || !name.trim()) {
      nextErrors.name = "请输入计划名称";
    }
    if (beginTime && endTime && endTime.getTime() < beginTime.getTime()) {
      nextErrors.time = "结束时间不能早于开始时间";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);

      const payload: any = {
        name: name.trim(),
        repository: repositoryId,
        assignees: assignees,
        begin_time: beginTime ? renderFormattedPayloadDate(beginTime) : null,
        end_time: endTime ? renderFormattedPayloadDate(endTime) : null,
        state: stateValue,
      };

      if (mode === "create") {
        await planService.createPlan(workspaceSlug, payload);
      } else if (mode === "edit" && planId) {
        await planService.updatePlan(workspaceSlug, {
          id: planId,
          name: payload.name,
          assignees: payload.assignees,
          begin_time: payload.begin_time,
          end_time: payload.end_time,
        });
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "成功",
        message: mode === "edit" ? "测试计划更新成功" : "测试计划创建成功",
      });

      await onSuccess?.();

      // 关闭并重置
      onCloseWithReset();
    } catch (e: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "失败",
        message: e?.message || "操作失败，请稍后重试",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onCloseWithReset} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="px-6 py-5">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* 计划名称（必填，红色星号） */}
          <div className="col-span-1">
            <label className="text-sm text-custom-text-300 mb-1 block">
              计划名称<span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="请输入计划名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* 所属示例库（只读，浅灰背景） */}
          <div className="col-span-1">
            <label className="text-sm text-custom-text-300 mb-1 block">所属示例库</label>
            <Input value={repositoryName} disabled className="w-full bg-[#f5f5f5]" />
          </div>

          {/* 状态（只读，浅灰背景，默认未开始） */}
          <div className="col-span-1">
            <label className="text-sm text-custom-text-300 mb-1 block">状态</label>
            <Input value="未开始" disabled className="w-full bg-[#f5f5f5]" />
          </div>

          {/* 负责人（多选）——宽度与输入框一致，带边框 */}
          <div className="col-span-1">
            <label className="text-sm text-custom-text-300 mb-1 block">负责人</label>
            <div className="h-9">
              <MemberDropdown
                multiple
                value={assignees}
                onChange={(val) => setAssignees(val)}
                placeholder="选择负责人"
                className="h-9"
                buttonContainerClassName="w-full text-left"
                buttonVariant="border-with-text"
                buttonClassName="border-custom-border-300 px-3 py-2.5"
                dropdownArrow
                dropdownArrowClassName="h-3.5 w-3.5"
                renderByDefault
              />
            </div>
          </div>

          {/* 开始时间与结束时间同一行显示，统一日期格式与边框样式 */}
          <div className="col-span-1">
            <label className="text-sm text-custom-text-300 mb-1 block">计划开始时间</label>
            <div className="h-9">
              <DateDropdown
                value={beginTime}
                onChange={(val) => setBeginTime(val)}
                placeholder="开始日期"
                icon={<CalendarDays className="h-3 w-3 flex-shrink-0" />}
                buttonVariant="border-with-text"
                buttonClassName="border-custom-border-300 px-3 py-2.5 text-left"
                buttonContainerClassName="w-full text-left"
                optionsClassName="z-[50]"
                maxDate={endTime ?? undefined}
                formatToken="yyyy-MM-dd"
                renderByDefault
              />
            </div>
          </div>

          <div className="col-span-1">
            <label className="text-sm text-custom-text-300 mb-1 block">计划结束时间</label>
            <div className="h-9">
              <DateDropdown
                value={endTime}
                onChange={(val) => setEndTime(val)}
                placeholder="结束日期"
                icon={<CalendarDays className="h-3 w-3 flex-shrink-0" />}
                buttonVariant="border-with-text"
                buttonClassName="border-custom-border-300 px-3 py-2.5 text-left"
                buttonContainerClassName="w-full text-left"
                optionsClassName="z-[50]"
                minDate={beginTime ?? undefined}
                formatToken="yyyy-MM-dd"
                renderByDefault
              />
            </div>
            {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
          </div>
        </div>

        {/* 操作区 */}
        <div className="flex items-center justify-end gap-2 mt-6">
          <Button variant="neutral-primary" size="sm" onClick={onCloseWithReset} disabled={submitting}>
            取消
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting}
            data-testid="qa-plan-submit"
          >
            {mode === "edit" ? "保存" : "创建"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
};
