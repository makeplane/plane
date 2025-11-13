"use client";
import React from "react";

type ModalHeaderProps = {
  onClose: () => void;
};

export function ModalHeader({ onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <h3 className="text-base font-medium">编辑用例</h3>
      <button
        type="button"
        className="rounded p-1 text-gray-500 hover:bg-gray-100"
        onClick={onClose}
        aria-label="关闭"
        title="关闭"
      >
        ×
      </button>
    </div>
  );
}

