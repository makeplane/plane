"use client";
import React from "react";
import { Select } from "antd";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

type Option = { value: string; label: React.ReactNode; title?: string; disabled?: boolean };

type CaseMetaFormProps = {
  assignee?: string;
  onAssigneeChange: (v: any) => void;
  onAssigneeBlur: () => void;
  assigneeOptions: Option[];

  stateValue?: string;
  onStateChange: (v: any) => void;
  onStateBlur: () => void;
  caseStateOptions: Option[];

  typeValue?: string;
  onTypeChange: (v: any) => void;
  onTypeBlur: () => void;
  caseTypeOptions: Option[];

  priorityValue?: string;
  onPriorityChange: (v: any) => void;
  onPriorityBlur: () => void;
  casePriorityOptions: Option[];
};

export function CaseMetaForm(props: CaseMetaFormProps) {
  const {
    assignee,
    onAssigneeChange,
    onAssigneeBlur,
    assigneeOptions,
    stateValue,
    onStateChange,
    onStateBlur,
    caseStateOptions,
    typeValue,
    onTypeChange,
    onTypeBlur,
    caseTypeOptions,
    priorityValue,
    onPriorityChange,
    onPriorityBlur,
    casePriorityOptions,
  } = props;

  return (
    <div className="mb-5">
      <div className="grid grid-cols-3 gap-3 ml-[10px]">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 ml-[10px]">维护人</label>
          <div className="w-full rounded-md border border-transparent text-sm  hover:border-blue-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300">
            <MemberDropdown
              multiple={false}
              value={assignee ?? null}
              onChange={(val) => {
                onAssigneeChange(val);
                setTimeout(() => onAssigneeBlur(), 0);
              }}
              placeholder="请选择维护人"
              className="w-full text-sm"
              buttonContainerClassName="w-full text-left"
              buttonVariant="transparent-with-text"
              buttonClassName="text-sm"
              dropdownArrowClassName="h-3.5 w-3.5"
              showUserDetails={true}
              optionsClassName="z-[60]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 ml-[10px]">用例类型</label>
          <div className="w-full rounded-md border border-transparent text-sm  hover:border-blue-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300">
            <Select
              placeholder="请选择用例类型"
              options={caseTypeOptions}
              value={typeValue}
              onChange={onTypeChange}
              onBlur={onTypeBlur}
              showSearch
              suffixIcon={null}
              variant="borderless"
              className="w-full text-sm"
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 ml-[10px]">优先级</label>
          <div className="w-full rounded-md border border-transparent text-sm  hover:border-blue-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300">
            <Select
              placeholder="请选择优先级"
              options={casePriorityOptions}
              value={priorityValue}
              onChange={onPriorityChange}
              onBlur={onPriorityBlur}
              showSearch
              suffixIcon={null}
              variant="borderless"
              className="w-full text-sm"
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
