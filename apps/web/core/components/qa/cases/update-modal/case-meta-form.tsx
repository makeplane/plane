"use client";
import React from "react";
import { Select } from "antd";

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
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">维护人</label>
          <div className="w-full rounded-md border border-transparent text-sm shadow-sm hover:border-blue-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300">
            <Select
              placeholder="请选择维护人"
              options={assigneeOptions}
              value={assignee}
              onChange={onAssigneeChange}
              onBlur={onAssigneeBlur}
              allowClear
              showSearch
              optionFilterProp="title"
              variant="borderless"
              className="w-full text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
          <div className="w-full rounded-md border border-transparent text-sm shadow-sm hover:border-blue-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300">
            <Select
              placeholder="请选择状态"
              options={caseStateOptions}
              value={stateValue}
              onChange={onStateChange}
              onBlur={onStateBlur}
              showSearch
              optionFilterProp="title"
              variant="borderless"
              className="w-full text-sm"
              filterOption={(input, option) => (option?.title ?? "").toLowerCase().includes(input.toLowerCase())}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">用例类型</label>
          <div className="w-full rounded-md border border-transparent text-sm shadow-sm hover:border-blue-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300">
            <Select
              placeholder="请选择用例类型"
              options={caseTypeOptions}
              value={typeValue}
              onChange={onTypeChange}
              onBlur={onTypeBlur}
              showSearch
              variant="borderless"
              className="w-full text-sm"
              filterOption={(input, option) => String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">优先级</label>
          <div className="w-full rounded-md border border-transparent text-sm shadow-sm hover:border-blue-300 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-300">
            <Select
              placeholder="请选择优先级"
              options={casePriorityOptions}
              value={priorityValue}
              onChange={onPriorityChange}
              onBlur={onPriorityBlur}
              showSearch
              variant="borderless"
              className="w-full text-sm"
              filterOption={(input, option) => String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

