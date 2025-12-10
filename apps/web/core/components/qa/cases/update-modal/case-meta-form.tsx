"use client";
import React, { useState } from "react";
import { Select } from "antd";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import * as LucideIcons from "lucide-react";

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

  labelList?: any[];
  onCreateLabel?: (name: string) => void;
  onDeleteLabel?: (id: string) => void;
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
    labelList = [],
    onCreateLabel,
    onDeleteLabel,
  } = props;

  const [labelInput, setLabelInput] = useState("");

  const handleCreateLabel = () => {
    const name = labelInput.trim();
    if (name && onCreateLabel) {
      onCreateLabel(name);
      setLabelInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateLabel();
    }
  };

  return (
    <div className="mb-5">
      <div className="grid grid-cols-4 gap-3 ml-[10px]">
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
          <label className="mb-1 block text-sm font-medium text-gray-700 ml-[6px]">用例类型</label>
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

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 ml-[10px]">标签</label>
          <div
            className="flex flex-wrap items-center gap-2 min-h-[32px] p-1 border border-transparent focus-within:border-custom-border-200 rounded cursor-text bg-white transition-colors"
            onClick={() => {
              const input = document.getElementById("meta-label-input");
              input?.focus();
            }}
          >
            {labelList.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs border border-blue-100 group"
              >
                <span>{label.name}</span>
                <span
                  className="cursor-pointer opacity-50 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLabel?.(label.id);
                  }}
                >
                  <LucideIcons.X size={12} />
                </span>
              </div>
            ))}

            <input
              id="meta-label-input"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleCreateLabel}
              placeholder={labelList.length === 0 ? "输入标签名称" : ""}
              className="flex-1 min-w-[60px] outline-none text-sm bg-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
